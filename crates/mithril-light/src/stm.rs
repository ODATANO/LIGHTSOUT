use std::collections::BTreeSet;

use blake2::digest::consts::U16;
use blake2::{Blake2b, Digest};
use serde::{Deserialize, Serialize};

use crate::Error;
use crate::bls::{BlsHost, G1_COMPRESSED, G1_POINT, G2_COMPRESSED, G2_GENERATOR, G2_POINT, SCALAR, negate_g1};
use crate::certificate::ProtocolParameters;
use crate::hash_to_curve::hash_to_g1;
use crate::merkle::{self, Hash};

/// A signer as registered for the epoch: its BLS key (compressed G2) and its stake.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct RegisteredParty {
    #[serde(with = "hex::serde")]
    #[cfg_attr(feature = "abi", schemars(with = "String"))]
    pub vk: [u8; G2_COMPRESSED],
    #[serde(with = "crate::json::u64_string")]
    #[cfg_attr(feature = "abi", schemars(with = "String"))]
    pub stake: u64,
}

/// One signer's contribution: a BLS signature (compressed G1) and the lottery indices it won.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct SignatureEntry {
    #[serde(with = "hex::serde")]
    #[cfg_attr(feature = "abi", schemars(with = "String"))]
    pub sigma: [u8; G1_COMPRESSED],
    pub indexes: Vec<u64>,
    /// The signer's leaf in the registration tree.
    pub signer_index: u64,
    pub party: RegisteredParty,
}

/// The sibling hashes that place the signers' leaves in the registration tree.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct BatchPath {
    pub values: Vec<Hash>,
    pub indices: Vec<u64>,
}

/// A Mithril multi-signature of the concatenation proof system.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct MultiSignature {
    pub signatures: Vec<SignatureEntry>,
    pub batch_proof: BatchPath,
}

/// The registration tree root, its leaf count and the total stake of one epoch.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct AggregateVerificationKey {
    pub root: Hash,
    pub nr_leaves: u64,
    #[serde(with = "crate::json::u64_string")]
    #[cfg_attr(feature = "abi", schemars(with = "String"))]
    pub total_stake: u64,
}

impl AggregateVerificationKey {
    /// The hex of the JSON that mithril serializes, as it appears in a certificate.
    pub fn to_json_hex(&self) -> String {
        let json = format!(
            r#"{{"mt_commitment":{{"root":{},"nr_leaves":{},"hasher":null}},"total_stake":{}}}"#,
            byte_array(&self.root),
            self.nr_leaves,
            self.total_stake
        );
        hex::encode(json)
    }
}

impl MultiSignature {
    /// The hex of the JSON that mithril serializes, as it appears in a certificate.
    pub fn to_json_hex(&self) -> String {
        let signatures: Vec<String> = self
            .signatures
            .iter()
            .map(|s| {
                format!(
                    r#"[{{"sigma":{},"indexes":{},"signer_index":{}}},[{},{}]]"#,
                    byte_array(&s.sigma),
                    number_array(&s.indexes),
                    s.signer_index,
                    byte_array(&s.party.vk),
                    s.party.stake
                )
            })
            .collect();
        let values: Vec<String> = self.batch_proof.values.iter().map(|v| byte_array(v)).collect();
        let json = format!(
            r#"{{"signatures":[{}],"batch_proof":{{"values":[{}],"indices":{},"hasher":null}}}}"#,
            signatures.join(","),
            values.join(","),
            number_array(&self.batch_proof.indices)
        );
        hex::encode(json)
    }

