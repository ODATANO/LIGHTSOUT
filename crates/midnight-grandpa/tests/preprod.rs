mod common;

use codec::{Decode, Encode};
use common::{AnySignature, Block, Dalek, encode_header, unhex};
use midnight_grandpa::{Error, Header, LightClient, header_hash};
use sp_consensus_grandpa::{AuthorityList, AuthoritySignature, ConsensusLog, GRANDPA_ENGINE_ID, GrandpaJustification, ScheduledChange};
use sp_core::H256;
use sp_runtime::generic::DigestItem;

const DIR: &str = "tests/data";

/// Set changes at blocks 17 to 893, then the latest four.
fn blocks() -> Vec<Block> {
    common::blocks(DIR)
}

fn genesis() -> LightClient {
    common::genesis(DIR)
}

fn load(f: &str) -> serde_json::Value {
    common::load(DIR, f)
}

fn justification(b: &Block) -> GrandpaJustification<Header> {
    GrandpaJustification::<Header>::decode(&mut &b.justification[..]).unwrap()
}

fn announced_set(header: &[u8]) -> AuthorityList {
    let h = Header::decode(&mut &header[..]).unwrap();
    let log = h.digest.logs.iter().find_map(|d| d.consensus_try_to::<ConsensusLog<u32>>(&GRANDPA_ENGINE_ID)).unwrap();
    log.try_into_change().unwrap().next_authorities
}

#[test]
fn genesis_set_has_13_keys() {
    let c = genesis();
    assert_eq!((c.set_id, c.authorities.len(), c.finalized_number), (0, 13, 0));
}

#[test]
fn follows_the_first_five_set_changes_from_genesis() {
    let mut c = genesis();
    for (i, b) in blocks().iter().take(5).enumerate() {
        let f = c.import(&b.header, &b.justification, &Dalek).unwrap();
        assert_eq!((f.number, f.new_set_id), (b.number, Some(i as u64 + 1)));
    }
    assert_eq!((c.set_id, c.finalized_number, c.authorities.len()), (5, 893, 130));
}

#[test]
fn follows_the_latest_set_changes() {
    let b = blocks();
    let late = &b[5..];
    // Start at set 10872 with the list block 3244318 announces. The 13 keys have not changed since genesis.
    let mut c = LightClient {
        set_id: 10872,
        authorities: announced_set(&late[0].header),
        finalized_hash: H256::zero(),
        finalized_number: late[0].number - 1,
    };
    for (i, b) in late.iter().enumerate() {
        assert_eq!(c.import(&b.header, &b.justification, &Dalek).unwrap().new_set_id, Some(10873 + i as u64));
    }
    assert_eq!((c.set_id, c.finalized_number), (10876, 3245218));
}

#[test]
fn rejects_wrong_genesis_hash_and_bad_authority_proof() {
    let g = load("genesis.json");
    let header = encode_header(&g["header"]);
    let mut proof: Vec<Vec<u8>> = g["proof"].as_array().unwrap().iter().map(unhex).collect();
    assert_eq!(LightClient::from_genesis(H256::zero(), &header, proof.clone()).unwrap_err(), Error::GenesisHashMismatch);
    let n = proof[0].len() - 1;
    proof[0][n] ^= 1;
    assert_eq!(LightClient::from_genesis(header_hash(&header), &header, proof).unwrap_err(), Error::GenesisAuthoritiesNotProven);
}

#[test]
fn rejects_a_forged_signature() {
    let b = blocks();
    let mut j = justification(&b[0]);
    let mut s: [u8; 64] = AsRef::<[u8]>::as_ref(&j.commit.precommits[0].signature).try_into().unwrap();
    s[10] ^= 1;
    j.commit.precommits[0].signature = AuthoritySignature::from(sp_core::ed25519::Signature::from_raw(s));
    assert_eq!(genesis().import(&b[0].header, &j.encode(), &Dalek).unwrap_err(), Error::InvalidSignature);
}

