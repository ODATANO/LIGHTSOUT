#![no_std]
//! Reads the logs of the Midnight bridge from a serialized ledger-9 transaction: a burn, and a
//! NEAR header the bridge accepted. It walks only the path to the call transcripts and refuses
//! what it does not know. The ledger validated the rest: NEAR takes a log only with `TxApplied`.

extern crate alloc;

use alloc::vec::Vec;

/// The tag that starts every serialized ledger-9 transaction with proofs.
pub const TAG: &[u8] = b"midnight:transaction[v12](signature[v2],proof,pedersen-schnorr[v1]):";
/// The log name of a burn, zero-padded to 32 bytes.
pub const BURN_LOG_NAME: &[u8] = b"lightsout/burn";
pub const BURN_ENTRY_POINT: &[u8] = b"burn";
/// The log name of an accepted NEAR header, and the call that writes it.
pub const HEAD_LOG_NAME: &[u8] = b"lightsout/head";
pub const HEAD_ENTRY_POINT: &[u8] = b"accept";

const OP_LOG: u8 = 9;
const OP_PUSH: u8 = 15;
const LOG_VERSION: u8 = 1;
const LOG_MISC: u8 = 10;
const LOG_DATA_LEN: usize = 288;
const MAX_DEPTH: usize = 300;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    BadTag,
    /// The input ends inside a value.
    Truncated,
    /// An integer or value is not in its canonical form.
    NonCanonical,
    /// Bytes are left after a node or after the node list.
    TrailingBytes,
    /// A child index points at the node itself or later.
    BadChild,
    /// A variant or a node shape that this parser does not know.
    Unknown,
    TooDeep,
    /// No burn call of the bridge has its log in the guaranteed part.
    NoBurnCall,
    /// A burn call has more than one log, or one of another form.
    BadBurnLog,
    /// No accept call of the bridge has its log in the guaranteed part.
    NoHeadCall,
    /// An accept call has more than one log, or one of another form.
    BadHeadLog,
}

/// A burn as the bridge logs it. `id` is the hash of the burned coin.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BurnLog {
    pub id: [u8; 32],
    pub value: u128,
    pub near_recipient: [u8; 64],
}

/// One contract call: the op variants of its guaranteed transcript and the value pushed before each `log`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Call {
    pub address: [u8; 32],
    pub entry_point: Vec<u8>,
    pub ops: Vec<u8>,
    pub logs: Vec<Option<LogItem>>,
}

/// A log value of the form the VM decodes: version, event type and one data cell.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogItem {
    pub version: u32,
    pub event_type: u8,
    pub data: Vec<u8>, // trailing zeros dropped, as on the wire
}

struct Reader<'a> {
    bytes: &'a [u8],
}

impl<'a> Reader<'a> {
    fn u8(&mut self) -> Result<u8, Error> {
        let (&b, rest) = self.bytes.split_first().ok_or(Error::Truncated)?;
        self.bytes = rest;
        Ok(b)
    }

    fn take(&mut self, n: usize) -> Result<&'a [u8], Error> {
        if self.bytes.len() < n {
            return Err(Error::Truncated);
        }
        let (head, rest) = self.bytes.split_at(n);
        self.bytes = rest;
        Ok(head)
    }

    // The compact form of u32, u64 and u128: the low 2 bits of the first byte give its length.
    fn compact(&mut self) -> Result<u128, Error> {
        let first = self.u8()?;
        match first & 0b11 {
            0b00 => Ok((first >> 2) as u128),
            0b01 => {
                let second = self.u8()?;
                if second == 0 {
                    return Err(Error::NonCanonical);
                }
                Ok(((first >> 2) as u128) | ((second as u128) << 6))
            }
            0b10 => {
                let rest = self.take(3)?;
                if rest[1] == 0 && rest[2] == 0 {
                    return Err(Error::NonCanonical);
                }
                let v = ((first >> 2) as u32) | ((rest[0] as u32) << 6) | ((rest[1] as u32) << 14) | ((rest[2] as u32) << 22);
                Ok(v as u128)
            }
            _ => {
                let n = (first >> 2) as usize + 4;
                if n > 16 {
                    return Err(Error::NonCanonical);
                }
                let bytes = self.take(n)?;
                if bytes[n - 1] == 0 || (n == 4 && bytes[3] < 64) {
                    return Err(Error::NonCanonical);
                }
                Ok(bytes.iter().rev().fold(0u128, |acc, b| (acc << 8) | *b as u128))
            }
        }
    }

    fn compact_max(&mut self, max: u128) -> Result<u128, Error> {
        let v = self.compact()?;
        if v > max { Err(Error::NonCanonical) } else { Ok(v) }
    }

    fn len(&mut self) -> Result<usize, Error> {
        Ok(self.compact_max(u32::MAX as u128)? as usize)
    }

    fn bytes_vec(&mut self) -> Result<&'a [u8], Error> {
        let n = self.len()?;
        self.take(n)
    }

    fn option(&mut self) -> Result<bool, Error> {
        // Option<Sp<T>> in a node: 0 = Some (the next child), 1 = None.
        match self.u8()? {
            0 => Ok(true),
            1 => Ok(false),
            _ => Err(Error::Unknown),
        }
    }

    fn end(&self) -> Result<(), Error> {
        if self.bytes.is_empty() { Ok(()) } else { Err(Error::TrailingBytes) }
    }
}

