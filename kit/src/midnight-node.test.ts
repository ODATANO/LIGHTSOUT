import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { nodeRpc } from './midnight-node.js';

const realFetch = globalThis.fetch;
const realInterval = process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS;
const times: number[] = [];

before(() => {
  process.env.MIDNIGHT_NODE_URL = 'http://node.test';
  globalThis.fetch = (async () => {
    times.push(Date.now());
    return new Response(JSON.stringify({ result: 'ok' }));
  }) as typeof fetch;
});
after(() => {
  globalThis.fetch = realFetch;
  if (realInterval === undefined) delete process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS;
  else process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS = realInterval;
});

test('requests take slots at the set distance, also when they run concurrently', async () => {
  process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS = '40';
  times.length = 0;
  await Promise.all([nodeRpc('a', []), nodeRpc('b', []), nodeRpc('c', [])]);
  const sorted = [...times].sort((x, y) => x - y);
  // A busy machine can fire two late timers together, but never before their slot.
  assert.ok(sorted[2]! - sorted[0]! >= 78, `span ${sorted[2]! - sorted[0]!}`);
});

test('0 turns the distance off', async () => {
  await new Promise((r) => setTimeout(r, 50));
  process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS = '0';
  const started = Date.now();
  await Promise.all(Array.from({ length: 5 }, () => nodeRpc('a', [])));
  // Five calls at the 40 ms distance of the test above take 160 ms. A busy machine stays under that.
  assert.ok(Date.now() - started < 150);
});

test('a value that is not a number of milliseconds is refused', async () => {
  process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS = 'fast';
  await assert.rejects(nodeRpc('a', []), /MIDNIGHT_NODE_MIN_INTERVAL_MS/);
  process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS = '-1';
  await assert.rejects(nodeRpc('a', []), /MIDNIGHT_NODE_MIN_INTERVAL_MS/);
});

test('an answer with an error status names the status, not the page it came with', async () => {
  process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS = '0';
  const usual = globalThis.fetch;
  globalThis.fetch = (async () => new Response('<html>down</html>', { status: 503 })) as typeof fetch;
  try {
    await assert.rejects(nodeRpc('chain_getFinalizedHead', []), /the node answered 503 to chain_getFinalizedHead/);
  } finally {
    globalThis.fetch = usual;
  }
});
