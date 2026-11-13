// Proving a registration from made-up outcomes of the bridge's register call, and the member
// tree the board asks about.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { proven } from './helpers.mjs';
import { verifyOutcome } from '../../../kit/src/near-light.ts';
import { proveRegisterArgs, registrationIn } from '../../../kit/src/near-prover.ts';
import { deploy } from './helpers.mjs';
import { FAILED_JOIN, JOINS, OTHER_ACCOUNT_JOIN, joinLine, madeUp } from './made-up.mjs';

const { clientHead, head, joinArgs, joins, locks, args, proofOf, withKnownBlock } = madeUp();
const proofOfJoin = (n) => proofOf(JOINS + n);

proven('a registration is recorded once and its commitment joins the member tree', async () => {
  const light = await withKnownBlock({ constraints: true });
  const empty = light.state.members.root();
  const proof = proofOfJoin(0);
  assert.equal(verifyOutcome(clientHead, proof).outcome.logs[0], joinLine(joins[0]));
  await light.call('prove_register', ...joinArgs(proof, joins[0]));
  assert.ok(light.state.joined.member(joins[0].index));
  assert.equal(light.state.members.firstFree(), 1n);
  assert.ok(light.state.members.findPathForLeaf(joins[0].commitment));
  assert.notEqual(light.state.members.root().field, empty.field);
  await assert.rejects(light.call('prove_register', ...joinArgs(proof, joins[0])), /already registered/);
});

test('the prover reads the registration from the outcome and builds the arguments that prove it', async () => {
  const light = await withKnownBlock();
  for (const n of [0, 1]) {
    const proof = proofOfJoin(n);
    assert.deepEqual(registrationIn(proof), { index: joins[n].index, commitment: joins[n].commitment });
    await light.call('prove_register', ...proveRegisterArgs(proof));
    assert.ok(light.state.joined.member(joins[n].index));
  }
  assert.equal(light.state.members.firstFree(), 2n);
  assert.throws(() => proveRegisterArgs(proofOf(0)), /not a registration/);
});

test('a registration in a block that is not known is refused', async () => {
  const light = await deploy(head);
  await assert.rejects(light.call('prove_register', ...joinArgs(proofOfJoin(0), joins[0])), /block is not known/);
});

test('another index, commitment or kind of call does not match the outcome', async () => {
  const light = await withKnownBlock();
  const proof = proofOfJoin(4);
  for (const claim of [{ ...joins[4], index: 99n }, { ...joins[4], commitment: randomBytes(32) }]) {
    await assert.rejects(light.call('prove_register', ...joinArgs(proof, claim)), /not in that block/);
  }
  // A lock's outcome proves no registration, and a registration's outcome no lock.
  await assert.rejects(light.call('prove_register', ...joinArgs(proofOf(0), { index: locks[0].id, commitment: locks[0].recipient })), /not in that block/);
  await assert.rejects(light.call('prove_lock', ...args(proof, { id: joins[4].index, amount: 5n, recipient: joins[4].commitment })), /not in that block/);
  await light.call('prove_register', ...joinArgs(proof, joins[4]));
});

test('a failed registration and one on another account are refused', async () => {
  const light = await withKnownBlock();
  await assert.rejects(light.call('prove_register', ...joinArgs(proofOfJoin(FAILED_JOIN), joins[FAILED_JOIN])), /not in that block/);
  await assert.rejects(light.call('prove_register', ...joinArgs(proofOfJoin(OTHER_ACCOUNT_JOIN), joins[OTHER_ACCOUNT_JOIN])), /not in that block/);
});

proven('known_root passes for every root the member tree has had and for no other', async () => {
  const light = await withKnownBlock({ constraints: true });
  await light.call('prove_register', ...joinArgs(proofOfJoin(0), joins[0]));
  const first = light.state.members.root();
  await light.call('prove_register', ...joinArgs(proofOfJoin(1), joins[1]));
  const second = light.state.members.root();
  await light.call('known_root', second);
  // A member who built a proof before the next registration can still use it.
  await light.call('known_root', first);
  await assert.rejects(light.call('known_root', { field: first.field + 1n }), /root is not known/);
});

test('every 256th registration cuts the list of old roots back to the newest', async () => {
  const light = await withKnownBlock();
  await light.call('prove_register', ...joinArgs(proofOfJoin(0), joins[0]));
  const before = light.state.members.root();
  // Registration 7 of the made-up block has index 256.
  await light.call('prove_register', ...joinArgs(proofOfJoin(7), joins[7]));
  const newest = light.state.members.root();
  await light.call('known_root', newest);
  await assert.rejects(light.call('known_root', before), /root is not known/);
  // The tree itself keeps both members.
  assert.equal(light.state.members.firstFree(), 2n);
  assert.ok(light.state.members.findPathForLeaf(joins[0].commitment));
  await light.call('prove_register', ...joinArgs(proofOfJoin(1), joins[1]));
  await light.call('known_root', newest);
});
