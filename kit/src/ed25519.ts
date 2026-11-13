import { ed25519 } from '@noble/curves/ed25519.js';

/** A curve point in affine coordinates, as the contracts' signature checks take it. */
export interface Point {
  x: bigint;
  y: bigint;
}

/** An ed25519 signature as the contracts take it. */
export interface Signature {
  r: Point;
  s: bigint;
}

/** The point behind the 32 bytes of an ed25519 key, or of the first half of a signature. */
export function pointOf(compressed: Uint8Array): Point {
  const p = ed25519.Point.fromBytes(compressed).toAffine();
  return { x: p.x, y: p.y };
}

/** A signature of 64 bytes as its point and its scalar, which is the second half, little-endian. */
export function signatureOf(signature: Uint8Array): Signature {
  if (signature.length !== 64) throw new Error(`an ed25519 signature has 64 bytes, this one ${signature.length}`);
  return { r: pointOf(signature.subarray(0, 32)), s: signature.subarray(32).reduceRight((acc, v) => (acc << 8n) | BigInt(v), 0n) };
}
