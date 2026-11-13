import { createHmac, randomBytes } from 'node:crypto';
import type { Ledger } from 'lightsout-board';
import type { ShieldedKeys } from '../codec.js';
import { pointOf, signatureOf } from '../ed25519.js';
import type { OwnDrop } from './book.js';
import { answerCircuit, type BountyTerms, bountyId } from './bounty.js';
import type { Board, Landed } from './calls.js';
import { randomField, sha256 } from './field.js';
import { type KeyPair, openHandover } from './handover.js';
import { MAX_CONTENT_BYTES, blocksOf, chainOf, decrypt, fullBlocks, keyHash, sealContent, stateAfter } from './sealing.js';

// What an asker and a solver do on the board, each step one call.

type Say = (line: string) => void;
const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');
const bytes = (text: string): Buffer => Buffer.from(text, 'hex');

/** The seed of the wallet that is paid for one drop. Only the solver's seed links it to the solver. */
export function payoutSeed(solverSeedHex: string, board: string, dropId: string): string {
  return createHmac('sha512', Buffer.from(solverSeedHex, 'hex')).update(`lightsout:drop-payout:${board}:${dropId}`).digest('hex');
}

/**
 * The seed of the wallet that takes back the reward of one bounty. The asker's main coin key
 * stands beside its NEAR account in its lock, so a refund there would name the asker. The
 * bounty's id commits to that wallet, so the seed comes from the bounty's `buyer` secret.
 */
export function refundSeed(askerSeedHex: string, board: string, buyer: string): string {
  return createHmac('sha512', Buffer.from(askerSeedHex, 'hex')).update(`lightsout:bounty-refund:${board}:${buyer}`).digest('hex');
}

/** A new drop of a content under a fresh key, as its solver keeps it. Nothing is sent yet. */
export function newDrop(board: string, content: Uint8Array): OwnDrop {
  if (content.length > MAX_CONTENT_BYTES) throw new Error(`a drop holds at most ${MAX_CONTENT_BYTES} bytes`);
  const { key } = sealContent(content);
  return { board, id: randomBytes(32).toString('hex'), key: key.toString(), blinds: [randomField().toString()], content: Buffer.from(content).toString('base64') };
}

/** Opens a drop made with `newDrop` on the board. `payout` is the coin public key a reward for it is paid to, 64 hex. */
export async function beginDrop(board: Board, secret: Uint8Array, own: OwnDrop, payout: string): Promise<Landed> {
  const content = Buffer.from(own.content, 'base64');
  const key = BigInt(own.key);
  const [blind] = own.blinds;
  if (blind === undefined) throw new Error(`drop ${own.id} has no blind`);
  const member = await board.membership(secret);
  const args: [Uint8Array, Uint8Array, Uint8Array, bigint, Uint8Array, bigint] = [bytes(own.id), keyHash(key), sha256(content), BigInt(content.length), bytes(payout), member.epoch];
  return board.call({ circuit: 'seal_begin', args }, { member, key, nextBlind: BigInt(blind) });
}

/**
 * Sends the sealing calls an open drop still lacks, one per 64-byte block. `save` stores the
 * drop before each call, so a run that stopped goes on where the board stands. `signal` stops
 * it between two calls.
 */
export async function sealDrop(board: Board, own: OwnDrop, save: (own: OwnDrop) => Promise<void>, say: Say, signal?: AbortSignal): Promise<Landed[]> {
  const id = bytes(own.id);
  const key = BigInt(own.key);
  const content = Buffer.from(own.content, 'base64');
  const blocks = blocksOf(content);
  const landed: Landed[] = [];
  for (;;) {
    signal?.throwIfAborted();
    const state = await board.state();
    if (!state.seals.member(id)) throw new Error(`the board has no drop ${own.id}`);
    const seal = state.seals.lookup(id);
    if (seal.done) return landed;
    const at = Number(seal.blocks);
    const before = stateAfter(blocks, at);
    // The board holds the commitment of the last call that landed, under one of the blinds kept.
    const blind = own.blinds.map(BigInt).find((b) => chainOf(before, key, b) === seal.chain);
    const block = blocks[at];
    if (blind === undefined || !block) throw new Error(`drop ${own.id} on the board does not continue from the kept key and blinds`);
    const nextBlind = randomField();
    own.blinds = [blind.toString(), nextBlind.toString()];
    await save(own);
    const circuit = at < fullBlocks(content.length) ? 'seal_block' : 'seal_finish';
    const call = await board.call({ circuit, args: [id] }, { key, block, state: before, blind, nextBlind });
    say(`${circuit} for block ${at + 1} of ${blocks.length}, tx ${call.tx}`);
    landed.push(call);
  }
}

