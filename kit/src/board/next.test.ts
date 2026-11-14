import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Bounty } from '../agent.js';
import { fallsTo, forSolver, LEAST_SOLVE_SECONDS, shareOf, winnable } from './next.js';

const NOW = 1_800_000_000;
const bounty = (id: string, minutesLeft: number, more: Partial<Bounty> = {}): Bounty => ({ id, model: 'a-model', prompt: `question ${id}`, reward: 20_000n, deadline: NOW + minutesLeft * 60, state: 'open', mine: false, ...more });

test('a solver takes the nearest deadline first', () => {
  const board = [bounty('late', 110), bounty('page', 25), bounty('soon', 12)];
  assert.deepEqual(forSolver(board, 10_000n).map((b) => b.id), ['soon', 'page', 'late']);
});

test('a solver leaves what is not open, its own, unreadable or under its least reward', () => {
  const board = [bounty('answered', 30, { state: 'answered' }), bounty('overdue', -1, { state: 'overdue' }), bounty('mine', 30, { mine: true }), bounty('sealed', 30, { prompt: undefined }), bounty('cheap', 30, { reward: 5_000n }), bounty('taken back', 30, { reward: undefined }), bounty('fine', 30)];
  assert.deepEqual(forSolver(board, 10_000n).map((b) => b.id), ['fine']);
});

test('a bounty with less than the time an answer takes cannot be won', () => {
  assert.equal(winnable(bounty('enough', 10), NOW), true);
  assert.equal(winnable({ deadline: NOW + LEAST_SOLVE_SECONDS - 1 }, NOW), false);
  assert.equal(winnable(bounty('gone', -5), NOW), false);
});

test('solvers that share a board split its bounties by their ids', () => {
  const ids = ['00000000', '00000001', '0000000a', 'ffffffff'].map((tail) => `${'ab'.repeat(28)}${tail}`);
  assert.deepEqual(ids.map((id) => fallsTo(id, shareOf('1/2'))), [true, false, true, false]);
  assert.deepEqual(ids.map((id) => fallsTo(id, shareOf('2/2'))), [false, true, false, true]);
  // Every bounty falls to exactly one of three, and to a solver that is alone.
  for (const id of ids) {
    assert.equal([1, 2, 3].filter((index) => fallsTo(id, { index, of: 3 })).length, 1);
    assert.equal(fallsTo(id, shareOf('1/1')), true);
  }
});

test('a share names a solver among the solvers', () => {
  assert.deepEqual(shareOf('2/3'), { index: 2, of: 3 });
  for (const wrong of ['', '2', '0/2', '3/2', '1/0', 'a/b', '1.5/2']) assert.throws(() => shareOf(wrong), /a share is a solver's number/, wrong);
});
