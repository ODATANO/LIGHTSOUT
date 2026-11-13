import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isTransient, withRetry } from './retry.js';

test('busy and unreachable services are transient, wrong answers are not', () => {
  assert.ok(isTransient(new Error('next_light_client_block: {"code":-429,"message":"Rate limits exceeded"}')));
  assert.ok(isTransient(new TypeError('fetch failed')));
  assert.ok(isTransient(new Error('status: HTTP 503')));
  assert.ok(!isTransient(new Error('bad approval from node1')));
});

test('withRetry repeats transient failures and gives up on the rest', async () => {
  let calls = 0;
  const value = await withRetry(
    async () => {
      calls++;
      if (calls < 3) throw new Error('fetch failed');
      return 'ok';
    },
    5,
    1,
  );
  assert.equal(value, 'ok');
  assert.equal(calls, 3);
  await assert.rejects(withRetry(async () => Promise.reject(new Error('wrong')), 5, 1), /wrong/);
  await assert.rejects(withRetry(async () => Promise.reject(new Error('fetch failed')), 2, 1), /fetch failed/);
});
