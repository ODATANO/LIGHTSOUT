import { bech32m } from '@scure/base';
import { MidnightBech32m, ShieldedAddress } from '@midnightntwrk/wallet-sdk-address-format';
import { nearToYocto, yoctoToNear } from 'near-api-js';

/** NEAR locks whole micro-NEAR, the unit the Midnight token counts in. */
export const YOCTO_PER_UNIT = 10n ** 18n;
export const NEAR_RECIPIENT_BYTES = 64;
/** The smallest burn the Midnight bridge takes, in micro-NEAR: 0.1 wNEAR. */
export const LEAST_BURN = 100_000n;

/** Micro-NEAR as the NEAR or wNEAR amount a person reads, such as 0.01. */
export const nearOf = (units: bigint): string => yoctoToNear(units * YOCTO_PER_UNIT);

/** The micro-NEAR of a NEAR or wNEAR amount as a person types it, such as 0.01. */
export function unitsOf(near: string): bigint {
  const amount = near.trim();
  if (!/^[0-9]+(\.[0-9]{1,6})?$/.test(amount)) throw new Error(`not an amount with at most six decimals: ${near}`);
  return nearToYocto(amount as `${number}`) / YOCTO_PER_UNIT;
}

export interface ShieldedKeys {
  coinPublicKey: string;
  encryptionPublicKey: string;
}

/** The keys behind a `mn_shield-addr_<network>1...` address. It is longer than the 90 characters bech32 usually allows. */
export function parseShieldedAddress(text: string, networkId: string): ShieldedKeys {
  const wrong = new Error(`not a shielded Midnight address: ${text}`);
  let decoded: ReturnType<typeof bech32m.decode>;
  try {
    decoded = bech32m.decode(text.trim() as `${string}1${string}`, false);
  } catch {
    throw wrong;
  }
  const [prefix, type, network = 'mainnet'] = decoded.prefix.split('_');
  if (prefix !== 'mn' || type !== 'shield-addr') throw wrong;
  if (network !== networkId) throw new Error(`address is for ${network}, not ${networkId}`);
  const repr = new MidnightBech32m(type, network, Buffer.from(bech32m.fromWords(decoded.words)));
  const address = ShieldedAddress.codec.decode(networkId, repr);
  return { coinPublicKey: address.coinPublicKeyString(), encryptionPublicKey: address.encryptionPublicKeyString() };
}

/** The `n` bits of a number, most significant first, as the contracts' bit witnesses return them. */
export function bitsOf(x: bigint, n: number): boolean[] {
  return Array.from({ length: n }, (_, i) => ((x >> BigInt(n - 1 - i)) & 1n) === 1n);
}

// NEAR's rule: 2 to 64 characters, lowercase letters and digits in parts that one of . - _ separates.
const NEAR_ACCOUNT = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

/** Whether NEAR takes this text as an account id. The bridge cannot pay a burn to any other name. */
export const isNearAccount = (id: string): boolean => id.length >= 2 && id.length <= NEAR_RECIPIENT_BYTES && NEAR_ACCOUNT.test(id);

/** A NEAR account id as the burn records it: UTF-8, zero-padded to 64 bytes. */
export function encodeNearRecipient(accountId: string): Uint8Array {
  if (!isNearAccount(accountId)) throw new Error(`not a NEAR account id: ${accountId}`);
  const bytes = Buffer.from(accountId, 'utf8');
  const out = new Uint8Array(NEAR_RECIPIENT_BYTES);
  out.set(bytes);
  return out;
}

export function decodeNearRecipient(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  return Buffer.from(end === -1 ? bytes : bytes.subarray(0, end)).toString('utf8');
}

/** The lock id in the bridge's lock event among a call's logs. */
export function lockIdIn(logs: string[]): string {
  for (const log of logs) {
    if (!log.startsWith('EVENT_JSON:')) continue;
    const event = JSON.parse(log.slice('EVENT_JSON:'.length)) as { event?: string; data?: { lock_id?: string } };
    const id = event.event === 'lock' ? event.data?.lock_id : undefined;
    if (id !== undefined) return id;
  }
  throw new Error('the call logged no lock event');
}
