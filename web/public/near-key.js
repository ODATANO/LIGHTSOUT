// A NEAR key and a Midnight seed made in the browser, for an agent on the visitor's own machine.

const DIGITS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Bytes in base58, as NEAR writes keys. */
export function base58(bytes) {
  let n = bytes.reduce((sum, b) => sum * 256n + BigInt(b), 0n);
  let out = '';
  for (; n > 0n; n /= 58n) out = DIGITS[Number(n % 58n)] + out;
  const zeros = bytes.findIndex((b) => b !== 0);
  return '1'.repeat(zeros === -1 ? bytes.length : zeros) + out;
}

/** A new NEAR key. Its account is the public key's 64 hex digits, made by the first transfer to it. */
export async function newNearKey() {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  // The last 32 bytes of the PKCS#8 form are the secret.
  const secret = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).slice(-32);
  const open = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  return { account: hex(open), privateKey: `ed25519:${base58([...secret, ...open])}` };
}

/** A new Midnight seed: 64 random bytes in hex. */
export const newSeed = () => hex(crypto.getRandomValues(new Uint8Array(64)));
