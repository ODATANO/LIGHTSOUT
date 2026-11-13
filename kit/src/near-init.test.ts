import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authorityKeys, governanceKeys } from './near-init.js';

const entry = (byte: string, weight: string) => byte.repeat(32) + weight;

test('authorityKeys reads the keys, in a fixed order', () => {
  // 8 is the compact form of 2 entries.
  const value = `0x08${entry('bb', '0100000000000000')}${entry('aa', '0200000000000000')}`;
  assert.deepEqual(authorityKeys(value), ['aa'.repeat(32), 'bb'.repeat(32)]);
});

test('a key that holds several seats counts once', () => {
  // 12 is the compact form of 3 entries.
  const seats = `0x0c${entry('aa', '0100000000000000')}${entry('bb', '0100000000000000')}${entry('aa', '0100000000000000')}`;
  const keys = `0x08${entry('bb', '0100000000000000')}${entry('aa', '0100000000000000')}`;
  assert.deepEqual(authorityKeys(seats), authorityKeys(keys));
});

test('authorityKeys refuses a value of another length', () => {
  assert.throws(() => authorityKeys(`0x08${entry('aa', '0100000000000000')}`), /unexpected length/);
});

test('governanceKeys finds the key hashes of native scripts in a datum', () => {
  const a = 'a'.repeat(56);
  const b = 'b'.repeat(56);
  assert.deepEqual(governanceKeys(`d87980838200581c${a}8200581c${b}ff`), [a, b]);
  assert.deepEqual(governanceKeys('d87980ff'), []);
});
