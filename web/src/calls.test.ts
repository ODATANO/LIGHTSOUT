import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { deriveIdentity } from '@odatano/nightgate-tx/txbuilder';
import { network } from 'lightsout-kit/bridge';
import { checked, Refused } from './calls.js';

const LEAST = 10_000n;
const refuses = (run: () => unknown, says: RegExp) => assert.throws(run, (e: unknown) => e instanceof Refused && says.test(e.message));

test('a read gets no arguments, whatever was posted', () => {
  for (const tool of ['whoami', 'balance', 'refund', 'collect', 'bounties'] as const) {
    assert.deepEqual(checked(tool, { anything: 1, amount: '5' }, LEAST), { args: {}, spends: 0n });
  }
});

test('a send names a shielded address of this network and an amount in wNEAR', async () => {
  const to = (await deriveIdentity({ seedHex: randomBytes(64).toString('hex'), networkId: network })).addresses.shielded;
  assert.deepEqual(checked('send', { to, amount: '0,05', extra: true }, LEAST), { args: { to, amount: '0.05' }, spends: 50_000n });
  refuses(() => checked('send', { to: 'mn_shield-addr_nowhere1qqq', amount: '0.05' }, LEAST), /no shielded address/);
  refuses(() => checked('send', { amount: '0.05' }, LEAST), /address is missing/);
  for (const amount of ['50000.1234567', '0', 'abc', '-1', 5]) refuses(() => checked('send', { to, amount }, LEAST), /amount/i);
});

test('a deposit takes one of the amounts the bridge locks', () => {
  const locks = [100_000n, 500_000n, 1_000_000n];
  assert.deepEqual(checked('deposit', { amount: '0,5', to: 'elsewhere' }, LEAST, locks), { args: { amount: '0.5' }, spends: 0n });
  assert.deepEqual(checked('deposit', { amount: '1.0' }, LEAST, locks), { args: { amount: '1' }, spends: 0n });
  refuses(() => checked('deposit', { amount: '0.2' }, LEAST, locks), /locks 0\.1, 0\.5, 1 NEAR/);
  refuses(() => checked('deposit', { amount: '0.1' }, LEAST), /not read the bridge yet/);
  assert.deepEqual(checked('register', { amount: '5' }, LEAST, locks), { args: {}, spends: 0n });
  assert.deepEqual(checked('register', { deposit: '0.5' }, LEAST, locks), { args: { deposit: '0.5' }, spends: 0n });
  assert.deepEqual(checked('register', { deposit: '' }, LEAST, locks), { args: {}, spends: 0n });
  refuses(() => checked('register', { deposit: '0.3' }, LEAST, locks), /locks 0\.1, 0\.5, 1 NEAR/);
});

test('a withdrawal goes to the own account or to a NEAR account id', () => {
  assert.deepEqual(checked('withdraw', { amount: '0.1' }, LEAST), { args: { amount: '0.1' }, spends: 100_000n });
  assert.deepEqual(checked('withdraw', { amount: '0.1', to: '' }, LEAST), { args: { amount: '0.1' }, spends: 100_000n });
  assert.deepEqual(checked('withdraw', { amount: '0.25', to: ' someone.testnet ' }, LEAST), { args: { amount: '0.25', to: 'someone.testnet' }, spends: 250_000n });
  refuses(() => checked('withdraw', { amount: '0.1', to: 'Not An Account' }, LEAST), /no NEAR account id/);
  refuses(() => checked('withdraw', { amount: '0.099999' }, LEAST), /0\.1 wNEAR or more/);
  const burn = '1d'.repeat(32);
  assert.deepEqual(checked('withdrawal', { burn }, LEAST), { args: { burn }, spends: 0n });
  refuses(() => checked('withdrawal', { burn: '3; drop' }, LEAST), /id of 64 hex digits/);
});

test('a question takes the form\'s choices and nothing else', () => {
  const asked = checked('ask', { prompt: ' Why is the sky blue? ', reward: '0.02', deadline_minutes: 1 }, LEAST);
  assert.deepEqual(asked, { args: { prompt: 'Why is the sky blue?', model: 'Qwen/Qwen3.8-27B', max_tokens: 64, reward: '0.02', deadline_minutes: 30 }, spends: 20_000n });
  refuses(() => checked('ask', { prompt: 'x', reward: '0.02', max_tokens: 512 }, LEAST), /answer lengths/);
  refuses(() => checked('ask', { prompt: 'x', reward: '0.02', model: 'some/other-model' }, LEAST), /models/);
  refuses(() => checked('ask', { prompt: 'x', reward: '0.005' }, LEAST), /0\.01 wNEAR or more/);
  refuses(() => checked('ask', { reward: '0.02' }, LEAST), /question is missing/);
});

test('a question that the board cannot hold is refused before anything runs', () => {
  refuses(() => checked('ask', { prompt: 'a'.repeat(301), reward: '0.02' }, LEAST), /300 characters/);
  // 300 characters of three bytes each pass the character limit and not the board's 512 bytes.
  refuses(() => checked('ask', { prompt: '€'.repeat(300), reward: '0.02' }, LEAST), /bytes too long/);
});
