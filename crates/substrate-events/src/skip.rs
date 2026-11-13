//! Steps over SCALE values by the type table without building them. A block's events can run
//! to a megabyte, and on NEAR every instruction of the walk costs gas.

use alloc::vec::Vec;
use codec::{Compact, Decode};
use scale_info::form::PortableForm;
use scale_info::{PortableRegistry, TypeDef, TypeDefPrimitive};

use crate::Error;

// A type that holds itself ends somewhere; no real value nests this deep.
const MAX_DEPTH: usize = 64;

// How a value of one type lies in the bytes.
enum Shape {
    // This many bytes of whole numbers, any content.
    Fixed(usize),
    // One byte, 0 or 1.
    Bool,
    // Four bytes that are a Unicode scalar value.
    Char,
    // A compact number of at most this many bytes.
    Compact(u8),
    // A compact count, then that many bytes.
    Bytes,
    // A compact count, then that many values of this type.
    Sequence(u32),
    // A compact count of bits, kept in units of this many bytes.
    Bits(usize),
    // This many values of this type.
    Array(u32, u32),
    // Values of these types in a row.
    Row(Vec<u32>),
    // One byte that picks a row by its place; None where the type has no such variant.
    Variant(Vec<Option<Vec<u32>>>),
}

/// The shape of every type of a table, by type id.
pub struct Shapes(Vec<Option<Shape>>);

fn take<'a>(input: &mut &'a [u8], n: usize) -> Result<&'a [u8], Error> {
    if input.len() < n {
        return Err(Error::BadEvents);
    }
    let (taken, rest) = input.split_at(n);
    *input = rest;
    Ok(taken)
}

fn count(input: &mut &[u8]) -> Result<usize, Error> {
    Compact::<u32>::decode(input).map(|c| c.0 as usize).map_err(|_| Error::BadEvents)
}

// The bytes of the whole number a compact type wraps, through wrappers of one field.
fn compact_width(registry: &PortableRegistry, mut id: u32) -> Option<u8> {
    for _ in 0..MAX_DEPTH {
        id = match &registry.resolve(id)?.type_def {
            TypeDef::Primitive(TypeDefPrimitive::U8) => return Some(1),
            TypeDef::Primitive(TypeDefPrimitive::U16) => return Some(2),
            TypeDef::Primitive(TypeDefPrimitive::U32) => return Some(4),
            TypeDef::Primitive(TypeDefPrimitive::U64) => return Some(8),
            TypeDef::Primitive(TypeDefPrimitive::U128) => return Some(16),
            TypeDef::Composite(c) if c.fields.len() == 1 => c.fields[0].ty.id,
            TypeDef::Tuple(t) if t.fields.len() == 1 => t.fields[0].id,
            _ => return None,
        };
    }
    None
}

fn shape_of(registry: &PortableRegistry, def: &TypeDef<PortableForm>) -> Option<Shape> {
    use TypeDefPrimitive as P;
    Some(match def {
        TypeDef::Primitive(P::Bool) => Shape::Bool,
        TypeDef::Primitive(P::Char) => Shape::Char,
        TypeDef::Primitive(P::Str) => Shape::Bytes,
        TypeDef::Primitive(P::U8 | P::I8) => Shape::Fixed(1),
        TypeDef::Primitive(P::U16 | P::I16) => Shape::Fixed(2),
        TypeDef::Primitive(P::U32 | P::I32) => Shape::Fixed(4),
        TypeDef::Primitive(P::U64 | P::I64) => Shape::Fixed(8),
        TypeDef::Primitive(P::U128 | P::I128) => Shape::Fixed(16),
        TypeDef::Primitive(P::U256 | P::I256) => Shape::Fixed(32),
        TypeDef::Compact(c) => Shape::Compact(compact_width(registry, c.type_param.id)?),
        TypeDef::Sequence(s) => Shape::Sequence(s.type_param.id),
        TypeDef::Array(a) => Shape::Array(a.len, a.type_param.id),
        TypeDef::Tuple(t) => Shape::Row(t.fields.iter().map(|f| f.id).collect()),
        TypeDef::Composite(c) => Shape::Row(c.fields.iter().map(|f| f.ty.id).collect()),
        TypeDef::Variant(v) => {
            let mut rows: Vec<Option<Vec<u32>>> = Vec::new();
            for variant in &v.variants {
                let at = variant.index as usize;
                if rows.len() <= at {
                    rows.resize_with(at + 1, || None);
                }
                rows[at] = Some(variant.fields.iter().map(|f| f.ty.id).collect());
            }
            Shape::Variant(rows)
        }
        TypeDef::BitSequence(b) => Shape::Bits(match &registry.resolve(b.bit_store_type.id)?.type_def {
            TypeDef::Primitive(P::U8) => 1,
            TypeDef::Primitive(P::U16) => 2,
            TypeDef::Primitive(P::U32) => 4,
            TypeDef::Primitive(P::U64) => 8,
            _ => return None,
        }),
    })
}

