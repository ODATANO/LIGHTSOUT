// A made-up NEAR block with outcomes of the bridge's lock and register calls, under a made-up head, in the RPC's form.
import { randomBytes } from 'node:crypto';
import { base58 } from '@scure/base';
import { blockHash } from '../../../kit/src/near-light.ts';
import { ACCOUNT, b58, coinKey, deploy, levels, liteBytes, sha256, u128, u32, u64, u64be } from './helpers.mjs';

const text = (bytes) => base58.encode(bytes);

// A Merkle tree over a power of two leaves: the root and each leaf's path in NEAR's form.
function tree(leaves) {
  let layer = leaves.map((leaf, i) => ({ hash: leaf, members: [i] }));
  const paths = leaves.map(() => []);
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const [l, r] = [layer[i], layer[i + 1]];
      for (const m of l.members) paths[m].push({ hash: text(r.hash), direction: 'Right' });
      for (const m of r.members) paths[m].push({ hash: text(l.hash), direction: 'Left' });
      next.push({ hash: sha256(l.hash, r.hash), members: [...l.members, ...r.members] });
    }
    layer = next;
  }
  return { root: layer[0].hash, paths };
}

export const lockLine = (lock) => `lightsout:lock:${u64be(lock.id).toString('hex')}${u64be(lock.amount).toString('hex')}${lock.recipient.toString('hex')}`;
const eventLine = (lock) => `EVENT_JSON:{"standard":"lightsout_bridge","version":"1.0.0","event":"lock","data":{"lock_id":"${lock.id}"}}`;
// A lock for a wallet of its own; `secret` is that wallet's coin secret key.
function lockOf(id, amount = 5n) {
  const secret = randomBytes(32);
  return { id, amount, secret, recipient: coinKey(secret) };
}
export const joinLine = (join) => `lightsout:join:${u64be(join.index).toString('hex')}${join.commitment.toString('hex')}`;
const joinEvent = (join) => `EVENT_JSON:{"standard":"lightsout_bridge","version":"1.0.0","event":"register","data":{"index":"${join.index}"}}`;
const joinOf = (index) => ({ index, commitment: randomBytes(32) });
// The outcome of a lock call with the given number of new receipts.
const outcome = (lock, receipts, change = {}) => outcomeWith([lockLine(lock), eventLine(lock)], receipts, change);
// The outcome of a register call. It takes exactly the fee, so it starts no new receipt.
const joined = (join, change = {}) => outcomeWith([joinLine(join), joinEvent(join)], 0, change);
const outcomeWith = (logs, receipts, change) => ({
  id: text(randomBytes(32)),
  outcome: {
    logs,
    receipt_ids: Array.from({ length: receipts }, () => text(randomBytes(32))),
    gas_burnt: 2428000000000 + receipts,
    tokens_burnt: '242800000000000000000',
    executor_id: ACCOUNT,
    status: { SuccessValue: '' },
    ...change,
  },
});
// The outcome's Merkle leaf, as NEAR hashes it.
function leafOf(o) {
  const status = 'SuccessValue' in o.outcome.status ? Buffer.concat([Buffer.of(2), u32(0)]) : Buffer.of(1);
  const rest = Buffer.concat([u32(o.outcome.receipt_ids.length), ...o.outcome.receipt_ids.map(b58), u64(o.outcome.gas_burnt), u128(o.outcome.tokens_burnt), u32(o.outcome.executor_id.length), Buffer.from(o.outcome.executor_id), status]);
  return sha256(u32(2 + o.outcome.logs.length), b58(o.id), sha256(rest), ...o.outcome.logs.map((l) => sha256(Buffer.from(l))));
}

// Sixteen outcomes. Locks: three good ones, a failed call, a call on another account, three more.
export const FAILED = 3;
export const OTHER_ACCOUNT = 4;
// Registrations: two good ones, a failed call, a call on another account, four more. The last
// one has index 256, at which the bridge cuts the list of old member tree roots back.
export const JOINS = 8;
export const FAILED_JOIN = 2;
export const OTHER_ACCOUNT_JOIN = 3;

/**
 * One made-up block under a made-up head, with its locks, registrations, proofs and call arguments.
 * `recipient` replaces the first lock's coin public key. `nextProducers` is the producer list
 * hash the head commits to. Registration n has the proof `proofOf(JOINS + n)`.
 */
