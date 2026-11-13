use num_bigint::BigUint;

/// The BLS12-381 and hashing primitives of the host, in the byte formats of NEP-488.
/// On NEAR every method is one `near_sdk::env` function of the same name.
pub trait BlsHost {
    fn sha256(&self, data: &[u8]) -> [u8; 32];
    /// Maps `48*k` bytes of field elements (big-endian, below p) to `96*k` bytes of G1 points.
    fn bls12381_map_fp_to_g1(&self, elements: &[u8]) -> Option<Vec<u8>>;
    /// Sums `97*k` bytes of (sign, uncompressed point) pairs on E(Fp).
    fn bls12381_p1_sum(&self, signed_points: &[u8]) -> Option<Vec<u8>>;
    /// Sums `128*k` bytes of (G1 point, little-endian scalar) pairs.
    fn bls12381_g1_multiexp(&self, pairs: &[u8]) -> Option<Vec<u8>>;
    /// Sums `224*k` bytes of (G2 point, little-endian scalar) pairs.
    fn bls12381_g2_multiexp(&self, pairs: &[u8]) -> Option<Vec<u8>>;
    fn bls12381_p1_decompress(&self, compressed: &[u8]) -> Option<Vec<u8>>;
    fn bls12381_p2_decompress(&self, compressed: &[u8]) -> Option<Vec<u8>>;
    /// Whether the product of the pairings of `288*k` bytes of (G1, G2) pairs is one.
    fn bls12381_pairing_check(&self, pairs: &[u8]) -> Option<bool>;
    fn ed25519_verify(&self, signature: &[u8; 64], message: &[u8], public_key: &[u8; 32]) -> bool;
}

pub const G1_POINT: usize = 96;
pub const G2_POINT: usize = 192;
pub const G1_COMPRESSED: usize = 48;
pub const G2_COMPRESSED: usize = 96;
pub const SCALAR: usize = 32;

/// The base field modulus p, big-endian.
pub const FIELD_MODULUS: [u8; 48] = [
    0x1a, 0x01, 0x11, 0xea, 0x39, 0x7f, 0xe6, 0x9a, 0x4b, 0x1b, 0xa7, 0xb6, 0x43, 0x4b, 0xac, 0xd7, 0x64, 0x77, 0x4b, 0x84, 0xf3, 0x85, 0x12, 0xbf,
    0x67, 0x30, 0xd2, 0xa0, 0xf6, 0xb0, 0xf6, 0x24, 0x1e, 0xab, 0xff, 0xfe, 0xb1, 0x53, 0xff, 0xff, 0xb9, 0xfe, 0xff, 0xff, 0xff, 0xff, 0xaa, 0xab,
];

/// The G2 generator, uncompressed: x.c1, x.c0, y.c1, y.c0.
pub const G2_GENERATOR: [u8; 192] = hex_literal(
    "13e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e\
     024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8\
     0606c4a02ea734cc32acd2b02bc28b99cb3e287e85a763af267492ab572e99ab3f370d275cec1da1aaa9075ff05f79be\
     0ce5d527727d6e118cc9cdc6da2e351aadfd9baa8cbdd3a76d429a695160d12c923ac9cc3baca289e193548608b82801",
);

const fn hex_literal(s: &str) -> [u8; 192] {
    let b = s.as_bytes();
    let mut out = [0u8; 192];
    let (mut i, mut n) = (0, 0);
    while i < b.len() {
        if b[i] == b' ' || b[i] == b'\n' || b[i] == b'\\' {
            i += 1;
            continue;
        }
        out[n] = nibble(b[i]) << 4 | nibble(b[i + 1]);
        n += 1;
        i += 2;
    }
    out
}

const fn nibble(c: u8) -> u8 {
    match c {
        b'0'..=b'9' => c - b'0',
        b'a'..=b'f' => c - b'a' + 10,
        _ => panic!("hex"),
    }
}

/// -P for an uncompressed G1 point: the same x, and p - y.
pub fn negate_g1(point: &[u8]) -> Option<[u8; G1_POINT]> {
    if point.len() != G1_POINT || point[0] & 0x40 != 0 {
        return None;
    }
    let p = BigUint::from_bytes_be(&FIELD_MODULUS);
    let y = BigUint::from_bytes_be(&point[48..]);
    if y >= p {
        return None;
    }
    let neg = if y == BigUint::ZERO { y } else { p - y };
    let mut out = [0u8; G1_POINT];
    out[..48].copy_from_slice(&point[..48]);
    let bytes = neg.to_bytes_be();
    out[G1_POINT - bytes.len()..].copy_from_slice(&bytes);
    Some(out)
}
