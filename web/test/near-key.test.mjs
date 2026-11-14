import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KeyPair } from 'near-api-js';
import { base58, hex, newNearKey, newSeed } from '../public/near-key.js';

test('a key made in the browser is one NEAR reads, and its account is the public key', async () => {
  const made = await newNearKey();
  assert.match(made.account, /^[0-9a-f]{64}$/);
  const read = KeyPair.fromString(made.privateKey);
  assert.equal(hex(read.getPublicKey().data), made.account);
  assert.equal(read.toString(), made.privateKey);
});

test('base58 keeps leading zero bytes', () => {
  assert.equal(base58([0, 0, 1]), '112');
  assert.equal(base58([0]), '1');
  assert.equal(base58([255]), '5Q');
});

test('a seed is 64 bytes in hex and new each time', () => {
  assert.match(newSeed(), /^[0-9a-f]{128}$/);
  assert.notEqual(newSeed(), newSeed());
});
