//! Reads the aggregator's JSON into the crate's types.
use serde_json::Value;

use crate::certificate::{Certificate, Metadata, ProtocolParameters, Signature, SignedEntity, Signer};
use crate::stm::{AggregateVerificationKey, BatchPath, MultiSignature, RegisteredParty, SignatureEntry};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ParseError(pub &'static str);

type Result<T> = core::result::Result<T, ParseError>;

fn bytes_of(v: &Value) -> Result<Vec<u8>> {
    v.as_array().ok_or(ParseError("byte array"))?.iter().map(|n| u8::try_from(n.as_u64().ok_or(ParseError("byte"))?).map_err(|_| ParseError("byte"))).collect()
}

fn fixed<const N: usize>(v: &Value) -> Result<[u8; N]> {
    bytes_of(v)?.try_into().map_err(|_| ParseError("byte length"))
}

fn u64_of(v: &Value) -> Result<u64> {
    v.as_u64().ok_or(ParseError("number"))
}

fn str_of(v: &Value) -> Result<String> {
    Ok(v.as_str().ok_or(ParseError("string"))?.to_string())
}

/// mithril's hex of JSON into the JSON.
fn hex_json(hex_json: &str) -> Result<Value> {
    serde_json::from_slice(&hex::decode(hex_json).map_err(|_| ParseError("hex"))?).map_err(|_| ParseError("json"))
}

/// RFC 3339 with up to nine fraction digits into Unix nanoseconds.
pub fn nanos(timestamp: &str) -> Result<i64> {
    let bad = ParseError("timestamp");
    let (date, time) = timestamp.strip_suffix('Z').ok_or(bad)?.split_once('T').ok_or(bad)?;
    let (time, fraction) = time.split_once('.').unwrap_or((time, "0"));
    let num = |s: &str| s.parse::<i64>().map_err(|_| bad);
    let d: Vec<i64> = date.split('-').map(num).collect::<Result<_>>()?;
    let t: Vec<i64> = time.split(':').map(num).collect::<Result<_>>()?;
    let ([y, m, day], [h, min, s]) = (<[i64; 3]>::try_from(d).map_err(|_| bad)?, <[i64; 3]>::try_from(t).map_err(|_| bad)?);
    // Days since 1970-01-01 in the proleptic Gregorian calendar.
    let (yy, mm) = if m <= 2 { (y - 1, m + 9) } else { (y, m - 3) };
    let era = yy.div_euclid(400);
    let yoe = yy - era * 400;
    let doy = (153 * mm + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146097 + doe - 719468;
    let seconds = days * 86400 + h * 3600 + min * 60 + s;
    if fraction.len() > 9 || !fraction.bytes().all(|b| b.is_ascii_digit()) {
        return Err(bad);
    }
    let frac = num(&format!("{fraction:0<9}"))?;
    Ok(seconds * 1_000_000_000 + frac)
}

/// The `multi_signature` field of a certificate.
pub fn multi_signature(hex: &str) -> Result<MultiSignature> {
    let v = hex_json(hex)?;
    let signatures = v["signatures"]
        .as_array()
        .ok_or(ParseError("signatures"))?
        .iter()
        .map(|entry| {
            let (sig, party) = (&entry[0], &entry[1]);
            Ok(SignatureEntry {
                sigma: fixed(&sig["sigma"])?,
                indexes: sig["indexes"].as_array().ok_or(ParseError("indexes"))?.iter().map(u64_of).collect::<Result<_>>()?,
                signer_index: u64_of(&sig["signer_index"])?,
                party: RegisteredParty { vk: fixed(&party[0])?, stake: u64_of(&party[1])? },
            })
        })
        .collect::<Result<_>>()?;
    let bp = &v["batch_proof"];
    Ok(MultiSignature {
        signatures,
        batch_proof: BatchPath {
            values: bp["values"].as_array().ok_or(ParseError("values"))?.iter().map(fixed).collect::<Result<_>>()?,
            indices: bp["indices"].as_array().ok_or(ParseError("indices"))?.iter().map(u64_of).collect::<Result<_>>()?,
        },
    })
}

/// The `aggregate_verification_key` field of a certificate.
pub fn aggregate_verification_key(hex: &str) -> Result<AggregateVerificationKey> {
    let v = hex_json(hex)?;
    Ok(AggregateVerificationKey {
        root: fixed(&v["mt_commitment"]["root"])?,
        nr_leaves: u64_of(&v["mt_commitment"]["nr_leaves"])?,
        total_stake: u64_of(&v["total_stake"])?,
    })
}

/// A `/certificate/{hash}` answer, with the hash the aggregator claims.
pub fn certificate(json: &str) -> Result<(Certificate, String)> {
    let v: Value = serde_json::from_str(json).map_err(|_| ParseError("json"))?;
    let meta = &v["metadata"];
    let params = &meta["parameters"];
    let entity = match v["signed_entity_type"].as_object().and_then(|o| o.iter().next()) {
        None => None,
        Some((kind, beacon)) => {
            let at = |i: usize| u64_of(&beacon[i]);
            Some(match kind.as_str() {
                "MithrilStakeDistribution" => SignedEntity::MithrilStakeDistribution(u64_of(beacon)?),
                "CardanoStakeDistribution" => SignedEntity::CardanoStakeDistribution(u64_of(beacon)?),
                "CardanoTransactions" => SignedEntity::CardanoTransactions(at(0)?, at(1)?),
                "CardanoDatabase" => SignedEntity::CardanoDatabase(u64_of(&beacon["epoch"])?, u64_of(&beacon["immutable_file_number"])?),
                "CardanoBlocksTransactions" => SignedEntity::CardanoBlocksTransactions(at(0)?, at(1)?, at(2)?),
                _ => return Err(ParseError("signed entity")),
            })
        }
    };
    let signature = match v["multi_signature"].as_str() {
        Some(hex) if !hex.is_empty() => Signature::Multi(multi_signature(hex)?),
        _ => Signature::Genesis(str_of(&v["genesis_signature"])?),
    };
    let certificate = Certificate {
        previous_hash: str_of(&v["previous_hash"])?,
        epoch: u64_of(&v["epoch"])?,
        metadata: Metadata {
            network: str_of(&meta["network"])?,
            version: str_of(&meta["version"])?,
            parameters: ProtocolParameters { k: u64_of(&params["k"])?, m: u64_of(&params["m"])?, phi_f: params["phi_f"].as_f64().ok_or(ParseError("phi_f"))? },
            initiated_at: nanos(meta["initiated_at"].as_str().ok_or(ParseError("initiated_at"))?)?,
            sealed_at: nanos(meta["sealed_at"].as_str().ok_or(ParseError("sealed_at"))?)?,
            signers: meta["signers"]
                .as_array()
                .ok_or(ParseError("signers"))?
                .iter()
                .map(|s| Ok(Signer { party_id: str_of(&s["party_id"])?, stake: u64_of(&s["stake"])? }))
                .collect::<Result<_>>()?,
        },
        message_parts: v["protocol_message"]["message_parts"]
            .as_object()
            .ok_or(ParseError("message_parts"))?
            .iter()
            .map(|(k, val)| Ok((k.clone(), str_of(val)?)))
            .collect::<Result<_>>()?,
        signed_message: str_of(&v["signed_message"])?,
        aggregate_verification_key: aggregate_verification_key(v["aggregate_verification_key"].as_str().ok_or(ParseError("avk"))?)?,
        signed_entity: entity,
        signature,
    };
    Ok((certificate, str_of(&v["hash"])?))
}
