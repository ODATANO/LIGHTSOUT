//! Reads a Cardano transaction and the permissioned-candidates datum of a partner chain.
use blake2::digest::consts::{U28, U32};
use blake2::{Blake2b, Digest};
use serde::{Deserialize, Serialize};

use crate::Error;
use crate::bls::BlsHost;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct Outpoint {
    pub tx_hash: [u8; 32],
    pub index: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Asset {
    pub policy: [u8; 28],
    pub name: Vec<u8>,
    pub amount: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Output {
    pub address: Vec<u8>,
    pub lovelace: u64,
    pub assets: Vec<Asset>,
    pub inline_datum: Option<Vec<u8>>,
}

/// A key witness: an ed25519 public key and its signature over the transaction id.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VkeyWitness {
    pub vkey: [u8; 32],
    pub signature: [u8; 64],
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Transaction {
    /// Blake2b-256 of the body bytes, the transaction id.
    pub hash: [u8; 32],
    pub inputs: Vec<Outpoint>,
    pub outputs: Vec<Output>,
    /// The assets the transaction mints. What it burns is left out.
    pub minted: Vec<Asset>,
    pub vkey_witnesses: Vec<VkeyWitness>,
    /// Whether the ledger ran the scripts successfully; a failed one spends only the collateral.
    pub is_valid: bool,
}

impl Transaction {
    /// The key hashes (blake2b-224) of the witnesses whose signature over the transaction id holds.
    pub fn signers<H: BlsHost>(&self, host: &H) -> Vec<[u8; 28]> {
        self.vkey_witnesses
            .iter()
            .filter(|w| host.ed25519_verify(&w.signature, &self.hash, &w.vkey))
            .map(|w| Blake2b::<U28>::digest(w.vkey).into())
            .collect()
    }
}

/// A governance body as a native n-of-k script: key hashes and how many must sign.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct Multisig {
    pub keys: Vec<[u8; 28]>,
    pub threshold: u8,
}

impl Multisig {
    /// Whether at least `threshold` distinct keys of the body are among `signers`.
    pub fn approved(&self, signers: &[[u8; 28]]) -> bool {
        let mut seen: Vec<&[u8; 28]> = self.keys.iter().filter(|k| signers.contains(k)).collect();
        seen.sort();
        seen.dedup();
        seen.len() >= self.threshold as usize
    }
}

/// A permissioned block producer of the datum that has a GRANDPA key of 32 bytes. The node
/// drops one without, so it can hold no seat.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "abi", derive(schemars::JsonSchema))]
pub struct Candidate {
    pub partner_chain_key: Vec<u8>,
    pub grandpa: [u8; 32],
}

// Datum layouts the node understands, by the version in the third slot.
const VERSION_LEGACY: u64 = 0;
const VERSION_V1: u64 = 1;
const KEY_ID_LEN: usize = 4;

struct Cbor<'a> {
    bytes: &'a [u8],
    pos: usize,
}

enum Head {
    Uint(u64),
    Nint,
    Bytes(Option<usize>),
    Text(Option<usize>),
    Array(Option<usize>),
    Map(Option<usize>),
    Tag(u64),
    Simple(u8),
    Break,
}

impl<'a> Cbor<'a> {
    fn new(bytes: &'a [u8]) -> Self {
        Self { bytes, pos: 0 }
    }

    fn byte(&mut self) -> Result<u8, Error> {
        let b = *self.bytes.get(self.pos).ok_or(Error::BadCbor)?;
        self.pos += 1;
        Ok(b)
    }

