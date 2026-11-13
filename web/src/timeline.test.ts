import assert from 'node:assert/strict';
import { test } from 'node:test';
import { timeline } from './timeline.js';

const YOCTO = 10n ** 24n;
const NOW = 1_800_000_000;
const lock = (id: bigint, height: bigint, minted = true) => ({ id, sender: `sender${id}.testnet`, amount: YOCTO / 10n, height, minted });
const burn = (id: string, block: number | undefined, paid = true) => ({ id, amount: 100_000n, to: `${id}.testnet`, paid, paidOut: paid ? 100_000n : 0n, block });
const call = (circuit: string, secondsAgo: number, ok = true) => ({ circuit, tx: `${circuit}${secondsAgo}`, height: 1, at: NOW - secondsAgo, ok });
const onNear = (method: string, secondsAgo: number, signer = 'relayer.testnet', height = 1) => ({ method, tx: `${method}${secondsAgo}`, signer, height, at: NOW - secondsAgo });
const named = (rows: ReturnType<typeof timeline>) => rows.map((row) => (row.kind === 'call' ? `${row.chain} ${row.circuit} x${row.times}` : `${row.kind} ${row.id}`));

test('deposits and withdrawals stand in the order of their blocks, the newest first', () => {
  // NEAR at one second a block: lock 1 is 600 s old, lock 0 is 3600 s old.
  const near = { height: 10_000n, blockSeconds: 1, recent: [lock(1n, 9_400n), lock(0n, 6_400n)] };
  // Midnight at six seconds a block: burn aa is 1200 s old, burn bb is 60 s old.
  const midnight = { height: 1_000n, burns: [burn('aa', 800), burn('bb', 990)] };
  assert.deepEqual(named(timeline(near, midnight)), ['withdrawal bb', 'deposit 1', 'withdrawal aa', 'deposit 0']);
});

test('a withdrawal NEAR has not proven yet stands first', () => {
  const near = { height: 10_000n, blockSeconds: 1.2, recent: [lock(0n, 9_999n)] };
  const midnight = { height: 1_000n, burns: [burn('cc', undefined, false)] };
  assert.deepEqual(named(timeline(near, midnight)), ['withdrawal cc', 'deposit 0']);
});

test('a row names the account, the amount in NEAR and whether it is through', () => {
  const near = { height: 100n, blockSeconds: 1, recent: [lock(7n, 90n, false)] };
  const midnight = { height: 100n, burns: [burn('dd', 50, true)] };
  assert.deepEqual(timeline(near, midnight), [
    { kind: 'deposit', id: '7', account: 'sender7.testnet', near: '0.1', done: false },
    { kind: 'withdrawal', id: 'dd', account: 'dd.testnet', near: '0.1', done: true },
  ]);
});

test('the calls on Midnight stand among them by their block time, one row for calls of a kind in a row', () => {
  const near = { height: 10_000n, blockSeconds: 1, recent: [lock(1n, 9_400n)] };
  const midnight = { height: 1_000n, burns: [] };
  const calls = [call('mint', 100), call('absorb', 700), call('absorb', 760), call('absorb', 820), call('absorb', 880, false), call('accept', 900)];
  const rows = timeline(near, midnight, { midnight: calls }, NOW);
  assert.deepEqual(named(rows), ['midnight mint x1', 'deposit 1', 'midnight absorb x3', 'midnight absorb x1', 'midnight accept x1']);
  assert.deepEqual(rows[2], { kind: 'call', chain: 'midnight', circuit: 'absorb', tx: 'absorb700', first: 'absorb820', at: NOW - 700, times: 3, ok: true });
});

test('a lock and a payout carry their NEAR transaction, and the other NEAR calls stand as rows', () => {
  const near = { height: 10_000n, blockSeconds: 1, recent: [lock(1n, 9_400n), lock(0n, 9_000n)] };
  const midnight = { height: 1_000n, burns: [burn('ee', 900), burn('ff', 950)] };
  const seen = {
    near: [onNear('submit_midnight_finality', 50), onNear('release', 200), onNear('lock', 590, 'sender1.testnet', 9_400), onNear('lock', 700, 'someone.testnet', 9_400)],
    released: new Map([['ee', 'release200']]),
  };
  const rows = timeline(near, midnight, seen, NOW);
  // The paid burn stands at its payout, the other at its burn, and the first lock at its transaction.
  assert.deepEqual(named(rows), ['near submit_midnight_finality x1', 'withdrawal ee', 'withdrawal ff', 'deposit 1', 'deposit 0']);
  assert.deepEqual(rows.map((row) => (row.kind === 'call' ? undefined : row.tx)), [undefined, 'release200', undefined, 'lock590', undefined]);
});