struct Node<'a> {
    children: Vec<usize>,
    data: &'a [u8],
}

struct Graph<'a> {
    nodes: Vec<Node<'a>>,
}

// A node's fields read in order: inline bytes from its data, children from its child list.
struct Fields<'g, 'a> {
    data: Reader<'a>,
    children: core::slice::Iter<'g, usize>,
}

impl<'g, 'a> Fields<'g, 'a> {
    fn child(&mut self) -> Result<usize, Error> {
        self.children.next().copied().ok_or(Error::Unknown)
    }

    fn end(&self) -> Result<(), Error> {
        self.data.end()?;
        if self.children.len() == 0 { Ok(()) } else { Err(Error::Unknown) }
    }
}

impl<'a> Graph<'a> {
    fn parse(tx: &'a [u8]) -> Result<Self, Error> {
        let body = tx.strip_prefix(TAG).ok_or(Error::BadTag)?;
        let mut r = Reader { bytes: body };
        let count = r.len()?;
        let mut nodes = Vec::new();
        for i in 0..count {
            let n = r.len()?;
            let mut children = Vec::new();
            for _ in 0..n {
                let c = r.compact_max(u64::MAX as u128)?;
                if c >= i as u128 {
                    return Err(Error::BadChild);
                }
                children.push(c as usize);
            }
            let data = r.bytes_vec()?;
            nodes.push(Node { children, data });
        }
        r.end()?;
        if nodes.is_empty() {
            return Err(Error::Truncated);
        }
        Ok(Graph { nodes })
    }

    fn root(&self) -> usize {
        self.nodes.len() - 1
    }

    fn fields(&self, i: usize) -> Fields<'_, 'a> {
        let n = &self.nodes[i];
        Fields { data: Reader { bytes: n.data }, children: n.children.iter() }
    }

    // The values of a Merkle-Patricia trie with their nibble paths.
    fn mpt(&self, i: usize, path: &mut Vec<u8>, out: &mut Vec<(Vec<u8>, usize)>) -> Result<(), Error> {
        if path.len() > MAX_DEPTH {
            return Err(Error::TooDeep);
        }
        let mut f = self.fields(i);
        match f.data.u8()? {
            0 => {}
            1 => {
                f.data.compact_max(u64::MAX as u128)?;
                out.push((path.clone(), f.child()?));
            }
            2 => {
                f.data.compact_max(u64::MAX as u128)?;
                for nibble in 0..16u8 {
                    let c = f.child()?;
                    path.push(nibble);
                    self.mpt(c, path, out)?;
                    path.pop();
                }
            }
            3 => {
                f.data.compact_max(u64::MAX as u128)?;
                let len = f.data.u8()? as usize;
                let packed = f.data.bytes_vec()?;
                if packed.len() != len.div_ceil(2) {
                    return Err(Error::NonCanonical);
                }
                let at = path.len();
                for k in 0..len {
                    let nibble = if k % 2 == 0 { packed[k / 2] >> 4 } else { packed[k / 2] & 0x0f };
                    path.push(nibble);
                }
                let c = f.child()?;
                self.mpt(c, path, out)?;
                path.truncate(at);
            }
            4 => {
                f.data.compact_max(u64::MAX as u128)?;
                out.push((path.clone(), f.child()?));
                let c = f.child()?;
                self.mpt(c, path, out)?;
            }
            _ => return Err(Error::Unknown),
        }
        f.end()
    }

    // The elements of a storage Array, in index order.
    fn array(&self, mpt: usize) -> Result<Vec<usize>, Error> {
        let mut entries = Vec::new();
        self.mpt(mpt, &mut Vec::new(), &mut entries)?;
        let mut indexed = Vec::with_capacity(entries.len());
        for (path, value) in entries {
            if path.first() == Some(&0) || path.len() > 16 {
                return Err(Error::NonCanonical);
            }
            let index = path.iter().fold(0u64, |acc, n| (acc << 4) | *n as u64);
            indexed.push((index, value));
        }
        indexed.sort_unstable_by_key(|(index, _)| *index);
        for (k, (index, _)) in indexed.iter().enumerate() {
            if *index != k as u64 {
                return Err(Error::NonCanonical);
            }
        }
        Ok(indexed.into_iter().map(|(_, v)| v).collect())
    }

