import { createHash, randomBytes } from 'node:crypto';
import { CompactTypeField, CompactTypeVector, type JubjubPoint, jubjubPointX, jubjubPointY, transientHash } from '@midnight-ntwrk/compact-runtime';

const TAG_BYTES = 32;

/** A random field element of 31 bytes. It is below the order of the embedded curve too, so it serves as a scalar. */
export const randomField = (): bigint => BigInt(`0x${randomBytes(31).toString('hex')}`);

/** A field element as the contract casts it to 32 bytes: least significant byte first. */
export const fieldBytes = (x: bigint): Buffer => Buffer.from(x.toString(16).padStart(64, '0'), 'hex').reverse();

/** A text as the contract pads it to 32 bytes. */
export function tag(text: string): Buffer {
  const bytes = Buffer.alloc(TAG_BYTES);
  bytes.write(text, 'ascii');
  return bytes;
}

export const sha256 = (...parts: Uint8Array[]): Buffer => createHash('sha256').update(Buffer.concat(parts)).digest();

/** The mask two parties share through a point: the hash of its coordinates and of `rest`. */
export function maskOf(shared: JubjubPoint, ...rest: bigint[]): bigint {
  return transientHash(new CompactTypeVector(2 + rest.length, CompactTypeField), [jubjubPointX(shared), jubjubPointY(shared), ...rest]);
}
