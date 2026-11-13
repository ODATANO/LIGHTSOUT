// The feed: what it decides to send, run against the contract on recorded testnet blocks.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { base58 } from '@scure/base';
import { followCalls, lockCalls, registerCalls } from '../../../kit/src/feed.ts';
import { builtAt, hashOf } from '../../../kit/src/near-prover.ts';
import { deploy, fixture, headOf, READ } from './helpers.mjs';
import { FAILED_JOIN, JOINS, madeUp } from './made-up.mjs';

const { checkpoint, blocks: [block] } = fixture;

// A NEAR that ends at the recorded block: after the checkpoint comes that block, then nothing.
const near = {
  hashAt: async (height) => base58.encode(hashOf(Number(height) === checkpoint.inner_lite.height ? checkpoint : block)),
  nextBlock: async (lastHash) => (lastHash === base58.encode(hashOf(checkpoint)) ? block : null),
  producersAt: async () => checkpoint.next_bps,
};
const names = (calls) => calls.map((c) => c.circuit);
const run = async (light, calls) => {
  for (const call of calls) await light.call(call.circuit, ...call.args);
};

// A block time at which the recorded header is fresh enough to become the head.
const soon = builtAt(block) + 600n;

test('the feed reads the producer list, then moves the head, then rests', async () => {
  const light = (await deploy(headOf(checkpoint.inner_lite))).at(soon);

  const list = await followCalls(light.state, near, READ);
  assert.equal(list[0].circuit, 'begin');
  assert.ok(list.length > 2 && list.slice(1).every((c) => c.circuit === 'absorb'));
  await run(light, list);
  assert.notEqual(light.state.tip.nextTotal, 0n);

  const header = await followCalls(light.state, near, READ);
  assert.equal(header[0].circuit, 'propose');
  assert.equal(header.at(-1).circuit, 'accept');
  assert.ok(header.slice(1, -1).every((c) => c.circuit === 'approve'));
  await run(light, header);
  assert.equal(light.state.tip.head.height, BigInt(block.inner_lite.height));
  assert.equal(light.state.tip.era, 1n);

  assert.deepEqual(await followCalls(light.state, near, READ), []);
});

test('a feed that starts in the middle sends only what is missing', async () => {
  const light = (await deploy(headOf(checkpoint.inner_lite))).at(soon);
  const list = await followCalls(light.state, near, READ);
  await run(light, list.slice(0, 3));
  const rest = await followCalls(light.state, near, READ);
  assert.deepEqual(names(rest), names(list.slice(3)));
  assert.deepEqual(rest[0].args, list[3].args);
  await run(light, rest);

  const header = await followCalls(light.state, near, READ);
  await run(light, header.slice(0, 3));
  const left = await followCalls(light.state, near, READ);
  assert.deepEqual(names(left), names(header.slice(3)));
  await run(light, left);
  assert.equal(light.state.tip.head.height, BigInt(block.inner_lite.height));
});

test('a producer list the head does not commit to is not sent', async () => {
  const light = await deploy(headOf(checkpoint.inner_lite));
  const lying = { ...near, producersAt: async () => checkpoint.next_bps.slice(1) };
  await assert.rejects(followCalls(light.state, lying, READ), /does not commit to/);
});

test('anyone proves a lock, and its recipient mints it', async () => {
  const { head, locks, proofOf } = madeUp();
  const light = await deploy(head);
  const keys = { coinPublicKey: locks[0].recipient.toString('hex'), encryptionPublicKey: '00'.repeat(32) };

  // Without the recipient's keys the plan stops at the proof.
  assert.deepEqual(names(lockCalls(light.state, proofOf(0))), ['know', 'prove_lock']);
  const calls = lockCalls(light.state, proofOf(0), keys);
  assert.deepEqual(names(calls), ['know', 'prove_lock', 'mint']);
  assert.deepEqual(calls[2].recipient, keys);
  await run(light, calls.slice(0, 1));
  assert.deepEqual(names(lockCalls(light.state, proofOf(0), keys)), ['prove_lock', 'mint']);
  await run(light.as(locks[0].secret), calls.slice(1));
  assert.equal(light.state.minted_locks.member(locks[0].id), true);
  assert.deepEqual(lockCalls(light.state, proofOf(0), keys), []);

  // The next lock of the same block needs no second know, and names another wallet.
  assert.deepEqual(names(lockCalls(light.state, proofOf(1), keys)), ['prove_lock']);
  const other = { ...keys, coinPublicKey: locks[1].recipient.toString('hex') };
  assert.deepEqual(names(lockCalls(light.state, proofOf(1), other)), ['prove_lock', 'mint']);
});

test('anyone proves a registration, once', async () => {
  const { head, joins, proofOf } = madeUp();
  const light = await deploy(head);

  const calls = registerCalls(light.state, proofOf(JOINS));
  assert.deepEqual(names(calls), ['know', 'prove_register']);
  await run(light, calls.slice(0, 1));
  assert.deepEqual(names(registerCalls(light.state, proofOf(JOINS))), ['prove_register']);
  await run(light, calls.slice(1));
  assert.ok(light.state.joined.member(joins[0].index));
  assert.ok(light.state.members.findPathForLeaf(joins[0].commitment));
  assert.deepEqual(registerCalls(light.state, proofOf(JOINS)), []);

  // The next registration of the same block needs no second know.
  const next = registerCalls(light.state, proofOf(JOINS + 1));
  assert.deepEqual(names(next), ['prove_register']);
  await run(light, next);
  assert.ok(light.state.joined.member(joins[1].index));
  assert.equal(light.state.members.firstFree(), 2n);
});

test('an outcome that is no registration gives no calls', async () => {
  const { head, proofOf } = madeUp();
  const light = await deploy(head);
  assert.throws(() => registerCalls(light.state, proofOf(0)), /does not start with a registration line/);
  // A failed call still logged its line; the contract refuses it.
  const failed = registerCalls(light.state, proofOf(JOINS + FAILED_JOIN));
  assert.deepEqual(names(failed), ['know', 'prove_register']);
  await run(light, failed.slice(0, 1));
  await assert.rejects(run(light, failed.slice(1)), /not in that block/);
});
