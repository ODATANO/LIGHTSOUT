import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { CompactTypeBytes, ecMulGenerator, JUBJUB_SCALAR_MODULUS, jubjubPointX, jubjubPointY, persistentHash } from '@midnight-ntwrk/compact-runtime';
import { LedgerParameters } from '@midnightntwrk/ledger-v9';
import { InMemoryTransactionHistoryStorage } from '@midnightntwrk/wallet-sdk-abstractions';
import { DustAddress } from '@midnightntwrk/wallet-sdk-address-format';
import { DustWallet } from '@midnightntwrk/wallet-sdk-dust-wallet';
import { WalletEntrySchema, WalletFacade, mergeWalletEntries } from '@midnightntwrk/wallet-sdk-facade';
import { HDWallet, Roles } from '@midnightntwrk/wallet-sdk-hd';
import { commitmentOf, dustAddress, memberSecret, messageKey, messageSecret } from './membership.js';

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

test('the member secret is 32 bytes of SHA-256 over a tag and the seed', () => {
  const seedHex = 'c3'.repeat(64);
  const secret = memberSecret(seedHex);
  assert.equal(hex(secret), '1c56a454908b25411a66e1dc927d1538264147a52d041943a50289ae127cba26');
  assert.equal(hex(secret), createHash('sha256').update('lightsout:member-secret').update(Buffer.from(seedHex, 'hex')).digest('hex'));
  assert.notEqual(hex(memberSecret('c4'.repeat(64))), hex(secret));
  assert.throws(() => memberSecret('not hex'), /not a wallet seed/);
});

test('the commitment is SHA-256 over the padded tag and the secret, as the board computes it', () => {
  const secret = Buffer.from('1c56a454908b25411a66e1dc927d1538264147a52d041943a50289ae127cba26', 'hex');
  // "lightsout:member" in ASCII, then 16 zero bytes, then the secret.
  const hashed = Buffer.from(`6c696768 74736f75 743a6d65 6d626572 00000000 00000000 00000000 00000000 ${hex(secret)}`.replaceAll(' ', ''), 'hex');
  assert.equal(hashed.length, 64);
  assert.equal(hex(commitmentOf(secret)), '2cab18efdac9bcb5d2062dcf6c4049daa40cfb8559d1e09df58fc5dd6f40db24');
  assert.equal(hex(commitmentOf(secret)), createHash('sha256').update(hashed).digest('hex'));
  // The board hashes the same 64 bytes with Compact's persistentHash.
  const random = randomBytes(32);
  const tag = Buffer.alloc(32);
  tag.write('lightsout:member');
  assert.equal(hex(commitmentOf(random)), hex(persistentHash(new CompactTypeBytes(64), Buffer.concat([tag, random]))));
  assert.throws(() => commitmentOf(randomBytes(31)), /32 bytes/);
});

test('the dust address of a seed is the one its wallet reports', async () => {
  // Addresses a synced wallet of these seeds reported on a chain with the network id `undeployed`.
  assert.equal(dustAddress('c3'.repeat(64), 'undeployed'), 'mn_dust_undeployed1wv3wfnkwz3pzw4lzzz35fz3sgmwnvwxzrvt9x6xux9ntg6g9trqs7s8hqnf');
  assert.equal(dustAddress(`${'00'.repeat(31)}01`, 'undeployed'), 'mn_dust_undeployed1w0l54txthpu8q05j9j9ttk3j5dyu5766dc9zkz2s435vdglzwdr35dw790y');

  // The dust part of a wallet facade names its address before it reaches any network.
  const seedHex = randomBytes(64).toString('hex');
  const hd = HDWallet.fromSeed(Buffer.from(seedHex, 'hex'));
  assert.equal(hd.type, 'seedOk');
  if (hd.type !== 'seedOk') return;
  const derived = hd.hdWallet.selectAccount(0).selectRole(Roles.Dust).deriveKeyAt(0);
  assert.equal(derived.type, 'keyDerived');
  if (derived.type !== 'keyDerived') return;
  const configuration = WalletFacade.resolveConfiguration({
    networkId: 'preprod',
    relayURL: new URL('ws://127.0.0.1:1'),
    provers: { v9: { kind: 'server', url: new URL('http://127.0.0.1:1') } },
    indexerClientConnection: { indexerHttpUrl: 'http://127.0.0.1:1/api/v4/graphql', indexerWsUrl: 'ws://127.0.0.1:1/api/v4/graphql/ws' },
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema, mergeWalletEntries),
    costParameters: { additionalFeeOverhead: 1n, feeBlocksMargin: 5 },
  });
  const wallet = await DustWallet(configuration).startWithSeed(derived.key, LedgerParameters.initialParameters().dust);
  try {
    assert.equal(dustAddress(seedHex, 'preprod'), DustAddress.encodePublicKey('preprod', (await wallet.getAddress()).data));
  } finally {
    await wallet.stop();
  }
});

test('the message secret is a Jubjub scalar from the seed, apart from the member secret', () => {
  const seedHex = 'c3'.repeat(64);
  const secret = messageSecret(seedHex);
  const hash = createHash('sha256').update('lightsout:message-key').update(Buffer.from(seedHex, 'hex')).digest('hex');
  assert.equal(secret, BigInt(`0x${hash}`) % JUBJUB_SCALAR_MODULUS);
  assert.ok(secret > 0n && secret < JUBJUB_SCALAR_MODULUS);
  assert.notEqual(secret, BigInt(`0x${hex(memberSecret(seedHex))}`) % JUBJUB_SCALAR_MODULUS);
  assert.notEqual(messageSecret('c4'.repeat(64)), secret);
});

test('the message key is the point of the secret, each coordinate as 32 bytes with the lowest first', () => {
  const secret = messageSecret('c3'.repeat(64));
  const key = messageKey(secret);
  assert.match(key, /^[0-9a-f]{128}$/);
  const point = ecMulGenerator(secret);
  const lowestFirst = (x: bigint) => Buffer.from(x.toString(16).padStart(64, '0'), 'hex').reverse().toString('hex');
  assert.equal(key, lowestFirst(jubjubPointX(point)) + lowestFirst(jubjubPointY(point)));
});
