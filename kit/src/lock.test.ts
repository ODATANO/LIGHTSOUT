import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { hold, type LockTimes } from './lock.js';

const quick: LockTimes = { beatMs: 20, staleMs: 400, waitMs: 60, now: Date.now };

test('a lock keeps a second process out until it is given back', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'lock-')), 'deep', 'agent.lock');
  const release = await hold(file, 'the state of heidi', quick);
  assert.equal(existsSync(file), true);
  await assert.rejects(hold(file, 'the state of heidi', quick), /the state of heidi is open in another process/);
  // The holder's signs of life keep the lock fresh past the time after which it would be stale.
  await new Promise((r) => setTimeout(r, 500));
  await assert.rejects(hold(file, 'the state of heidi', quick), /open in another process/);
  await release();
  assert.equal(existsSync(file), false);
  const again = await hold(file, 'the state of heidi', quick);
  await again();
});

test('a holder that died is passed over once its last sign of life is old', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'lock-')), 'agent.lock');
  await writeFile(file, JSON.stringify({ token: 'gone', at: Date.now() - 2_000 }));
  const release = await hold(file, 'the state of grace', quick);
  await release();
  assert.equal(existsSync(file), false);

  // A fresh lock of a holder that then dies is waited out.
  await writeFile(file, JSON.stringify({ token: 'gone', at: Date.now() }));
  const patient = { ...quick, waitMs: 2_000 };
  const started = Date.now();
  const late = await hold(file, 'the state of grace', patient);
  assert.ok(Date.now() - started >= 100, 'it waited for the lock to grow stale');
  await late();
});

test('giving a lock back leaves a lock that another process took alone', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'lock-')), 'agent.lock');
  const release = await hold(file, 'the state', { ...quick, beatMs: 10_000 });
  await writeFile(file, JSON.stringify({ token: 'other', at: Date.now() }));
  await release();
  assert.equal(existsSync(file), true);
});

test('a lock given back stays gone, also when a sign of life was on its way', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'lock-')), 'agent.lock');
  for (let round = 0; round < 40; round++) {
    const release = await hold(file, 'the state', { ...quick, beatMs: 1 });
    await new Promise((r) => setTimeout(r, 3));
    await release();
    assert.equal(existsSync(file), false);
    await new Promise((r) => setTimeout(r, 3));
    assert.equal(existsSync(file), false, `the lock came back in round ${round}`);
  }
});

test('a lock file that is being written counts as held, by the time it last changed', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'lock-')), 'agent.lock');
  await writeFile(file, '');
  await assert.rejects(hold(file, 'the state', quick), /open in another process/);

  // One that nobody finished writing is passed over like any holder that died.
  const longAgo = new Date(Date.now() - 2_000);
  await utimes(file, longAgo, longAgo);
  const release = await hold(file, 'the state', quick);
  await release();
  assert.equal(existsSync(file), false);
});
