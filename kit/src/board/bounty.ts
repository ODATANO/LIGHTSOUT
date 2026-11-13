import type { JubjubPoint } from '@midnight-ntwrk/compact-runtime';
import { type Ledger, pureCircuits } from 'lightsout-board';
import { sha256 } from './field.js';

// A bounty: a reward for an answer of a NEAR AI model to one exact request. The board pays it
// only for a drop whose content a TEE key of the bounty signed as the answer to that request.

const MODEL_BYTES = 48;
/** The furthest a bounty's deadline can lie ahead, in seconds: 30 days. */
export const MAX_BOUNTY_SECONDS = 30 * 86400;
/** The longest request a bounty can publish on the board. */
export const REQUEST_BYTES = 512;
/** How many TEE keys a bounty can name. */
export const KEY_PLACES = 4;
const ANSWER_CIRCUITS = { 16: 'answer_16', 24: 'answer_24', 36: 'answer_36' } as const;

export type AnswerCircuit = (typeof ANSWER_CIRCUITS)[keyof typeof ANSWER_CIRCUITS];

const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

function padded(bytes: Uint8Array, size: number, what: string): Buffer {
  if (bytes.length > size) throw new Error(`${what} has ${bytes.length} bytes, the board takes ${size}`);
  return Buffer.concat([bytes, Buffer.alloc(size - bytes.length)]);
}

/** A bounty as it is posted. */
export interface Posting {
  terms: BountyTerms;
  buyer: JubjubPoint; // the point the answer's key is handed to
  refundTo: Uint8Array; // 32 bytes; the coin public key an unanswered reward goes back to
  deadline: bigint; // Unix seconds
  reward: bigint; // units of wNEAR
}

/** The id of a bounty, as the board computes it. It commits to the whole posting but the request text. */
export function bountyId({ terms, buyer, refundTo, deadline, reward }: Posting): Buffer {
  const bounty = { request_hash: terms.requestHash, model: terms.model, model_length: terms.modelLength, keys: terms.keys, buyer, refund_to: refundTo, deadline };
  return Buffer.from(pureCircuits.bountyId(bounty, reward));
}

/** The circuit that answers a bounty for this model. Its name's length decides, since the signed text has a fixed length per circuit. */
export function answerCircuit(model: string): AnswerCircuit {
  const circuit = ANSWER_CIRCUITS[Buffer.byteLength(model) as keyof typeof ANSWER_CIRCUITS];
  if (!circuit) throw new Error(`the board answers models whose name has ${Object.keys(ANSWER_CIRCUITS).join(', ')} bytes, not ${model}`);
  return circuit;
}

/** What the TEE signs for an answer: the model, the hex of the request hash and the hex of the response hash. */
export function signedText(model: string, requestHash: Uint8Array, responseHash: Uint8Array): Buffer {
  return Buffer.from(`${model}:${hex(requestHash)}:${hex(responseHash)}`, 'utf8');
}

/** What a bounty asks, as `post_bounty` takes it. */
export interface BountyTerms {
  requestHash: Buffer; // 32 bytes; the SHA-256 hash of the exact request bytes
  model: Buffer; // the model's name, zero-padded
  modelLength: bigint;
  keys: Buffer[]; // the TEE keys, zero entries for unused places
  text: Buffer; // the request bytes, zero-padded; all zero when not published
  textLength: bigint;
}

/**
 * The terms of a bounty for a model's answer to `request`. `keys` are the ed25519 keys of the
 * model's TEEs, 32 bytes each. With `publish` false the board gets the hash only.
 */
export function bountyTerms(model: string, request: Uint8Array, keys: readonly Uint8Array[], publish = true): BountyTerms {
  answerCircuit(model);
  if (keys.length === 0 || keys.length > KEY_PLACES) throw new Error(`a bounty names 1 to ${KEY_PLACES} TEE keys`);
  for (const key of keys) {
    if (key.length !== 32 || key.every((byte) => byte === 0)) throw new Error('a TEE key is 32 bytes and not zero');
  }
  const text = publish ? request : new Uint8Array();
  return {
    requestHash: sha256(request),
    model: padded(Buffer.from(model, 'utf8'), MODEL_BYTES, 'the model name'),
    modelLength: BigInt(Buffer.byteLength(model)),
    keys: Array.from({ length: KEY_PLACES }, (_, i) => Buffer.from(keys[i] ?? new Uint8Array(32))),
    text: padded(text, REQUEST_BYTES, 'the request'),
    textLength: BigInt(text.length),
  };
}

/** A bounty as everyone reads it from the board. */
export interface PublicBounty {
  id: string; // 64 hex
  model: string;
  requestHash: string; // 64 hex
  request?: Buffer; // the exact request bytes, when published and matching the hash
  keys: string[]; // 64 hex each; the TEE keys it accepts
  deadline: bigint; // Unix seconds; an answer counts before it, a refund after it
  reward?: bigint; // units of wNEAR, while the bounty is open
  answer?: string; // 64 hex; the drop that answered it
}

/** The bounties on the board. One with neither reward nor answer was refunded. */
export function bountiesOf(state: Ledger): PublicBounty[] {
  const list: PublicBounty[] = [];
  for (const [id, bounty] of state.bounties) {
    const published = state.requests.lookup(id);
    const request = Buffer.from(published.text).subarray(0, Number(published.length));
    list.push({
      id: hex(id),
      model: Buffer.from(bounty.model).subarray(0, Number(bounty.model_length)).toString('utf8'),
      requestHash: hex(bounty.request_hash),
      request: request.length > 0 && sha256(request).equals(bounty.request_hash) ? request : undefined,
      keys: bounty.keys.map(hex).filter((key) => !/^0+$/.test(key)),
      deadline: bounty.deadline,
      reward: state.rewards.member(id) ? state.rewards.lookup(id).value : undefined,
      answer: state.answers.member(id) ? hex(state.answers.lookup(id).drop) : undefined,
    });
  }
  return list;
}