    fn take(&mut self, n: usize) -> Result<&'a [u8], Error> {
        let end = self.pos.checked_add(n).filter(|e| *e <= self.bytes.len()).ok_or(Error::BadCbor)?;
        let out = &self.bytes[self.pos..end];
        self.pos = end;
        Ok(out)
    }

    fn head(&mut self) -> Result<Head, Error> {
        let initial = self.byte()?;
        let (major, info) = (initial >> 5, initial & 31);
        let arg = match info {
            0..=23 => Some(info as u64),
            24 => Some(self.byte()? as u64),
            25 => Some(u16::from_be_bytes(self.take(2)?.try_into().unwrap()) as u64),
            26 => Some(u32::from_be_bytes(self.take(4)?.try_into().unwrap()) as u64),
            27 => Some(u64::from_be_bytes(self.take(8)?.try_into().unwrap())),
            31 => None,
            _ => return Err(Error::BadCbor),
        };
        let len = |a: Option<u64>| a.map(|a| usize::try_from(a).map_err(|_| Error::BadCbor)).transpose();
        Ok(match (major, arg) {
            (0, Some(a)) => Head::Uint(a),
            (1, Some(_)) => Head::Nint,
            (2, a) => Head::Bytes(len(a)?),
            (3, a) => Head::Text(len(a)?),
            (4, a) => Head::Array(len(a)?),
            (5, a) => Head::Map(len(a)?),
            (6, Some(a)) => Head::Tag(a),
            (7, None) => Head::Break,
            (7, Some(_)) if info <= 24 => Head::Simple(if info == 24 { self.bytes[self.pos - 1] } else { info }),
            // Floats have no place in a transaction.
            (7, Some(_)) => return Err(Error::BadCbor),
            _ => return Err(Error::BadCbor),
        })
    }

    fn uint(&mut self) -> Result<u64, Error> {
        match self.head()? {
            Head::Uint(v) => Ok(v),
            _ => Err(Error::BadCbor),
        }
    }

    /// A byte string, joined when it comes in chunks.
    fn bytes(&mut self) -> Result<Vec<u8>, Error> {
        match self.head()? {
            Head::Bytes(Some(n)) => Ok(self.take(n)?.to_vec()),
            Head::Bytes(None) => {
                let mut out = Vec::new();
                loop {
                    match self.head()? {
                        Head::Bytes(Some(n)) => out.extend_from_slice(self.take(n)?),
                        Head::Break => return Ok(out),
                        _ => return Err(Error::BadCbor),
                    }
                }
            }
            _ => Err(Error::BadCbor),
        }
    }

    /// Opens an array and returns how many items follow, or None for an indefinite one.
    fn array(&mut self) -> Result<Option<usize>, Error> {
        match self.head()? {
            Head::Array(n) => Ok(n),
            _ => Err(Error::BadCbor),
        }
    }

    fn map(&mut self) -> Result<Option<usize>, Error> {
        match self.head()? {
            Head::Map(n) => Ok(n),
            _ => Err(Error::BadCbor),
        }
    }

    /// Whether an indefinite container ends here; consumes the break if so.
    fn at_break(&mut self) -> Result<bool, Error> {
        if self.bytes.get(self.pos) == Some(&0xff) {
            self.pos += 1;
            return Ok(true);
        }
        Ok(false)
    }

    /// Runs `f` for each item of the array that starts here.
    fn each<F: FnMut(&mut Self) -> Result<(), Error>>(&mut self, mut f: F) -> Result<(), Error> {
        match self.array()? {
            Some(n) => (0..n).try_for_each(|_| f(self)),
            None => {
                while !self.at_break()? {
                    f(self)?;
                }
                Ok(())
            }
        }
    }

    /// Runs `f` for each key of the map that starts here; `f` must consume the value.
    fn each_entry<F: FnMut(&mut Self, u64) -> Result<(), Error>>(&mut self, mut f: F) -> Result<(), Error> {
        let mut entry = |c: &mut Self| {
            let key = c.uint()?;
            f(c, key)
        };
        match self.map()? {
            Some(n) => (0..n).try_for_each(|_| entry(self)),
            None => {
                while !self.at_break()? {
                    entry(self)?;
                }
                Ok(())
            }
        }
    }

    /// Skips one complete item.
    fn skip(&mut self) -> Result<(), Error> {
        let mut pending = 1usize;
        while pending > 0 {
            pending -= 1;
            match self.head()? {
                Head::Uint(_) | Head::Nint | Head::Simple(_) => {}
                Head::Bytes(Some(n)) | Head::Text(Some(n)) => {
                    self.take(n)?;
                }
                Head::Bytes(None) | Head::Text(None) | Head::Array(None) => pending += self.skip_indefinite()?,
                Head::Map(None) => pending += self.skip_indefinite()?,
                Head::Array(Some(n)) => pending = pending.checked_add(n).ok_or(Error::BadCbor)?,
                Head::Map(Some(n)) => pending = pending.checked_add(n.checked_mul(2).ok_or(Error::BadCbor)?).ok_or(Error::BadCbor)?,
                Head::Tag(_) => pending += 1,
                Head::Break => return Err(Error::BadCbor),
            }
        }
        Ok(())
    }

    // Skips the items of an indefinite container up to its break.
    fn skip_indefinite(&mut self) -> Result<usize, Error> {
        while !self.at_break()? {
            self.skip()?;
        }
        Ok(0)
    }

    /// The raw bytes of the item that starts here.
    fn raw(&mut self) -> Result<&'a [u8], Error> {
        let start = self.pos;
        self.skip()?;
        Ok(&self.bytes[start..self.pos])
    }
}

