// Shared by the tests: the board and the compiled bridge in the JS runtime. Members join through
// the bridge's proof of a registration on NEAR, and the board asks the bridge about its tree.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as rt from '@midnight-ntwrk/compact-runtime';
import { proofDataIntoSerializedPreimage } from '@midnightntwrk/ledger-v9';
import { check } from '@midnight-ntwrk/zkir-v3';
import * as bridge from '../../midnight-bridge/managed/midnight-bridge/contract/index.js';
import { ACCOUNT, NO_KEYS, compiled as bridgeCompiled, sha256, u128, u32, u64, u64be, witnesses as bridgeWitnesses } from '../../midnight-bridge/test/helpers.mjs';
import { joinLine } from '../../midnight-bridge/test/made-up.mjs';
import * as board from '../managed/board/contract/index.js';
import { bountyId } from '../../../kit/src/board/bounty.ts';
import { randomField } from '../../../kit/src/board/field.ts';
import { DAY_SECONDS, memberCommitment } from '../../../kit/src/board/member.ts';
import { INITIAL, compress, sealContent } from '../../../kit/src/board/sealing.ts';
import { boardWitnesses } from '../../../kit/src/board/witnesses.ts';

const WALLET = '00'.repeat(32);
const BLOCK = '11'.repeat(32);
export const BRIDGE = '0a'.repeat(32);
export const BOARD = '0b'.repeat(32);
export const TOKEN = Buffer.alloc(32, 7);
// The day and the block time of a call when a test names none.
export const EPOCH = 20000n;
export const NOON = Number(EPOCH) * DAY_SECONDS + DAY_SECONDS / 2;

export const hex = (bytes) => Buffer.from(bytes).toString('hex');
/** The coin public key of a wallet from its coin secret key, as the ledger derives it. */
export const coinKeyOf = (secret) => sha256(Buffer.from('midnight:zswap-pk[v1]'), secret);
export const coinOf = (value, color = TOKEN) => ({ nonce: randomBytes(32), color, value });

/** A drop as its solver knows it: the content, its key, and the hidden state of the sealing. */
export function dropOf(content) {
  return { id: randomBytes(32), content, payout: randomBytes(32), ...sealContent(content), state: INITIAL, blind: 0n };
}

const managed = { [BRIDGE]: new URL('../../midnight-bridge/managed/midnight-bridge/', import.meta.url), [BOARD]: new URL('../managed/board/', import.meta.url) };
const read = (address, path) => {
  try {
    return readFileSync(new URL(path, managed[address]));
  } catch {
    return undefined;
  }
};

// A test that checks runs against the compiled circuits of the board and the bridge.
const compiled = bridgeCompiled && existsSync(new URL('keys/seal_begin.prover', managed[BOARD]));
// LIGHTSOUT_UNCHECKED=1 runs those tests in the JS runtime alone, for a source without keys yet.
const unchecked = process.env.LIGHTSOUT_UNCHECKED === '1';
export const proven = (name, fn) => test(name, { skip: compiled || unchecked ? false : NO_KEYS }, fn);

// Checks one call of a call tree against the compiled circuit of its contract.
async function checkCall(call) {
  const provider = {
    lookupKey: async (name) => ({ proverKey: read(call.contractAddress, `keys/${name}.prover`), verifierKey: read(call.contractAddress, `keys/${name}.verifier`), ir: read(call.contractAddress, `zkir/${name}.bzkir`) }),
    getParams: async () => {
      throw new Error('checking constraints needs no proving parameters');
    },
  };
  await check(proofDataIntoSerializedPreimage(call.input, call.output, call.publicTranscript, call.privateTranscriptOutputs, call.circuitId), provider);
}

// A Merkle tree in the form of the bridge's paths: side 1 has the sibling on the left, 2 on the right.
function tree(leaves) {
  let layer = [...leaves];
  while (layer.length & (layer.length - 1)) layer.push(randomBytes(32));
  const paths = leaves.map(() => []);
  for (let width = 1; layer.length > 1; width *= 2) {
    paths.forEach((path, i) => {
      const at = Math.floor(i / width);
      path.push(at % 2 ? { hash: layer[at - 1], side: 1n } : { hash: layer[at + 1], side: 2n });
    });
    layer = layer.flatMap((node, i) => (i % 2 ? [] : [sha256(node, layer[i + 1])]));
  }
  return { root: layer[0], paths };
}
const levels = (path, size) => Array.from({ length: size }, (_, i) => path[i] ?? { hash: Buffer.alloc(32), side: 0n });

