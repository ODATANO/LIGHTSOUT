use blake2::digest::consts::U32;
use blake2::{Blake2b, Digest};

use crate::Error;

pub type Hash = [u8; 32];

fn node(left: &[u8], right: &[u8]) -> Hash {
    Blake2b::<U32>::new().chain_update(left).chain_update(right).finalize().into()
}

/// A leaf of the registration tree: a registered party's key and stake, hashed without a tag.
pub fn leaf(vk: &[u8; 96], stake: u64) -> Hash {
    Blake2b::<U32>::new().chain_update(vk).chain_update(stake.to_be_bytes()).finalize().into()
}

fn parent(i: usize) -> usize {
    (i - 1) / 2
}

fn sibling(i: usize) -> usize {
    if i % 2 == 1 { i + 1 } else { i - 1 }
}

/// Checks that `leaves`, at the sorted leaf positions `indices`, are in the tree with `root`
/// and `nr_leaves` leaves, given the sibling hashes `values` in the order the walk needs them.
/// The same walk as mithril-stm's batch path.
pub fn verify_batch_path(root: &Hash, nr_leaves: usize, leaves: &[Hash], indices: &[usize], values: &[Hash]) -> Result<(), Error> {
    if leaves.len() != indices.len() || indices.is_empty() || indices.windows(2).any(|w| w[0] >= w[1]) {
        return Err(Error::BadBatchPath);
    }
    let width = nr_leaves.checked_next_power_of_two().ok_or(Error::BadBatchPath)?;
    let nr_nodes = width + nr_leaves - 1;
    let mut positions: Vec<usize> = indices.iter().map(|i| width + i - 1).collect();
    if positions.iter().any(|p| *p >= nr_nodes) {
        return Err(Error::BadBatchPath);
    }
    let mut hashes: Vec<Hash> = leaves.to_vec();
    let mut values = values.iter();
    let mut idx = positions[0];
    while idx > 0 {
        let mut next_hashes = Vec::with_capacity(positions.len());
        let mut next_positions = Vec::with_capacity(positions.len());
        idx = parent(idx);
        let mut i = 0;
        while i < positions.len() {
            next_positions.push(parent(positions[i]));
            if positions[i].is_multiple_of(2) {
                let left = values.next().ok_or(Error::BadBatchPath)?;
                next_hashes.push(node(left, &hashes[i]));
            } else {
                let sib = sibling(positions[i]);
                if i + 1 < positions.len() && positions[i + 1] == sib {
                    next_hashes.push(node(&hashes[i], &hashes[i + 1]));
                    i += 1;
                } else if sib < nr_nodes {
                    let right = values.next().ok_or(Error::BadBatchPath)?;
                    next_hashes.push(node(&hashes[i], right));
                } else {
                    let empty: Hash = Blake2b::<U32>::digest([0u8]).into();
                    next_hashes.push(node(&hashes[i], &empty));
                }
            }
            i += 1;
        }
        hashes = next_hashes;
        positions = next_positions;
    }
    if hashes.len() == 1 && &hashes[0] == root && values.next().is_none() {
        Ok(())
    } else {
        Err(Error::BadBatchPath)
    }
}