#[test]
fn rejects_a_wrong_set_id() {
    let b = blocks();
    let mut c = genesis();
    c.set_id = 1;
    assert_eq!(c.import(&b[0].header, &b[0].justification, &Dalek).unwrap_err(), Error::InvalidSignature);
}

#[test]
fn rejects_skipping_a_set_change() {
    // Block 180 is signed by set 1. A client still on set 0 must not accept it.
    let b = blocks();
    assert_eq!(genesis().import(&b[1].header, &b[1].justification, &Dalek).unwrap_err(), Error::InvalidSignature);
}

#[test]
fn rejects_too_little_weight() {
    let b = blocks();
    let mut j = justification(&b[0]);
    // 13 voters of weight 1, so the threshold is 9.
    j.commit.precommits.truncate(8);
    assert_eq!(genesis().import(&b[0].header, &j.encode(), &Dalek).unwrap_err(), Error::InvalidCommit);
}

#[test]
fn rejects_a_duplicate_voter() {
    let b = blocks();
    let mut j = justification(&b[0]);
    j.commit.precommits.truncate(8);
    let dup = j.commit.precommits[0].clone();
    j.commit.precommits.push(dup);
    assert_eq!(genesis().import(&b[0].header, &j.encode(), &Dalek).unwrap_err(), Error::InvalidCommit);
}

#[test]
fn rejects_an_unused_ancestry_header() {
    let b = blocks();
    let mut j = justification(&b[0]);
    j.votes_ancestries.push(Header::decode(&mut &b[1].header[..]).unwrap());
    assert_eq!(genesis().import(&b[0].header, &j.encode(), &Dalek).unwrap_err(), Error::InvalidAncestry);
}

#[test]
fn rejects_a_precommit_without_ancestry() {
    let b = blocks();
    let mut j = justification(&b[0]);
    j.commit.precommits[0].precommit.target_hash = H256::repeat_byte(7);
    j.commit.precommits[0].precommit.target_number += 1;
    assert_eq!(genesis().import(&b[0].header, &j.encode(), &AnySignature).unwrap_err(), Error::InvalidCommit);
}

#[test]
fn rejects_a_header_the_justification_does_not_finalize() {
    let b = blocks();
    assert_eq!(genesis().import(&b[1].header, &b[0].justification, &Dalek).unwrap_err(), Error::TargetMismatch);
}

#[test]
fn rejects_a_block_that_is_not_newer() {
    let b = blocks();
    let mut c = genesis();
    c.import(&b[0].header, &b[0].justification, &Dalek).unwrap();
    assert_eq!(c.import(&b[0].header, &b[0].justification, &Dalek).unwrap_err(), Error::NotNewer);
}

#[test]
fn rejects_trailing_bytes() {
    let b = blocks();
    let mut j = b[0].justification.clone();
    j.push(0);
    assert_eq!(genesis().import(&b[0].header, &j, &Dalek).unwrap_err(), Error::BadJustification);
}

#[test]
fn stops_on_forced_and_delayed_changes() {
    let b = blocks();
    let next = announced_set(&b[0].header);
    for log in [
        ConsensusLog::ForcedChange(0u32, ScheduledChange { next_authorities: next.clone(), delay: 0 }),
        ConsensusLog::ScheduledChange(ScheduledChange { next_authorities: next.clone(), delay: 5 }),
    ] {
        let mut h = Header::decode(&mut &b[0].header[..]).unwrap();
        h.digest.logs.retain(|d| d.as_consensus().is_none_or(|(id, _)| id != GRANDPA_ENGINE_ID));
        h.digest.logs.push(DigestItem::Consensus(GRANDPA_ENGINE_ID, log.encode()));
        let header = h.encode();
        let hash = header_hash(&header);
        let mut j = justification(&b[0]);
        j.commit.target_hash = hash;
        for p in &mut j.commit.precommits {
            p.precommit.target_hash = hash;
        }
        assert_eq!(genesis().import(&header, &j.encode(), &AnySignature).unwrap_err(), Error::UnsupportedChange);
    }
}
