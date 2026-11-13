#![allow(dead_code)]

use codec::Encode;
use ed25519_dalek::{Signature, VerifyingKey};
use midnight_grandpa::{LightClient, SignatureVerifier, header_hash};
use serde_json::Value;
use sp_core::H256;

pub struct Dalek;
impl SignatureVerifier for Dalek {
    fn ed25519_verify(&self, sig: &[u8; 64], msg: &[u8], pk: &[u8; 32]) -> bool {
        VerifyingKey::from_bytes(pk).is_ok_and(|k| k.verify_strict(msg, &Signature::from_bytes(sig)).is_ok())
    }
}

/// Accepts every signature, to reach the checks that run after the signatures.
pub struct AnySignature;
impl SignatureVerifier for AnySignature {
    fn ed25519_verify(&self, _: &[u8; 64], _: &[u8], _: &[u8; 32]) -> bool {
        true
    }
}

pub fn unhex(v: &Value) -> Vec<u8> {
    hex::decode(v.as_str().unwrap().trim_start_matches("0x")).unwrap()
}

pub fn load(dir: &str, f: &str) -> Value {
    serde_json::from_str(&std::fs::read_to_string(format!("{dir}/{f}")).unwrap()).unwrap()
}

/// SCALE-encodes an RPC header. The digest logs are already encoded digest items.
pub fn encode_header(h: &Value) -> Vec<u8> {
    let mut out = unhex(&h["parentHash"]);
    let number = u32::from_str_radix(h["number"].as_str().unwrap().trim_start_matches("0x"), 16).unwrap();
    codec::Compact(number).encode_to(&mut out);
    out.extend(unhex(&h["stateRoot"]));
    out.extend(unhex(&h["extrinsicsRoot"]));
    let logs = h["digest"]["logs"].as_array().unwrap();
    codec::Compact(logs.len() as u32).encode_to(&mut out);
    for l in logs {
        out.extend(unhex(l));
    }
    out
}

pub struct Block {
    pub number: u32,
    pub header: Vec<u8>,
    pub justification: Vec<u8>,
}

/// The first five set changes, then the latest four, in ascending order.
pub fn blocks(dir: &str) -> Vec<Block> {
    let mut b: Vec<Block> = load(dir, "justified-blocks.json")
        .as_array()
        .unwrap()
        .iter()
        .map(|b| {
            let header = encode_header(&b["header"]);
            assert_eq!(format!("{:?}", header_hash(&header)), b["hash"].as_str().unwrap(), "header encoding");
            let j = b["justifications"].as_array().unwrap().iter().find(|j| j[0] == "FRNK").unwrap();
            Block { number: b["number"].as_u64().unwrap() as u32, header, justification: unhex(&j[1]) }
        })
        .collect();
    b.sort_by_key(|x| x.number);
    b
}

pub fn genesis(dir: &str) -> LightClient {
    let g = load(dir, "genesis.json");
    let proof = g["proof"].as_array().unwrap().iter().map(unhex).collect();
    LightClient::from_genesis(H256::from_slice(&unhex(&g["hash"])), &encode_header(&g["header"]), proof).unwrap()
}
