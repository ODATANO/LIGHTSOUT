//! 64-bit numbers as decimal strings in JSON, since JavaScript numbers stop at 2^53.
use serde::{Deserialize, Deserializer, Serialize, Serializer};

pub mod u64_string {
    use super::*;
    pub fn serialize<S: Serializer>(v: &u64, s: S) -> Result<S::Ok, S::Error> {
        v.to_string().serialize(s)
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<u64, D::Error> {
        String::deserialize(d)?.parse().map_err(serde::de::Error::custom)
    }
}

pub mod i64_string {
    use super::*;
    pub fn serialize<S: Serializer>(v: &i64, s: S) -> Result<S::Ok, S::Error> {
        v.to_string().serialize(s)
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<i64, D::Error> {
        String::deserialize(d)?.parse().map_err(serde::de::Error::custom)
    }
}
