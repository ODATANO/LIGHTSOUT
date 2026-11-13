//! Reads a raw `System::Events` value with the type table of its runtime and tells whether
//! one extrinsic emitted `Midnight.TxApplied` for a transaction hash. Anything unknown is an error.
#![no_std]

extern crate alloc;

mod skip;

use codec::{Compact, Decode};
use scale_info::form::PortableForm;
use scale_info::{PortableRegistry, TypeDef, TypeDefPrimitive, Variant};

/// Spec version and table for each runtime this crate ships, from `gen/`. A table is the
/// SCALE-encoded type of `System::Events` with the types it refers to.
pub const TABLES: &[(u32, &[u8])] = &[
    (2001000, include_bytes!("../tables/2001000.scale")),
    (2001100, include_bytes!("../tables/2001100.scale")),
];

#[derive(Debug, PartialEq, Eq)]
pub enum Error {
    UnknownSpec,
    BadTable,
    BadEvents,
    TrailingBytes,
}

// Where the parts of an event record sit in the table.
struct Layout {
    shapes: skip::Shapes,
    phase: u32,
    event: u32,
    topics: u32,
    apply_extrinsic: u8,
    midnight: u8,
    tx_applied: u8,
}

fn variant<'a>(registry: &'a PortableRegistry, id: u32, name: &str) -> Result<&'a Variant<PortableForm>, Error> {
    let TypeDef::Variant(v) = &registry.resolve(id).ok_or(Error::BadTable)?.type_def else {
        return Err(Error::BadTable);
    };
    v.variants.iter().find(|v| v.name == name).ok_or(Error::BadTable)
}

fn single_field(v: &Variant<PortableForm>) -> Result<u32, Error> {
    match v.fields.as_slice() {
        [f] => Ok(f.ty.id),
        _ => Err(Error::BadTable),
    }
}

fn is(registry: &PortableRegistry, id: u32, want: &TypeDef<PortableForm>) -> bool {
    registry.resolve(id).is_some_and(|t| &t.type_def == want)
}

/// The table this crate ships for a runtime.
pub fn table(spec: u32) -> Option<&'static [u8]> {
    TABLES.iter().find(|(s, _)| *s == spec).map(|(_, table)| *table)
}

fn layout(mut table: &[u8]) -> Result<Layout, Error> {
    let (root, registry) = <(u32, PortableRegistry)>::decode(&mut table).map_err(|_| Error::BadTable)?;
    if !table.is_empty() {
        return Err(Error::BadTable);
    }
    let TypeDef::Sequence(seq) = &registry.resolve(root).ok_or(Error::BadTable)?.type_def else {
        return Err(Error::BadTable);
    };
    let record = seq.type_param.id;
    let TypeDef::Composite(c) = &registry.resolve(record).ok_or(Error::BadTable)?.type_def else {
        return Err(Error::BadTable);
    };
    let [phase, event, topics] = c.fields.as_slice() else { return Err(Error::BadTable) };
    if (phase.name.as_deref(), event.name.as_deref(), topics.name.as_deref()) != (Some("phase"), Some("event"), Some("topics")) {
        return Err(Error::BadTable);
    }
    let apply = variant(&registry, phase.ty.id, "ApplyExtrinsic")?;
    if !is(&registry, single_field(apply)?, &TypeDef::Primitive(TypeDefPrimitive::U32)) {
        return Err(Error::BadTable);
    }
    let midnight = variant(&registry, event.ty.id, "Midnight")?;
    let applied = variant(&registry, single_field(midnight)?, "TxApplied")?;
    // TxApplied holds `{ tx_hash: [u8; 32] }`.
    let details = registry.resolve(single_field(applied)?).ok_or(Error::BadTable)?;
    let TypeDef::Composite(d) = &details.type_def else { return Err(Error::BadTable) };
    let [field] = d.fields.as_slice() else { return Err(Error::BadTable) };
    let TypeDef::Array(a) = &registry.resolve(field.ty.id).ok_or(Error::BadTable)?.type_def else {
        return Err(Error::BadTable);
    };
    if a.len != 32 || !is(&registry, a.type_param.id, &TypeDef::Primitive(TypeDefPrimitive::U8)) {
        return Err(Error::BadTable);
    }
    Ok(Layout {
        phase: phase.ty.id,
        event: event.ty.id,
        topics: topics.ty.id,
        apply_extrinsic: apply.index,
        midnight: midnight.index,
        tx_applied: applied.index,
        shapes: skip::Shapes::of(&registry),
    })
}

/// True if extrinsic `extrinsic` emitted `Midnight.TxApplied { tx_hash }` in these events, read
/// with `table`. Events the table cannot read to their last byte are an error.
pub fn applied_with(table: &[u8], events: &[u8], extrinsic: u32, tx_hash: [u8; 32]) -> Result<bool, Error> {
    let layout = layout(table)?;
    let mut input = events;
    let Compact(count) = Compact::<u32>::decode(&mut input).map_err(|_| Error::BadEvents)?;
    let mut found = false;
    for _ in 0..count {
        let phase = layout.shapes.skip(layout.phase, &mut input)?;
        let event = layout.shapes.skip(layout.event, &mut input)?;
        layout.shapes.skip(layout.topics, &mut input)?;
        let at = phase.split_first().filter(|(v, _)| **v == layout.apply_extrinsic).map(|(_, n)| n);
        let ours = at == Some(&extrinsic.to_le_bytes()[..]);
        found |= ours && event.len() == 34 && event[..2] == [layout.midnight, layout.tx_applied] && event[2..] == tx_hash;
    }
    if !input.is_empty() {
        return Err(Error::TrailingBytes);
    }
    Ok(found)
}

/// As `applied_with`, with the table this crate ships for `spec`.
pub fn applied(events: &[u8], spec: u32, extrinsic: u32, tx_hash: [u8; 32]) -> Result<bool, Error> {
    applied_with(table(spec).ok_or(Error::UnknownSpec)?, events, extrinsic, tx_hash)
}

/// The index of the Midnight pallet in the runtime of `table`, as it prefixes its events and calls.
pub fn midnight_pallet_of(table: &[u8]) -> Result<u8, Error> {
    Ok(layout(table)?.midnight)
}

/// As `midnight_pallet_of`, with the table this crate ships for `spec`.
pub fn midnight_pallet(spec: u32) -> Result<u8, Error> {
    midnight_pallet_of(table(spec).ok_or(Error::UnknownSpec)?)
}
