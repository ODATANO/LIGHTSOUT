//! The crate steps over event records with shapes it derives from the table. Here the recorded
//! events values, values of a made-up table with every kind of type, and copies of both with one
//! bit flipped are read twice: by the crate and with `scale-decode` stepping over each record.

use codec::{Compact, Decode, Encode};
use scale_decode::visitor::{IgnoreVisitor, decode_with_visitor};
use scale_info::{PortableRegistry, TypeDef, TypeInfo};
use serde_json::Value;
use substrate_events::{Error, applied_with, midnight_pallet_of, table};

fn step<'a>(registry: &PortableRegistry, id: u32, input: &mut &'a [u8]) -> Result<&'a [u8], Error> {
    let start = *input;
    decode_with_visitor(input, id, registry, IgnoreVisitor::new()).map_err(|_| Error::BadEvents)?;
    Ok(&start[..start.len() - input.len()])
}

fn variant_index(registry: &PortableRegistry, id: u32, name: &str) -> (u8, u32) {
    let TypeDef::Variant(v) = &registry.resolve(id).unwrap().type_def else { panic!("type {id} has no variants") };
    let variant = v.variants.iter().find(|v| v.name == name).unwrap();
    (variant.index, variant.fields[0].ty.id)
}

// What `applied_with` answers when `scale-decode` steps over the records.
fn reference(table: &[u8], events: &[u8], extrinsic: u32, tx_hash: [u8; 32]) -> Result<bool, Error> {
    let (root, registry) = <(u32, PortableRegistry)>::decode(&mut &table[..]).unwrap();
    let TypeDef::Sequence(records) = &registry.resolve(root).unwrap().type_def else { panic!("the table's root is no sequence") };
    let TypeDef::Composite(record) = &registry.resolve(records.type_param.id).unwrap().type_def else { panic!("a record is no struct") };
    let [phase, event, topics] = [0, 1, 2].map(|i| record.fields[i].ty.id);
    let (apply_extrinsic, _) = variant_index(&registry, phase, "ApplyExtrinsic");
    let (midnight, midnight_events) = variant_index(&registry, event, "Midnight");
    let (tx_applied, _) = variant_index(&registry, midnight_events, "TxApplied");
    assert_eq!(midnight_pallet_of(table), Ok(midnight));

    let mut input = events;
    let Compact(count) = Compact::<u32>::decode(&mut input).map_err(|_| Error::BadEvents)?;
    let mut found = false;
    for _ in 0..count {
        let at = step(&registry, phase, &mut input)?;
        let emitted = step(&registry, event, &mut input)?;
        step(&registry, topics, &mut input)?;
        let ours = at.split_first().is_some_and(|(v, n)| *v == apply_extrinsic && n == extrinsic.to_le_bytes());
        found |= ours && emitted.len() == 34 && emitted[..2] == [midnight, tx_applied] && emitted[2..] == tx_hash;
    }
    if !input.is_empty() {
        return Err(Error::TrailingBytes);
    }
    Ok(found)
}

// Reads a value and every copy of it with one bit flipped both ways. Returns how many of the
// copies were refused, still read as applied, and read as not applied.
fn same_both_ways(name: &str, table: &[u8], events: &[u8], extrinsic: u32, tx_hash: [u8; 32]) -> [usize; 3] {
    assert_eq!(applied_with(table, events, extrinsic, tx_hash), reference(table, events, extrinsic, tx_hash), "{name}");
    let mut seen = [0; 3];
    for at in 0..events.len() {
        for bit in 0..8 {
            let mut copy = events.to_vec();
            copy[at] ^= 1 << bit;
            let ours = applied_with(table, &copy, extrinsic, tx_hash);
            assert_eq!(ours, reference(table, &copy, extrinsic, tx_hash), "{name}, byte {at}, bit {bit}");
            seen[match ours {
                Err(_) => 0,
                Ok(true) => 1,
                Ok(false) => 2,
            }] += 1;
        }
    }
    seen
}

#[test]
fn recorded_events_and_their_flipped_copies_read_as_scale_decode_reads_them() {
    let file = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/data/events.json")).unwrap();
    let samples: Vec<Value> = serde_json::from_str(&file).unwrap();
    assert!(samples.len() >= 9);
    for s in &samples {
        let name = format!("{} #{}", s["chain"].as_str().unwrap(), s["block"]);
        let table = table(s["spec"].as_u64().unwrap() as u32).unwrap();
        let events = hex::decode(&s["events"].as_str().unwrap()[2..]).unwrap();
        let (extrinsic, hash) = match s["applied"].as_array().unwrap().first() {
            Some(pair) => (pair[0].as_u64().unwrap() as u32, hex::decode(&pair[1].as_str().unwrap()[2..]).unwrap().try_into().unwrap()),
            None => (0, [0; 32]),
        };
        let [refused, applied, not_applied] = same_both_ways(&name, table, &events, extrinsic, hash);
        println!("{name}: {} bytes, flipped copies: {refused} refused, {applied} applied, {not_applied} not applied", events.len());
    }
}

// A runtime whose events hold every kind of type a table can name.
#[derive(Encode, TypeInfo)]
enum Phase {
    ApplyExtrinsic(u32),
    Finalization,
    Initialization,
}

#[derive(Encode, TypeInfo)]
struct Details {
    tx_hash: [u8; 32],
}