/**
 * A made-up NEAR block with one successful register call per commitment, and a head whose block
 * root is that block. Returns the head and the arguments of the bridge's know and prove_register.
 */
function registrations(commitments) {
  const [gas, tokens] = [u64(2428000000000), u128('242800000000000000000')];
  const rest = sha256(u32(0), gas, tokens, u32(ACCOUNT.length), Buffer.from(ACCOUNT), Buffer.of(2), u32(0));
  const calls = commitments.map((commitment, index) => ({ index: BigInt(index), commitment, receipt: randomBytes(32), event: randomBytes(32) }));
  const outcomes = tree(calls.map((call) => sha256(u32(4), call.receipt, rest, sha256(Buffer.from(joinLine(call))), call.event)));
  const lite = randomBytes(208);
  sha256(outcomes.root).copy(lite, 104);
  const [innerRest, previous] = [randomBytes(32), randomBytes(32)];
  const hash = sha256(sha256(sha256(lite), innerRest), previous);
  return {
    head: [300000100n, randomBytes(32), randomBytes(32), randomBytes(32), hash],
    know: [lite, innerRest, previous, levels([], 34)],
    register: calls.map((call, n) => [hash, call.receipt, 0n, [Buffer.alloc(32), Buffer.alloc(32)], gas, tokens, u64be(call.index), call.commitment, call.event, levels(outcomes.paths[n], 16), levels([], 10)]),
  };
}

// A contract state as a deploy leaves it on chain: every operation carries its verifier key.
function withKeys(state, address, circuits) {
  for (const circuit of circuits) {
    const key = read(address, `keys/${circuit}.verifier`);
    if (!key) continue;
    const operation = new rt.ContractOperation();
    operation.verifierKey = key;
    state.setOperation(circuit, operation);
  }
  return state;
}

/**
 * The bridge with `members` registered commitments and a board that points at it. `joined` of
 * them are in the member tree from the start, the others join with join(n). With constraints:
 * true every call of a call tree is also checked against its compiled circuit.
 */
