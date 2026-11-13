import { createHash, createPublicKey, verify } from 'node:crypto';
import { base58 } from '@scure/base';

// NEAR light client: verifies block headers by block producer signatures and execution outcomes by
// Merkle proofs, so an RPC can only delay facts, never forge them. Layouts follow nearcore's
// chain/chain/src/lightclient.rs and neard verify-proof.

export interface ValidatorStakeView {
  account_id: string;
  public_key: string;
  stake: string;
}

export interface BlockHeaderInnerLiteView {
  height: number;
  epoch_id: string;
  next_epoch_id: string;
  prev_state_root: string;
  outcome_root: string;
  timestamp_nanosec: string;
  next_bp_hash: string;
  block_merkle_root: string;
}

export interface LightClientBlockView {
  prev_block_hash: string;
  next_block_inner_hash: string;
  inner_lite: BlockHeaderInnerLiteView;
  inner_rest_hash: string;
  next_bps: ValidatorStakeView[] | null;
  approvals_after_next: (string | null)[];
}

/** What the client trusts: the newest verified block and the producers of its epoch and the next. */
export interface LightClientHead {
  hash: string;
  inner_lite: BlockHeaderInnerLiteView;
  epoch_bps: ValidatorStakeView[];
  next_bps: ValidatorStakeView[] | null;
}

export interface MerklePathItem {
  hash: string;
  direction: 'Left' | 'Right';
}

export type ExecutionStatusView =
  | 'Unknown'
  | { Failure: unknown }
  | { SuccessValue: string }
  | { SuccessReceiptId: string };

export interface ExecutionOutcomeWithIdView {
  proof: MerklePathItem[];
  block_hash: string;
  id: string;
  outcome: {
    logs: string[];
    receipt_ids: string[];
    gas_burnt: number;
    tokens_burnt: string;
    executor_id: string;
    status: ExecutionStatusView;
  };
}

export interface LightClientProof {
  outcome_proof: ExecutionOutcomeWithIdView;
  outcome_root_proof: MerklePathItem[];
  block_header_lite: { prev_block_hash: string; inner_rest_hash: string; inner_lite: BlockHeaderInnerLiteView };
  block_proof: MerklePathItem[];
}

const sha256 = (...parts: Uint8Array[]): Uint8Array => {
  const h = createHash('sha256');
  for (const p of parts) h.update(p);
  return new Uint8Array(h.digest());
};
const b58 = (s: string): Uint8Array => base58.decode(s);
const u32 = (n: number): Uint8Array => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const u64 = (n: bigint | number): Uint8Array => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
};
const u128 = (n: bigint | string): Uint8Array => {
  const v = BigInt(n);
  return Buffer.concat([u64(v & 0xffffffffffffffffn), u64(v >> 64n)]);
};
const bytes = (b: Uint8Array): Uint8Array => Buffer.concat([u32(b.length), b]);
const str = (s: string): Uint8Array => bytes(Buffer.from(s, 'utf8'));
const vec = (items: Uint8Array[]): Uint8Array => Buffer.concat([u32(items.length), ...items]);
const equal = (a: Uint8Array, b: Uint8Array): boolean => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;

function ed25519Key(key: string): Uint8Array {
  if (!key.startsWith('ed25519:')) throw new Error(`unsupported key type: ${key}`);
  const raw = b58(key.slice('ed25519:'.length));
  if (raw.length !== 32) throw new Error('an ed25519 key has 32 bytes');
  return raw;
}

function verifyEd25519(key: Uint8Array, message: Uint8Array, signature: string): boolean {
  if (!signature.startsWith('ed25519:')) return false;
  const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), key]);
  return verify(null, message, createPublicKey({ key: spki, format: 'der', type: 'spki' }), b58(signature.slice(8)));
}

/** The 208 bytes of a header's inner_lite, which the block hash starts from. */
export function innerLiteBorsh(i: BlockHeaderInnerLiteView): Uint8Array {
  return Buffer.concat([
    u64(i.height),
    b58(i.epoch_id),
    b58(i.next_epoch_id),
    b58(i.prev_state_root),
    b58(i.outcome_root),
    u64(BigInt(i.timestamp_nanosec)),
    b58(i.next_bp_hash),
    b58(i.block_merkle_root),
  ]);
}

/** Block hash from the light parts of a header. */
export function blockHash(innerLite: BlockHeaderInnerLiteView, innerRestHash: string, prevBlockHash: string): Uint8Array {
  const innerHash = sha256(sha256(innerLiteBorsh(innerLite)), b58(innerRestHash));
  return sha256(innerHash, b58(prevBlockHash));
}