/// Parses a transaction as the ledger serializes it: `[body, witnesses, is_valid, auxiliary]`.
pub fn parse_transaction(bytes: &[u8]) -> Result<Transaction, Error> {
    let mut c = Cbor::new(bytes);
    if c.array()? != Some(4) {
        return Err(Error::BadCbor);
    }
    let body = c.raw()?;
    let witnesses = c.raw()?;
    let is_valid = match c.head()? {
        Head::Simple(21) => true,
        Head::Simple(20) => false,
        _ => return Err(Error::BadCbor),
    };
    c.skip()?;
    if c.pos != bytes.len() {
        return Err(Error::BadCbor);
    }
    let hash: [u8; 32] = Blake2b::<U32>::digest(body).into();
    let (mut inputs, mut outputs, mut minted) = (Vec::new(), Vec::new(), Vec::new());
    Cbor::new(body).each_entry(|c, key| match key {
        0 => {
            // Conway wraps sets in tag 258.
            if let Head::Tag(258) = peek(c)? {
                c.head()?;
            }
            c.each(|c| {
                inputs.push(outpoint(c)?);
                Ok(())
            })
        }
        1 => c.each(|c| {
            outputs.push(output(c)?);
            Ok(())
        }),
        9 => multiasset(c, &mut minted, true),
        _ => c.skip(),
    })?;
    let mut vkey_witnesses = Vec::new();
    Cbor::new(witnesses).each_entry(|c, key| match key {
        0 => {
            if let Head::Tag(258) = peek(c)? {
                c.head()?;
            }
            c.each(|c| {
                vkey_witnesses.push(vkey_witness(c)?);
                Ok(())
            })
        }
        _ => c.skip(),
    })?;
    Ok(Transaction { hash, inputs, outputs, minted, vkey_witnesses, is_valid })
}

fn vkey_witness(c: &mut Cbor) -> Result<VkeyWitness, Error> {
    if c.array()? != Some(2) {
        return Err(Error::BadCbor);
    }
    let vkey = c.bytes()?.try_into().map_err(|_| Error::BadCbor)?;
    let signature = c.bytes()?.try_into().map_err(|_| Error::BadCbor)?;
    Ok(VkeyWitness { vkey, signature })
}

fn peek(c: &mut Cbor) -> Result<Head, Error> {
    let pos = c.pos;
    let head = c.head()?;
    c.pos = pos;
    Ok(head)
}

fn outpoint(c: &mut Cbor) -> Result<Outpoint, Error> {
    if c.array()? != Some(2) {
        return Err(Error::BadCbor);
    }
    let tx_hash = c.bytes()?.try_into().map_err(|_| Error::BadCbor)?;
    Ok(Outpoint { tx_hash, index: c.uint()? })
}

// A post-Alonzo output is a map; the older form is an array of address, value and datum hash.
fn output(c: &mut Cbor) -> Result<Output, Error> {
    let mut out = Output { address: Vec::new(), lovelace: 0, assets: Vec::new(), inline_datum: None };
    match peek(c)? {
        Head::Map(_) => c.each_entry(|c, key| match key {
            0 => {
                out.address = c.bytes()?;
                Ok(())
            }
            1 => value(c, &mut out),
            2 => {
                out.inline_datum = datum_option(c)?;
                Ok(())
            }
            _ => c.skip(),
        })?,
        Head::Array(_) => {
            let mut i = 0;
            c.each(|c| {
                match i {
                    0 => out.address = c.bytes()?,
                    1 => value(c, &mut out)?,
                    _ => c.skip()?,
                }
                i += 1;
                Ok(())
            })?;
        }
        _ => return Err(Error::BadCbor),
    }
    Ok(out)
}

