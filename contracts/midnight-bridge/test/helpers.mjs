// Shared by the tests: NEAR's byte encodings, the witnesses, and a contract instance in the JS runtime.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { base58 } from '@scure/base';
import * as rt from '@midnight-ntwrk/compact-runtime';
import { proofDataIntoSerializedPreimage } from '@midnightntwrk/ledger-v9';
import { check } from '@midnight-ntwrk/zkir-v3';
import { Contract, ledger } from '../managed/midnight-bridge/contract/index.js';

export const ACCOUNT = 'oda_bridge.odatano.testnet';
// The address the contract has in these tests.
export const ADDRESS = '01'.repeat(32);
export const fixture = JSON.parse(readFileSync(new URL('../../../kit/src/fixtures/near-testnet.json', import.meta.url), 'utf8'));

export const sha256 = (...parts) => createHash('sha256').update(Buffer.concat(parts)).digest();
// The coin public key Midnight derives from a coin secret key.
export const coinKey = (secret) => sha256(Buffer.from('midnight:zswap-pk[v1]'), secret);
export const b58 = (text) => Buffer.from(base58.decode(text.replace(/^ed25519:/, '')));
export const u32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
export const u64 = (n) => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
};
export const u64be = (n) => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64BE(BigInt(n));
  return b;
};
export const u128 = (n) => Buffer.concat([u64(BigInt(n) & 0xffffffffffffffffn), u64(BigInt(n) >> 64n)]);
export const littleEndian = (bytes) => bytes.reduceRight((acc, v) => (acc << 8n) | BigInt(v), 0n);

// The 208-byte inner_lite of a header.
export const liteBytes = (i) =>
  Buffer.concat([u64(i.height), b58(i.epoch_id), b58(i.next_epoch_id), b58(i.prev_state_root), b58(i.outcome_root), u64(BigInt(i.timestamp_nanosec)), b58(i.next_bp_hash), b58(i.block_merkle_root)]);

// The borsh producer list that next_bp_hash commits to. Entries are { name, key, stake }.
export const listBytes = (list) =>
  Buffer.concat([u32(list.length), ...list.map((p) => Buffer.concat([Buffer.of(0), u32(p.name.length), Buffer.from(p.name), Buffer.of(0), p.key, u128(p.stake)]))]);
export const fromView = (bps) => bps.map((v) => ({ name: v.account_id, key: b58(v.public_key), stake: BigInt(v.stake) }));

// SHA-256 padding: 0x80, zeros, the bit length as eight big-endian bytes.
export function padded(message) {
  const zeros = (119 - (message.length % 64)) % 64;
  const length = Buffer.alloc(8);
  length.writeBigUInt64BE(BigInt(message.length) * 8n);
  return Buffer.concat([message, Buffer.of(0x80), Buffer.alloc(zeros), length]);
}

// A Merkle path in the circuit's form, filled with empty levels up to size.
export const levels = (path, size) =>
  Array.from({ length: size }, (_, i) => (path[i] ? { hash: b58(path[i].hash), side: path[i].direction === 'Left' ? 1n : 2n } : { hash: Buffer.alloc(32), side: 0n }));

// The secret of the reader the tests read lists as when they name no other.
export const SECRET = Buffer.alloc(32, 1);

const bits = (x, n) => Array.from({ length: n }, (_, i) => ((x >> BigInt(n - 1 - i)) & 1n) === 1n);
export const witnesses = {
  bitsOf: (context, x) => [context.privateState, bits(x, 35)],
  bitsOfByte: (context, x) => [context.privateState, bits(x, 8)],
  lowBit: (context, x) => [context.privateState, [(x & 1n) === 1n, x >> 1n]],
  readSecret: (context) => [context.privateState, SECRET],
};
// The key the contract keeps a list read under: the hash of its reader's secret.
export const readOf = (secret) => rt.transientHash(new rt.CompactTypeBytes(32), secret);
// The read the tests begin when they name no reader.
export const READ = readOf(SECRET);

