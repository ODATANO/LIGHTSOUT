#![no_std]
//! A GRANDPA light client for Midnight that starts at the genesis block.
//! It follows every authority set change and checks justifications the way the node does.

extern crate alloc;

use alloc::{collections::BTreeMap, collections::BTreeSet, vec::Vec};
use codec::{Decode, DecodeAll, Encode};
use finality_grandpa::{Chain, Message, voter_set::VoterSet};
use sp_consensus_grandpa::{AuthorityId, AuthorityList, ConsensusLog, GRANDPA_ENGINE_ID, GrandpaJustification, SetId, localized_payload};
use sp_core::H256;
use sp_runtime::{generic::DigestItem, traits::BlakeTwo256};

pub type Header = sp_runtime::generic::Header<u32, BlakeTwo256>;

/// Checks one ed25519 signature. On NEAR this is the `ed25519_verify` host function.
pub trait SignatureVerifier {
    fn ed25519_verify(&self, signature: &[u8; 64], message: &[u8], public_key: &[u8; 32]) -> bool;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    GenesisHashMismatch,
    GenesisAuthoritiesNotProven,
    BadHeader,
    BadJustification,
    /// The header is not above the last finalized block.
    NotNewer,
    /// The justification finalizes another block than the given header.
    TargetMismatch,
    /// The precommits do not reach the threshold, or a voter is not in the set.
    InvalidCommit,
    InvalidSignature,
    /// `votes_ancestries` has a missing or an unused header.
    InvalidAncestry,
    /// A forced change or a delayed change. These are not proven by finality, so the client stops.
    UnsupportedChange,
    BadGrandpaLog,
    EmptyAuthoritySet,
}

/// Blake2b-256 of a SCALE-encoded header, which is the block hash.
pub fn header_hash(encoded: &[u8]) -> H256 {
    H256(sp_crypto_hashing::blake2_256(encoded))
}

/// Storage key of `Grandpa::Authorities`.
pub fn authorities_key() -> Vec<u8> {
    let mut k = sp_crypto_hashing::twox_128(b"Grandpa").to_vec();
    k.extend_from_slice(&sp_crypto_hashing::twox_128(b"Authorities"));
    k
}

#[derive(Debug, Clone, PartialEq, Eq, Encode, Decode)]
pub struct LightClient {
    pub set_id: SetId,
    pub authorities: AuthorityList,
    pub finalized_hash: H256,
    pub finalized_number: u32,
}

/// The engine id under which every Midnight header logs the spec version of its runtime.
pub const RUNTIME_ENGINE_ID: [u8; 4] = *b"MNSV";

/// The spec version of the runtime that built a block, as its header logs it.
pub fn runtime_version(h: &Header) -> Option<u32> {
    h.digest.logs.iter().find_map(|item| match item {
        DigestItem::Consensus(id, data) if *id == RUNTIME_ENGINE_ID => u32::decode_all(&mut &data[..]).ok(),
        _ => None,
    })
}

/// The engine id under which Aura logs the slot a block was built in.
pub const AURA_ENGINE_ID: [u8; 4] = *b"aura";

/// The slot a block was built in, as its header logs it.
pub fn slot(h: &Header) -> Option<u64> {
    h.digest.logs.iter().find_map(|item| match item {
        DigestItem::PreRuntime(id, data) if *id == AURA_ENGINE_ID => u64::decode_all(&mut &data[..]).ok(),
        _ => None,
    })
}

/// A block the client accepted as final.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Finalized {
    pub hash: H256,
    pub number: u32,
    pub state_root: H256,
    /// The spec version of the runtime that built the block; None when the header logs none.
    pub runtime: Option<u32>,
    /// The slot the block was built in; None when the header logs none.
    pub slot: Option<u64>,
    /// Set when this block enacted a new authority set.
    pub new_set_id: Option<SetId>,
}

impl LightClient {
    /// Starts from the genesis header. The genesis authority set is read from the
    /// genesis state with a storage proof, so the only trusted input is `genesis_hash`.
    pub fn from_genesis(genesis_hash: H256, header: &[u8], authorities_proof: Vec<Vec<u8>>) -> Result<Self, Error> {
        if header_hash(header) != genesis_hash {
            return Err(Error::GenesisHashMismatch);
        }
        let h = Header::decode_all(&mut &header[..]).map_err(|_| Error::BadHeader)?;
        if h.number != 0 {
            return Err(Error::BadHeader);
        }
        let raw = substrate_read_proof::read_value(h.state_root.0, authorities_proof, &authorities_key())
            .map_err(|_| Error::GenesisAuthoritiesNotProven)?
            .ok_or(Error::GenesisAuthoritiesNotProven)?;
        let authorities = AuthorityList::decode_all(&mut &raw[..]).map_err(|_| Error::GenesisAuthoritiesNotProven)?;
        voter_set(&authorities)?;
        Ok(Self { set_id: 0, authorities, finalized_hash: genesis_hash, finalized_number: 0 })
    }

