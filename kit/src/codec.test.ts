import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { deriveIdentity } from '@odatano/nightgate-tx/txbuilder';
import { decodeNearRecipient, encodeNearRecipient, lockIdIn, nearOf, parseShieldedAddress, unitsOf } from './codec.js';

test('amounts are typed and shown in NEAR and counted in micro-NEAR', () => {
  assert.equal(unitsOf('0.01'), 10_000n);
  assert.equal(unitsOf(' 1 '), 1_000_000n);
  assert.equal(unitsOf('0.000001'), 1n);
  assert.equal(nearOf(10_000n), '0.01');
  assert.equal(nearOf(7_370_000n), '7.37');
  assert.equal(nearOf(0n), '0');
  for (const wrong of ['', '-1', '1e3', '0.0000001', '.5', 'abc', '1,5']) assert.throws(() => unitsOf(wrong), /not an amount/);
});

test('a shielded address yields the keys it was made from', async () => {
  const id = await deriveIdentity({ seedHex: randomBytes(64).toString('hex'), networkId: 'preprod' });
  assert.deepEqual(parseShieldedAddress(id.addresses.shielded, 'preprod'), id.shieldedKeys);
  assert.throws(() => parseShieldedAddress(id.addresses.shielded, 'mainnet'), /preprod/);
  assert.throws(() => parseShieldedAddress(id.addresses.night, 'preprod'), /not a shielded/);
});

test('NEAR recipients round-trip through 64 bytes', () => {
  const bytes = encodeNearRecipient('alice.lightsout.odatano.testnet');
  assert.equal(bytes.length, 64);
  assert.equal(decodeNearRecipient(bytes), 'alice.lightsout.odatano.testnet');
  assert.equal(decodeNearRecipient(encodeNearRecipient('a'.repeat(64))), 'a'.repeat(64));
  for (const wrong of ['', 'a', 'a'.repeat(65), 'Alice.testnet', 'alice .testnet', 'alice..testnet', '.alice', 'alice.', 'a--b.testnet', 'älice.testnet']) {
    assert.throws(() => encodeNearRecipient(wrong), /not a NEAR account id/);
  }
});

const event = (name: string, data: object) => `EVENT_JSON:${JSON.stringify({ standard: 'lightsout_bridge', version: '1.0.0', event: name, data })}`;

test('the lock id comes from the lock event, wherever it stands in the logs', () => {
  const line = `lightsout:lock:${'0'.repeat(15)}7${'0'.repeat(80)}`;
  assert.equal(lockIdIn([line, event('lock', { lock_id: '7', sender: 'alice.testnet' })]), '7');
  assert.equal(lockIdIn([event('lock', { lock_id: '0' })]), '0');
  assert.equal(lockIdIn([event('minted', { lock_id: '3' }), 'plain text', event('lock', { lock_id: '4' })]), '4');
});

test('logs without a lock event are an error', () => {
  assert.throws(() => lockIdIn([]), /no lock event/);
  assert.throws(() => lockIdIn([event('minted', { lock_id: '3' })]), /no lock event/);
});
