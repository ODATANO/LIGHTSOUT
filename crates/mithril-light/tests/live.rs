//! Certificates and a transaction proof recorded from the pre-release-preview aggregator.
mod common;

use common::{Native, certificate, data};
use mithril_light::certificate::parse_avk_json_hex;
use mithril_light::{CertifiedTransaction, ChainState, Error, Signature, verify_transaction_proof};
use serde_json::Value;

fn load(name: &str) -> (mithril_light::Certificate, String) {
    certificate(&data(&format!("certificate-{name}.json")))
}

#[test]
fn certificate_hashes_match_the_aggregator() {
    for name in ["1469-mit", "1470-mit", "1471-mit", "1471-car"] {
        let (cert, hash) = load(name);
        assert_eq!(cert.compute_hash().unwrap(), hash, "{name}");
        assert_eq!(cert.compute_message_hash().unwrap(), cert.signed_message, "{name}");
    }
}

#[test]
fn json_hex_round_trips() {
    let raw: Value = serde_json::from_str(&data("certificate-1471-car.json")).unwrap();
    let (cert, _) = load("1471-car");
    assert_eq!(cert.aggregate_verification_key.to_json_hex(), raw["aggregate_verification_key"].as_str().unwrap());
    let Signature::Multi(multi) = &cert.signature else { panic!() };
    assert_eq!(multi.to_json_hex(), raw["multi_signature"].as_str().unwrap());
}

#[test]
fn every_multi_signature_verifies() {
    for name in ["1469-mit", "1470-mit", "1471-mit", "1471-car"] {
        let (cert, _) = load(name);
        let Signature::Multi(multi) = &cert.signature else { panic!() };
        multi.verify(&Native, cert.signed_message.as_bytes(), &cert.aggregate_verification_key, &cert.metadata.parameters).unwrap_or_else(|e| panic!("{name}: {e:?}"));
    }
}

#[test]
fn a_certificate_of_two_signers_verifies() {
    let (cert, hash) = load("1479-two");
    assert_eq!(cert.compute_hash().unwrap(), hash);
    let Signature::Multi(multi) = &cert.signature else { panic!() };
    assert_eq!(multi.signatures.len(), 2);
    multi.verify(&Native, cert.signed_message.as_bytes(), &cert.aggregate_verification_key, &cert.metadata.parameters).unwrap();
}

#[test]
fn a_changed_message_or_index_is_refused() {
    let (cert, _) = load("1471-car");
    let Signature::Multi(multi) = &cert.signature else { panic!() };
    let avk = &cert.aggregate_verification_key;
    let params = &cert.metadata.parameters;
    let mut other = cert.signed_message.clone().into_bytes();
    other[0] ^= 1;
    assert_eq!(multi.verify(&Native, &other, avk, params), Err(Error::LotteryLost));

    let mut extra = multi.clone();
    let first = extra.signatures[0].indexes[0];
    extra.signatures[0].indexes.push(first);
    assert_eq!(extra.verify(&Native, cert.signed_message.as_bytes(), avk, params), Err(Error::IndexNotUnique));

    let mut few = multi.clone();
    few.signatures[0].indexes.truncate(params.k as usize - 1);
    assert_eq!(few.verify(&Native, cert.signed_message.as_bytes(), avk, params), Err(Error::NotEnoughSignatures));

    let mut richer = multi.clone();
    richer.signatures[0].party.stake += 1;
    assert!(matches!(richer.verify(&Native, cert.signed_message.as_bytes(), avk, params), Err(Error::BadBatchPath | Error::LotteryLost)));

    let mut forged = multi.clone();
    forged.signatures[0].sigma = multi.batch_proof.values[0].iter().chain([0u8; 16].iter()).copied().collect::<Vec<u8>>().try_into().unwrap();
    assert!(matches!(forged.verify(&Native, cert.signed_message.as_bytes(), avk, params), Err(Error::LotteryLost | Error::BadPoint | Error::BadSignature)));
}

#[test]
fn the_chain_follows_two_epoch_changes() {
    let (start, _) = load("1469-mit");
    let state = ChainState::from_certificate(&start).unwrap();
    assert_eq!(state.next_aggregate_verification_key, parse_avk_json_hex(start.message_part("next_aggregate_verification_key").unwrap()));

    let (c1470, _) = load("1470-mit");
    let state = state.verify(&Native, &c1470).unwrap();
    assert_eq!(state.epoch, 1470);

    let (c1471, _) = load("1471-mit");
    let state = state.verify(&Native, &c1471).unwrap();
    assert_eq!(state.epoch, 1471);

    // A later certificate of the same epoch is signed with the same key and keeps what was announced.
    let (later, _) = load("1471-car");
    let after = state.verify(&Native, &later).unwrap();
    assert_eq!(after.aggregate_verification_key, state.aggregate_verification_key);
    assert!(after.next_aggregate_verification_key.is_some());

    // The link to another certificate is not signed and plays no part.
    let mut relinked = later.clone();
    relinked.previous_hash = "00".repeat(32);
    assert_eq!(state.verify(&Native, &relinked), Ok(after.clone()));

    // Skipping an epoch, or re-using an old epoch's certificate, fails.
    let (c1469, _) = load("1469-mit");
    assert_eq!(ChainState::from_certificate(&c1469).unwrap().verify(&Native, &c1471), Err(Error::EpochNotChained));
    assert_eq!(state.verify(&Native, &c1470), Err(Error::EpochNotChained));
    let mut wrong_epoch = later.clone();
    wrong_epoch.epoch = 1472;
    assert_eq!(state.verify(&Native, &wrong_epoch), Err(Error::EpochMismatch));
}

