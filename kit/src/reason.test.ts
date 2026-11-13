import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reasonOf } from './reason.js';

test('a wrapped failure is told with the reason behind it', () => {
  const dust = new Error('Insufficient Funds: could not balance dust');
  const wrapped = new Error('submitTx rejected the transaction. The failure is on `cause`.', { cause: new Error('Insufficient Funds: could not balance dust', { cause: dust }) });
  assert.equal(reasonOf(wrapped), 'submitTx rejected the transaction. The failure is on `cause`. Cause: Insufficient Funds: could not balance dust');
  assert.equal(reasonOf(new Error('plain')), 'plain');
  // A message that already holds its cause is not doubled.
  assert.equal(reasonOf(new Error('the model did not answer: 529 overloaded', { cause: new Error('529 overloaded') })), 'the model did not answer: 529 overloaded');
  assert.equal(reasonOf(new Error('outer', { cause: 'a text, not an error' })), 'outer');
  assert.equal(reasonOf('a text'), 'a text');
});