    /// Checks the multi-signature over `msg` for the signers of `avk` under `params`.
    pub fn verify<H: BlsHost>(&self, host: &H, msg: &[u8], avk: &AggregateVerificationKey, params: &ProtocolParameters) -> Result<(), Error> {
        // Signers sign the message with the registration root appended.
        let mut msgp = msg.to_vec();
        msgp.extend_from_slice(&avk.root);

        let mut unique = BTreeSet::new();
        let mut count = 0usize;
        for entry in &self.signatures {
            let mut lottery = crate::lottery::Lottery::new(params.phi_f, entry.party.stake, avk.total_stake)?;
            for &index in &entry.indexes {
                if index > params.m {
                    return Err(Error::LotteryLost);
                }
                if !lottery.is_won(crate::lottery::evaluate(&msgp, index, &entry.sigma)) {
                    return Err(Error::LotteryLost);
                }
                unique.insert(index);
                count += 1;
            }
        }
        if count != unique.len() {
            return Err(Error::IndexNotUnique);
        }
        if (count as u64) < params.k {
            return Err(Error::NotEnoughSignatures);
        }

        let leaves: Vec<Hash> = self.signatures.iter().map(|s| merkle::leaf(&s.party.vk, s.party.stake)).collect();
        let indices: Vec<usize> = self.batch_proof.indices.iter().map(|i| *i as usize).collect();
        merkle::verify_batch_path(&avk.root, avk.nr_leaves as usize, &leaves, &indices, &self.batch_proof.values)?;

        self.verify_aggregate(host, &msgp)
    }

    // e(σ, G2) == e(H(msgp), vk) for the aggregated σ and vk.
    fn verify_aggregate<H: BlsHost>(&self, host: &H, msgp: &[u8]) -> Result<(), Error> {
        let sigmas: Vec<u8> = self.signatures.iter().flat_map(|s| s.sigma).collect();
        let vks: Vec<u8> = self.signatures.iter().flat_map(|s| s.party.vk).collect();
        let sigmas = host.bls12381_p1_decompress(&sigmas).ok_or(Error::BadPoint)?;
        let vks = host.bls12381_p2_decompress(&vks).ok_or(Error::BadPoint)?;
        let (sigma, vk) = if self.signatures.len() == 1 {
            (sigmas, vks)
        } else {
            // Random 128-bit weights from the signatures themselves keep a rogue key from cancelling out.
            let mut digest = Blake2b::<U16>::new();
            for entry in &self.signatures {
                digest.update(entry.sigma);
            }
            let mut g1_pairs = Vec::with_capacity(self.signatures.len() * (G1_POINT + SCALAR));
            let mut g2_pairs = Vec::with_capacity(self.signatures.len() * (G2_POINT + SCALAR));
            for (i, (sigma, vk)) in sigmas.chunks(G1_POINT).zip(vks.chunks(G2_POINT)).enumerate() {
                let mut scalar = [0u8; SCALAR];
                scalar[..16].copy_from_slice(&digest.clone().chain_update(i.to_be_bytes()).finalize());
                g1_pairs.extend_from_slice(sigma);
                g1_pairs.extend_from_slice(&scalar);
                g2_pairs.extend_from_slice(vk);
                g2_pairs.extend_from_slice(&scalar);
            }
            (host.bls12381_g1_multiexp(&g1_pairs).ok_or(Error::BadPoint)?, host.bls12381_g2_multiexp(&g2_pairs).ok_or(Error::BadPoint)?)
        };
        let hashed = hash_to_g1(host, msgp)?;
        let neg_hashed = negate_g1(&hashed).ok_or(Error::BadPoint)?;
        let mut pairs = Vec::with_capacity(2 * (G1_POINT + G2_POINT));
        pairs.extend_from_slice(&neg_hashed);
        pairs.extend_from_slice(&vk);
        pairs.extend_from_slice(&sigma);
        pairs.extend_from_slice(&G2_GENERATOR);
        match host.bls12381_pairing_check(&pairs) {
            Some(true) => Ok(()),
            Some(false) => Err(Error::BadSignature),
            None => Err(Error::BadPoint),
        }
    }
}

fn byte_array(bytes: &[u8]) -> String {
    let items: Vec<String> = bytes.iter().map(|b| b.to_string()).collect();
    format!("[{}]", items.join(","))
}

fn number_array(numbers: &[u64]) -> String {
    let items: Vec<String> = numbers.iter().map(|n| n.to_string()).collect();
    format!("[{}]", items.join(","))
}
