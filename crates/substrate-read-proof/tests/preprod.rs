use substrate_read_proof::{Error, read_value};

struct Vector { root: [u8; 32], key: Vec<u8>, value: Vec<u8>, proof: Vec<Vec<u8>> }

fn unhex(s: &serde_json::Value) -> Vec<u8> { hex::decode(s.as_str().unwrap().trim_start_matches("0x")).unwrap() }

fn load(file: &str, key_field: &str) -> Vector {
    let j: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(format!("tests/data/{file}")).unwrap()).unwrap();
    Vector {
        root: unhex(&j["header"]["stateRoot"]).try_into().unwrap(),
        key: unhex(&j[key_field]),
        value: unhex(&j["value"]),
        proof: j["proof"].as_array().unwrap().iter().map(unhex).collect(),
    }
}

#[test]
fn statekey_proof_from_preprod_verifies() {
    let v = load("statekey-proof.json", "key");
    assert_eq!(read_value(v.root, v.proof, &v.key), Ok(Some(v.value)));
}

#[test]
fn statekey_proof_from_stagenet_verifies() {
    let v = load("stagenet-statekey-proof.json", "key");
    assert_eq!(read_value(v.root, v.proof, &v.key), Ok(Some(v.value)));
}

#[test]
fn genesis_grandpa_authorities_proof_verifies() {
    let v = load("genesis.json", "grandpaAuthoritiesKey");
    assert_eq!(read_value(v.root, v.proof, &v.key), Ok(Some(v.value)));
}

#[test]
fn wrong_root_fails() {
    let mut v = load("statekey-proof.json", "key");
    v.root[0] ^= 1;
    assert_eq!(read_value(v.root, v.proof, &v.key), Err(Error::InvalidProof));
}

#[test]
fn changed_node_fails() {
    let v = load("statekey-proof.json", "key");
    for i in 0..v.proof.len() {
        let mut proof = v.proof.clone();
        let last = proof[i].len() - 1;
        proof[i][last] ^= 1;
        assert_ne!(read_value(v.root, proof, &v.key), Ok(Some(v.value.clone())), "node {i}");
    }
}

#[test]
fn missing_node_fails() {
    let v = load("statekey-proof.json", "key");
    for i in 0..v.proof.len() {
        let mut proof = v.proof.clone();
        proof.remove(i);
        assert_eq!(read_value(v.root, proof, &v.key), Err(Error::InvalidProof), "node {i}");
    }
}

#[test]
fn other_key_is_not_proven() {
    let v = load("statekey-proof.json", "key");
    let mut key = v.key.clone();
    *key.last_mut().unwrap() ^= 1;
    assert_ne!(read_value(v.root, v.proof, &key), Ok(Some(v.value)));
}
