use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::Error;
use crate::bls::BlsHost;
use crate::stm::{AggregateVerificationKey, MultiSignature};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct ProtocolParameters {
    pub k: u64,
    pub m: u64,
    pub phi_f: f64,
}

impl ProtocolParameters {
    // phi_f as an 8.24 fixed-point number, rounded to the nearest with ties to even, as mithril does.
    fn phi_f_fixed(&self) -> u32 {
        (self.phi_f * (1u64 << 24) as f64).round_ties_even() as u32
    }

    /// Hex SHA-256 of k, m and the fixed-point phi_f, all big-endian.
    pub fn compute_hash(&self) -> String {
        let digest = Sha256::new().chain_update(self.k.to_be_bytes()).chain_update(self.m.to_be_bytes()).chain_update(self.phi_f_fixed().to_be_bytes()).finalize();
        hex::encode(digest)
    }
}

// Two sets are equal when they hash alike. The signed message covers only that hash.
impl PartialEq for ProtocolParameters {
    fn eq(&self, other: &Self) -> bool {
        self.k == other.k && self.m == other.m && self.phi_f_fixed() == other.phi_f_fixed()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct Signer {
    pub party_id: String,
    #[serde(with = "crate::json::u64_string")]
    #[cfg_attr(feature = "abi", schemars(with = "String"))]
    pub stake: u64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct Metadata {
    pub network: String,
    pub version: String,
    pub parameters: ProtocolParameters,
    /// Unix nanoseconds.
    #[serde(with = "crate::json::i64_string")]
    #[cfg_attr(feature = "abi", schemars(with = "String"))]
    pub initiated_at: i64,
    #[serde(with = "crate::json::i64_string")]
    #[cfg_attr(feature = "abi", schemars(with = "String"))]
    pub sealed_at: i64,
    pub signers: Vec<Signer>,
}

impl Metadata {
    pub fn compute_hash(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(self.network.as_bytes());
        hasher.update(self.version.as_bytes());
        hasher.update(self.parameters.compute_hash().as_bytes());
        hasher.update(self.initiated_at.to_be_bytes());
        hasher.update(self.sealed_at.to_be_bytes());
        for signer in &self.signers {
            let party = Sha256::new().chain_update(signer.party_id.as_bytes()).chain_update(signer.stake.to_be_bytes()).finalize();
            hasher.update(hex::encode(party).as_bytes());
        }
        hex::encode(hasher.finalize())
    }
}

/// What a certificate certifies. The numbers are epoch, block number and offset or file number.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub enum SignedEntity {
    MithrilStakeDistribution(u64),
    CardanoStakeDistribution(u64),
    CardanoTransactions(u64, u64),
    CardanoDatabase(u64, u64),
    CardanoBlocksTransactions(u64, u64, u64),
}

impl SignedEntity {
    fn feed_hash(&self, hasher: &mut Sha256) {
        match self {
            SignedEntity::MithrilStakeDistribution(epoch) | SignedEntity::CardanoStakeDistribution(epoch) => hasher.update(epoch.to_be_bytes()),
            SignedEntity::CardanoTransactions(epoch, block) | SignedEntity::CardanoDatabase(epoch, block) => {
                hasher.update(epoch.to_be_bytes());
                hasher.update(block.to_be_bytes());
            }
            SignedEntity::CardanoBlocksTransactions(epoch, block, offset) => {
                hasher.update(5u16.to_be_bytes());
                hasher.update(epoch.to_be_bytes());
                hasher.update(block.to_be_bytes());
                hasher.update(offset.to_be_bytes());
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub enum Signature {
    Multi(MultiSignature),
    /// Ed25519 by the network's genesis key, hex of the 64 bytes.
    Genesis(String),
}

// The parts in the order mithril hashes them.
const MESSAGE_PARTS: [&str; 12] = [
    "snapshot_digest",
    "cardano_transactions_merkle_root",
    "cardano_blocks_transactions_merkle_root",
    "next_aggregate_verification_key",
    "next_protocol_parameters",
    "current_epoch",
    "latest_block_number",
    "cardano_blocks_transactions_block_number_offset",
    "cardano_stake_distribution_epoch",
    "cardano_stake_distribution_merkle_root",
    "cardano_database_merkle_root",
    "next_aggregate_verification_key_snark",
];

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct Certificate {
    pub previous_hash: String,
    pub epoch: u64,
    pub metadata: Metadata,
    /// Key and value of each protocol message part, in any order.
    pub message_parts: Vec<(String, String)>,
    pub signed_message: String,
    pub aggregate_verification_key: AggregateVerificationKey,
    pub signed_entity: Option<SignedEntity>,
    pub signature: Signature,
}

impl Certificate {
    pub fn message_part(&self, key: &str) -> Option<&str> {
        self.message_parts.iter().find(|(k, _)| k == key).map(|(_, v)| v.as_str())
    }

    /// Hex SHA-256 over the parts in mithril's order.
    pub fn compute_message_hash(&self) -> Result<String, Error> {
        if self.message_parts.iter().any(|(k, _)| !MESSAGE_PARTS.contains(&k.as_str())) {
            return Err(Error::UnknownMessagePart);
        }
        let mut hasher = Sha256::new();
        for key in MESSAGE_PARTS {
            if let Some(value) = self.message_part(key) {
                hasher.update(key.as_bytes());
                hasher.update(value.as_bytes());
            }
        }
        Ok(hex::encode(hasher.finalize()))
    }

    /// The certificate hash the aggregator publishes, as the next certificate's `previous_hash`.
    pub fn compute_hash(&self) -> Result<String, Error> {
        let mut hasher = Sha256::new();
        hasher.update(self.previous_hash.as_bytes());
        hasher.update(self.epoch.to_be_bytes());
        hasher.update(self.metadata.compute_hash().as_bytes());
        hasher.update(self.compute_message_hash()?.as_bytes());
        hasher.update(self.signed_message.as_bytes());
        hasher.update(self.aggregate_verification_key.to_json_hex().as_bytes());
        if let Some(entity) = &self.signed_entity {
            entity.feed_hash(&mut hasher);
        }
        match &self.signature {
            Signature::Multi(multi) => hasher.update(multi.to_json_hex().as_bytes()),
            Signature::Genesis(hex) => hasher.update(hex.as_bytes()),
        }
        Ok(hex::encode(hasher.finalize()))
    }

    // The checks every certificate passes on its own.
    fn verify_content(&self) -> Result<(), Error> {
        if self.compute_message_hash()? != self.signed_message {
            return Err(Error::MessageMismatch);
        }
        if self.message_part("current_epoch") != Some(self.epoch.to_string().as_str()) {
            return Err(Error::EpochMismatch);
        }
        Ok(())
    }

    /// Checks a genesis certificate against the network's genesis verification key.
    pub fn verify_genesis<H: BlsHost>(&self, host: &H, genesis_key: &[u8; 32]) -> Result<(), Error> {
        let Signature::Genesis(signature) = &self.signature else { return Err(Error::BadGenesisSignature) };
        self.verify_content()?;
        let signature: [u8; 64] = hex::decode(signature).ok().and_then(|s| s.try_into().ok()).ok_or(Error::BadGenesisSignature)?;
        if !host.ed25519_verify(&signature, self.signed_message.as_bytes(), genesis_key) {
            return Err(Error::BadGenesisSignature);
        }
        Ok(())
    }
}

/// What a verifier keeps between certificates: the epoch, the keys and parameters that sign in
/// it, and what the signers announced for the next epoch. The certificates' own hash links are
/// not signed, so the chain is the chain of announced keys.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct ChainState {
    pub epoch: u64,
    pub aggregate_verification_key: AggregateVerificationKey,
    pub parameters: ProtocolParameters,
    pub next_aggregate_verification_key: Option<AggregateVerificationKey>,
    pub next_parameters_hash: Option<String>,
}

impl ChainState {
    /// Pins a verified certificate as the start of the chain.
    pub fn from_certificate(certificate: &Certificate) -> Result<Self, Error> {
        Ok(Self {
            epoch: certificate.epoch,
            aggregate_verification_key: certificate.aggregate_verification_key.clone(),
            parameters: certificate.metadata.parameters.clone(),
            next_aggregate_verification_key: next_avk(certificate),
            next_parameters_hash: certificate.message_part("next_protocol_parameters").map(str::to_string),
        })
    }

    /// Starts the chain at a certificate the network's genesis key signed. Its key and its
    /// parameters must be the ones its signed message announces, because the signature covers
    /// nothing else of it.
    pub fn from_genesis<H: BlsHost>(host: &H, certificate: &Certificate, genesis_key: &[u8; 32]) -> Result<Self, Error> {
        certificate.verify_genesis(host, genesis_key)?;
        if next_avk(certificate).as_ref() != Some(&certificate.aggregate_verification_key) {
            return Err(Error::AvkNotChained);
        }
        if certificate.message_part("next_protocol_parameters") != Some(certificate.metadata.parameters.compute_hash().as_str()) {
            return Err(Error::ParametersNotChained);
        }
        Self::from_certificate(certificate)
    }

    /// Verifies `certificate` against this state and returns the state after it.
    pub fn verify<H: BlsHost>(&self, host: &H, certificate: &Certificate) -> Result<ChainState, Error> {
        let Signature::Multi(multi) = &certificate.signature else { return Err(Error::BadSignature) };
        certificate.verify_content()?;
        let avk = &certificate.aggregate_verification_key;
        let params = &certificate.metadata.parameters;
        let mut next = self.clone();
        if certificate.epoch == self.epoch {
            if *avk != self.aggregate_verification_key {
                return Err(Error::AvkNotChained);
            }
            if *params != self.parameters {
                return Err(Error::ParametersNotChained);
            }
        } else if certificate.epoch == self.epoch + 1 {
            if Some(avk) != self.next_aggregate_verification_key.as_ref() {
                return Err(Error::AvkNotChained);
            }
            if Some(params.compute_hash()) != self.next_parameters_hash {
                return Err(Error::ParametersNotChained);
            }
            next.epoch = certificate.epoch;
            next.aggregate_verification_key = avk.clone();
            next.parameters = params.clone();
        } else {
            return Err(Error::EpochNotChained);
        }
        multi.verify(host, certificate.signed_message.as_bytes(), avk, params)?;
        // A certificate without an announcement keeps what an earlier one of its epoch announced.
        if certificate.epoch != self.epoch {
            next.next_aggregate_verification_key = None;
            next.next_parameters_hash = None;
        }
        if let Some(avk) = next_avk(certificate) {
            next.next_aggregate_verification_key = Some(avk);
        }
        if let Some(hash) = certificate.message_part("next_protocol_parameters") {
            next.next_parameters_hash = Some(hash.to_string());
        }
        Ok(next)
    }
}

// The announced key for the next epoch, from the hex JSON in the protocol message.
fn next_avk(certificate: &Certificate) -> Option<AggregateVerificationKey> {
    certificate.message_part("next_aggregate_verification_key").and_then(parse_avk_json_hex)
}

/// Reads mithril's hex JSON of an aggregate verification key.
pub fn parse_avk_json_hex(hex_json: &str) -> Option<AggregateVerificationKey> {
    let json = String::from_utf8(hex::decode(hex_json).ok()?).ok()?;
    let root = json_byte_array(&json, "\"root\":")?;
    let nr_leaves = json_number(&json, "\"nr_leaves\":")?;
    let total_stake = json_number(&json, "\"total_stake\":")?;
    Some(AggregateVerificationKey { root: root.try_into().ok()?, nr_leaves, total_stake })
}

fn json_number(json: &str, key: &str) -> Option<u64> {
    let rest = &json[json.find(key)? + key.len()..];
    let end = rest.find(|c: char| !c.is_ascii_digit())?;
    rest[..end].parse().ok()
}

fn json_byte_array(json: &str, key: &str) -> Option<Vec<u8>> {
    let rest = &json[json.find(key)? + key.len()..];
    let rest = rest.strip_prefix('[')?;
    let end = rest.find(']')?;
    rest[..end].split(',').map(|n| n.trim().parse().ok()).collect()
}
