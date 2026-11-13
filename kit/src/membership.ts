import { createHash } from 'node:crypto';
import { ecMulGenerator, JUBJUB_SCALAR_MODULUS, jubjubPointX, jubjubPointY } from '@midnight-ntwrk/compact-runtime';
import { DustSecretKey } from '@midnightntwrk/ledger-v9';
import { DustAddress } from '@midnightntwrk/wallet-sdk-address-format';
import { HDWallet, Roles } from '@midnightntwrk/wallet-sdk-hd';

const SECRET_TAG = 'lightsout:member-secret';
const COMMITMENT_TAG = 'lightsout:member';
const MESSAGE_TAG = 'lightsout:message-key';
const COORDINATE_HEX = 64;

function seedBytes(seedHex: string): Buffer {
  if (!/^(?:[0-9a-f]{2})+$/i.test(seedHex)) throw new Error('not a wallet seed');
  return Buffer.from(seedHex, 'hex');
}

/** The member secret of a wallet seed, 32 bytes. The board's member proof shows knowledge of it and reveals nothing. */
export function memberSecret(seedHex: string): Uint8Array {
  return createHash('sha256').update(SECRET_TAG).update(seedBytes(seedHex)).digest();
}

/** The commitment a member registers on NEAR: SHA-256 over the tag, zero-padded to 32 bytes, and the secret. */
export function commitmentOf(secret: Uint8Array): Uint8Array {
  if (secret.length !== 32) throw new Error('a member secret has 32 bytes');
  const tag = Buffer.alloc(32);
  tag.write(COMMITMENT_TAG, 'ascii');
  return createHash('sha256').update(tag).update(secret).digest();
}

/** The address a wallet seed collects dust at on a network. */
export function dustAddress(seedHex: string, networkId: string): string {
  const hd = HDWallet.fromSeed(seedBytes(seedHex));
  if (hd.type !== 'seedOk') throw new Error('not a wallet seed');
  const derived = hd.hdWallet.selectAccount(0).selectRole(Roles.Dust).deriveKeyAt(0);
  hd.hdWallet.clear();
  if (derived.type !== 'keyDerived') throw new Error('the seed derives no dust key');
  return DustAddress.encodePublicKey(networkId, DustSecretKey.fromSeed(derived.key).publicKey);
}

/** The secret scalar of a wallet seed behind the message key it registers. */
export function messageSecret(seedHex: string): bigint {
  const hash = createHash('sha256').update(MESSAGE_TAG).update(seedBytes(seedHex)).digest('hex');
  const secret = BigInt(`0x${hash}`) % JUBJUB_SCALAR_MODULUS;
  if (secret === 0n) throw new Error('the seed gives no message key');
  return secret;
}

// A coordinate as the board casts a field element to 32 bytes: least significant byte first.
const coordinateHex = (x: bigint): string => Buffer.from(x.toString(16).padStart(COORDINATE_HEX, '0'), 'hex').reverse().toString('hex');

/** The message key a member registers on NEAR: the point of a message secret, x then y, 128 hex. */
export function messageKey(secret: bigint): string {
  const point = ecMulGenerator(secret);
  return coordinateHex(jubjubPointX(point)) + coordinateHex(jubjubPointY(point));
}
