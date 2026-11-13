import assert from 'node:assert/strict';
import { test } from 'node:test';
import { promptIn } from '../inference/nearai.js';
import { REQUEST_BYTES } from './bounty.js';
import { checkQuestion, DEFAULT_MODEL, questionRequest } from './question.js';

test('a question becomes a request the board can publish, one of a kind', () => {
  const [a, b] = [questionRequest('Why is the sky blue?', DEFAULT_MODEL, 64), questionRequest('Why is the sky blue?', DEFAULT_MODEL, 64)];
  assert.equal(promptIn(a), 'Why is the sky blue?');
  assert.equal((JSON.parse(a) as { max_tokens: number }).max_tokens, 64);
  assert.ok(Buffer.byteLength(a) <= REQUEST_BYTES);
  assert.notEqual(a, b);
});

test('a question passes or fails whatever seed its request gets', () => {
  // The longest question the board takes for this model, found by its own check.
  let longest = 'a'.repeat(REQUEST_BYTES);
  while (longest.length > 0) {
    try {
      checkQuestion(longest);
      break;
    } catch {
      longest = longest.slice(1);
    }
  }
  assert.ok(longest.length > 300);
  for (let i = 0; i < 50; i++) assert.ok(Buffer.byteLength(questionRequest(longest, DEFAULT_MODEL, 64)) <= REQUEST_BYTES);
  assert.throws(() => checkQuestion(`${longest}a`), /1 bytes too long/);
});

test('a question the board cannot answer is refused', () => {
  assert.throws(() => checkQuestion('x', 'some/model'), /the board answers models/);
  assert.throws(() => checkQuestion('x', DEFAULT_MODEL, 513), /1 to 512 tokens/);
  assert.throws(() => checkQuestion('x', DEFAULT_MODEL, 0), /1 to 512 tokens/);
  assert.throws(() => checkQuestion('  '), /empty/);
});
