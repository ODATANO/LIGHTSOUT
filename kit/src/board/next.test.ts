import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Bounty } from '../agent.js';
import { forSolver, LEAST_SOLVE_SECONDS, winnable } from './next.js';

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
