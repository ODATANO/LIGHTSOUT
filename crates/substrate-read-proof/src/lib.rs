#![no_std]
//! Verifies a `state_getReadProof` result against a block's state root.

extern crate alloc;

use alloc::vec::Vec;
use codec::{Compact, Encode};
use hash_db::Hasher;
use sp_core::H256;
use sp_trie::{LayoutV1, MemoryDB, Recorder, StorageProof, Trie, TrieDBBuilder, TrieDBMutBuilder, TrieMut, read_trie_value};

/// Blake2b-256 trie hasher in pure Rust, the same as `sp_core::Blake2Hasher`.
/// sp-core exports that type only with `std`; the runtime's `BlakeTwo256` needs Substrate host calls.
#[derive(Debug)]
pub struct Blake2Hasher;

impl Hasher for Blake2Hasher {
    type Out = H256;
    type StdHasher = hash256_std_hasher::Hash256StdHasher;
    const LENGTH: usize = 32;

    fn hash(x: &[u8]) -> H256 {
        sp_crypto_hashing::blake2_256(x).into()
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum Error {
    /// A node on the path is missing, or a node does not hash to its parent's reference.
    InvalidProof,
}

/// Returns the value stored under `key`, or `None` if the proof shows the key is absent.
/// `LayoutV1` also reads V0 tries: the layouts differ only in how values are written.
pub fn read_value(state_root: [u8; 32], proof: Vec<Vec<u8>>, key: &[u8]) -> Result<Option<Vec<u8>>, Error> {
    let db = StorageProof::new(proof).into_memory_db::<Blake2Hasher>();
    read_trie_value::<LayoutV1<Blake2Hasher>, _>(&db, &H256(state_root), key, None, None)
        .map_err(|_| Error::InvalidProof)
}

/// Reads several keys from one proof, building its node set once.
pub fn read_values(state_root: [u8; 32], proof: Vec<Vec<u8>>, keys: &[&[u8]]) -> Result<Vec<Option<Vec<u8>>>, Error> {
    let db = StorageProof::new(proof).into_memory_db::<Blake2Hasher>();
    keys.iter()
        .map(|k| read_trie_value::<LayoutV1<Blake2Hasher>, _>(&db, &H256(state_root), k, None, None).map_err(|_| Error::InvalidProof))
        .collect()
}

/// The key of extrinsic `index` in a block's extrinsics trie.
pub fn extrinsic_key(index: u32) -> Vec<u8> {
    Compact(index).encode()
}

/// Builds a block's extrinsics trie and returns its root and the nodes that prove extrinsic `index`.
/// Each value is a SCALE-encoded extrinsic with its length prefix, as `chain_getBlock` returns it.
pub fn extrinsic_proof(extrinsics: &[Vec<u8>], index: u32) -> ([u8; 32], Vec<Vec<u8>>) {
    type Layout = LayoutV1<Blake2Hasher>;
    let mut db = MemoryDB::<Blake2Hasher>::new(&[0u8]);
    let mut root = H256::default();
    {
        let mut trie = TrieDBMutBuilder::<Layout>::new(&mut db, &mut root).build();
        for (i, x) in extrinsics.iter().enumerate() {
            trie.insert(&extrinsic_key(i as u32), x).expect("an in-memory trie takes every insert");
        }
    }
    let mut recorder = Recorder::<Layout>::new();
    {
        let trie = TrieDBBuilder::<Layout>::new(&db, &root).with_recorder(&mut recorder).build();
        trie.get(&extrinsic_key(index)).expect("the trie was just built");
    }
    (root.0, recorder.drain().into_iter().map(|r| r.data).collect())
}
