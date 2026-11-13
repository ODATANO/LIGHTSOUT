import { createHash } from 'node:crypto';
import { base58 } from '@scure/base';
import { type Point, pointOf, type Signature, signatureOf } from './ed25519.js';
import { blockHash, innerLiteBorsh, type LightClientBlockView, type LightClientProof, type MerklePathItem, producerListBorsh, type ValidatorStakeView } from './near-light.js';

// Turns what the NEAR RPC returns into the arguments of the Midnight contract's light client calls.
// A wrong argument cannot forge anything: the contract checks every value against NEAR's hashes.

/** One level of a Merkle path as the contract takes it. */
export interface Level {
  hash: Uint8Array; // 32 bytes; the sibling
  side: bigint; // 0 = no level, 1 = sibling on the left, 2 = on the right
}

export type { Point };

export const BLOCK_PATH_LEVELS = 34;
export const OUTCOME_PATH_LEVELS = 16;
export const SHARD_PATH_LEVELS = 10;
const LOCK_LINE = /^lightsout:lock:([0-9a-f]{16})([0-9a-f]{16})([0-9a-f]{64})$/;
const JOIN_LINE = /^lightsout:join:([0-9a-f]{16})([0-9a-f]{64})$/;

const b58 = (text: string): Uint8Array => base58.decode(text.replace(/^ed25519:/, ''));
const sha256 = (...parts: Uint8Array[]): Uint8Array => createHash('sha256').update(Buffer.concat(parts)).digest();
const u64le = (n: bigint | number): Uint8Array => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
};
const u128le = (n: bigint): Uint8Array => Buffer.concat([u64le(n & 0xffffffffffffffffn), u64le(n >> 64n)]);

/** A Merkle path of the RPC as exactly `size` levels, the unused ones empty. */
export function levels(path: MerklePathItem[], size: number): Level[] {
  if (path.length > size) throw new Error(`the path has ${path.length} levels, the contract takes ${size}`);
  return Array.from({ length: size }, (_, i) => {
    const item = path[i];
    return item ? { hash: b58(item.hash), side: item.direction === 'Left' ? 1n : 2n } : { hash: new Uint8Array(32), side: 0n };
  });
}

/** The producer list as `begin` and `absorb` take it: its byte length and its SHA-256 blocks of 64 bytes. */
export function listBlocks(bps: ValidatorStakeView[]): { length: bigint; blocks: Uint8Array[] } {
  const list = producerListBorsh(bps);
  // SHA-256 padding: 0x80, zeros, the bit length as eight big-endian bytes.
  const tail = Buffer.alloc(8);
  tail.writeBigUInt64BE(BigInt(list.length) * 8n);
  const padded = Buffer.concat([list, Uint8Array.of(0x80), new Uint8Array((119 - (list.length % 64)) % 64), tail]);
  const blocks: Uint8Array[] = [];
  for (let at = 0; at < padded.length; at += 64) blocks.push(padded.subarray(at, at + 64));
  return { length: BigInt(list.length), blocks };
}

/** The hash of a light client block. */
export function hashOf(block: Pick<LightClientBlockView, 'inner_lite' | 'inner_rest_hash' | 'prev_block_hash'>): Uint8Array {
  return blockHash(block.inner_lite, block.inner_rest_hash, block.prev_block_hash);
}

/** The hash a block's producers sign, which is the hash of the block after it. The bridge keeps the proposal under it. */
export function proposalOf(block: Pick<LightClientBlockView, 'inner_lite' | 'inner_rest_hash' | 'prev_block_hash' | 'next_block_inner_hash'>): Uint8Array {
  return sha256(b58(block.next_block_inner_hash), hashOf(block));
}

/** The second a block was built in. The bridge takes a header only while it is at most 32 hours old. */
export function builtAt(block: Pick<LightClientBlockView, 'inner_lite'>): bigint {
  return BigInt(block.inner_lite.timestamp_nanosec) / 1_000_000_000n;
}

/** The arguments of `propose` for a light client block. */
export function proposeArgs(block: LightClientBlockView): [Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, bigint] {
  return [innerLiteBorsh(block.inner_lite), b58(block.inner_rest_hash), b58(block.prev_block_hash), b58(block.next_block_inner_hash), u64le(block.inner_lite.height + 2), builtAt(block)];
}

/** The arguments of `approve` for the producer at `index`, who must have signed the block. */
export function approveArgs(block: LightClientBlockView, producers: ValidatorStakeView[], index: number): [Uint8Array, bigint, Signature, Point] {
  const approval = block.approvals_after_next[index];
  const producer = producers[index];
  if (!approval || !producer) throw new Error(`producer ${index} did not sign this block`);
  return [proposalOf(block), BigInt(index), signatureOf(b58(approval)), pointOf(b58(producer.public_key))];
}

/**
 * The producers to submit for a block: signers by stake, largest first, until they hold more than
 * two thirds. Throws when the block's signers do not reach that.
 */
