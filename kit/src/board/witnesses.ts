import type { Witnesses } from 'lightsout-board';
import { bitsOf } from '../codec.js';
import { type Membership, memberWitnesses } from './member.js';

/** The private values of one call. A call sets what its circuit asks for; a witness without its value throws. */
export interface Inputs {
  member?: Membership; // seal_begin and post_bounty
  key?: bigint; // the content key; the sealing calls and the answer of a bounty
  block?: Uint8Array; // 64 bytes; the block a sealing call absorbs
  state?: readonly bigint[]; // eight words; the SHA-256 state before that block
  blind?: bigint; // the blind of the commitment the board holds
  nextBlind?: bigint; // the blind of the commitment the call leaves
  nonce?: bigint; // the one-time scalar of a handover; claim and the answer of a bounty
  coinSecretKey?: Uint8Array; // 32 bytes; default zeros; of the wallet a refund goes to
}

function given<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`the call has no ${what}`);
  return value;
}

/** The board's witnesses, answering from the inputs of the call that runs. */
export function boardWitnesses<PS>(inputs: () => Inputs): Witnesses<PS> {
  return {
    ...memberWitnesses<PS>(() => given(inputs().member, 'member proof')),
    bitsOf: ({ privateState }, x) => [privateState, bitsOf(x, 35)],
    bitsOfByte: ({ privateState }, x) => [privateState, bitsOf(x, 8)],
    lowBit: ({ privateState }, x) => [privateState, [(x & 1n) === 1n, x >> 1n]],
    contentKey: ({ privateState }) => [privateState, given(inputs().key, 'content key')],
    contentBlock: ({ privateState }) => [privateState, given(inputs().block, 'content block')],
    sealState: ({ privateState }) => [privateState, [...given(inputs().state, 'SHA-256 state')]],
    sealBlind: ({ privateState }) => [privateState, given(inputs().blind, 'blind')],
    sealNextBlind: ({ privateState }) => [privateState, given(inputs().nextBlind, 'next blind')],
    handoverNonce: ({ privateState }) => [privateState, given(inputs().nonce, 'handover nonce')],
    // Anyone refunds a bounty 30 days past its deadline, and needs no key for it.
    coinSecretKey: ({ privateState }) => [privateState, inputs().coinSecretKey ?? new Uint8Array(32)],
  };
}
