//! Midnight finality and burn proofs, checked on NEAR.

use codec::{Decode, DecodeAll, Encode};
use midnight_grandpa::LightClient;
use near_sdk::env;
use near_sdk::json_types::Base64VecU8;
use near_sdk::near;

/// Storage key of `System::Events`: twox128("System") ++ twox128("Events").
pub const EVENTS_KEY: [u8; 32] = [
    0x26, 0xaa, 0x39, 0x4e, 0xea, 0x56, 0x30, 0xe0, 0x7c, 0x48, 0xae, 0x0c, 0x95, 0x58, 0xce, 0xf7,
    0x80, 0xd4, 0x1e, 0x5e, 0x16, 0x05, 0x67, 0x65, 0xbc, 0x84, 0x61, 0x85, 0x10, 0x72, 0xc9, 0xd7,
];
/// Storage key of `System::LastRuntimeUpgrade`.
pub const LAST_RUNTIME_UPGRADE_KEY: [u8; 32] = [
    0x26, 0xaa, 0x39, 0x4e, 0xea, 0x56, 0x30, 0xe0, 0x7c, 0x48, 0xae, 0x0c, 0x95, 0x58, 0xce, 0xf7,
    0xf9, 0xcc, 0xe9, 0xc8, 0x88, 0x46, 0x9b, 0xb1, 0xa0, 0xdc, 0xea, 0xa1, 0x29, 0x67, 0x2e, 0xf8,
];
/// Storage key of `System::AuthorizedUpgrade`, set from the vote for a new runtime until it is applied.
pub const AUTHORIZED_UPGRADE_KEY: [u8; 32] = [
    0x26, 0xaa, 0x39, 0x4e, 0xea, 0x56, 0x30, 0xe0, 0x7c, 0x48, 0xae, 0x0c, 0x95, 0x58, 0xce, 0xf7,
    0x2f, 0xa9, 0xf1, 0xbf, 0x25, 0x56, 0x78, 0x08, 0x77, 0x1b, 0xff, 0x09, 0x1d, 0xc8, 0x9e, 0xcd,
];
pub struct NearSig;
impl midnight_grandpa::SignatureVerifier for NearSig {
    fn ed25519_verify(&self, signature: &[u8; 64], message: &[u8], public_key: &[u8; 32]) -> bool {
        env::ed25519_verify(signature, message, public_key)
    }
}

/// The genesis of the Midnight chain. Only `genesis_hash` is trusted; the rest is checked against it.
#[near(serializers = [json])]
pub struct MidnightGenesis {
    /// 32 bytes, hex.
    pub genesis_hash: String,
    pub header: Base64VecU8,
    /// Read proof of `Grandpa::Authorities` against the genesis state root.
    pub authorities_proof: Vec<Base64VecU8>,
}

/// A header and the GRANDPA justification that finalizes it.
#[near(serializers = [json])]
pub struct FinalityProof {
    pub header: Base64VecU8,
    pub justification: Base64VecU8,
}

/// The light client state as the bridge exposes it.
#[near(serializers = [json])]
pub struct MidnightView {
    pub set_id: u64,
    pub authorities: u32,
    pub finalized_number: u32,
    pub finalized_hash: String,
}

/// Midnight builds one block per slot of six seconds, counted from the Unix epoch.
pub const SLOT_NS: u64 = 6_000_000_000;

/// Whether Midnight had authorized a new runtime at a block finalized here.
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub struct UpgradeCheck {
    pub block: u32,
    /// A new runtime was voted in and is not applied yet.
    pub authorized: bool,
    /// When Midnight built the checked block, Unix nanoseconds.
    pub at: near_sdk::json_types::U64,
}

/// What the bridge knows of Midnight's runtime.
#[near(serializers = [json])]
#[derive(Clone, Debug, PartialEq)]
pub struct RuntimeView {
    /// The newest finalized Midnight block.
    pub block: u32,
    /// The spec version of the runtime that built it; 0 = its header logs none.
    pub spec: u32,
    /// The bridge has a table for that version, so it can prove burns in such blocks.
    pub readable: bool,
    /// The newest check for an authorized runtime upgrade.
    pub upgrade: Option<UpgradeCheck>,
    /// The highest NEAR block the Midnight bridge is proven to have made its head.
    pub accepted_head: Option<near_sdk::json_types::U64>,
    /// `lock` and `register` are open: readable, a check within the last hour found no upgrade
    /// authorized, and the accepted head is at most 43,200 NEAR blocks old.
    pub locks_open: bool,
}