    /// Accepts `header` as final if `justification` is valid for the current set.
    /// If the header schedules a new set, that set applies from the next block on.
    pub fn import(&mut self, header: &[u8], justification: &[u8], sig: &impl SignatureVerifier) -> Result<Finalized, Error> {
        let hash = header_hash(header);
        let h = Header::decode_all(&mut &header[..]).map_err(|_| Error::BadHeader)?;
        if h.number <= self.finalized_number {
            return Err(Error::NotNewer);
        }
        self.verify_justification(hash, h.number, justification, sig)?;
        let change = scheduled_change(&h)?;
        if let Some(next) = &change {
            voter_set(next)?;
        }
        self.finalized_hash = hash;
        self.finalized_number = h.number;
        let new_set_id = change.map(|next| {
            self.authorities = next;
            self.set_id += 1;
            self.set_id
        });
        Ok(Finalized { hash, number: h.number, state_root: h.state_root, runtime: runtime_version(&h), slot: slot(&h), new_set_id })
    }

    /// Mirrors `GrandpaJustification::verify_with_voter_set` in sc-consensus-grandpa.
    pub fn verify_justification(&self, target_hash: H256, target_number: u32, justification: &[u8], sig: &impl SignatureVerifier) -> Result<(), Error> {
        let j = GrandpaJustification::<Header>::decode_all(&mut &justification[..]).map_err(|_| Error::BadJustification)?;
        if j.commit.target_hash != target_hash || j.commit.target_number != target_number {
            return Err(Error::TargetMismatch);
        }
        let voters = voter_set(&self.authorities)?;
        let ancestry = AncestryChain::new(&j.votes_ancestries);
        match finality_grandpa::validate_commit(&j.commit, &voters, &ancestry) {
            Ok(r) if r.is_valid() => {}
            _ => return Err(Error::InvalidCommit),
        }
        let base = j.commit.precommits.iter().min_by_key(|s| s.precommit.target_number).map(|s| s.precommit.target_hash).ok_or(Error::InvalidCommit)?;
        let mut visited = BTreeSet::new();
        for signed in &j.commit.precommits {
            let payload = localized_payload(j.round, self.set_id, &Message::<H256, u32>::Precommit(signed.precommit.clone()));
            let signature: &[u8; 64] = AsRef::<[u8]>::as_ref(&signed.signature).try_into().map_err(|_| Error::InvalidSignature)?;
            let public: &[u8; 32] = AsRef::<[u8]>::as_ref(&signed.id).try_into().map_err(|_| Error::InvalidSignature)?;
            if !sig.ed25519_verify(signature, &payload, public) {
                return Err(Error::InvalidSignature);
            }
            if signed.precommit.target_hash == base {
                continue;
            }
            let route = ancestry.ancestry(base, signed.precommit.target_hash).map_err(|_| Error::InvalidAncestry)?;
            visited.insert(signed.precommit.target_hash);
            visited.extend(route);
        }
        if visited != ancestry.headers.keys().copied().collect::<BTreeSet<_>>() {
            return Err(Error::InvalidAncestry);
        }
        Ok(())
    }
}

fn voter_set(authorities: &AuthorityList) -> Result<VoterSet<AuthorityId>, Error> {
    VoterSet::new(authorities.iter().cloned()).ok_or(Error::EmptyAuthoritySet)
}

/// Reads the GRANDPA logs of a header. Only an immediate scheduled change is accepted.
fn scheduled_change(h: &Header) -> Result<Option<AuthorityList>, Error> {
    let mut change = None;
    for item in &h.digest.logs {
        let DigestItem::Consensus(id, data) = item else { continue };
        if *id != GRANDPA_ENGINE_ID {
            continue;
        }
        match ConsensusLog::<u32>::decode_all(&mut &data[..]).map_err(|_| Error::BadGrandpaLog)? {
            ConsensusLog::ScheduledChange(c) if c.delay == 0 => {
                // The node applies the earliest scheduled change of a block.
                change.get_or_insert(c.next_authorities);
            }
            ConsensusLog::ScheduledChange(_) | ConsensusLog::ForcedChange(..) => return Err(Error::UnsupportedChange),
            ConsensusLog::OnDisabled(_) | ConsensusLog::Pause(_) | ConsensusLog::Resume(_) => {}
        }
    }
    Ok(change)
}

/// The headers of `votes_ancestries`, keyed by their hash.
struct AncestryChain {
    headers: BTreeMap<H256, H256>,
}

impl AncestryChain {
    fn new(headers: &[Header]) -> Self {
        Self { headers: headers.iter().map(|h| (header_hash(&h.encode()), h.parent_hash)).collect() }
    }
}

impl Chain<H256, u32> for AncestryChain {
    fn ancestry(&self, base: H256, block: H256) -> Result<Vec<H256>, finality_grandpa::Error> {
        let mut route = Vec::new();
        let mut current = block;
        while current != base {
            current = *self.headers.get(&current).ok_or(finality_grandpa::Error::NotDescendent)?;
            route.push(current);
        }
        route.pop();
        Ok(route)
    }
}
