import { createHash } from 'node:crypto';
import { ZswapSecretKeys } from '@midnightntwrk/ledger-v9';
import { HDWallet, Roles } from '@midnightntwrk/wallet-sdk-hd';

const KEY_BYTES = 32;
const PUBLIC_KEY_TAG = 'midnight:zswap-pk[v1]';

/** The coin secret key of a wallet seed. The bridge's mint proves knowledge of it and reveals nothing. */
export function coinSecretKey(seedHex: string): Uint8Array {
  const hd = HDWallet.fromSeed(Buffer.from(seedHex, 'hex'));
  if (hd.type !== 'seedOk') throw new Error('not a wallet seed');
  const derived = hd.hdWallet.selectAccount(0).selectRole(Roles.Zswap).deriveKeyAt(0);
  hd.hdWallet.clear();
  if (derived.type !== 'keyDerived') throw new Error('the seed derives no shielded key');
  // The serialized key is a version tag followed by the 32 key bytes.
  const serialized = ZswapSecretKeys.fromSeed(derived.key).coinSecretKey.yesIKnowTheSecurityImplicationsOfThis_serialize();
  return serialized.subarray(serialized.length - KEY_BYTES);
}

/** The coin public key Midnight derives from a coin secret key, hex. */
export function coinPublicKeyOf(secret: Uint8Array): string {
  return createHash('sha256').update(PUBLIC_KEY_TAG).update(secret).digest('hex');
}