export async function world({ members = 2, joined = members, constraints = false } = {}) {
  const secrets = Array.from({ length: members }, () => randomBytes(32));
  const made = registrations(secrets.map(memberCommitment));

  const bridgeContract = new bridge.Contract({ ...bridgeWitnesses, coinSecretKey: (context) => [context.privateState, Buffer.alloc(32)] });
  const bridgeState = withKeys((await bridgeContract.initialState(rt.createConstructorContext(undefined, WALLET), ...made.head, Buffer.from(ACCOUNT))).currentContractState, BRIDGE, Object.keys(bridge.expectedVk));
  const onBridge = async (name, args) => {
    const context = rt.createCircuitContext({ circuitId: name, contractAddress: BRIDGE, coinPublicKeyOrZswapState: WALLET, contractState: bridgeState, privateState: undefined });
    bridgeState.data = (await bridgeContract.circuits[name](context, ...args)).context.callContext.currentQueryContext.state;
  };
  await onBridge('know', made.know);
  for (let n = 0; n < joined; n++) await onBridge('prove_register', made.register[n]);

  // What the witnesses answer: the acting member, and the private values of the solver in a call.
  // Without a slot the member proof takes the first free one of the day.
  const values = { secret: secrets[0], epoch: EPOCH, slot: undefined, path: (leaf) => w.tree.findPathForLeaf(leaf), key: 0n, block: Buffer.alloc(64), state: [], blind: 0n, next: 0n, nonce: 0n, coinSecretKey: Buffer.alloc(32) };
  const witnesses = boardWitnesses(() => ({
    member: { secret: values.secret, members: { findPathForLeaf: (leaf) => values.path(leaf) }, epoch: values.epoch },
    key: values.key,
    block: values.block,
    state: values.state,
    blind: values.blind,
    nextBlind: values.next,
    nonce: values.nonce,
    coinSecretKey: values.coinSecretKey,
  }));
  const contract = new board.Contract({
    ...witnesses,
    memberSlot: (context) => (values.slot === undefined ? witnesses.memberSlot(context) : [context.privateState, values.slot]),
  });
  const boardState = (await contract.initialState(rt.createConstructorContext(undefined, WALLET), { bytes: Buffer.from(BRIDGE, 'hex') }, TOKEN)).currentContractState;
  const crossContract = {
    stateProvider: { getContractState: async (_block, address) => (address === BRIDGE ? bridgeState : undefined) },
    moduleProvider: { resolve: (address) => (address === BRIDGE ? async () => bridge : undefined) },
  };

  const w = {
    secrets,
    values,
    get state() {
      return board.ledger(boardState.data);
    },
    get tree() {
      return bridge.ledger(bridgeState.data).members;
    },
    join: (n) => onBridge('prove_register', made.register[n]),
    // Makes the next marked calls come from the member with this secret.
    as(secret) {
      values.secret = secret;
      return this;
    },
    /**
     * Runs a circuit of the board as a transaction of its own at the given block time. Returns
     * the calls of its call tree, the bridge's first, and the coins it moved. `checked` decides
     * for this call alone whether it is checked against the compiled circuits.
     */
    async call(name, args, { time = NOON, checked = constraints } = {}) {
      const context = rt.createCircuitContext({ circuitId: name, contractAddress: BOARD, coinPublicKeyOrZswapState: WALLET, contractState: boardState, privateState: undefined, time, parentBlockHash: BLOCK, crossContract });
      const result = await contract.circuits[name](context, ...args);
      const calls = result.context.callProofDataTrace;
      if (checked && !unchecked) for (const call of calls) await checkCall(call);
      boardState.data = result.context.callContext.currentQueryContext.state;
      return { calls, coins: rt.decodeZswapLocalState(result.context.callContext.currentZswapLocalState) };
    },
    // A call with a member proof for the day of its block time, in the acting member's next free slot.
    marked(name, args, { time = NOON, epoch = BigInt(Math.floor(time / DAY_SECONDS)), slot, ...rest } = {}) {
      Object.assign(values, { epoch, slot });
      return w.call(name, [...args, epoch], { time, ...rest });
    },
    begin: (drop, options) => w.sealing(drop, [], () => w.marked('seal_begin', [drop.id, drop.keyHash, drop.hash, BigInt(drop.content.length), drop.payout], options)),
    sealBlock: (drop, block) => w.sealing(drop, [block], () => w.call('seal_block', [drop.id])),
    sealFinish: (drop, block) => w.sealing(drop, [block], () => w.call('seal_finish', [drop.id])),
    // One step of the solver. The call sees the solver's private values. When it passes, the
    // solver's SHA-256 state and blind move on.
    async sealing(drop, blocks, call) {
      Object.assign(values, { key: drop.key, state: drop.state, blind: drop.blind, next: randomField(), block: blocks[0] ?? values.block });
      const result = await call();
      drop.state = blocks.reduce(compress, drop.state);
      drop.blind = values.next;
      return result;
    },
    // Opens a drop and seals its whole content.
    async sealed(drop) {
      await w.begin(drop);
      const full = Math.floor(drop.content.length / 64);
      for (const [i, block] of drop.blocks.entries()) await (i < full ? w.sealBlock(drop, block) : w.sealFinish(drop, block));
      return drop;
    },
    // The ciphertext blocks of a drop as the ledger holds them.
    cipherOf(id) {
      const blocks = w.state.cipher.lookup(id);
      return Array.from({ length: Number(w.state.seals.lookup(id).blocks) }, (_, i) => blocks.lookup(BigInt(i)));
    },
    // Puts a reward on an answer for the buyer's point. Returns the bounty id.
    async postBounty(terms, buyer, { coin = coinOf(1000n), refundTo = randomBytes(32), deadline = BigInt(NOON + 600), ...options } = {}) {
      await w.marked('post_bounty', [terms.requestHash, terms.model, terms.modelLength, terms.keys, terms.text, terms.textLength, coin, buyer.point, refundTo, deadline], options);
      return bountyId({ terms, buyer: buyer.point, refundTo, deadline, reward: coin.value });
    },
    // Answers a bounty with a drop, as the holder of `key`.
    answer(circuit, bounty, drop, signature, point, { key = drop.key, ...options } = {}) {
      Object.assign(values, { key, nonce: randomField() });
      return w.call(circuit, [bounty, drop.id, signature, point], options);
    },
    // Refunds a bounty as the wallet with this coin secret key; without one, as anyone.
    refundBounty(bounty, { secret = Buffer.alloc(32), ...options } = {}) {
      values.coinSecretKey = secret;
      return w.call('refund_bounty', [bounty], options);
    },
  };
  return w;
}
