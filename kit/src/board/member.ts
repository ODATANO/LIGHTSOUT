import type { MerkleTreePath } from '@midnight-ntwrk/compact-runtime';
import type { Ledger, Witnesses } from 'lightsout-board';
import { commitmentOf } from '../membership.js';
import { fieldBytes, sha256, tag } from './field.js';

export const DAY_SECONDS = 86400;
/** How many marked calls a member has per day. */
export const SLOTS = 32;
const MARK_TAG = 'lightsout:mark';

/** The day of a block time in seconds, as the member proof counts days. */
export const epochOf = (seconds: number): bigint => BigInt(Math.floor(seconds / DAY_SECONDS));

/** The commitment a member secret stands behind in the bridge's member tree. */
export const memberCommitment = (secret: Uint8Array): Uint8Array => commitmentOf(secret);

/** The mark a member proof leaves for one day and slot. Only the secret links two marks of a member. */
export function markOf(secret: Uint8Array, epoch: bigint, slot: bigint): Buffer {
  return sha256(tag(MARK_TAG), secret, fieldBytes(epoch), fieldBytes(slot));
}

/** The first slot of the day whose mark is not on the board. The board keeps its marks per day. */
export function freeSlot(secret: Uint8Array, epoch: bigint, marks: Pick<Ledger['marks'], 'member' | 'lookup'>): bigint {
  const used = marks.member(epoch) ? marks.lookup(epoch) : undefined;
  for (let slot = 0n; slot < BigInt(SLOTS); slot++) {
    if (!used?.member(markOf(secret, epoch, slot))) return slot;
  }
  throw new Error(`this member has used its ${SLOTS} calls of the day`);
}

/** The bridge's member tree, as far as a member proof reads it. */
export interface MemberTree {
  findPathForLeaf(leaf: Uint8Array): MerkleTreePath<Uint8Array> | undefined;
}

/** What a member proof is made from. */
export interface Membership {
  secret: Uint8Array; // 32 bytes; the member secret
  members: MemberTree; // the bridge's member tree, from its public state
  epoch: bigint; // the day of the chain's time, which the call also names
}

export type MemberWitnesses<PS> = Pick<Witnesses<PS>, 'memberSecret' | 'memberPath' | 'memberSlot'>;

/**
 * The witnesses of the member proof: the secret, the path of its commitment in the bridge's tree,
 * and the first slot of the day that the board's marks leave free.
 */
export function memberWitnesses<PS>(membership: () => Membership): MemberWitnesses<PS> {
  return {
    memberSecret: ({ privateState }) => [privateState, membership().secret],
    memberPath: ({ privateState }, leaf) => {
      const path = membership().members.findPathForLeaf(leaf);
      if (!path) throw new Error('the bridge has no member with this commitment');
      return [privateState, path];
    },
    memberSlot: ({ privateState, ledger }) => {
      const { secret, epoch } = membership();
      return [privateState, freeSlot(secret, epoch, ledger.marks)];
    },
  };
}
