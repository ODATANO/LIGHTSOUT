import { CompactTypeField, CompactTypeVector, persistentHash, subField, transientCommit, transientHash } from '@midnight-ntwrk/compact-runtime';
import { randomField, sha256 } from './field.js';

export const MAX_CONTENT_BYTES = 4096;
export const BLOCK_BYTES = 64;
// A block's sixteen words lie in three field elements of this many bytes.
const PART_BYTES = [28, 28, 8] as const;
const WORD = 4294967296n;

const fields2 = new CompactTypeVector(2, CompactTypeField);
const fields3 = new CompactTypeVector(3, CompactTypeField);

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74,
  0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d,
  0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e,
  0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
/** The SHA-256 state before the first block. */
export const INITIAL: readonly bigint[] = [0x6a09e667n, 0xbb67ae85n, 0x3c6ef372n, 0xa54ff53an, 0x510e527fn, 0x9b05688cn, 0x1f83d9abn, 0x5be0cd19n];
const rotr = (x: number, n: number): number => ((x >>> n) | (x << (32 - n))) >>> 0;

/**
 * SHA-256 compression: the state after one 64-byte block, as eight words. The solver needs the
 * state between blocks, which a finished hash does not give.
 */
export function compress(state: readonly bigint[], block: Uint8Array): bigint[] {
  if (state.length !== 8 || block.length !== BLOCK_BYTES) throw new Error('compression takes eight words and a 64-byte block');
  const bytes = Buffer.from(block);
  const w = Array.from({ length: 64 }, (_, i) => (i < 16 ? bytes.readUInt32BE(4 * i) : 0));
  for (let i = 16; i < 64; i++) {
    const [w15, w2] = [w[i - 15]!, w[i - 2]!];
    const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3);
    const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10);
    w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
  }
  const before = state.map(Number);
  let [a, b, c, d, e, f, g, h] = before as [number, number, number, number, number, number, number, number];
  for (let i = 0; i < 64; i++) {
    const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i]! + w[i]!) >>> 0;
    const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
    [h, g, f, e, d, c, b, a] = [g, f, e, (d + t1) >>> 0, c, b, a, (t1 + t2) >>> 0];
  }
  return [a, b, c, d, e, f, g, h].map((v, i) => BigInt((v + before[i]!) >>> 0));
}

/** The content with its SHA-256 padding, in 64-byte blocks. */
export function blocksOf(content: Uint8Array): Buffer[] {
  const zeros = (119 - (content.length % BLOCK_BYTES)) % BLOCK_BYTES;
  const length = Buffer.alloc(8);
  length.writeBigUInt64BE(BigInt(content.length) * 8n);
  const data = Buffer.concat([content, Buffer.of(0x80), Buffer.alloc(zeros), length]);
  return Array.from({ length: data.length / BLOCK_BYTES }, (_, i) => data.subarray(BLOCK_BYTES * i, BLOCK_BYTES * (i + 1)));
}

/** How many blocks of a content go in with seal_block. The one or two after them go in with seal_finish. */
export const fullBlocks = (length: number): number => Math.floor(length / BLOCK_BYTES);

/** The SHA-256 state after the first `count` blocks. */
export const stateAfter = (blocks: readonly Uint8Array[], count: number): bigint[] => blocks.slice(0, count).reduce<bigint[]>(compress, [...INITIAL]);

export const keyHash = (key: bigint): Uint8Array => persistentHash(CompactTypeField, key);

const pack = (words: readonly bigint[]): bigint => words.reduce((acc, w) => acc * WORD + w, 0n);

/** The commitment the contract keeps instead of the SHA-256 state: to the state and the key, under a blind. */
export function chainOf(state: readonly bigint[], key: bigint, blind: bigint): bigint {
  return transientCommit(fields3, [pack(state.slice(0, 4)), pack(state.slice(4)), key], blind);
}

/** A content as its solver seals it: under a key of its own, in the blocks the sealing calls take. */
export interface Sealed {
  key: bigint;
  keyHash: Uint8Array;
  hash: Uint8Array; // the content's SHA-256 hash
  blocks: Buffer[];
}

/** Prepares a content for a drop. Every call draws a fresh random key. */
export function sealContent(content: Uint8Array): Sealed {
  const key = randomField();
  return { key, keyHash: keyHash(key), hash: sha256(content), blocks: blocksOf(content) };
}

/** The content from a drop's ciphertext blocks, for whoever has the key. */
export function decrypt(blocks: readonly (readonly bigint[])[], key: bigint, length: number): Buffer {
  const parts = blocks.flatMap((block, i) =>
    PART_BYTES.map((size, j) => {
      const packed = subField(block[j] ?? 0n, transientHash(fields2, [key, BigInt(3 * i + j)]));
      return Buffer.from(packed.toString(16).padStart(64, '0'), 'hex').subarray(32 - size);
    }),
  );
  return Buffer.concat(parts).subarray(0, length);
}