#[test]
fn phi_f_is_hashed_as_mithril_rounds_it() {
    use sha2::{Digest, Sha256};
    // 0.05 * 2^24 is 838860.8, and mithril rounds to the nearest.
    let parameters = mithril_light::ProtocolParameters { k: 5, m: 100, phi_f: 0.05 };
    let expected = Sha256::new().chain_update(5u64.to_be_bytes()).chain_update(100u64.to_be_bytes()).chain_update(838_861u32.to_be_bytes()).finalize();
    assert_eq!(parameters.compute_hash(), hex::encode(expected));
}

#[test]
fn parameters_that_hash_alike_count_as_the_same() {
    let (c1470, _) = load("1470-mit");
    let state = ChainState::from_certificate(&c1470).unwrap();
    // The first certificate of an epoch, its phi_f moved by less than the hash can tell.
    let (mut nudged, _) = load("1471-mit");
    nudged.metadata.parameters.phi_f += 1e-9;
    let state = state.verify(&Native, &nudged).unwrap();
    let (later, _) = load("1471-car");
    assert!(state.verify(&Native, &later).is_ok());
}

#[test]
fn the_transaction_proof_matches_the_certified_root() {
    let proof: Value = serde_json::from_str(&data("proof-v2-3fad67d4.json")).unwrap();
    let certified = &proof["certified_transactions"];
    let item = &certified["items"][0];
    let tx = CertifiedTransaction {
        transaction_hash: item["transaction_hash"].as_str().unwrap().to_string(),
        block_number: item["block_number"].as_u64().unwrap(),
        slot_number: item["slot_number"].as_u64().unwrap(),
        block_hash: item["block_hash"].as_str().unwrap().to_string(),
    };
    let bytes = hex::decode(certified["proof"].as_str().unwrap()).unwrap();
    let root = verify_transaction_proof(&bytes, &tx).unwrap();

    let (cert, hash) = load("1471-car");
    assert_eq!(hash, proof["certificate_hash"].as_str().unwrap());
    assert_eq!(hex::encode(root), cert.message_part("cardano_blocks_transactions_merkle_root").unwrap());

    let mut other = tx.clone();
    other.block_number += 1;
    assert_eq!(verify_transaction_proof(&bytes, &other), Err(Error::TransactionNotProven));
    let mut damaged = bytes.clone();
    let last = damaged.len() - 1;
    damaged[last] ^= 1;
    assert!(matches!(verify_transaction_proof(&damaged, &tx), Err(Error::BadInclusionProof | Error::BadProofEncoding)));
}

#[test]
fn a_second_leaf_at_a_proven_position_is_refused() {
    // The recorded proof with a made-up transaction added at the position of the real one.
    let bytes = hex::decode(data("proof-v2-3fad67d4-doubled-leaf.hex").trim()).unwrap();
    let made_up = CertifiedTransaction { transaction_hash: "ff".repeat(32), block_number: 0, slot_number: 0, block_hash: "00".repeat(32) };
    assert_eq!(verify_transaction_proof(&bytes, &made_up), Err(Error::BadInclusionProof));
}

fn genesis_key() -> [u8; 32] {
    let key: Vec<u8> = serde_json::from_slice(&hex::decode(data("genesis.vkey").trim()).unwrap()).unwrap();
    key.try_into().unwrap()
}

#[test]
fn the_networks_genesis_certificate_starts_a_chain() {
    let (genesis, _) = load("1129-genesis");
    let state = ChainState::from_genesis(&Native, &genesis, &genesis_key()).unwrap();
    assert_eq!(state.epoch, 1129);
    assert_eq!(state.aggregate_verification_key, genesis.aggregate_verification_key);
    assert_eq!(state.next_aggregate_verification_key, Some(genesis.aggregate_verification_key.clone()));

    // The genesis signature covers the message only, so the fields beside it must match it.
    let mut other_key = genesis.clone();
    other_key.aggregate_verification_key.total_stake += 1;
    assert_eq!(ChainState::from_genesis(&Native, &other_key, &genesis_key()), Err(Error::AvkNotChained));
    let mut other_parameters = genesis.clone();
    other_parameters.metadata.parameters.k += 1;
    assert_eq!(ChainState::from_genesis(&Native, &other_parameters, &genesis_key()), Err(Error::ParametersNotChained));
    let mut other_message = genesis.clone();
    other_message.epoch += 1;
    assert_eq!(ChainState::from_genesis(&Native, &other_message, &genesis_key()), Err(Error::EpochMismatch));

    let mut wrong = genesis_key();
    wrong[0] ^= 1;
    assert_eq!(ChainState::from_genesis(&Native, &genesis, &wrong), Err(Error::BadGenesisSignature));
    // A certificate the signers made is no genesis certificate.
    let (signed, _) = load("1469-mit");
    assert_eq!(ChainState::from_genesis(&Native, &signed, &genesis_key()), Err(Error::BadGenesisSignature));
    // And the chain itself takes no genesis certificate as one of its own.
    assert_eq!(state.verify(&Native, &genesis), Err(Error::BadSignature));
}

#[test]
fn the_relayer_json_is_the_contract_argument() {
    // Written by the relayer's `toContractCertificate` from certificate-1471-car.json.
    let mut cert: mithril_light::Certificate = serde_json::from_str(&data("contract-certificate-1471-car.json")).unwrap();
    let (mut expected, hash) = load("1471-car");
    // The parts may come in any order; the hash sorts them.
    cert.message_parts.sort();
    expected.message_parts.sort();
    assert_eq!(cert, expected);
    assert_eq!(cert.compute_hash().unwrap(), hash);
}
