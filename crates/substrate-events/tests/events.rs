//! Real System::Events values of the dev chain, mainnet and preview, decoded by polkadot.js as reference.

use serde_json::Value;
use sha2::{Digest, Sha256};
use substrate_events::{Error, TABLES, applied, midnight_pallet};

struct Sample {
    name: String,
    spec: u32,
    events: Vec<u8>,
    applied: Vec<(u32, [u8; 32])>,
    partial: Vec<(u32, [u8; 32])>,
}

fn pairs(v: &Value) -> Vec<(u32, [u8; 32])> {
    let hash = |h: &Value| hex::decode(&h.as_str().unwrap()[2..]).unwrap().try_into().unwrap();
    v.as_array().unwrap().iter().map(|p| (p[0].as_u64().unwrap() as u32, hash(&p[1]))).collect()
}

fn samples() -> Vec<Sample> {
    let file = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/data/events.json")).unwrap();
    let all: Vec<Value> = serde_json::from_str(&file).unwrap();
    all.iter()
        .map(|s| Sample {
            name: format!("{} #{}", s["chain"].as_str().unwrap(), s["block"]),
            spec: s["spec"].as_u64().unwrap() as u32,
            events: hex::decode(&s["events"].as_str().unwrap()[2..]).unwrap(),
            applied: pairs(&s["applied"]),
            partial: pairs(&s["partial"]),
        })
        .collect()
}

// The record of `TxApplied` as it must appear in the value: phase, pallet, variant, hash.
fn record(spec: u32, extrinsic: u32, hash: [u8; 32]) -> Vec<u8> {
    let mut r = vec![0];
    r.extend(extrinsic.to_le_bytes());
    r.extend([midnight_pallet(spec).unwrap(), 2]);
    r.extend(hash);
    r
}

fn contains(hay: &[u8], needle: &[u8]) -> bool {
    hay.windows(needle.len()).any(|w| w == needle)
}

#[test]
fn tables_are_the_generated_ones() {
    let hashes: Vec<(u32, String)> = TABLES.iter().map(|(s, t)| (*s, hex::encode(Sha256::digest(t)))).collect();
    assert_eq!(
        hashes,
        [
            (2001000, "1e28a8ef335bf5a337abbd5fb0e91457d5b5e0b4c62eed6d1befbf04cf557b38".to_string()),
            (2001100, "d899b1affcb033ec680b1953c9da8e6fe57cc14f16bb378fc361feebe27d7c01".to_string()),
        ]
    );
}

#[test]
fn midnight_is_pallet_5() {
    for (spec, _) in TABLES {
        assert_eq!(midnight_pallet(*spec), Ok(5));
    }
}

#[test]
fn every_sample_reads_like_polkadot_js() {
    let samples = samples();
    assert!(samples.len() >= 9);
    for s in &samples {
        for &(ext, hash) in &s.applied {
            assert_eq!(applied(&s.events, s.spec, ext, hash), Ok(true), "{}", s.name);
            assert_eq!(applied(&s.events, s.spec, ext + 1, hash), Ok(false), "{}", s.name);
            let mut other = hash;
            other[31] ^= 1;
            assert_eq!(applied(&s.events, s.spec, ext, other), Ok(false), "{}", s.name);
        }
        for &(ext, hash) in &s.partial {
            assert_eq!(applied(&s.events, s.spec, ext, hash), Ok(false), "{}", s.name);
        }
        if s.applied.is_empty() {
            assert_eq!(applied(&s.events, s.spec, 0, [0; 32]), Ok(false), "{}", s.name);
        }
    }
}

#[test]
fn the_burn_fixture_is_applied() {
    let file = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/../../contracts/near-bridge/tests/fixtures/burn-tx.json")).unwrap();
    let f: Value = serde_json::from_str(&file).unwrap();
    let events = hex::decode(&f["storage_values"][0].as_str().unwrap()[2..]).unwrap();
    let hash: [u8; 32] = hex::decode(&f["tx_sha256"].as_str().unwrap()[2..]).unwrap().try_into().unwrap();
    let (spec, ext) = (f["spec_version"].as_u64().unwrap() as u32, f["extrinsic_index"].as_u64().unwrap() as u32);
    assert_eq!(applied(&events, spec, ext, hash), Ok(true));
}

// TxPartialSuccess has the same shape as TxApplied, one variant later.
#[test]
fn partial_success_is_not_applied() {
    let s = samples().into_iter().find(|s| s.applied.len() == 1).unwrap();
    let (ext, hash) = s.applied[0];
    let at = s.events.windows(34).position(|w| w[..2] == [midnight_pallet(s.spec).unwrap(), 2] && w[2..] == hash).unwrap();
    let mut events = s.events.clone();
    events[at + 1] = 7;
    assert_eq!(applied(&events, s.spec, ext, hash), Ok(false));
}

#[test]
fn unknown_spec_is_refused() {
    let s = &samples()[0];
    assert_eq!(applied(&s.events, 2001101, 0, [0; 32]), Err(Error::UnknownSpec));
}

#[test]
fn leftover_and_missing_bytes_are_refused() {
    for s in samples() {
        let mut longer = s.events.clone();
        longer.push(0);
        assert_eq!(applied(&longer, s.spec, 0, [0; 32]), Err(Error::TrailingBytes), "{}", s.name);
        for cut in [0, 1, s.events.len() / 2, s.events.len() - 1] {
            assert_eq!(applied(&s.events[..cut], s.spec, 0, [0; 32]), Err(Error::BadEvents), "{} cut {cut}", s.name);
        }
    }
}

// No flipped bit makes a record appear: true needs the exact TxApplied record bytes in the value.
#[test]
fn flipped_bits_never_invent_a_record() {
    for s in samples() {
        let Some(&(ext, hash)) = s.applied.first() else { continue };
        let want = record(s.spec, ext, hash);
        let (mut refused, mut kept) = (0, 0);
        for at in 0..s.events.len() {
            for bit in 0..8 {
                let mut m = s.events.clone();
                m[at] ^= 1 << bit;
                match applied(&m, s.spec, ext, hash) {
                    Ok(true) => {
                        assert!(contains(&m, &want), "{} byte {at} bit {bit}", s.name);
                        kept += 1;
                    }
                    Ok(false) => {}
                    Err(_) => refused += 1,
                }
            }
        }
        println!("{}: {} flips, {refused} refused, {kept} still applied", s.name, s.events.len() * 8);
    }
}