// A value is a coin, or a coin and a map of policy to a map of asset name to amount.
fn value(c: &mut Cbor, out: &mut Output) -> Result<(), Error> {
    match peek(c)? {
        Head::Uint(_) => out.lovelace = c.uint()?,
        Head::Array(_) => {
            let mut i = 0;
            c.each(|c| {
                match i {
                    0 => out.lovelace = c.uint()?,
                    1 => multiasset(c, &mut out.assets, false)?,
                    _ => return Err(Error::BadCbor),
                }
                i += 1;
                Ok(())
            })?;
        }
        _ => return Err(Error::BadCbor),
    }
    Ok(())
}

// A map of policy to a map of asset name to an amount. The mint field has `burns`: negative
// amounts, which are left out.
fn multiasset(c: &mut Cbor, assets: &mut Vec<Asset>, burns: bool) -> Result<(), Error> {
    let policies = c.map()?;
    let mut n = 0;
    loop {
        if let Some(count) = policies {
            if n == count {
                break;
            }
        } else if c.at_break()? {
            break;
        }
        n += 1;
        let policy: [u8; 28] = c.bytes()?.try_into().map_err(|_| Error::BadCbor)?;
        let names = c.map()?;
        let mut m = 0;
        loop {
            if let Some(count) = names {
                if m == count {
                    break;
                }
            } else if c.at_break()? {
                break;
            }
            m += 1;
            let name = c.bytes()?;
            match c.head()? {
                Head::Uint(amount) => assets.push(Asset { policy, name, amount }),
                Head::Nint if burns => {}
                _ => return Err(Error::BadCbor),
            }
        }
    }
    Ok(())
}

// `[0, hash]` names a datum, `[1, #6.24(bytes)]` carries it inline.
fn datum_option(c: &mut Cbor) -> Result<Option<Vec<u8>>, Error> {
    if c.array()? != Some(2) {
        return Err(Error::BadCbor);
    }
    match c.uint()? {
        0 => {
            c.skip()?;
            Ok(None)
        }
        1 => match c.head()? {
            Head::Tag(24) => Ok(Some(c.bytes()?)),
            _ => Err(Error::BadCbor),
        },
        _ => Err(Error::BadCbor),
    }
}

/// Decodes the permissioned candidates as the node does: a versioned `[data, candidates, version]`
/// list, or the legacy list of `[key, aura, grandpa]` triples.
pub fn decode_candidates(datum: &[u8]) -> Result<Vec<Candidate>, Error> {
    let mut c = Cbor::new(datum);
    let outer = c.array()?;
    let mut items: Vec<&[u8]> = Vec::new();
    match outer {
        Some(n) => {
            for _ in 0..n {
                items.push(c.raw()?);
            }
        }
        None => {
            while !c.at_break()? {
                items.push(c.raw()?);
            }
        }
    }
    if c.pos != datum.len() {
        return Err(Error::BadDatum);
    }
    let versioned = items.len() == 3 && matches!(Cbor::new(items[2]).head(), Ok(Head::Uint(_)));
    let mut candidates = Vec::new();
    if !versioned {
        for item in items {
            candidates.extend(legacy_candidate(item)?);
        }
        return Ok(candidates);
    }
    let version = Cbor::new(items[2]).uint()?;
    match version {
        VERSION_LEGACY => Cbor::new(items[1]).each(|c| {
            candidates.extend(legacy_candidate(c.raw()?)?);
            Ok(())
        })?,
        VERSION_V1 => Cbor::new(items[1]).each(|c| {
            candidates.extend(v1_candidate(c)?);
            Ok(())
        })?,
        _ => return Err(Error::BadDatum),
    }
    Ok(candidates)
}

