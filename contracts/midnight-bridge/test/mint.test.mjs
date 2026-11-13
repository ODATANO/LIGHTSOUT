// The mint: for a proven lock only, once, by its recipient, with the amount the proof names.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { proven } from './helpers.mjs';
import { madeUp } from './made-up.mjs';

const { args, locks, proofOf, withKnownBlock } = madeUp();

proven('a proven lock is minted once, and nothing else is', async () => {
  const light = await withKnownBlock({ constraints: true });
  const lock = locks[0];
  await assert.rejects(light.call('mint', lock.id), /lock is not proven/);
  await light.call('prove_lock', ...args(proofOf(0), lock));

  // Another wallet cannot mint the lock; its recipient can.
  await assert.rejects(light.as(locks[1].secret).call('mint', lock.id), /only the recipient mints/);
  assert.equal(light.state.minted_locks.member(lock.id), false);
  await light.as(lock.secret).call('mint', lock.id);
  assert.equal(light.state.minted_locks.member(lock.id), true);
  // The proven lock is gone once it is minted, and it cannot be proven again.
  assert.equal(light.state.locks.member(lock.id), false);
  await assert.rejects(light.call('mint', lock.id), /already minted/);
  await assert.rejects(light.call('prove_lock', ...args(proofOf(0), lock)), /already minted/);
  await assert.rejects(light.call('mint', locks[1].id), /lock is not proven/);
});

test('each proven lock is minted by its own recipient', async () => {
  const light = await withKnownBlock();
  for (const n of [1, 2]) {
    await light.call('prove_lock', ...args(proofOf(n), locks[n]));
    await light.as(locks[n].secret).call('mint', locks[n].id);
  }
  assert.equal(light.state.minted_locks.size(), 2n);
  assert.equal(light.state.locks.size(), 0n);
});
