//! A fed-ops update on Cardano preprod, signed by two 2-of-3 governance bodies.
mod common;

use common::{Native, data};
use mithril_light::{Multisig, Outpoint, TokenUpdate, candidate_update, parse_transaction};

const TX_HASH: &str = "f984693d8f5f1e1a90b971b11d8e142fc48d55e45d60322bd5358dc91bc070de";
const PREPROD_POLICY: &str = "d962fc619efb2b904e5a8443838500ef2145452af117ab8f9cc3f97f";
const TECH_AUTH: [&str; 3] = [
    "f932cb4c0de84606b3da87214324887270f5fb0e04a6870dc7df5f23",
    "1ef4e15cba8217811b9a9b2a7ec4a24a110418a38c2a9f0ae7127e04",
    "8585125fa41171f55c23cdadc3d0ad3692be927c6ed1b92d1f048335",
];
const COUNCIL: [&str; 3] = [
    "3958ae4a79fa36f52c9e0f5fab7aac2d4c4446a290b44e2d2f53d387",
    "c6f2de5adbbf0b77adcc6883d562a4f5a535017eaedc6804c5e55b33",
    "a7b42151bbc97e9ecd40f454d6dd0a24cf3e579c675f6552bd059c82",
];

fn body(keys: [&str; 3], threshold: u8) -> Multisig {
    Multisig { keys: keys.iter().map(|k| hex::decode(k).unwrap().try_into().unwrap()).collect(), threshold }
}

fn update() -> mithril_light::Transaction {
    parse_transaction(&hex::decode(data("preprod-fedops-update-f984693d.hex").trim()).unwrap()).unwrap()
}

#[test]
fn the_update_carries_both_quorums() {
    let tx = update();
    assert_eq!(hex::encode(tx.hash), TX_HASH);
    assert_eq!(tx.vkey_witnesses.len(), 7);
    let signers = tx.signers(&Native);
    assert_eq!(signers.len(), 7);
    assert!(body(COUNCIL, 2).approved(&signers));
    assert!(body(TECH_AUTH, 2).approved(&signers));
    assert!(body(TECH_AUTH, 3).approved(&signers));

    let policy: [u8; 28] = hex::decode(PREPROD_POLICY).unwrap().try_into().unwrap();
    let spent = Outpoint { tx_hash: hex::decode("2d14c502936d4b62fbc6d73a85aa220fc4f61c26e2d1b42645913d4540bce7d1").unwrap().try_into().unwrap(), index: 0 };
    let TokenUpdate::Moved(next, candidates) = candidate_update(&tx, &spent, &policy).unwrap() else { panic!("the token moved") };
    assert_eq!((hex::encode(next.tx_hash), next.index), (TX_HASH.to_string(), 0));
    assert!(!candidates.is_empty());
}

#[test]
fn a_broken_signature_does_not_count() {
    let mut tx = update();
    let council = body(COUNCIL, 2);
    // Break two of the three council signatures: the council quorum falls, the other body's holds.
    let mut broken = 0;
    for w in tx.vkey_witnesses.iter_mut().filter(|w| council.keys.contains(&blake2b_224(&w.vkey))).take(2) {
        w.signature[0] ^= 1;
        broken += 1;
    }
    assert_eq!(broken, 2);
    let signers = tx.signers(&Native);
    assert_eq!(signers.len(), 5);
    assert!(!council.approved(&signers));
    assert!(body(TECH_AUTH, 2).approved(&signers));
    assert!(!body(COUNCIL, 1).approved(&[]));
}

fn blake2b_224(vkey: &[u8; 32]) -> [u8; 28] {
    use blake2::{Blake2b, Digest, digest::consts::U28};
    Blake2b::<U28>::digest(vkey).into()
}
