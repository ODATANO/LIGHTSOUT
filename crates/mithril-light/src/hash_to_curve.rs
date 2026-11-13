use num_bigint::BigUint;

use crate::Error;
use crate::bls::{BlsHost, FIELD_MODULUS, G1_POINT};

// RFC 9380 hash_to_curve for BLS12-381 G1 with SHA-256, as blst runs it for Mithril: the
// domain separation tag is empty. The host maps each field element and clears the cofactor.
const COUNT: usize = 2;
const L: usize = 64;
const SHA256_BLOCK: usize = 64;

/// H(msg) in G1, uncompressed.
pub fn hash_to_g1<H: BlsHost>(host: &H, msg: &[u8]) -> Result<[u8; G1_POINT], Error> {
    let uniform = expand_message_xmd(host, msg, COUNT * L);
    let p = BigUint::from_bytes_be(&FIELD_MODULUS);
    let mut elements = Vec::with_capacity(COUNT * 48);
    for chunk in uniform.chunks(L) {
        let e = BigUint::from_bytes_be(chunk) % &p;
        let bytes = e.to_bytes_be();
        elements.extend(core::iter::repeat_n(0u8, 48 - bytes.len()));
        elements.extend_from_slice(&bytes);
    }
    let points = host.bls12381_map_fp_to_g1(&elements).ok_or(Error::BadPoint)?;
    let mut signed = Vec::with_capacity(COUNT * (G1_POINT + 1));
    for point in points.chunks(G1_POINT) {
        signed.push(0);
        signed.extend_from_slice(point);
    }
    let sum = host.bls12381_p1_sum(&signed).ok_or(Error::BadPoint)?;
    sum.try_into().map_err(|_| Error::BadPoint)
}

/// expand_message_xmd with SHA-256 and an empty tag.
fn expand_message_xmd<H: BlsHost>(host: &H, msg: &[u8], len: usize) -> Vec<u8> {
    let ell = len.div_ceil(32);
    let dst_prime = [0u8];
    let mut input = vec![0u8; SHA256_BLOCK];
    input.extend_from_slice(msg);
    input.extend_from_slice(&(len as u16).to_be_bytes());
    input.push(0);
    input.extend_from_slice(&dst_prime);
    let b0 = host.sha256(&input);
    let mut out = Vec::with_capacity(ell * 32);
    let mut prev = [0u8; 32];
    for i in 1..=ell {
        let mut block: Vec<u8> = b0.iter().zip(prev.iter()).map(|(a, b)| a ^ b).collect();
        block.push(i as u8);
        block.extend_from_slice(&dst_prime);
        prev = host.sha256(&block);
        out.extend_from_slice(&prev);
    }
    out.truncate(len);
    out
}