// `[key, aura, grandpa]`. Another shape fails the datum, as in the node. A GRANDPA key of
// another length only leaves this candidate out.
fn legacy_candidate(bytes: &[u8]) -> Result<Option<Candidate>, Error> {
    let mut c = Cbor::new(bytes);
    let mut fields: Vec<Vec<u8>> = Vec::new();
    c.each(|c| {
        fields.push(c.bytes()?);
        Ok(())
    })?;
    let [key, _aura, grandpa] = <[Vec<u8>; 3]>::try_from(fields).map_err(|_| Error::BadDatum)?;
    Ok(grandpa.try_into().ok().map(|grandpa| Candidate { partner_chain_key: key, grandpa }))
}

// `[key, [[id, bytes], ...]]` with ids of four bytes. Another shape fails the datum, as in the
// node. A candidate without a "gran" entry of 32 bytes is left out.
fn v1_candidate(c: &mut Cbor) -> Result<Option<Candidate>, Error> {
    let mut i = 0;
    let mut key = Vec::new();
    let mut grandpa = None;
    c.each(|c| {
        match i {
            0 => key = c.bytes()?,
            1 => c.each(|c| {
                let mut j = 0;
                let (mut id, mut bytes) = (Vec::new(), Vec::new());
                c.each(|c| {
                    match j {
                        0 => id = c.bytes()?,
                        1 => bytes = c.bytes()?,
                        _ => return Err(Error::BadDatum),
                    }
                    j += 1;
                    Ok(())
                })?;
                if j != 2 || id.len() != KEY_ID_LEN {
                    return Err(Error::BadDatum);
                }
                if id.as_slice() == b"gran" {
                    grandpa = Some(bytes);
                }
                Ok(())
            })?,
            _ => return Err(Error::BadDatum),
        }
        i += 1;
        Ok(())
    })?;
    if i != 2 {
        return Err(Error::BadDatum);
    }
    Ok(grandpa.and_then(|g| g.try_into().ok()).map(|grandpa| Candidate { partner_chain_key: key, grandpa }))
}

/// What a transaction that spends the token's output did with the token.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TokenUpdate {
    /// The token is in this output now, with the candidates in its inline datum.
    Moved(Outpoint, Vec<Candidate>),
    /// No output carries the token, so the transaction burned it.
    Burned,
}

// The token under `policy` is the asset with the empty name.
fn is_token(asset: &Asset, policy: &[u8; 28]) -> bool {
    asset.policy == *policy && asset.name.is_empty() && asset.amount > 0
}

// The output of `tx` that carries the token, with the candidates in its inline datum: none
// when it has no such datum or one that does not decode, so the token can still be followed.
fn token_output(tx: &Transaction, policy: &[u8; 28]) -> Result<Option<(Outpoint, Vec<Candidate>)>, Error> {
    let mut carrying = tx.outputs.iter().enumerate().filter(|(_, output)| output.assets.iter().any(|a| is_token(a, policy)));
    let Some((index, output)) = carrying.next() else { return Ok(None) };
    if carrying.next().is_some() {
        return Err(Error::TokenNotFound);
    }
    let candidates = output.inline_datum.as_ref().and_then(|datum| decode_candidates(datum).ok()).unwrap_or_default();
    Ok(Some((Outpoint { tx_hash: tx.hash, index: index as u64 }, candidates)))
}

/// The candidate update a transaction carries: it spends `tracked`, the current output of the
/// token under `policy`, and creates the token's next output or none.
pub fn candidate_update(tx: &Transaction, tracked: &Outpoint, policy: &[u8; 28]) -> Result<TokenUpdate, Error> {
    if !tx.is_valid {
        return Err(Error::NotValidTransaction);
    }
    if !tx.inputs.contains(tracked) {
        return Err(Error::OutpointNotSpent);
    }
    Ok(match token_output(tx, policy)? {
        Some((next, candidates)) => TokenUpdate::Moved(next, candidates),
        None => TokenUpdate::Burned,
    })
}

/// The first output of the token minted anew: `tx` mints the token under `policy` and puts it
/// into one output. Returns that outpoint and its candidates, as a move of the token does.
pub fn candidate_mint(tx: &Transaction, policy: &[u8; 28]) -> Result<(Outpoint, Vec<Candidate>), Error> {
    if !tx.is_valid {
        return Err(Error::NotValidTransaction);
    }
    if !tx.minted.iter().any(|a| is_token(a, policy)) {
        return Err(Error::TokenNotMinted);
    }
    token_output(tx, policy)?.ok_or(Error::TokenNotFound)
}
