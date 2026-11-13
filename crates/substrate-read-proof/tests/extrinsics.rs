//! The extrinsics trie of a real dev-chain block, rebuilt from `chain_getBlock`.

use substrate_read_proof::{Error, extrinsic_key, extrinsic_proof, read_value};

fn block() -> (Vec<Vec<u8>>, [u8; 32]) {
    let f: serde_json::Value = serde_json::from_str(&std::fs::read_to_string("../../contracts/near-bridge/tests/fixtures/burn-tx.json").unwrap()).unwrap();
    let unhex = |v: &serde_json::Value| hex::decode(&v.as_str().unwrap()[2..]).unwrap();
    let xs = f["extrinsics"].as_array().unwrap().iter().map(unhex).collect();
    (xs, unhex(&f["block"]["extrinsics_root"]).try_into().unwrap())
}

#[test]
fn rebuilt_root_is_the_header_root() {
    let (xs, root) = block();
    for i in 0..xs.len() as u32 {
        let (built, proof) = extrinsic_proof(&xs, i);
        assert_eq!(built, root);
        assert_eq!(read_value(root, proof, &extrinsic_key(i)), Ok(Some(xs[i as usize].clone())));
    }
}

#[test]
fn a_proof_shows_one_extrinsic_only() {
    let (xs, root) = block();
    let (_, proof) = extrinsic_proof(&xs, 4);
    assert_eq!(read_value(root, proof.clone(), &extrinsic_key(3)), Err(Error::InvalidProof));
    assert_eq!(read_value(root, proof.clone(), &extrinsic_key(xs.len() as u32)), Ok(None));
    let mut other = root;
    other[0] ^= 1;
    assert_eq!(read_value(other, proof, &extrinsic_key(4)), Err(Error::InvalidProof));
}