pub fn start(genesis: MidnightGenesis) -> Result<Vec<u8>, String> {
    let hash = unhex32("genesis_hash", &genesis.genesis_hash)?;
    let proof = genesis.authorities_proof.into_iter().map(|p| p.0).collect();
    let client = LightClient::from_genesis(hash.into(), &genesis.header.0, proof).map_err(|e| format!("genesis: {e:?}"))?;
    Ok(client.encode())
}

pub fn load(encoded: &[u8]) -> LightClient {
    LightClient::decode(&mut &encoded[..]).unwrap_or_else(|_| env::panic_str("stored light client is corrupt"))
}

pub fn view(client: &LightClient) -> MidnightView {
    MidnightView {
        set_id: client.set_id,
        authorities: client.authorities.len() as u32,
        finalized_number: client.finalized_number,
        finalized_hash: hex::encode(client.finalized_hash.0),
    }
}

/// A committee in a canonical form: its distinct keys, sorted, each SCALE-encoded with a weight of 1.
/// Seats are left out. Cardano names the keys, and Midnight alone decides how many seats each holds.
pub fn committee_of_keys(keys: impl IntoIterator<Item = Vec<u8>>) -> Vec<u8> {
    let mut members: Vec<(Vec<u8>, u64)> = keys.into_iter().map(|key| (key, 1)).collect();
    members.sort();
    members.dedup();
    members.encode()
}

/// The keys of the light client's authority set, as `committee_of_keys` writes them.
pub fn committee(client: &LightClient) -> Vec<u8> {
    committee_of_keys(client.authorities.iter().map(|(id, _)| id.encode()))
}

/// Whether every key of `set` is a key of `committee`, both as `committee_of_keys` writes them.
pub fn within(set: &[u8], committee: &[u8]) -> bool {
    let keys = |encoded: &[u8]| Vec::<(Vec<u8>, u64)>::decode_all(&mut &encoded[..]).unwrap_or_else(|_| env::panic_str("stored committee is corrupt"));
    let committee = keys(committee);
    keys(set).iter().all(|key| committee.contains(key))
}

/// The transaction in a `Midnight.send_mn_transaction` extrinsic as the block holds it: a length,
/// a bare extrinsic of version 4 or 5, the call `[pallet, 0]`, then the transaction bytes.
pub fn midnight_tx(extrinsic: &[u8], pallet: u8) -> Result<Vec<u8>, String> {
    let bad = || "extrinsic is not an unsigned Midnight.send_mn_transaction".to_string();
    let body = Vec::<u8>::decode_all(&mut &extrinsic[..]).map_err(|_| bad())?;
    match body.as_slice() {
        [4 | 5, p, 0, rest @ ..] if *p == pallet => Vec::<u8>::decode_all(&mut &rest[..]).map_err(|_| bad()),
        _ => Err(bad()),
    }
}

/// The spec version at the start of `System::LastRuntimeUpgrade`, which names the runtime that
/// ran the block. What follows it is not read, so a field added there breaks nothing.
pub fn runtime_spec(value: &[u8]) -> Result<u32, String> {
    let spec = codec::Compact::<u32>::decode(&mut &value[..]).map_err(|_| "LastRuntimeUpgrade does not decode".to_string())?;
    Ok(spec.0)
}

/// A NEAR account from its zero-padded bytes.
pub fn recipient(bytes: &[u8]) -> Result<String, String> {
    let len = bytes.iter().rposition(|b| *b != 0).map_or(0, |i| i + 1);
    String::from_utf8(bytes[..len].to_vec()).map_err(|_| "burn recipient is not UTF-8".to_string())
}

pub fn unhex32(name: &str, value: &str) -> Result<[u8; 32], String> {
    hex::decode(value)
        .ok()
        .and_then(|b| b.try_into().ok())
        .ok_or_else(|| format!("{name} must be 32 bytes of hex"))
}
