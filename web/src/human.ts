/** Whether the token a visitor's browser got from the bot check passes, asked from `address`. */
export type Human = (token: unknown, address: string) => Promise<boolean>;

/** Where the check's script and its frame come from, for the page's content security policy. */
export const CHECK_ORIGIN = 'https://challenges.cloudflare.com';
const VERIFY = `${CHECK_ORIGIN}/turnstile/v0/siteverify`;
// The longest token the check hands out.
const TOKEN_CHARS = 2048;
const TIMEOUT_MS = 10_000;
// What the check answers when the key of this server is the wrong one.
const KEY_REFUSED = ['missing-input-secret', 'invalid-input-secret'];

/**
 * The bot check of Cloudflare Turnstile for the widget `secret` belongs to. A token passes
 * once, within five minutes of the visitor's check. Throws when the check cannot be asked.
 */
export function turnstile(secret: string, post: typeof fetch = fetch): Human {
  return async (token, address) => {
    if (typeof token !== 'string' || token === '' || token.length > TOKEN_CHARS) return false;
    const res = await post(VERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, ...(address === 'unknown' ? {} : { remoteip: address }) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`the bot check answered HTTP ${res.status}`);
    const body = (await res.json()) as { success?: unknown; 'error-codes'?: unknown };
    const codes = Array.isArray(body['error-codes']) ? body['error-codes'].map(String) : [];
    if (codes.some((code) => KEY_REFUSED.includes(code))) throw new Error(`the bot check refuses this server's key: ${codes.join(', ')}`);
    return body.success === true;
  };
}
