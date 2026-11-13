// Proving a lock from made-up outcomes of the bridge's lock call. The TypeScript light client must
// accept every proof first, so both agree on NEAR's encoding.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { proven } from './helpers.mjs';
import { verifyOutcome } from '../../../kit/src/near-light.ts';
import { lockIn, proveLockArgs } from '../../../kit/src/near-prover.ts';
import { ACCOUNT, deploy, levels } from './helpers.mjs';
import { FAILED, OTHER_ACCOUNT, lockLine, madeUp } from './made-up.mjs';

const { args, clientHead, head, locks, proofOf, withKnownBlock } = madeUp();

proven('locks with zero, one and two new receipts are recorded, each once', async () => {
  const light = await withKnownBlock({ constraints: true });
  for (const n of [0, 1, 2]) {
    const proof = proofOf(n);
    assert.equal(verifyOutcome(clientHead, proof).outcome.logs[0], lockLine(locks[n]));
    await light.call('prove_lock', ...args(proof, locks[n]));
    const got = light.state.locks.lookup(locks[n].id);
    assert.equal(got.amount, locks[n].amount);
    assert.deepEqual(Buffer.from(got.recipient), locks[n].recipient);
  }
  await assert.rejects(light.call('prove_lock', ...args(proofOf(0), locks[0])), /already proven/);
});

test('the prover reads the lock from the outcome and builds the arguments that prove it', async () => {
  const light = await withKnownBlock();
  for (const n of [0, 1, 2]) {
    const proof = proofOf(n);
    assert.deepEqual(lockIn(proof), { id: locks[n].id, amount: locks[n].amount, recipient: locks[n].recipient });
    await light.call('prove_lock', ...proveLockArgs(proof));
    assert.equal(light.state.locks.lookup(locks[n].id).amount, locks[n].amount);
  }
});

test('a lock in a block that is not known is refused', async () => {
  const light = await deploy(head);
  await assert.rejects(light.call('prove_lock', ...args(proofOf(0), locks[0])), /block is not known/);
});

test('another amount, recipient, id or path does not match the outcome', async () => {
  const light = await withKnownBlock();
  const proof = proofOf(5);
  for (const claim of [{ ...locks[5], amount: 6n }, { ...locks[5], recipient: randomBytes(32) }, { ...locks[5], id: 99n }]) {
    await assert.rejects(light.call('prove_lock', ...args(proof, claim)), /not in that block/);
  }
  const reversed = args(proof, locks[5]);
  reversed[10] = levels([...proof.outcome_proof.proof].reverse(), 16);
  await assert.rejects(light.call('prove_lock', ...reversed), /not in that block/);
  const three = args(proof, locks[5]);
  three[2] = 3n;
  await assert.rejects(light.call('prove_lock', ...three), /more than two new receipts/);
  await light.call('prove_lock', ...args(proof, locks[5]));
  assert.equal(light.state.locks.member(52n), true);
});

test('the log of a failed call or of another account proves nothing', async () => {
  const light = await withKnownBlock();
  assert.ok('Failure' in verifyOutcome(clientHead, proofOf(FAILED)).outcome.status);
  await assert.rejects(light.call('prove_lock', ...args(proofOf(FAILED), locks[FAILED])), /not in that block/);
  assert.notEqual(verifyOutcome(clientHead, proofOf(OTHER_ACCOUNT)).outcome.executor_id, ACCOUNT);
  await assert.rejects(light.call('prove_lock', ...args(proofOf(OTHER_ACCOUNT), locks[OTHER_ACCOUNT])), /not in that block/);
});
