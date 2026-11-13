//! Ledger 9 network: node 2.0.0, 7 permissioned validators.

mod common;

use codec::Decode;
use common::{Dalek, blocks, genesis};
use midnight_grandpa::{Header, LightClient};
use sp_consensus_grandpa::{ConsensusLog, GRANDPA_ENGINE_ID};
use sp_core::H256;

const DIR: &str = "tests/data/stagenet";

#[test]
fn genesis_set_has_7_keys() {
    let c = genesis(DIR);
    assert_eq!((c.set_id, c.authorities.len(), c.finalized_number), (0, 7, 0));
}

#[test]
fn follows_the_first_five_set_changes_from_genesis() {
    let mut c = genesis(DIR);
    for (i, b) in blocks(DIR).iter().take(5).enumerate() {
        let f = c.import(&b.header, &b.justification, &Dalek).unwrap();
        assert_eq!((f.number, f.new_set_id), (b.number, Some(i as u64 + 1)));
    }
    assert_eq!((c.set_id, c.finalized_number, c.authorities.len()), (5, 1243, 7));
}

#[test]
fn follows_the_latest_set_changes() {
    let b = blocks(DIR);
    let late = &b[5..];
    let h = Header::decode(&mut &late[0].header[..]).unwrap();
    let announced = h.digest.logs.iter().find_map(|d| d.consensus_try_to::<ConsensusLog<u32>>(&GRANDPA_ENGINE_ID)).unwrap();
    // Each session shuffles the same 7 keys, so the announced list also signs this block.
    let authorities = announced.try_into_change().unwrap().next_authorities;
    let (mut now, mut first) = (authorities.clone(), genesis(DIR).authorities);
    now.sort();
    first.sort();
    assert_eq!(now, first);
    let mut c = LightClient { set_id: 3877, authorities, finalized_hash: H256::zero(), finalized_number: late[0].number - 1 };
    for (i, b) in late.iter().enumerate() {
        assert_eq!(c.import(&b.header, &b.justification, &Dalek).unwrap().new_set_id, Some(3878 + i as u64));
    }
    assert_eq!((c.set_id, c.finalized_number), (3881, late[3].number));
}

// Recorded from `grandpa_proveFinality`, the source the relayer reads: its justification of a
// set change can differ from the one stored in the block, and both must verify.
#[test]
fn follows_16_set_changes_read_with_prove_finality() {
    let proofs = common::load(DIR, "prove-finality.json");
    let mut c = genesis(DIR);
    for (i, p) in proofs.as_array().unwrap().iter().enumerate() {
        let f = c.import(&common::unhex(&p["header"]), &common::unhex(&p["justification"]), &Dalek).unwrap();
        assert_eq!((u64::from(f.number), f.new_set_id), (p["number"].as_u64().unwrap(), Some(i as u64 + 1)));
    }
    assert_eq!((c.set_id, c.finalized_number), (16, 4543));
}
