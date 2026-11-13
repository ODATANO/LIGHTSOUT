//! Follows every set change from genesis to a recorded head.
//! Needs a recording of the chain's justified blocks:
//! `MIDNIGHT_CHAIN=<path to chain.bin> [MIDNIGHT_GENESIS=tests/data/stagenet] cargo test --release --test full_chain -- --ignored --nocapture`

mod common;

use common::{Dalek, genesis};

#[test]
#[ignore = "needs MIDNIGHT_CHAIN, a recording of about 120 MB"]
fn follows_every_set_change_from_genesis() {
    let data = std::fs::read(std::env::var("MIDNIGHT_CHAIN").expect("MIDNIGHT_CHAIN")).unwrap();
    let mut c = genesis(&std::env::var("MIDNIGHT_GENESIS").unwrap_or("tests/data".into()));
    let (mut at, mut sigs, start) = (0usize, 0usize, std::time::Instant::now());
    let take = |at: &mut usize| {
        let n = u32::from_le_bytes(data[*at..*at + 4].try_into().unwrap()) as usize;
        *at += 4 + n;
        &data[*at - n..*at]
    };
    while at < data.len() {
        let header = take(&mut at).to_vec();
        let justification = take(&mut at).to_vec();
        let expected = c.set_id + 1;
        let f = c.import(&header, &justification, &Dalek).unwrap_or_else(|e| panic!("set {expected}: {e:?}"));
        assert_eq!(f.new_set_id, Some(expected), "block {} must enact set {expected}", f.number);
        sigs += justification.len() / 132;
    }
    println!("set {} at block {}, about {} signatures, {:?}", c.set_id, c.finalized_number, sigs, start.elapsed());
}