export function signersFor(block: LightClientBlockView, producers: ValidatorStakeView[]): number[] {
  const total = producers.reduce((sum, p) => sum + BigInt(p.stake), 0n);
  const signed = producers.map((p, i) => ({ i, stake: BigInt(p.stake) })).filter((s) => block.approvals_after_next[s.i]);
  signed.sort((a, b) => (b.stake > a.stake ? 1 : b.stake < a.stake ? -1 : a.i - b.i));
  const chosen: number[] = [];
  let stake = 0n;
  for (const signer of signed) {
    if (stake * 3n > total * 2n) break;
    chosen.push(signer.i);
    stake += signer.stake;
  }
  if (stake * 3n <= total * 2n) throw new Error('the block\'s signers hold no more than two thirds of the stake');
  return chosen;
}

/** The arguments of `know` for the block an outcome proof is about. */
export function knowArgs(proof: LightClientProof): [Uint8Array, Uint8Array, Uint8Array, Level[]] {
  const header = proof.block_header_lite;
  return [innerLiteBorsh(header.inner_lite), b58(header.inner_rest_hash), b58(header.prev_block_hash), levels(proof.block_proof, BLOCK_PATH_LEVELS)];
}

/** The first line the bridge logs for a lock. `amount` is micro-NEAR, `coinPublicKey` the recipient's in hex. */
export function lockLine(id: bigint, amount: bigint, coinPublicKey: string): string {
  const hex16 = (n: bigint) => n.toString(16).padStart(16, '0');
  return `lightsout:lock:${hex16(id)}${hex16(amount)}${coinPublicKey}`;
}

/** The lock a bridge outcome logged in its first line. */
export function lockIn(proof: LightClientProof): { id: bigint; amount: bigint; recipient: Uint8Array } {
  const line = LOCK_LINE.exec(proof.outcome_proof.outcome.logs[0] ?? '');
  if (!line) throw new Error('the outcome does not start with a lock line');
  return { id: BigInt(`0x${line[1]}`), amount: BigInt(`0x${line[2]}`), recipient: Buffer.from(line[3]!, 'hex') };
}

/** What every proof of a bridge outcome starts with: block, receipt, new receipts, gas and tokens burnt. */
function outcomeHead(proof: LightClientProof): [Uint8Array, Uint8Array, bigint, Uint8Array[], Uint8Array, Uint8Array] {
  const { outcome, id, block_hash } = proof.outcome_proof;
  if (outcome.receipt_ids.length > 2) throw new Error('the contract takes at most two new receipts');
  const receipts = [0, 1].map((i) => (outcome.receipt_ids[i] ? b58(outcome.receipt_ids[i]) : new Uint8Array(32)));
  return [b58(block_hash), b58(id), BigInt(outcome.receipt_ids.length), receipts, u64le(outcome.gas_burnt), u128le(BigInt(outcome.tokens_burnt))];
}

/** What every proof of a bridge outcome ends with: the event's hash and the two Merkle paths. */
function outcomeTail(proof: LightClientProof): [Uint8Array, Level[], Level[]] {
  const { outcome, proof: path } = proof.outcome_proof;
  return [sha256(Buffer.from(outcome.logs[1]!, 'utf8')), levels(path, OUTCOME_PATH_LEVELS), levels(proof.outcome_root_proof, SHARD_PATH_LEVELS)];
}

/** The arguments of `prove_lock` for the outcome of the bridge's lock call. */
export function proveLockArgs(proof: LightClientProof): [Uint8Array, Uint8Array, bigint, Uint8Array[], Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Level[], Level[]] {
  const { outcome } = proof.outcome_proof;
  const line = LOCK_LINE.exec(outcome.logs[0] ?? '');
  if (!line || outcome.logs.length !== 2) throw new Error('the outcome is not a lock: it needs the lock line and the event');
  return [...outcomeHead(proof), Buffer.from(line[1]!, 'hex'), Buffer.from(line[2]!, 'hex'), Buffer.from(line[3]!, 'hex'), ...outcomeTail(proof)];
}

/** The registration a bridge outcome logged in its first line. */
export function registrationIn(proof: LightClientProof): { index: bigint; commitment: Uint8Array } {
  const line = JOIN_LINE.exec(proof.outcome_proof.outcome.logs[0] ?? '');
  if (!line) throw new Error('the outcome does not start with a registration line');
  return { index: BigInt(`0x${line[1]}`), commitment: Buffer.from(line[2]!, 'hex') };
}

/** The arguments of `prove_register` for the outcome of the bridge's register call. */
export function proveRegisterArgs(proof: LightClientProof): [Uint8Array, Uint8Array, bigint, Uint8Array[], Uint8Array, Uint8Array, Uint8Array, Uint8Array, Uint8Array, Level[], Level[]] {
  const { outcome } = proof.outcome_proof;
  const line = JOIN_LINE.exec(outcome.logs[0] ?? '');
  if (!line || outcome.logs.length !== 2) throw new Error('the outcome is not a registration: it needs the registration line and the event');
  return [...outcomeHead(proof), Buffer.from(line[1]!, 'hex'), Buffer.from(line[2]!, 'hex'), ...outcomeTail(proof)];
}
