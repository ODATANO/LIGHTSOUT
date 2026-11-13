import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Budget, Rate } from './limits.js';

test('a session spends up to its own amount', () => {
  const budget = new Budget(100n, 300n, 1000n);
  assert.equal(budget.left(0n, 'a'), 100n);
  budget.count('a', 60n);
  assert.equal(budget.left(60n, 'a'), 40n);
  assert.equal(budget.left(100n, 'a'), 0n);
  assert.equal(budget.left(120n, 'a'), 0n);
});

test('an address spends up to its amount across sessions, and another address is not held back', () => {
  const budget = new Budget(100n, 250n, 1000n);
  budget.count('a', 100n);
  budget.count('a', 100n);
  assert.equal(budget.left(0n, 'a'), 50n);
  assert.equal(budget.left(0n, 'b'), 100n);
});

test('all visitors together spend up to the day amount', () => {
  const budget = new Budget(100n, 300n, 150n);
  budget.count('a', 100n);
  assert.equal(budget.left(0n, 'b'), 50n);
  budget.count('b', 50n);
  assert.equal(budget.left(0n, 'c'), 0n);
});

test('a failed call gives its amount back, never below nothing', () => {
  const budget = new Budget(100n, 300n, 1000n);
  budget.count('a', 80n);
  budget.count('a', -80n);
  assert.equal(budget.left(0n, 'a'), 100n);
  budget.count('a', -50n);
  budget.count('a', 300n);
  assert.equal(budget.left(0n, 'a'), 0n);
});

test('an address does something a few times within the window and no more', () => {
  const rate = new Rate(2, 60_000);
  assert.equal(rate.allows('a'), true);
  assert.equal(rate.allows('a'), true);
  assert.equal(rate.allows('a'), false);
  assert.equal(rate.allows('b'), true);
});

test('what lies outside the window does not count', async () => {
  const rate = new Rate(1, 20);
  assert.equal(rate.allows('a'), true);
  assert.equal(rate.allows('a'), false);
  await new Promise((r) => setTimeout(r, 30));
  rate.tidy();
  assert.equal(rate.allows('a'), true);
});