    // The values of a storage HashMap: each entry is a pair node `[key, value]`.
    fn map_values(&self, mpt: usize) -> Result<Vec<usize>, Error> {
        let mut entries = Vec::new();
        self.mpt(mpt, &mut Vec::new(), &mut entries)?;
        entries
            .into_iter()
            .map(|(_, pair)| {
                let mut f = self.fields(pair);
                f.child()?;
                let value = f.child()?;
                f.end()?;
                Ok(value)
            })
            .collect()
    }

    fn calls(&self) -> Result<Vec<Call>, Error> {
        let mut f = self.fields(self.root());
        match f.data.u8()? {
            0 => {}
            // A rewards claim has no contract calls.
            1 => return Ok(Vec::new()),
            _ => return Err(Error::Unknown),
        }
        f.data.bytes_vec()?; // network id
        let intents = f.child()?;
        let mut out = Vec::new();
        for intent in self.map_values(intents)? {
            let mut f = self.fields(intent);
            for _ in 0..2 {
                // guaranteed and fallible unshielded offers
                if f.data.option()? {
                    f.child()?;
                }
            }
            let actions = f.child()?;
            for action in self.array(actions)? {
                let mut a = self.fields(action);
                match a.data.u8()? {
                    0 => {
                        let call = a.child()?;
                        a.end()?;
                        out.push(self.call(call)?);
                    }
                    1 | 2 => {}
                    _ => return Err(Error::Unknown),
                }
            }
        }
        Ok(out)
    }

    fn call(&self, i: usize) -> Result<Call, Error> {
        let mut f = self.fields(i);
        let address: [u8; 32] = f.data.take(32)?.try_into().map_err(|_| Error::Truncated)?;
        let entry_point = f.data.bytes_vec()?.to_vec();
        let (mut ops, mut logs) = (Vec::new(), Vec::new());
        if f.data.option()? {
            let transcript = f.child()?;
            let program = self.program(transcript)?;
            for (k, op) in program.iter().enumerate() {
                let variant = *self.nodes[*op].data.first().ok_or(Error::Truncated)?;
                ops.push(variant);
                if variant == OP_LOG {
                    let item = match k.checked_sub(1) {
                        Some(prev) => self.pushed_log_item(program[prev])?,
                        None => None,
                    };
                    logs.push(item);
                }
            }
        }
        Ok(Call { address, entry_point, ops, logs })
    }

    // The op nodes of a transcript: gas inline, 9 effect maps, then the program array.
    fn program(&self, transcript: usize) -> Result<Vec<usize>, Error> {
        let mut f = self.fields(transcript);
        for _ in 0..4 {
            f.data.compact_max(u64::MAX as u128)?;
        }
        for _ in 0..9 {
            f.child()?;
        }
        let program = f.child()?;
        if f.data.option()? {
            f.child()?;
        }
        f.end()?;
        self.array(program)
    }

    // The log item of `push { storage: false, value }`, or None for any other op before a log.
    fn pushed_log_item(&self, op: usize) -> Result<Option<LogItem>, Error> {
        let mut f = self.fields(op);
        if f.data.u8()? != OP_PUSH || f.data.u8()? != 0 {
            return Ok(None);
        }
        if f.data.u8()? != 3 {
            return Ok(None); // not an array state value
        }
        let items = f.child()?;
        f.end()?;
        let cells = self.array(items)?;
        if cells.len() != 3 {
            return Ok(None);
        }
        let version = self.cell_atom(cells[0], 4)?;
        let event_type = self.cell_atom(cells[1], 1)?;
        let data = self.cell_atom(cells[2], LOG_DATA_LEN)?;
        let (Some(version), Some(event_type), Some(data)) = (version, event_type, data) else {
            return Ok(None);
        };
        let le = |b: &[u8]| b.iter().rev().fold(0u32, |acc, x| (acc << 8) | *x as u32);
        Ok(Some(LogItem { version: le(&version), event_type: le(&event_type) as u8, data }))
    }