/** The borsh validator list that next_bp_hash commits to. Only ed25519 producers occur. */
export function producerListBorsh(bps: ValidatorStakeView[]): Uint8Array {
  return vec(bps.map((v) => Buffer.concat([Uint8Array.of(0), str(v.account_id), Uint8Array.of(0), ed25519Key(v.public_key), u128(v.stake)])));
}

/** sha256 of the borsh validator list, as committed in next_bp_hash. */
export function bpHash(bps: ValidatorStakeView[]): Uint8Array {
  return sha256(producerListBorsh(bps));
}

/** Checks a light client block against the head and returns the new head. Throws on any mismatch. */
export function advance(head: LightClientHead, block: LightClientBlockView): LightClientHead {
  const lite = block.inner_lite;
  if (lite.height <= head.inner_lite.height) throw new Error('the block is not newer than the head');
  const inCurrent = lite.epoch_id === head.inner_lite.epoch_id;
  if (!inCurrent && lite.epoch_id !== head.inner_lite.next_epoch_id) throw new Error('the block is from an unknown epoch');
  const bps = inCurrent ? head.epoch_bps : head.next_bps;
  if (!bps) throw new Error('the producers of the next epoch are unknown');

  const hash = blockHash(lite, block.inner_rest_hash, block.prev_block_hash);
  const nextHash = sha256(b58(block.next_block_inner_hash), hash);
  const message = Buffer.concat([Uint8Array.of(0), nextHash, u64(lite.height + 2)]);
  let total = 0n;
  let approved = 0n;
  bps.forEach((bp, i) => {
    total += BigInt(bp.stake);
    const signature = block.approvals_after_next[i];
    if (!signature) return;
    if (!verifyEd25519(ed25519Key(bp.public_key), message, signature)) throw new Error(`bad approval from ${bp.account_id}`);
    approved += BigInt(bp.stake);
  });
  if (approved * 3n <= total * 2n) throw new Error('the approvals hold no 2/3 stake');

  let nextBps = inCurrent ? head.next_bps : null;
  if (block.next_bps) {
    if (!equal(bpHash(block.next_bps), b58(lite.next_bp_hash))) throw new Error('next_bps does not match next_bp_hash');
    nextBps = block.next_bps;
  }
  return { hash: base58.encode(hash), inner_lite: lite, epoch_bps: bps, next_bps: nextBps };
}

function rootFromPath(path: MerklePathItem[], leaf: Uint8Array): Uint8Array {
  return path.reduce((cur, item) => (item.direction === 'Left' ? sha256(b58(item.hash), cur) : sha256(cur, b58(item.hash))), leaf);
}

function statusBorsh(status: ExecutionStatusView): Uint8Array {
  if (status === 'Unknown') return Uint8Array.of(0);
  if ('Failure' in status) return Uint8Array.of(1);
  if ('SuccessValue' in status) return Buffer.concat([Uint8Array.of(2), bytes(Buffer.from(status.SuccessValue, 'base64'))]);
  return Buffer.concat([Uint8Array.of(3), b58(status.SuccessReceiptId)]);
}

function outcomeLeaf(o: ExecutionOutcomeWithIdView): Uint8Array {
  const partial = Buffer.concat([
    vec(o.outcome.receipt_ids.map(b58)),
    u64(o.outcome.gas_burnt),
    u128(o.outcome.tokens_burnt),
    str(o.outcome.executor_id),
    statusBorsh(o.outcome.status),
  ]);
  const hashes = [b58(o.id), sha256(partial), ...o.outcome.logs.map((l) => sha256(Buffer.from(l, 'utf8')))];
  return sha256(vec(hashes));
}

/** Verifies that an execution outcome is in a block the verified head commits to. */
export function verifyOutcome(head: LightClientHead, proof: LightClientProof): ExecutionOutcomeWithIdView {
  const o = proof.outcome_proof;
  const shardRoot = rootFromPath(o.proof, outcomeLeaf(o));
  const outcomeRoot = rootFromPath(proof.outcome_root_proof, sha256(shardRoot));
  const lite = proof.block_header_lite;
  if (!equal(outcomeRoot, b58(lite.inner_lite.outcome_root))) throw new Error('the outcome is not in its block');
  const hash = blockHash(lite.inner_lite, lite.inner_rest_hash, lite.prev_block_hash);
  if (!equal(hash, b58(o.block_hash))) throw new Error('the block header does not match the outcome block');
  if (!equal(rootFromPath(proof.block_proof, hash), b58(head.inner_lite.block_merkle_root))) {
    throw new Error('the block is not an ancestor of the verified head');
  }
  return o;
}
