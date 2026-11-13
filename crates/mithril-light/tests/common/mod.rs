//! A native stand-in for the NEAR host functions, built on blst.
#![allow(dead_code)]

use blst::*;
use ed25519_dalek::{Signature as EdSignature, Verifier, VerifyingKey};
use mithril_light::{BlsHost, Certificate};
use sha2::{Digest, Sha256};

pub struct Native;

fn p1_affine(bytes: &[u8]) -> Option<blst_p1_affine> {
    let mut out = blst_p1_affine::default();
    let err = unsafe { blst_p1_deserialize(&mut out, bytes.as_ptr()) };
    (err == BLST_ERROR::BLST_SUCCESS).then_some(out)
}

fn p2_affine(bytes: &[u8]) -> Option<blst_p2_affine> {
    let mut out = blst_p2_affine::default();
    let err = unsafe { blst_p2_deserialize(&mut out, bytes.as_ptr()) };
    (err == BLST_ERROR::BLST_SUCCESS).then_some(out)
}

fn p1_bytes(p: &blst_p1) -> Vec<u8> {
    let mut out = [0u8; 96];
    unsafe { blst_p1_serialize(out.as_mut_ptr(), p) };
    out.to_vec()
}

fn p2_bytes(p: &blst_p2) -> Vec<u8> {
    let mut out = [0u8; 192];
    unsafe { blst_p2_serialize(out.as_mut_ptr(), p) };
    out.to_vec()
}

impl BlsHost for Native {
    fn sha256(&self, data: &[u8]) -> [u8; 32] {
        Sha256::digest(data).into()
    }

    fn bls12381_map_fp_to_g1(&self, elements: &[u8]) -> Option<Vec<u8>> {
        if !elements.len().is_multiple_of(48) {
            return None;
        }
        let mut out = Vec::new();
        for e in elements.chunks(48) {
            let mut fp = blst_fp::default();
            let mut p = blst_p1::default();
            unsafe {
                blst_fp_from_bendian(&mut fp, e.as_ptr());
                blst_map_to_g1(&mut p, &fp, std::ptr::null());
            }
            out.extend(p1_bytes(&p));
        }
        Some(out)
    }

    fn bls12381_p1_sum(&self, signed_points: &[u8]) -> Option<Vec<u8>> {
        if !signed_points.len().is_multiple_of(97) {
            return None;
        }
        let mut acc = blst_p1::default();
        for s in signed_points.chunks(97) {
            let affine = p1_affine(&s[1..])?;
            let mut p = blst_p1::default();
            unsafe {
                blst_p1_from_affine(&mut p, &affine);
                blst_p1_cneg(&mut p, s[0] == 1);
                blst_p1_add_or_double(&mut acc, &acc, &p);
            }
        }
        Some(p1_bytes(&acc))
    }

    fn bls12381_g1_multiexp(&self, pairs: &[u8]) -> Option<Vec<u8>> {
        if !pairs.len().is_multiple_of(128) {
            return None;
        }
        let mut acc = blst_p1::default();
        for pair in pairs.chunks(128) {
            let affine = p1_affine(&pair[..96])?;
            if !unsafe { blst_p1_affine_in_g1(&affine) } {
                return None;
            }
            let mut p = blst_p1::default();
            let mut m = blst_p1::default();
            unsafe {
                blst_p1_from_affine(&mut p, &affine);
                blst_p1_mult(&mut m, &p, pair[96..].as_ptr(), 256);
                blst_p1_add_or_double(&mut acc, &acc, &m);
            }
        }
        Some(p1_bytes(&acc))
    }

    fn bls12381_g2_multiexp(&self, pairs: &[u8]) -> Option<Vec<u8>> {
        if !pairs.len().is_multiple_of(224) {
            return None;
        }
        let mut acc = blst_p2::default();
        for pair in pairs.chunks(224) {
            let affine = p2_affine(&pair[..192])?;
            if !unsafe { blst_p2_affine_in_g2(&affine) } {
                return None;
            }
            let mut p = blst_p2::default();
            let mut m = blst_p2::default();
            unsafe {
                blst_p2_from_affine(&mut p, &affine);
                blst_p2_mult(&mut m, &p, pair[192..].as_ptr(), 256);
                blst_p2_add_or_double(&mut acc, &acc, &m);
            }
        }
        Some(p2_bytes(&acc))
    }

    fn bls12381_p1_decompress(&self, compressed: &[u8]) -> Option<Vec<u8>> {
        if !compressed.len().is_multiple_of(48) {
            return None;
        }
        let mut out = Vec::new();
        for c in compressed.chunks(48) {
            let mut affine = blst_p1_affine::default();
            if unsafe { blst_p1_uncompress(&mut affine, c.as_ptr()) } != BLST_ERROR::BLST_SUCCESS {
                return None;
            }
            let mut p = blst_p1::default();
            unsafe { blst_p1_from_affine(&mut p, &affine) };
            out.extend(p1_bytes(&p));
        }
        Some(out)
    }

    fn bls12381_p2_decompress(&self, compressed: &[u8]) -> Option<Vec<u8>> {
        if !compressed.len().is_multiple_of(96) {
            return None;
        }
        let mut out = Vec::new();
        for c in compressed.chunks(96) {
            let mut affine = blst_p2_affine::default();
            if unsafe { blst_p2_uncompress(&mut affine, c.as_ptr()) } != BLST_ERROR::BLST_SUCCESS {
                return None;
            }
            let mut p = blst_p2::default();
            unsafe { blst_p2_from_affine(&mut p, &affine) };
            out.extend(p2_bytes(&p));
        }
        Some(out)
    }

    fn bls12381_pairing_check(&self, pairs: &[u8]) -> Option<bool> {
        if !pairs.len().is_multiple_of(288) {
            return None;
        }
        let mut acc = blst_fp12::default();
        let mut first = true;
        for pair in pairs.chunks(288) {
            let p = p1_affine(&pair[..96])?;
            let q = p2_affine(&pair[96..])?;
            if !unsafe { blst_p1_affine_in_g1(&p) } || !unsafe { blst_p2_affine_in_g2(&q) } {
                return None;
            }
            let mut ml = blst_fp12::default();
            unsafe { blst_miller_loop(&mut ml, &q, &p) };
            if first {
                acc = ml;
                first = false;
            } else {
                let prev = acc;
                unsafe { blst_fp12_mul(&mut acc, &prev, &ml) };
            }
        }
        let mut result = blst_fp12::default();
        unsafe { blst_final_exp(&mut result, &acc) };
        Some(unsafe { blst_fp12_is_one(&result) })
    }

    fn ed25519_verify(&self, signature: &[u8; 64], message: &[u8], public_key: &[u8; 32]) -> bool {
        VerifyingKey::from_bytes(public_key).is_ok_and(|k| k.verify(message, &EdSignature::from_bytes(signature)).is_ok())
    }
}

pub fn data(name: &str) -> String {
    std::fs::read_to_string(format!("{}/tests/data/{name}", env!("CARGO_MANIFEST_DIR"))).unwrap()
}

/// The aggregator's `/certificate/{hash}` JSON as the crate takes it, plus the hash it claims.
pub fn certificate(json: &str) -> (Certificate, String) {
    mithril_light::aggregator::certificate(json).unwrap()
}
