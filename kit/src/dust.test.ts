import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DustAddress } from '@midnightntwrk/wallet-sdk-address-format';
import { outputSeed, parseDustAddress, stars } from './dust.js';
import { dustAddress } from './membership.js';

test('a NIGHT amount is read in stars', () => {
  assert.equal(stars('100'), 100_000_000n);
  assert.equal(stars('2.5'), 2_500_000n);
  assert.equal(stars('0.000001'), 1n);
  for (const bad of ['', '0', '-1', '1.0000001', '1e3', 'ten']) assert.throws(() => stars(bad), /NIGHT amount/);
});

test('each registration of each bridge gets a wallet seed of its own', () => {
  const sponsor = 'a1'.repeat(64);
  const seed = outputSeed(sponsor, 'bridge.testnet', 3n);
  assert.match(seed, /^[0-9a-f]{64}$/);
  assert.equal(outputSeed(sponsor, 'bridge.testnet', 3n), seed);
  const others = [outputSeed(sponsor, 'bridge.testnet', 4n), outputSeed(sponsor, 'bridge2.testnet', 3n), outputSeed('a2'.repeat(64), 'bridge.testnet', 3n), outputSeed(sponsor, 'bridge.testnet:3', 0n)];
  assert.equal(new Set([seed, ...others]).size, 5);
});

test('a dust address is read for its own network only', () => {
  const seedHex = 'c3'.repeat(64);
  const address = parseDustAddress(dustAddress(seedHex, 'preprod'), 'preprod');
  assert.equal(DustAddress.encodePublicKey('preprod', address.data), dustAddress(seedHex, 'preprod'));
  assert.throws(() => parseDustAddress(dustAddress(seedHex, 'preprod'), 'stagenet'));
  assert.throws(() => parseDustAddress('mn_addr_preprod1qqqq', 'preprod'));
});
