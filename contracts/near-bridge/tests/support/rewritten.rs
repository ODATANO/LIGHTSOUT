//! The recorded burn block around another transaction. No transaction of the form the Midnight
//! bridge writes now is recorded yet, so the tests put a rewritten one into the recorded block.

use codec::{Decode, Encode};
use serde_json::{Value, json};

fn unhex(v: &Value) -> Vec<u8> {
    hex::decode(v.as_str().unwrap().trim_start_matches("0x")).unwrap()
}

fn hexed(bytes: &[u8]) -> Value {
    json!(format!("0x{}", hex::encode(bytes)))
}

/// A state trie holding only `entries`, with the nodes that prove all of them and show that
/// the trie holds none of `absent`.
pub fn state_trie_reading(entries: &[(&[u8], Vec<u8>)], absent: &[&[u8]]) -> ([u8; 32], Vec<Vec<u8>>) {
    use sp_trie::{LayoutV1, MemoryDB, Recorder, Trie, TrieDBBuilder, TrieDBMutBuilder, TrieMut};
    type Layout = LayoutV1<substrate_read_proof::Blake2Hasher>;
    let mut db = MemoryDB::<substrate_read_proof::Blake2Hasher>::default();
    let mut root = Default::default();
    {
        let mut t = TrieDBMutBuilder::<Layout>::new(&mut db, &mut root).build();
        for (k, v) in entries {
            t.insert(k, v).unwrap();
        }
    }
    let mut recorder = Recorder::<Layout>::new();
    {
        let t = TrieDBBuilder::<Layout>::new(&db, &root).with_recorder(&mut recorder).build();
        for (k, _) in entries {
            t.get(k).unwrap();
        }
        for k in absent {
            t.get(k).unwrap();
        }
    }
    (root.0, recorder.drain().into_iter().map(|r| r.data).collect())
}

/// The recording with `tx` as its Midnight transaction. The extrinsic, the hash in the events,
/// the two roots of the block and the parent hash of each later header follow from it. The state
/// holds the two values a proof reads. The last header is no longer the justified one.
pub fn with_tx(recording: &Value, tx: &[u8], sha256: impl Fn(&[u8]) -> [u8; 32]) -> Value {
    let list = |v: &Value| -> Vec<Vec<u8>> { v.as_array().unwrap().iter().map(unhex).collect() };
    let mut f = recording.clone();
    let at = f["extrinsic_index"].as_u64().unwrap() as usize;

    // An extrinsic is a length, then a version byte, the call `[pallet, 0]` and the transaction.
    let mut extrinsics = list(&f["extrinsics"]);
    let body = Vec::<u8>::decode(&mut &extrinsics[at][..]).unwrap();
    extrinsics[at] = [&body[..3], &tx.to_vec().encode()[..]].concat().encode();

    let mut events = unhex(&f["storage_values"][0]);
    let (recorded_hash, hash) = (unhex(&f["tx_sha256"]), sha256(tx));
    let places: Vec<usize> = events.windows(32).enumerate().filter(|(_, w)| *w == recorded_hash).map(|(i, _)| i).collect();
    assert!(!places.is_empty(), "the recorded events do not name the transaction");
    for place in places {
        events[place..place + 32].copy_from_slice(&hash);
    }

    let keys = list(&f["storage_keys"]);
    let state = [(keys[0].as_slice(), events.clone()), (keys[1].as_slice(), unhex(&f["storage_values"][1]))];
    let (state_root, state_proof) = state_trie_reading(&state, &[]);

    let mut headers: Vec<midnight_grandpa::Header> = list(&f["headers"]).iter().map(|h| Decode::decode(&mut &h[..]).unwrap()).collect();
    headers[0].extrinsics_root = substrate_read_proof::extrinsic_proof(&extrinsics, at as u32).0.into();
    headers[0].state_root = state_root.into();
    for i in 1..headers.len() {
        headers[i].parent_hash = midnight_grandpa::header_hash(&headers[i - 1].encode());
    }

    f["tx"] = hexed(tx);
    f["tx_sha256"] = hexed(&hash);
    f["extrinsics"] = extrinsics.iter().map(|x| hexed(x)).collect();
    f["storage_values"][0] = hexed(&events);
    f["state_proof"] = state_proof.iter().map(|n| hexed(n)).collect();
    f["headers"] = headers.iter().map(|h| hexed(&h.encode())).collect();
    f
}