// The size of a type whose values all have the same length and need no check; None otherwise.
// `sizes` keeps each answer, and a type that is being looked at counts as None, which ends a loop.
fn fixed_size(shapes: &[Option<Shape>], sizes: &mut [Option<Option<usize>>], id: u32) -> Option<usize> {
    let at = id as usize;
    if let Some(known) = sizes.get(at)? {
        return *known;
    }
    sizes[at] = Some(None);
    let size = match shapes[at].as_ref()? {
        Shape::Fixed(n) => Some(*n),
        Shape::Array(len, of) => fixed_size(shapes, sizes, *of).and_then(|n| n.checked_mul(*len as usize)),
        Shape::Row(fields) => fields.iter().try_fold(0usize, |sum, field| sum.checked_add(fixed_size(shapes, sizes, *field)?)),
        _ => None,
    };
    sizes[at] = Some(size);
    size
}

impl Shapes {
    /// A type the table does not hold, or one this reader does not know, has no shape. A value
    /// of it is an error.
    pub fn of(registry: &PortableRegistry) -> Self {
        let len = registry.types.iter().map(|t| t.id as usize + 1).max().unwrap_or(0);
        let mut shapes: Vec<Option<Shape>> = Vec::new();
        shapes.resize_with(len, || None);
        for t in &registry.types {
            shapes[t.id as usize] = shape_of(registry, &t.ty.type_def);
        }
        // Rows and arrays of whole numbers become one step.
        let mut sizes = alloc::vec![None; len];
        for id in 0..len {
            if let Some(n) = fixed_size(&shapes, &mut sizes, id as u32) {
                shapes[id] = Some(Shape::Fixed(n));
            }
        }
        Self(shapes)
    }

    /// Steps over one value of type `id` and returns the bytes it took.
    pub fn skip<'a>(&self, id: u32, input: &mut &'a [u8]) -> Result<&'a [u8], Error> {
        let start = *input;
        self.step(id, input, 0)?;
        Ok(&start[..start.len() - input.len()])
    }

    fn step(&self, id: u32, input: &mut &[u8], depth: usize) -> Result<(), Error> {
        if depth > MAX_DEPTH {
            return Err(Error::BadEvents);
        }
        match self.0.get(id as usize).and_then(Option::as_ref).ok_or(Error::BadEvents)? {
            Shape::Fixed(n) => take(input, *n).map(|_| ()),
            Shape::Bool => match take(input, 1)? {
                [0 | 1] => Ok(()),
                _ => Err(Error::BadEvents),
            },
            Shape::Char => {
                let scalar = u32::from_le_bytes(take(input, 4)?.try_into().map_err(|_| Error::BadEvents)?);
                char::from_u32(scalar).map(|_| ()).ok_or(Error::BadEvents)
            }
            Shape::Compact(width) => match *width {
                1 => Compact::<u8>::decode(input).map(|_| ()),
                2 => Compact::<u16>::decode(input).map(|_| ()),
                4 => Compact::<u32>::decode(input).map(|_| ()),
                8 => Compact::<u64>::decode(input).map(|_| ()),
                _ => Compact::<u128>::decode(input).map(|_| ()),
            }
            .map_err(|_| Error::BadEvents),
            Shape::Bytes => {
                let n = count(input)?;
                take(input, n).map(|_| ())
            }
            Shape::Sequence(of) => {
                let n = count(input)?;
                self.repeat(*of, n, input, depth)
            }
            Shape::Bits(unit) => {
                let bits = count(input)?;
                take(input, bits.div_ceil(unit * 8) * unit).map(|_| ())
            }
            Shape::Array(len, of) => self.repeat(*of, *len as usize, input, depth),
            Shape::Row(fields) => fields.iter().try_for_each(|field| self.step(*field, input, depth + 1)),
            Shape::Variant(rows) => {
                let [index] = take(input, 1)? else { return Err(Error::BadEvents) };
                let fields = rows.get(*index as usize).and_then(Option::as_ref).ok_or(Error::BadEvents)?;
                fields.iter().try_for_each(|field| self.step(*field, input, depth + 1))
            }
        }
    }

    // `n` values of type `of` in a row. Values of one size are taken in one step.
    fn repeat(&self, of: u32, n: usize, input: &mut &[u8], depth: usize) -> Result<(), Error> {
        if let Some(Some(Shape::Fixed(size))) = self.0.get(of as usize) {
            return take(input, n.checked_mul(*size).ok_or(Error::BadEvents)?).map(|_| ());
        }
        (0..n).try_for_each(|_| self.step(of, input, depth + 1))
    }
}
