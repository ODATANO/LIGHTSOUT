import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { OwnAgents, type Redeemed } from './own.js';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const C = 'c'.repeat(64);
const fileIn = async (): Promise<string> => join(await mkdtemp(join(tmpdir(), 'own-')), 'own.json');
const gives = (dead: string[] = []) => {
  const asked: string[] = [];
  const redeem = async (code: string): Promise<Redeemed> => {
    asked.push(code);
    return dead.includes(code) ? 'spent' : { key: `key-of-${code}`, validUntil: '2026-11-21T00:00:00.000Z' };
  };
  return { asked, redeem };
};
const keyFor = async (own: OwnAgents, account: string): Promise<string> => {
  await own.paid(account);
  return (await own.key(account)).key;
};

test('each code gives one key, in order, and a restart does not give it again', async () => {
  const file = await fileIn();
  const { redeem } = gives();
  const own = new OwnAgents(['aaaaaa', 'bbbbbb'], 5, redeem, file);
  await own.load();
  assert.equal(await keyFor(own, A), 'key-of-aaaaaa');
  const again = new OwnAgents(['aaaaaa', 'bbbbbb'], 5, redeem, file);
  await again.load();
  assert.equal(again.has(A), true);
  await assert.rejects(again.key(A), /has its fee key already/);
  assert.equal(await keyFor(again, B), 'key-of-bbbbbb');
  assert.equal(again.open, false);
  assert.doesNotMatch(await readFile(file, 'utf8'), /key-of/);
});

test('only an account the faucet paid gets a key', async () => {
  const { asked, redeem } = gives();
  const own = new OwnAgents(['aaaaaa'], 5, redeem, await fileIn());
  await assert.rejects(own.key(A), /was not paid/);
  assert.deepEqual(asked, []);
});

test('a code that is used up is skipped', async () => {
  const { asked, redeem } = gives(['aaaaaa']);
  const own = new OwnAgents(['aaaaaa', 'bbbbbb'], 5, redeem, await fileIn());
  assert.equal(await keyFor(own, A), 'key-of-bbbbbb');
  assert.deepEqual(asked, ['aaaaaa', 'bbbbbb']);
});

test('a paid account counts for the day, and two that ask at once get two codes', async () => {
  const { asked, redeem } = gives();
  const own = new OwnAgents(['aaaaaa', 'bbbbbb', 'cccccc'], 2, redeem, await fileIn());
  await own.paid(A);
  await own.paid(A);
  assert.equal(own.open, true);
  await own.paid(B);
  assert.equal(own.open, false);
  assert.deepEqual((await Promise.all([own.key(A), own.key(B)])).map((got) => got.key), ['key-of-aaaaaa', 'key-of-bbbbbb']);
  assert.deepEqual(asked, ['aaaaaa', 'bbbbbb']);
  assert.equal(own.waits(C), false);
});

test('an account whose key did not come waits for it, and the code stays for the next try', async () => {
  let down = true;
  const redeem = async (code: string): Promise<Redeemed> => {
    if (down) throw new Error('the gateway does not answer');
    return { key: `key-of-${code}` };
  };
  const own = new OwnAgents(['aaaaaa'], 1, redeem, await fileIn());
  await own.paid(A);
  await assert.rejects(own.key(A), /does not answer/);
  assert.equal(own.waits(A), true);
  assert.equal(own.open, false);
  down = false;
  assert.equal((await own.key(A)).key, 'key-of-aaaaaa');
  assert.equal(own.waits(A), false);
});