/**
 * Puts a reward on an answer for the buyer's point with a coin of the caller's wallet. The caller
 * keeps `buyer` before the call, since only its secret opens the answer. Returns the bounty id.
 */
export async function postBounty(board: Board, secret: Uint8Array, terms: BountyTerms, reward: bigint, buyer: KeyPair, refundTo: string, deadline: bigint): Promise<{ bounty: string; landed: Landed }> {
  if (reward <= 0n) throw new Error('a bounty needs a reward');
  const coin = { nonce: randomBytes(32), color: (await board.state()).token, value: reward };
  const member = await board.membership(secret);
  const args: [Uint8Array, Uint8Array, bigint, Uint8Array[], Uint8Array, bigint, typeof coin, KeyPair['point'], Uint8Array, bigint, bigint] = [terms.requestHash, terms.model, terms.modelLength, terms.keys, terms.text, terms.textLength, coin, buyer.point, bytes(refundTo), deadline, member.epoch];
  const bounty = bountyId({ terms, buyer: buyer.point, refundTo: bytes(refundTo), deadline, reward });
  return { bounty: hex(bounty), landed: await board.call({ circuit: 'post_bounty', args }, { member }) };
}

/**
 * Answers a bounty with a sealed drop of the caller that holds the model's response. `signature`
 * and `key` are the TEE's over the bounty's request and that response. The board hands the drop's
 * key to the bounty's buyer and pays the reward to the drop's payout wallet, whose keys `payout` are.
 */
export function answerBounty(board: Board, own: OwnDrop, bounty: string, model: string, signature: Uint8Array, key: Uint8Array, payout: ShieldedKeys): Promise<Landed> {
  const args: [Uint8Array, Uint8Array, ReturnType<typeof signatureOf>, ReturnType<typeof pointOf>] = [bytes(bounty), bytes(own.id), signatureOf(signature), pointOf(key)];
  return board.call({ circuit: answerCircuit(model), args }, { key: BigInt(own.key), nonce: randomField() }, [payout]);
}

/**
 * Takes the reward of an unanswered bounty back after its deadline. `refund` are the keys of the
 * wallet it is refunded to and `coinSecretKey` that wallet's, which the board asks for.
 */
export function refundBounty(board: Board, bounty: string, refund: ShieldedKeys, coinSecretKey: Uint8Array): Promise<Landed> {
  return board.call({ circuit: 'refund_bounty', args: [bytes(bounty)] }, { coinSecretKey }, [refund]);
}

/** The drop that answered a bounty and its content key, for the bounty's asker. Undefined while it is unanswered. */
export function answeredKey(state: Ledger, bounty: string, buyerSecret: bigint): { drop: string; key: bigint } | undefined {
  const id = bytes(bounty);
  if (!state.answers.member(id)) return undefined;
  const answer = state.answers.lookup(id);
  return { drop: hex(answer.drop), key: openHandover(answer.handover, buyerSecret) };
}

/** The content of a sealed drop under its key. Throws when it does not have the SHA-256 hash the drop names. */
export function contentOf(state: Ledger, dropId: string, key: bigint): Buffer {
  const id = bytes(dropId);
  const drop = state.drops.lookup(id);
  const stored = state.cipher.lookup(id);
  const blocks = Array.from({ length: Number(state.seals.lookup(id).blocks) }, (_, i) => stored.lookup(BigInt(i)));
  const content = decrypt(blocks, key, Number(drop.length));
  if (!sha256(content).equals(drop.content_hash)) throw new Error(`the key does not open drop ${dropId}`);
  return content;
}
