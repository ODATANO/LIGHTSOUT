//! Compares the parser with the ledger crate on real transactions and on mutated copies.

use midnight_base_crypto::fab::{AlignedValue, AlignmentAtom, AlignmentSegment};
use midnight_ledger_v9::structure::{ContractAction, ProofMarker, Signature, Transaction};
use midnight_onchain_runtime::ops::Op;
use midnight_onchain_runtime::state::{AlignedValueChecked, StateValue};
use midnight_serialize::{tagged_deserialize, tagged_serialize};
use midnight_storage::arena::Sp;
use midnight_storage::db::InMemoryDB;
use midnight_storage::storable::Storable;
use midnight_transient_crypto::commitment::PureGeneratorPedersen;
use midnight_tx::{Call, LogItem, calls};
use sha2::{Digest, Sha256};

type Tx = Transaction<Signature, ProofMarker, PureGeneratorPedersen, InMemoryDB>;

fn data(name: &str) -> Vec<u8> {
    std::fs::read(format!("{}/tests/data/{name}", env!("CARGO_MANIFEST_DIR"))).unwrap()
}

// A cell with one atom and alignment `Bytes { length }`, as the parser reads it.
fn cell_atom(v: &StateValue<InMemoryDB, AlignedValueChecked>, length: u32) -> Option<Vec<u8>> {
    let StateValue::Cell(cell) = v else { return None };
    let av: AlignedValue = AlignedValueChecked::clone(cell).into();
    let [atom] = av.value.0.as_slice() else { return None };
    match av.alignment.0.as_slice() {
        [AlignmentSegment::Atom(AlignmentAtom::Bytes { length: l })] if *l == length => Some(atom.0.clone()),
        _ => None,
    }
}

fn log_item(value: &StateValue<InMemoryDB, AlignedValueChecked>) -> Option<LogItem> {
    let StateValue::Array(arr) = value else { return None };
    if arr.len() != 3 {
        return None;
    }
    let le = |b: Vec<u8>| b.iter().rev().fold(0u32, |acc, x| (acc << 8) | *x as u32);
    let version = le(cell_atom(arr.get(0)?, 4)?);
    let event_type = le(cell_atom(arr.get(1)?, 1)?) as u8;
    let data = cell_atom(arr.get(2)?, 288)?;
    Some(LogItem { version, event_type, data })
}

// The same view of the calls, built with the ledger crate.
fn reference(bytes: &[u8]) -> Option<Vec<Call>> {
    let tx: Tx = tagged_deserialize(&mut &bytes[..]).ok()?;
    let Transaction::Standard(s) = tx else { return Some(Vec::new()) };
    let mut out = Vec::new();
    for entry in s.intents.iter() {
        for action in entry.1.actions.iter() {
            let ContractAction::Call(c) = &*action else { continue };
            let (mut ops, mut logs) = (Vec::new(), Vec::new());
            if let Some(t) = c.guaranteed_transcript.as_ref() {
                let program: Vec<_> = t.program.iter().collect();
                for (k, op) in program.iter().enumerate() {
                    let mut repr = Vec::new();
                    Storable::<InMemoryDB>::to_binary_repr(&**op, &mut repr).unwrap();
                    ops.push(repr[0]);
                    if let Op::Log = &**op {
                        let item = k.checked_sub(1).and_then(|p| match &*program[p] {
                            Op::Push { storage: false, value } => log_item(value),
                            _ => None,
                        });
                        logs.push(item);
                    }
                }
            }
            out.push(Call { address: c.address.0.0, entry_point: c.entry_point.0.clone(), ops, logs });
        }
    }
    Some(out)
}

fn sorted(mut calls: Vec<Call>) -> Vec<Call> {
    calls.sort_by(|a, b| (a.address, &a.entry_point, &a.ops).cmp(&(b.address, &b.entry_point, &b.ops)));
    calls
}

fn same_as_reference(bytes: &[u8]) {
    let ours = calls(bytes).map(sorted);
    let theirs = reference(bytes).map(sorted);
    assert_eq!(ours.ok(), theirs);
}