    // A cell holding one value atom with alignment `Bytes { length }`, or None for another shape.
    fn cell_atom(&self, state_value: usize, length: usize) -> Result<Option<Vec<u8>>, Error> {
        let mut f = self.fields(state_value);
        if f.data.u8()? != 1 {
            return Ok(None);
        }
        let cell = f.child()?;
        f.end()?;
        let mut r = Reader { bytes: self.nodes[cell].data };
        let (x, y, n) = flagged(&mut r)?;
        let atom = match (x, y) {
            (false, false) if n == 0 => Vec::new(),
            (false, false) => alloc::vec![n as u8],
            (false, true) => {
                let bytes = r.take(n as usize)?;
                if bytes.last() == Some(&0) {
                    return Err(Error::NonCanonical);
                }
                bytes.to_vec()
            }
            _ => return Ok(None),
        };
        if flagged(&mut r)? != (false, false, length as u32) {
            return Ok(None);
        }
        r.end()?;
        if atom.len() > length {
            return Err(Error::NonCanonical);
        }
        Ok(Some(atom))
    }
}

// The flagged integer of the field-aligned binary format: two flag bits, then 5, 12 or 19 bits.
fn flagged(r: &mut Reader) -> Result<(bool, bool, u32), Error> {
    let b0 = r.u8()?;
    let (x, y, a) = (b0 & 0x80 != 0, b0 & 0x40 != 0, (b0 % 0x20) as u32);
    if b0 & 0x20 == 0 {
        return Ok((x, y, a));
    }
    let b1 = r.u8()?;
    let b = (b1 % 0x80) as u32;
    if b1 & 0x80 == 0 {
        return if b == 0 { Err(Error::NonCanonical) } else { Ok((x, y, a | (b << 5))) };
    }
    let b2 = r.u8()?;
    let c = (b2 % 0x80) as u32;
    if b2 & 0x80 != 0 || c == 0 {
        return Err(Error::NonCanonical);
    }
    Ok((x, y, a | (b << 5) | (c << 12)))
}

/// Every contract call of the transaction, in intent and action order.
pub fn calls(tx: &[u8]) -> Result<Vec<Call>, Error> {
    Graph::parse(tx)?.calls()
}

// The payload of the one log named `name` in each call of `entry_point` to `bridge`, in the
// order of the calls. A call without a log in its guaranteed part is passed over: the bridge
// logs in every such call, so that one ran in the fallible part, which is not read.
fn payloads(tx: &[u8], bridge: [u8; 32], entry_point: &[u8], name: &[u8], bad: Error) -> Result<Vec<[u8; LOG_DATA_LEN - 32]>, Error> {
    let mut out = Vec::new();
    for call in calls(tx)?.iter().filter(|c| c.address == bridge && c.entry_point == entry_point && !c.logs.is_empty()) {
        let [Some(item)] = call.logs.as_slice() else {
            return Err(bad);
        };
        if item.version != LOG_VERSION as u32 || item.event_type != LOG_MISC {
            return Err(bad);
        }
        let mut data = [0u8; LOG_DATA_LEN];
        data[..item.data.len()].copy_from_slice(&item.data);
        let mut padded = [0u8; 32];
        padded[..name.len()].copy_from_slice(name);
        if data[..32] != padded {
            return Err(bad);
        }
        out.push(data[32..].try_into().unwrap());
    }
    Ok(out)
}

/// The burn log of every `burn` call to `bridge` whose log is in the guaranteed part of this
/// transaction, in the order of the calls.
pub fn bridge_burn_logs(tx: &[u8], bridge: [u8; 32]) -> Result<Vec<BurnLog>, Error> {
    let mut logs = Vec::new();
    for payload in payloads(tx, bridge, BURN_ENTRY_POINT, BURN_LOG_NAME, Error::BadBurnLog)? {
        // id, value as u128 LE, the recipient, zeros.
        if payload[112..].iter().any(|b| *b != 0) {
            return Err(Error::BadBurnLog);
        }
        logs.push(BurnLog {
            id: payload[..32].try_into().unwrap(),
            value: u128::from_le_bytes(payload[32..48].try_into().unwrap()),
            near_recipient: payload[48..112].try_into().unwrap(),
        });
    }
    if logs.is_empty() {
        return Err(Error::NoBurnCall);
    }
    Ok(logs)
}

/// The NEAR height of every header that an `accept` call to `bridge` made the head, where its
/// log is in the guaranteed part of this transaction, in the order of the calls.
pub fn bridge_head_logs(tx: &[u8], bridge: [u8; 32]) -> Result<Vec<u64>, Error> {
    let mut heights = Vec::new();
    for payload in payloads(tx, bridge, HEAD_ENTRY_POINT, HEAD_LOG_NAME, Error::BadHeadLog)? {
        // The height as u64 LE, zeros.
        if payload[8..].iter().any(|b| *b != 0) {
            return Err(Error::BadHeadLog);
        }
        heights.push(u64::from_le_bytes(payload[..8].try_into().unwrap()));
    }
    if heights.is_empty() {
        return Err(Error::NoHeadCall);
    }
    Ok(heights)
}