#[derive(Encode, TypeInfo)]
enum Midnight {
    Called(Details, Vec<u8>),
    #[codec(index = 2)]
    TxApplied(Details),
    #[codec(index = 7)]
    TxPartialSuccess(Details),
}

#[derive(Encode, TypeInfo)]
struct Wrapped(u64);

// SCALE writes a char as its four-byte scalar value.
#[derive(TypeInfo)]
struct Letter(char);

impl Encode for Letter {
    fn encode_to<T: codec::Output + ?Sized>(&self, dest: &mut T) {
        (self.0 as u32).encode_to(dest)
    }
}

#[derive(Encode, TypeInfo)]
enum Odd {
    Flags(bool, bool),
    Letter(Letter),
    Text(String),
    Counts(Compact<u8>, Compact<u16>, Compact<u32>, Compact<u64>, Compact<u128>),
    Maybe(Option<u64>, Option<Vec<u8>>),
    Nested(Vec<Vec<u16>>, Vec<(u8, bool)>),
    Sized([u32; 3], (i8, i128), [[u8; 4]; 2], Wrapped),
    Unit,
    #[codec(index = 200)]
    Far { amount: u128, to: [u8; 32], notes: Vec<String> },
}

#[derive(Encode, TypeInfo)]
enum Event {
    System(u8),
    #[codec(index = 5)]
    Midnight(Midnight),
    #[codec(index = 9)]
    Odd(Odd),
}

#[derive(Encode, TypeInfo)]
struct Record {
    phase: Phase,
    event: Event,
    topics: Vec<[u8; 32]>,
}

// The table of that runtime, in the form the crate takes: the root type's id, then the types.
fn odd_table() -> Vec<u8> {
    let mut registry = scale_info::Registry::new();
    let root = registry.register_type(&scale_info::meta_type::<Vec<Record>>()).id;
    (root, PortableRegistry::from(registry)).encode()
}

fn at(extrinsic: u32, event: Event) -> Record {
    Record { phase: Phase::ApplyExtrinsic(extrinsic), event, topics: vec![] }
}

#[test]
fn every_kind_of_type_reads_as_scale_decode_reads_it() {
    let table = odd_table();
    let hash = [0xab; 32];
    let records = vec![
        Record { phase: Phase::Initialization, event: Event::System(3), topics: vec![[1; 32], [2; 32]] },
        at(0, Event::Odd(Odd::Flags(true, false))),
        at(0, Event::Odd(Odd::Letter(Letter('é')))),
        at(1, Event::Odd(Odd::Text("a NEAR header".into()))),
        at(1, Event::Odd(Odd::Counts(Compact(200), Compact(60_000), Compact(1 << 30), Compact(u64::MAX), Compact(u128::MAX)))),
        at(1, Event::Odd(Odd::Counts(Compact(1), Compact(2), Compact(3), Compact(4), Compact(5)))),
        at(2, Event::Odd(Odd::Maybe(Some(9), None))),
        at(2, Event::Odd(Odd::Maybe(None, Some(vec![7; 70])))),
        at(2, Event::Odd(Odd::Nested(vec![vec![1, 2, 3], vec![], vec![4]], vec![(1, true), (2, false)]))),
        at(3, Event::Midnight(Midnight::Called(Details { tx_hash: hash }, vec![5; 40]))),
        at(3, Event::Odd(Odd::Sized([1, 2, 3], (-1, i128::MIN), [[9; 4]; 2], Wrapped(77)))),
        at(3, Event::Odd(Odd::Unit)),
        at(3, Event::Odd(Odd::Far { amount: 1 << 100, to: [3; 32], notes: vec!["one".into(), String::new()] })),
        at(3, Event::Midnight(Midnight::TxApplied(Details { tx_hash: hash }))),
        at(4, Event::Midnight(Midnight::TxPartialSuccess(Details { tx_hash: [0xcd; 32] }))),
        Record { phase: Phase::Finalization, event: Event::System(0), topics: vec![] },
    ];
    let events = records.encode();
    assert_eq!(applied_with(&table, &events, 3, hash), Ok(true));
    assert_eq!(applied_with(&table, &events, 4, [0xcd; 32]), Ok(false));
    let [refused, applied, not_applied] = same_both_ways("the made-up runtime", &table, &events, 3, hash);
    println!("{} bytes, flipped copies: {refused} refused, {applied} applied, {not_applied} not applied", events.len());
    // Some flips break the value, some leave the record in place, some hit the record itself.
    assert!(refused > 0 && applied > 0 && not_applied > 0);
}

// Many records, as in a full block: the answer does not depend on how many are stepped over.
#[test]
fn a_long_value_reads_as_scale_decode_reads_it() {
    let table = odd_table();
    let hash = [0xab; 32];
    let mut records: Vec<Record> = (0..20_000u32).map(|n| at(2, Event::Midnight(Midnight::TxApplied(Details { tx_hash: [n as u8; 32] })))).collect();
    records.push(at(3, Event::Midnight(Midnight::TxApplied(Details { tx_hash: hash }))));
    let events = records.encode();
    assert!(events.len() > 800_000);
    assert_eq!(applied_with(&table, &events, 3, hash), Ok(true));
    assert_eq!(reference(&table, &events, 3, hash), Ok(true));
    assert_eq!(applied_with(&table, &events[..events.len() - 1], 3, hash), reference(&table, &events[..events.len() - 1], 3, hash));
}
