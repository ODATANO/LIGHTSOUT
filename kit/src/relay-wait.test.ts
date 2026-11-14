import assert from 'node:assert/strict';
import { test } from 'node:test';
import { headMover } from './relay-wait.js';

// A clock that only the pauses move.
const clock = () => {
  let at = 0;
  return { now: () => at, pause: async (ms: number) => void (at += ms) };
};

test('a run leaves the head to a relay for the wait and says so once a minute', async () => {
  const { now, pause } = clock();
  const moved: bigint[] = [];
  const said: string[] = [];
  const toHead = headMover(async (height) => void moved.push(height), (line) => said.push(line), 120_000, pause, now);
  for (let step = 0; step < 8; step++) await toHead(77n);
  assert.deepEqual(moved, []);
  assert.deepEqual(said, ['waiting for a relay to bring the Midnight bridge past NEAR block 77', 'waiting for a relay to bring the Midnight bridge past NEAR block 77']);
});

test('after the wait the run follows NEAR itself, each step', async () => {
  const { now, pause } = clock();
  const moved: bigint[] = [];
  const toHead = headMover(async (height) => void moved.push(height), () => undefined, 30_000, pause, now);
  await toHead(5n);
  await toHead(5n);
  assert.deepEqual(moved, []);
  await toHead(5n);
  await toHead(6n);
  assert.deepEqual(moved, [5n, 6n]);
});

test('without a wait the run follows NEAR at once', async () => {
  const { now, pause } = clock();
  const moved: bigint[] = [];
  const said: string[] = [];
  const toHead = headMover(async (height) => void moved.push(height), (line) => said.push(line), 0, pause, now);
  await toHead(9n);
  assert.deepEqual(moved, [9n]);
  assert.deepEqual(said, []);
});

test('the wait counts from the first step, not from when the run began', async () => {
  const { now, pause } = clock();
  const moved: bigint[] = [];
  const toHead = headMover(async (height) => void moved.push(height), () => undefined, 30_000, pause, now);
  await pause(600_000);
  await toHead(3n);
  assert.deepEqual(moved, []);
});