#[test]
fn mint_tx_reads_like_the_ledger() {
    let tx = data("mint-tx.bin");
    same_as_reference(&tx);
    let calls = calls(&tx).unwrap();
    assert_eq!(calls.len(), 1);
    assert_eq!(hex::encode(calls[0].address), "4be1d0d3c7a31f744a19faee39cbdae500a2679e5e3901290699a5420c8e8f56");
    assert_eq!(calls[0].entry_point, b"mint");
    assert_eq!(calls[0].ops.len(), 56);
    assert!(calls[0].logs.is_empty());
}

// TxApplied carries the sha256 of the serialized transaction.
#[test]
fn tx_hash_is_sha256_of_the_bytes() {
    let hash = Sha256::digest(data("mint-tx.bin"));
    assert_eq!(hex::encode(hash), "0d3ff0b05f8f4562b5018ab6202d86ec004343a86d204915085311aa1f9201a3");
}

#[test]
fn a_mint_has_no_burn_log() {
    let tx = data("mint-tx.bin");
    let bridge = calls(&tx).unwrap()[0].address;
    assert_eq!(midnight_tx::bridge_burn_logs(&tx, bridge), Err(midnight_tx::Error::NoBurnCall));
}

#[test]
fn a_cut_tx_is_refused() {
    let tx = data("mint-tx.bin");
    for cut in [0, 10, midnight_tx::TAG.len(), tx.len() / 2, tx.len() - 1] {
        assert!(calls(&tx[..cut]).is_err(), "cut at {cut}");
    }
    let mut longer = tx.clone();
    longer.push(0);
    assert_eq!(calls(&longer), Err(midnight_tx::Error::TrailingBytes));
}

const BURN_BRIDGE: &str = "18402a8adb36cc13b665022aabd0f4b77f1ab13d5a9aff78accad8104ba2ebe6";

fn bridge() -> [u8; 32] {
    hex::decode(BURN_BRIDGE).unwrap().try_into().unwrap()
}

// A real burn on preview. Its contract logs a burn in another layout than the bridge.
#[test]
fn the_recorded_burn_reads_like_the_ledger() {
    let tx = data("burn-tx.bin");
    same_as_reference(&tx);
    assert_eq!(hex::encode(Sha256::digest(&tx)), "1075c942177c3993509f6c93a47a6a4b5544163ed561bfe36e575327cd0f7841");
}

fn bob() -> [u8; 64] {
    let mut to = [0u8; 64];
    to[..29].copy_from_slice(b"bob.lightsout.odatano.testnet");
    to
}

// What the bridge logs under `name`: the name in 32 bytes, then the payload.
fn log_data(name: &[u8], payload: &[u8]) -> Vec<u8> {
    let mut data = vec![0u8; 32];
    data[..name.len()].copy_from_slice(name);
    data.extend_from_slice(payload);
    data
}

// The id the rewritten burn carries. A real one is the hash of the burned coin.
const BURN_ID: [u8; 32] = [0x1d; 32];

// The log of a burn of 100000 units to bob.lightsout.odatano.testnet.
fn burn_data() -> Vec<u8> {
    log_data(midnight_tx::BURN_LOG_NAME, &[&BURN_ID[..], &100_000u128.to_le_bytes(), &bob()].concat())
}