const managed = new URL('../managed/midnight-bridge/', import.meta.url);
const read = (path) => {
  try {
    return readFileSync(new URL(path, managed));
  } catch {
    return undefined;
  }
};
// A test that checks runs against the compiled circuits. `npm run compile` builds their proving keys.
export const compiled = existsSync(new URL('keys/burn.prover', managed));
export const NO_KEYS = 'needs the proving keys: npm run compile';
// LIGHTSOUT_UNCHECKED=1 runs those tests in the JS runtime alone, for a source without keys yet.
const unchecked = process.env.LIGHTSOUT_UNCHECKED === '1';
export const proven = (name, fn) => test(name, { skip: compiled || unchecked ? false : NO_KEYS }, fn);

// The circuit's own constraint system, as the prover would see it.
const provider = {
  lookupKey: async (name) => ({ proverKey: read(`keys/${name}.prover`), verifierKey: read(`keys/${name}.verifier`), ir: read(`zkir/${name}.bzkir`) }),
  getParams: async () => {
    throw new Error('checking constraints needs no proving parameters');
  },
};

/**
 * A deployed contract. call(name, ...args) runs a circuit and keeps the new state; with
 * constraints: true it also checks that the run satisfies the compiled circuit.
 */
export async function deploy(head, { account = ACCOUNT, constraints = false, using = witnesses } = {}) {
  // The coin secret key of the wallet that sends the next calls, and the secret of its list reads.
  let acting = Buffer.alloc(32);
  let reader;
  const contract = new Contract({
    ...using,
    coinSecretKey: (context) => [context.privateState, acting],
    readSecret: (context) => (reader ? [context.privateState, reader] : using.readSecret(context)),
  });
  const coin = '00'.repeat(32);
  const init = await contract.initialState(rt.createConstructorContext(undefined, coin), BigInt(head.height), head.epoch, head.nextEpoch, head.nextProducers, head.blockRoot, Buffer.from(account));
  const contractState = init.currentContractState;
  // The second the block of the next calls is built in; without one the clock's.
  let time;
  let last;
  // What a prover needs to prove the last call.
  const preimage = () => proofDataIntoSerializedPreimage(last.trace.input, last.trace.output, last.trace.publicTranscript, last.trace.privateTranscriptOutputs, last.name);
  return {
    async call(name, ...args) {
      const context = rt.createCircuitContext({ circuitId: name, contractAddress: ADDRESS, coinPublicKeyOrZswapState: coin, contractState, privateState: undefined, ...(time === undefined ? {} : { time }) });
      const result = await contract.circuits[name](context, ...args);
      last = { name, trace: result.context.callProofDataTrace.at(-1) };
      if (constraints && !unchecked) await check(preimage(), provider);
      contractState.data = result.context.callContext.currentQueryContext.state;
    },
    get preimage() {
      return preimage();
    },
    // The public transcript of the last call, as the ledger receives it.
    get transcript() {
      return last.trace.publicTranscript;
    },
    get state() {
      return ledger(contractState.data);
    },
    // Makes the next calls run in a block built at this second.
    at(seconds) {
      time = Number(seconds);
      return this;
    },
    // Makes the next calls come from the wallet with this coin secret key.
    as(secret) {
      acting = secret;
      return this;
    },
    // Makes the next calls come from a reader with this secret.
    reading(secret) {
      reader = secret;
      return this;
    },
    // Reads a whole producer list block by block, as the reader the calls come from.
    async readList(bytes) {
      await this.call('begin', BigInt(bytes.length));
      const data = padded(bytes);
      for (let at = 0; at < data.length; at += 64) await this.call('absorb', data.subarray(at, at + 64));
    },
  };
}

// The head a contract starts from, taken from a header in the RPC's form.
export const headOf = (lite) => ({ height: lite.height, epoch: b58(lite.epoch_id), nextEpoch: b58(lite.next_epoch_id), nextProducers: b58(lite.next_bp_hash), blockRoot: b58(lite.block_merkle_root) });
