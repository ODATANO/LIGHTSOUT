import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { deriveIdentity } from '@odatano/nightgate-tx/txbuilder';
import { parseShieldedAddress } from './codec.js';
import { coinPublicKeyOf, coinSecretKey } from './keys.js';

test('the coin secret key of a seed hashes to the coin public key in its address', async () => {
  for (let i = 0; i < 3; i++) {
    const seedHex = randomBytes(64).toString('hex');
    const { addresses } = await deriveIdentity({ seedHex, networkId: 'preprod' });
    assert.equal(coinPublicKeyOf(coinSecretKey(seedHex)), parseShieldedAddress(addresses.shielded, 'preprod').coinPublicKey);
  }
});
