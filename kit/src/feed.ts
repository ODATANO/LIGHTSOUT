import { base58 } from '@scure/base';
import type { Ledger } from 'lightsout-midnight-bridge';
import type { Call } from './bridge.js';
import type { ShieldedKeys } from './codec.js';
import { bpHash, type LightClientBlockView, type LightClientProof, type ValidatorStakeView } from './near-light.js';
import { approveArgs, knowArgs, listBlocks, lockIn, proposalOf, proposeArgs, proveLockArgs, proveRegisterArgs, registrationIn, signersFor } from './near-prover.js';

// Decides which calls the Midnight bridge needs next to follow NEAR, to mint a lock and to take a registration.
// Nothing here needs trust: the contract checks every value against NEAR's hashes and signatures.

/** What the feed asks NEAR's RPC. */
export interface NearSource {
  /** The newest light client block after the block with this hash; null when there is none yet. */
  nextBlock(lastHash: string): Promise<LightClientBlockView | null>;
  hashAt(height: bigint): Promise<string>;
  /** The block producers of the epoch of the block at this height, in the order NEAR hashes them. */
  producersAt(height: number): Promise<ValidatorStakeView[]>;
}

const same = (a: Uint8Array, b: Uint8Array): boolean => Buffer.compare(a, b) === 0;

/** Whether read `read` exists, still takes blocks and reads the list the head commits to. */
export function continues(state: Pick<Ledger, 'tip' | 'readers'>, read: bigint): boolean {
  if (!state.readers.member(read)) return false;
  const r = state.readers.lookup(read);
  return r.active && same(r.expected, state.tip.head.nextProducers) && r.filling === state.tip.era + 1n;
}

/**
 * The calls that still read `list` into the contract as the next epoch's producers. `read` is
 * the caller's own read, which the bridge keeps under the hash of the caller's read secret: one
 * it began and can continue, or one the bridge has not seen. The calls must be sent with that secret.
 */
export function listCalls(state: Pick<Ledger, 'tip' | 'readers'>, list: ValidatorStakeView[], read: bigint): Call[] {
  if (state.tip.nextTotal !== 0n) return [];
  const { length, blocks } = listBlocks(list);
  const absorb = (block: Uint8Array): Call => ({ circuit: 'absorb', args: [block] });
  if (!state.readers.member(read)) return [{ circuit: 'begin', args: [length] }, ...blocks.map(absorb)];
  const r = state.readers.lookup(read);
  if (!continues(state, read) || r.bitLength !== length * 8n) throw new Error('this read does not read that list; take another read secret');
  // Every block takes 64 bytes off the list; the last ones hold only padding.
  const done = Number((length - r.parse.left + 63n) / 64n);
  return blocks.slice(done).map(absorb);
}

/**
 * The calls that make `block` the head: propose it, count signatures until more than two thirds
 * of the stake signed, accept it. Signers go in by stake, largest first, so the stake a proposal
 * already holds tells how many are in. Empty when someone counted signatures in another order.
 */
export function headerCalls(state: Pick<Ledger, 'candidates'>, block: LightClientBlockView, producers: ValidatorStakeView[]): Call[] {
  const hash = proposalOf(block);
  const signers = signersFor(block, producers);
  const calls: Call[] = [];
  let counted = 0;
  if (state.candidates.member(hash)) {
    const held = state.candidates.lookup(hash).stake;
    let sum = 0n;
    while (sum < held && counted < signers.length) sum += BigInt(producers[signers[counted++]!]!.stake);
    if (sum !== held) return [];
  } else {
    calls.push({ circuit: 'propose', args: proposeArgs(block) });
  }
  for (const index of signers.slice(counted)) calls.push({ circuit: 'approve', args: approveArgs(block, producers, index) });
  calls.push({ circuit: 'accept', args: [hash] });
  return calls;
}

/**
 * The next calls toward NEAR's newest block: first the producer list of the next epoch, as the
 * caller's read `read`, then a header. A header of the head's own epoch is fetched only when the
 * block at height `wanted` is not under the head yet. Empty when nothing is needed.
 */
export async function followCalls(state: Pick<Ledger, 'tip' | 'readers' | 'candidates'>, near: NearSource, read: bigint, wanted?: bigint): Promise<Call[]> {
  const head = state.tip.head;
  const block = await near.nextBlock(await near.hashAt(head.height));
  if (!block) return [];
  const epoch = base58.decode(block.inner_lite.epoch_id);
  const inHeadEpoch = same(epoch, head.epoch);
  if (!inHeadEpoch && !same(epoch, head.nextEpoch)) throw new Error('NEAR answered with a block two epochs past the head');

  if (state.tip.nextTotal === 0n) {
    // A block of the head's epoch names the next producers itself; a later one sits in their epoch.
    const list = inHeadEpoch ? block.next_bps : await near.producersAt(block.inner_lite.height);
    if (!list || !same(bpHash(list), head.nextProducers)) throw new Error('NEAR returned a producer list the head does not commit to');
    return listCalls(state, list, read);
  }
  if (inHeadEpoch) {
    // A fresh contract knows no producers of its own epoch; its first header comes from the next one.
    if (state.tip.total === 0n) return [];
    // The head's block root covers every block below the head.
    if (wanted === undefined || wanted < head.height) return [];
  }
  return headerCalls(state, block, await near.producersAt(block.inner_lite.height));
}

/**
 * The calls that prove a lock from its outcome proof. With `own`, the caller's shielded keys, the
 * mint follows when the lock names them; only its recipient can mint a lock.
 */
export function lockCalls(state: Pick<Ledger, 'blocks' | 'locks' | 'minted_locks'>, proof: LightClientProof, own?: ShieldedKeys): Call[] {
  const lock = lockIn(proof);
  // The bridge keeps a proven lock until its mint and remembers a minted one for good.
  if (state.minted_locks.member(lock.id)) return [];
  const calls: Call[] = [];
  if (!state.locks.member(lock.id)) {
    if (!state.blocks.member(base58.decode(proof.outcome_proof.block_hash))) calls.push({ circuit: 'know', args: knowArgs(proof) });
    calls.push({ circuit: 'prove_lock', args: proveLockArgs(proof) });
  }
  const mine = own?.coinPublicKey === Buffer.from(lock.recipient).toString('hex');
  if (mine) calls.push({ circuit: 'mint', args: [lock.id], recipient: own });
  return calls;
}

/**
 * The height of the block that holds the proof's outcome root. NEAR puts it into a block after
 * the call's own, and the head commits only to blocks below itself.
 */
export const outcomeBlock = (proof: LightClientProof): bigint => BigInt(proof.block_header_lite.inner_lite.height);

/** The calls that prove a registration from its outcome proof. Empty when the bridge has it. */
export function registerCalls(state: Pick<Ledger, 'blocks' | 'joined'>, proof: LightClientProof): Call[] {
  if (state.joined.member(registrationIn(proof).index)) return [];
  const calls: Call[] = [];
  if (!state.blocks.member(base58.decode(proof.outcome_proof.block_hash))) calls.push({ circuit: 'know', args: knowArgs(proof) });
  calls.push({ circuit: 'prove_register', args: proveRegisterArgs(proof) });
  return calls;
}