export function madeUp({ recipient, nextProducers = randomBytes(32) } = {}) {
  const locks = [recipient ? { ...lockOf(40n, 1000000n), recipient } : lockOf(40n, 1000000n), lockOf(41n, 2000000n), lockOf(42n, 3000000n), lockOf(50n), lockOf(51n), lockOf(52n), lockOf(53n), lockOf(54n)];
  const joins = Array.from({ length: 8 }, (_, n) => joinOf(n === 7 ? 256n : BigInt(7 + n)));
  const outcomes = [
    outcome(locks[0], 0),
    outcome(locks[1], 1),
    outcome(locks[2], 2),
    outcome(locks[FAILED], 1, { status: { Failure: {} } }),
    outcome(locks[OTHER_ACCOUNT], 1, { executor_id: ACCOUNT.replace('oda_', 'odb_') }),
    outcome(locks[5], 1),
    outcome(locks[6], 1),
    outcome(locks[7], 1),
    ...joins.map((join, n) => joined(join, n === FAILED_JOIN ? { status: { Failure: {} } } : n === OTHER_ACCOUNT_JOIN ? { executor_id: ACCOUNT.replace('oda_', 'odb_') } : {})),
  ];
  const outcomeTree = tree(outcomes.map(leafOf));
  const shardTree = tree([sha256(outcomeTree.root), randomBytes(32), randomBytes(32), randomBytes(32)]);
  const innerLite = {
    height: 300000000,
    epoch_id: text(randomBytes(32)),
    next_epoch_id: text(randomBytes(32)),
    prev_state_root: text(randomBytes(32)),
    outcome_root: text(shardTree.root),
    timestamp_nanosec: '1793900000000000000',
    next_bp_hash: text(nextProducers),
    block_merkle_root: text(randomBytes(32)),
  };
  const header = { prev_block_hash: text(randomBytes(32)), inner_rest_hash: text(randomBytes(32)), inner_lite: innerLite };
  const hash = Buffer.from(blockHash(innerLite, header.inner_rest_hash, header.prev_block_hash));
  const blockTree = tree([randomBytes(32), randomBytes(32), randomBytes(32), randomBytes(32), randomBytes(32), hash, randomBytes(32), randomBytes(32)]);
  const headLite = { ...innerLite, height: 300000100, block_merkle_root: text(blockTree.root) };

  // The head as the TypeScript light client holds it.
  const clientHead = { hash: '', inner_lite: headLite, epoch_bps: [], next_bps: null };
  // The head as the contract's constructor takes it.
  const head = { height: headLite.height, epoch: b58(headLite.epoch_id), nextEpoch: b58(headLite.next_epoch_id), nextProducers: b58(headLite.next_bp_hash), blockRoot: blockTree.root };

  // The proof of outcome i, as the RPC's light_client_proof returns it.
  const proofOf = (i) => ({
    outcome_proof: { ...outcomes[i], proof: outcomeTree.paths[i], block_hash: text(hash) },
    outcome_root_proof: shardTree.paths[0],
    block_header_lite: header,
    block_proof: blockTree.paths[5],
  });

  // The arguments of prove_lock from a proof and the lock it claims.
  function args(proof, lock) {
    const o = proof.outcome_proof;
    const receipts = [0, 1].map((i) => (o.outcome.receipt_ids[i] ? b58(o.outcome.receipt_ids[i]) : Buffer.alloc(32)));
    return [b58(o.block_hash), b58(o.id), BigInt(o.outcome.receipt_ids.length), receipts, u64(o.outcome.gas_burnt), u128(o.outcome.tokens_burnt),
      u64be(lock.id), u64be(lock.amount), lock.recipient, sha256(Buffer.from(o.outcome.logs[1])), levels(o.proof, 16), levels(proof.outcome_root_proof, 10)];
  }

  // The arguments of prove_register from a proof and the registration it claims.
  function joinArgs(proof, join) {
    const o = proof.outcome_proof;
    const receipts = [0, 1].map((i) => (o.outcome.receipt_ids[i] ? b58(o.outcome.receipt_ids[i]) : Buffer.alloc(32)));
    return [b58(o.block_hash), b58(o.id), BigInt(o.outcome.receipt_ids.length), receipts, u64(o.outcome.gas_burnt), u128(o.outcome.tokens_burnt),
      u64be(join.index), join.commitment, sha256(Buffer.from(o.outcome.logs[1])), levels(o.proof, 16), levels(proof.outcome_root_proof, 10)];
  }

  // The arguments of know for the made-up block.
  const knowArgs = [liteBytes(innerLite), b58(header.inner_rest_hash), b58(header.prev_block_hash), levels(blockTree.paths[5], 34)];

  // A contract on the made-up head that already knows the made-up block.
  async function withKnownBlock(options) {
    const light = await deploy(head, options);
    await light.call('know', ...knowArgs);
    return light;
  }
  return { locks, joins, clientHead, head, proofOf, args, joinArgs, knowArgs, withKnownBlock };
}