// The recorded burn's call with another entry point and log, in the guaranteed part or the
// fallible one, as the ledger crate builds and serializes it. Its proof no longer fits.
fn rewritten_call(entry_point: &[u8], data: &[u8], guaranteed: bool) -> Tx {
    let tx: Tx = tagged_deserialize(&mut &self::data("burn-tx.bin")[..]).unwrap();
    let Transaction::Standard(mut s) = tx else { panic!("standard tx") };
    let (segment, intent) = s
        .intents
        .iter()
        .map(|e| (*e.0, (*e.1).clone()))
        .find(|(_, i)| i.actions.iter().any(|a| matches!(&*a, ContractAction::Call(_))))
        .unwrap();
    let ContractAction::Call(call) = (*intent.actions.iter().next().unwrap()).clone() else { panic!("a call") };
    let mut call = (*call).clone();
    let mut transcript = (**call.guaranteed_transcript.as_ref().unwrap()).clone();
    let ops: Vec<_> = transcript.program.iter().map(|op| (*op).clone()).collect();
    let log = ops.iter().position(|op| matches!(op, Op::Log)).unwrap();
    let Op::Push { value: StateValue::Array(item), .. } = &ops[log - 1] else { panic!("a pushed log item") };
    let StateValue::Cell(cell) = item.get(2).unwrap() else { panic!("a data cell") };
    let mut value: AlignedValue = AlignedValueChecked::clone(cell).into();
    // An atom drops its trailing zeros.
    let used = data.len() - data.iter().rev().take_while(|b| **b == 0).count();
    value.value.0[0].0 = data[..used].to_vec();
    let cell = StateValue::Cell(Sp::new(AlignedValueChecked::try_from(value).unwrap()));
    let item = item.insert(2, cell).unwrap();
    transcript.program = transcript.program.insert(log - 1, Op::Push { storage: false, value: StateValue::Array(item) }).unwrap();
    call.entry_point.0 = entry_point.to_vec();
    let transcript = Some(Sp::new(transcript));
    (call.guaranteed_transcript, call.fallible_transcript) = if guaranteed { (transcript, None) } else { (None, transcript) };
    let mut changed = intent.clone();
    changed.actions = changed.actions.insert(0, ContractAction::Call(Sp::new(call))).unwrap();
    s.intents = s.intents.insert(segment, changed);
    Transaction::Standard(s)
}

fn serialized(tx: &Tx) -> Vec<u8> {
    let mut bytes = Vec::new();
    tagged_serialize(tx, &mut bytes).unwrap();
    bytes
}

fn rewritten(entry_point: &[u8], data: &[u8]) -> Vec<u8> {
    serialized(&rewritten_call(entry_point, data, true))
}

#[test]
fn a_burn_gives_its_id_value_and_recipient() {
    let tx = rewritten(b"burn", &burn_data());
    same_as_reference(&tx);
    assert_eq!(midnight_tx::bridge_burn_logs(&tx, bridge()).unwrap(), vec![midnight_tx::BurnLog { id: BURN_ID, value: 100_000, near_recipient: bob() }]);
    assert_eq!(midnight_tx::bridge_head_logs(&tx, bridge()), Err(midnight_tx::Error::NoHeadCall));
}

// The file the NEAR contract tests with. `cargo test -- --ignored writes` writes it anew.
#[test]
fn the_rewritten_burn_is_the_fixture() {
    assert_eq!(data("burn-tx-id.bin"), rewritten(b"burn", &burn_data()));
}

#[test]
#[ignore = "writes tests/data/burn-tx-id.bin and head-tx.bin"]
fn writes_the_rewritten_fixtures() {
    let dir = format!("{}/tests/data", env!("CARGO_MANIFEST_DIR"));
    std::fs::write(format!("{dir}/burn-tx-id.bin"), rewritten(b"burn", &burn_data())).unwrap();
    std::fs::write(format!("{dir}/head-tx.bin"), rewritten(b"accept", &head_data(277_000_000))).unwrap();
}

#[test]
fn a_burn_log_of_another_form_is_refused() {
    // One byte after the recipient.
    let mut long = burn_data();
    long.push(1);
    assert_eq!(midnight_tx::bridge_burn_logs(&rewritten(b"burn", &long), bridge()), Err(midnight_tx::Error::BadBurnLog));
    let other_name = log_data(b"lightsout/burn2", &burn_data()[32..]);
    assert_eq!(midnight_tx::bridge_burn_logs(&rewritten(b"burn", &other_name), bridge()), Err(midnight_tx::Error::BadBurnLog));
}

