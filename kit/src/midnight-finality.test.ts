import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { TypeRegistry } from '@polkadot/types';
import type { Header } from '@polkadot/types/interfaces';
import { finalityBatch, MAX_FINALITY_BLOCKS, newestIsDue } from './midnight-finality.js';

const registry = new TypeRegistry();
const ZERO = `0x${'00'.repeat(32)}`;
const json = (number: number) => ({ parentHash: ZERO, number: `0x${number.toString(16)}`, stateRoot: ZERO, extrinsicsRoot: ZERO, digest: { logs: [] } });
const hashOf = (number: number) => registry.createType<Header>('Header', json(number)).hash.toHex();

const FINALIZED = 100;
const HEAD = '0xhead';
const calls: string[] = [];
const realFetch = globalThis.fetch;

// A node on which every block up to FINALIZED ends its authority set.
function answer(method: string, params: unknown[]): unknown {
  if (method === 'chain_getFinalizedHead') return HEAD;
  if (method === 'chain_getHeader') {
    if (params[0] === HEAD) return json(FINALIZED);
    for (let n = 1; n <= FINALIZED; n++) if (hashOf(n) === params[0]) return json(n);
  }
  if (method === 'grandpa_proveFinality') return registry.createType('(H256, Bytes, Vec<Header>)', [hashOf(params[0] as number), '0x00', []]).toHex();
  throw new Error(`unexpected ${method}`);
}

before(() => {
  process.env.MIDNIGHT_NODE_URL = 'http://node.test';
  process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS = '0';
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    const { method, params } = JSON.parse(init.body) as { method: string; params: unknown[] };
    calls.push(method);
    return new Response(JSON.stringify({ result: answer(method, params) }));
  }) as typeof fetch;
});
after(() => {
  globalThis.fetch = realFetch;
});

test('a batch reads the finalized height once and then two calls per block', async () => {
  calls.length = 0;
  const batch = await finalityBatch(0);
  assert.deepEqual(batch.map((b) => b.number), Array.from({ length: MAX_FINALITY_BLOCKS }, (_, i) => i + 1));
  assert.equal(calls.filter((m) => m === 'chain_getFinalizedHead').length, 1);
  assert.equal(calls.length, 2 + MAX_FINALITY_BLOCKS * 2);
});

test('a batch stops at the finalized height', async () => {
  const batch = await finalityBatch(FINALIZED - 2);
  assert.deepEqual(batch.map((b) => b.number), [FINALIZED - 1, FINALIZED]);
  assert.deepEqual(await finalityBatch(FINALIZED), []);
});

test('the newest block is due for a check that grows old or a runtime the bridge does not know', () => {
  const now = 1_800_000_000_000;
  const checked = (minutesAgo: number, authorized = false) => ({ block: 1, authorized, at: (BigInt(now - minutesAgo * 60_000) * 1_000_000n).toString() });
  const known = (upgrade: ReturnType<typeof checked> | null, spec = 2001100) => ({ block: 1, spec, readable: true, upgrade, accepted_head: '1', locks_open: true });
  const signs = { spec: 2001100, authorized: false, proposals: 0 };
  assert.equal(newestIsDue(known(checked(5)), signs, now), false);
  assert.equal(newestIsDue(known(checked(39)), signs, now), false);
  assert.equal(newestIsDue(known(checked(41)), signs, now), true);
  assert.equal(newestIsDue(known(null), signs, now), true);
  assert.equal(newestIsDue(undefined, signs, now), true);
  assert.equal(newestIsDue(known(checked(5)), { ...signs, authorized: true }, now), true);
  assert.equal(newestIsDue(known(checked(5, true)), { ...signs, authorized: true }, now), false);
  assert.equal(newestIsDue(known(checked(5, true)), signs, now), true);
  assert.equal(newestIsDue(known(checked(5), 2001000), signs, now), true);
});
