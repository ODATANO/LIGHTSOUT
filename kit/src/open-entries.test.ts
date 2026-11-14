import assert from 'node:assert/strict';
import { test } from 'node:test';
import { highestOf, openEntries } from './open-entries.js';

// Entry `id` ran in NEAR block 100 + id.
const blockOf = async (id: bigint) => 100n + id;
const arrivedOf = (ids: bigint[]) => (id: bigint) => ids.includes(id);

test('the highest block among the entries Midnight lacks is wanted', async () => {
  const open = await openEntries(0n, 5n, arrivedOf([0n, 1n, 3n]), blockOf);
  assert.deepEqual(open, { from: 2n, highest: 104n });
});

test('the next look starts at the first open entry', async () => {
  const read: bigint[] = [];
  const open = await openEntries(2n, 5n, arrivedOf([3n]), async (id) => (read.push(id), blockOf(id)));
  assert.equal(open.from, 2n);
  assert.deepEqual(read, [2n, 4n]);
});

test('with every entry on Midnight nothing is wanted and the next look starts behind them', async () => {
  const open = await openEntries(0n, 3n, () => true, blockOf);
  assert.deepEqual(open, { from: 3n, highest: undefined });
});

test('an empty list wants nothing', async () => {
  assert.deepEqual(await openEntries(0n, 0n, () => false, blockOf), { from: 0n, highest: undefined });
});

test('an entry NEAR does not answer for is looked at again', async () => {
  const open = await openEntries(0n, 2n, () => false, async (id) => (id === 0n ? undefined : 101n));
  assert.deepEqual(open, { from: 0n, highest: 101n });
});

test('the highest of several heights leaves out the missing ones', () => {
  assert.equal(highestOf(undefined, 7n, undefined, 9n, 8n), 9n);
  assert.equal(highestOf(undefined, undefined), undefined);
  assert.equal(highestOf(), undefined);
});
