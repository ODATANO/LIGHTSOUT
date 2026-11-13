import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Pool, type PoolAgent } from './pool.js';

const agent = (id: string): PoolAgent => ({ id, account: `${id}.testnet`, env: {} });

test('a registered agent is lent as ready, one that is not as fresh', async () => {
  const registered = new Set(['alice.testnet']);
  const pool = new Pool([agent('alice'), agent('carol')], async (account) => registered.has(account));
  await pool.refresh();
  assert.deepEqual([pool.free(false), pool.free(true)], [1, 1]);
  assert.equal(pool.take('one', true)?.id, 'carol');
  assert.equal(pool.take('two', true), undefined);
  assert.equal(pool.take('two', false)?.id, 'alice');
  assert.deepEqual([pool.free(false), pool.free(true)], [0, 0]);
});

test('a fresh agent that registered is a ready one once it is free again', async () => {
  const registered = new Set<string>();
  const pool = new Pool([agent('carol')], async (account) => registered.has(account));
  await pool.refresh();
  const lent = pool.take('one', true);
  assert.equal(lent?.id, 'carol');
  registered.add('carol.testnet');
  await pool.refresh();
  assert.equal(pool.free(false), 0);
  if (lent) pool.release(lent);
  assert.deepEqual([pool.free(false), pool.free(true), pool.knowsRegistered(agent('carol'))], [1, 0, true]);
});

test('an agent the bridge was not asked about yet counts as fresh', () => {
  const pool = new Pool([agent('alice')], async () => true);
  assert.deepEqual([pool.free(false), pool.free(true)], [0, 1]);
});