#[test]
fn a_burn_in_the_fallible_part_is_passed_over() {
    let tx = serialized(&rewritten_call(b"burn", &burn_data(), false));
    same_as_reference(&tx);
    assert_eq!(midnight_tx::bridge_burn_logs(&tx, bridge()), Err(midnight_tx::Error::NoBurnCall));
}

// The log of an accepted NEAR header: its height.
fn head_data(height: u64) -> Vec<u8> {
    log_data(midnight_tx::HEAD_LOG_NAME, &height.to_le_bytes())
}

#[test]
fn an_accepted_header_gives_its_height() {
    let tx = rewritten(b"accept", &head_data(277_000_000));
    same_as_reference(&tx);
    assert_eq!(midnight_tx::bridge_head_logs(&tx, bridge()), Ok(vec![277_000_000]));
    assert_eq!(midnight_tx::bridge_burn_logs(&tx, bridge()), Err(midnight_tx::Error::NoBurnCall));
    assert_eq!(data("head-tx.bin"), tx);
    // The same log under another call, or with a byte after the height, proves nothing.
    assert_eq!(midnight_tx::bridge_head_logs(&rewritten(b"propose", &head_data(1)), bridge()), Err(midnight_tx::Error::NoHeadCall));
    let mut long = head_data(1);
    long.push(1);
    assert_eq!(midnight_tx::bridge_head_logs(&rewritten(b"accept", &long), bridge()), Err(midnight_tx::Error::BadHeadLog));
}

#[test]
fn a_burn_of_another_contract_is_refused() {
    let mut other = bridge();
    other[0] ^= 1;
    assert_eq!(midnight_tx::bridge_burn_logs(&data("burn-tx.bin"), other), Err(midnight_tx::Error::NoBurnCall));
}

// The burn call twice in one intent, built and serialized with the ledger crate.
#[test]
fn two_burn_calls_give_two_logs() {
    let tx: Tx = tagged_deserialize(&mut &data("burn-tx.bin")[..]).unwrap();
    let Transaction::Standard(mut s) = tx else { panic!("standard tx") };
    let (segment, intent) = s
        .intents
        .iter()
        .map(|e| (*e.0, (*e.1).clone()))
        .find(|(_, i)| i.actions.iter().any(|a| matches!(&*a, ContractAction::Call(_))))
        .unwrap();
    let mut doubled = intent.clone();
    let call = (*doubled.actions.iter().next().unwrap()).clone();
    doubled.actions = doubled.actions.push(call);
    s.intents = s.intents.insert(segment, doubled);
    let mut bytes = Vec::new();
    tagged_serialize(&Transaction::Standard(s), &mut bytes).unwrap();
    same_as_reference(&bytes);
    assert_eq!(calls(&bytes).unwrap().len(), 2);
    assert_eq!(midnight_tx::bridge_burn_logs(&bytes, bridge()).unwrap().len(), 2);
}

// Wherever the ledger accepts a mutated copy, the parser reads the same calls.
#[test]
fn mutations_never_read_differently() {
    for name in ["mint-tx.bin", "burn-tx.bin"] {
        mutate(&data(name));
    }
}

fn mutate(tx: &[u8]) {
    let tx = tx.to_vec();
    let mut seed = 0x9e3779b97f4a7c15u64;
    let mut next = || {
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        seed
    };
    let (mut accepted, mut agreed) = (0, 0);
    for _ in 0..3000 {
        let mut m = tx.clone();
        for _ in 0..1 + next() % 3 {
            let at = (next() as usize) % m.len();
            m[at] ^= 1 << (next() % 8);
        }
        let (ours, theirs) = (calls(&m).map(sorted), reference(&m).map(sorted));
        if let Some(theirs) = theirs {
            accepted += 1;
            assert_eq!(ours.as_ref().ok(), Some(&theirs), "ledger accepts, parser differs");
            agreed += 1;
        }
    }
    println!("{accepted} mutations accepted by the ledger, {agreed} read the same");
}
