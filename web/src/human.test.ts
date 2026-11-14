import assert from 'node:assert/strict';
import { test } from 'node:test';
import { turnstile } from './human.js';

interface Asked {
  url: string;
  body: Record<string, string>;
}

// A check that answers `answer` and notes what it was asked.
function check(answer: unknown, status = 200) {
  const asked: Asked[] = [];
  const post = (async (url: string, init: { body: string }) => {
    asked.push({ url, body: JSON.parse(init.body) as Record<string, string> });
    return new Response(JSON.stringify(answer), { status });
  }) as unknown as typeof fetch;
  return { asked, human: turnstile('the-secret', post) };
}

test('a token the check accepts passes, asked with the key and the visitor address', async () => {
  const { asked, human } = check({ success: true });
  assert.equal(await human('a-token', '203.0.113.7'), true);
  assert.deepEqual(asked, [
    { url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify', body: { secret: 'the-secret', response: 'a-token', remoteip: '203.0.113.7' } },
  ]);
});

test('a token the check refuses does not pass', async () => {
  const { human } = check({ success: false, 'error-codes': ['timeout-or-duplicate'] });
  assert.equal(await human('a-used-token', '203.0.113.7'), false);
});

test('no token, an empty one and an overlong one never reach the check', async () => {
  const { asked, human } = check({ success: true });
  assert.equal(await human(undefined, '203.0.113.7'), false);
  assert.equal(await human('', '203.0.113.7'), false);
  assert.equal(await human(7, '203.0.113.7'), false);
  assert.equal(await human('x'.repeat(2049), '203.0.113.7'), false);
  assert.deepEqual(asked, []);
});

test('an address nobody knows is left out', async () => {
  const { asked, human } = check({ success: true });
  await human('a-token', 'unknown');
  assert.deepEqual(asked[0]!.body, { secret: 'the-secret', response: 'a-token' });
});

test('a wrong key of the server is an error, not a failed check', async () => {
  const { human } = check({ success: false, 'error-codes': ['invalid-input-secret'] });
  await assert.rejects(human('a-token', '203.0.113.7'), /refuses this server's key: invalid-input-secret/);
});

test('a check that does not answer is an error', async () => {
  const { human } = check({}, 503);
  await assert.rejects(human('a-token', '203.0.113.7'), /HTTP 503/);
});
