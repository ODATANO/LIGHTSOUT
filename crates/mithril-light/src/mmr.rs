use blake2::{Blake2s256, Digest};
use ckb_merkle_mountain_range::{Merge, MerkleProof, Result as MmrResult};
use serde::{Deserialize, Serialize};

use crate::Error;

// Mithril's Merkle mountain range: leaves are the raw identifier bytes, nodes Blake2s-256 of both children.
struct Blake2sMerge;

impl Merge for Blake2sMerge {
    type Item = Vec<u8>;
    fn merge(lhs: &Vec<u8>, rhs: &Vec<u8>) -> MmrResult<Vec<u8>> {
        Ok(Blake2s256::new().chain_update(lhs).chain_update(rhs).finalize().to_vec())
    }
}

fn merge(lhs: &[u8], rhs: &[u8]) -> Vec<u8> {
    Blake2s256::new().chain_update(lhs).chain_update(rhs).finalize().to_vec()
}

/// A transaction as the aggregator certifies it. Hashes are hex.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct CertifiedTransaction {
    pub transaction_hash: String,
    pub block_number: u64,
    pub slot_number: u64,
    pub block_hash: String,
}

impl CertifiedTransaction {
    /// The leaf bytes mithril stores for a transaction.
    pub fn leaf(&self) -> Vec<u8> {
        format!("Tx/{}/{}/{}/{}", self.transaction_hash, self.block_hash, self.block_number, self.slot_number).into_bytes()
    }
}

struct Proof {
    root: Vec<u8>,
    leaves: Vec<(u64, Vec<u8>)>,
    size: u64,
    items: Vec<Vec<u8>>,
}

// A proof over block ranges whose leaves are the roots of the ranges' own proofs.
struct MapProof {
    master: Proof,
    subs: Vec<((u64, u64), MapProof)>,
}

// bincode's standard configuration: little-endian with variable-length integers.
struct Reader<'a> {
    bytes: &'a [u8],
    pos: usize,
}

impl Reader<'_> {
    fn take(&mut self, n: usize) -> Result<&[u8], Error> {
        let end = self.pos.checked_add(n).filter(|e| *e <= self.bytes.len()).ok_or(Error::BadProofEncoding)?;
        let out = &self.bytes[self.pos..end];
        self.pos = end;
        Ok(out)
    }

    fn varint(&mut self) -> Result<u64, Error> {
        let first = self.take(1)?[0];
        Ok(match first {
            0..=250 => first as u64,
            251 => u16::from_le_bytes(self.take(2)?.try_into().unwrap()) as u64,
            252 => u32::from_le_bytes(self.take(4)?.try_into().unwrap()) as u64,
            253 => u64::from_le_bytes(self.take(8)?.try_into().unwrap()),
            _ => return Err(Error::BadProofEncoding),
        })
    }

    fn len(&mut self) -> Result<usize, Error> {
        let n = self.varint()?;
        if n > self.bytes.len() as u64 { Err(Error::BadProofEncoding) } else { Ok(n as usize) }
    }

    fn bytes(&mut self) -> Result<Vec<u8>, Error> {
        let n = self.len()?;
        Ok(self.take(n)?.to_vec())
    }

    fn proof(&mut self) -> Result<Proof, Error> {
        let root = self.bytes()?;
        let n = self.len()?;
        let mut leaves = Vec::with_capacity(n);
        for _ in 0..n {
            leaves.push((self.varint()?, self.bytes()?));
        }
        let size = self.varint()?;
        let n = self.len()?;
        let mut items = Vec::with_capacity(n);
        for _ in 0..n {
            items.push(self.bytes()?);
        }
        Ok(Proof { root, leaves, size, items })
    }

    fn map_proof(&mut self, depth: usize) -> Result<MapProof, Error> {
        if depth > 4 {
            return Err(Error::BadProofEncoding);
        }
        let master = self.proof()?;
        let n = self.len()?;
        let mut subs = Vec::with_capacity(n);
        for _ in 0..n {
            let range = (self.varint()?, self.varint()?);
            subs.push((range, self.map_proof(depth + 1)?));
        }
        Ok(MapProof { master, subs })
    }
}

impl Proof {
    fn verify(&self) -> Result<(), Error> {
        // The library drops every further leaf at a position it has seen, without hashing it.
        let mut positions: Vec<u64> = self.leaves.iter().map(|(position, _)| *position).collect();
        positions.sort_unstable();
        positions.dedup();
        if positions.len() != self.leaves.len() {
            return Err(Error::BadInclusionProof);
        }
        let ok = MerkleProof::<Vec<u8>, Blake2sMerge>::new(self.size, self.items.clone())
            .verify(self.root.clone(), self.leaves.clone())
            .map_err(|_| Error::BadInclusionProof)?;
        if ok { Ok(()) } else { Err(Error::BadInclusionProof) }
    }

    fn contains(&self, leaf: &[u8]) -> bool {
        self.leaves.iter().any(|(_, l)| l == leaf)
    }
}

impl MapProof {
    fn verify(&self) -> Result<(), Error> {
        for (_, sub) in &self.subs {
            sub.verify()?;
        }
        self.master.verify()?;
        // A block range's leaf in the master tree is the range's key hashed with its root.
        for ((start, end), sub) in &self.subs {
            let key = format!("{start}-{end}").into_bytes();
            if !self.master.contains(&merge(&key, &sub.master.root)) {
                return Err(Error::BadInclusionProof);
            }
        }
        Ok(())
    }

    fn contains(&self, leaf: &[u8]) -> bool {
        self.master.contains(leaf) || self.subs.iter().any(|(_, sub)| sub.contains(leaf))
    }
}

/// Checks the aggregator's inclusion proof for `transaction` and returns the Merkle root it proves,
/// which must be the `cardano_blocks_transactions_merkle_root` of a verified certificate.
pub fn verify_transaction_proof(proof: &[u8], transaction: &CertifiedTransaction) -> Result<[u8; 32], Error> {
    let mut reader = Reader { bytes: proof, pos: 0 };
    let map = reader.map_proof(0)?;
    if reader.pos != proof.len() {
        return Err(Error::BadProofEncoding);
    }
    map.verify()?;
    if !map.contains(&transaction.leaf()) {
        return Err(Error::TransactionNotProven);
    }
    map.master.root.try_into().map_err(|_| Error::BadProofEncoding)
}
