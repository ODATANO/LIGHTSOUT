// The address a visitor reached the page under. The preview image in the page's head must be
// named by a full address, and the page does not know its own host name.

const HOST = /^[a-z0-9.-]+(:\d+)?$/i;
const LOCAL = /^(localhost|127\.0\.0\.1)(:|$)/;

/** `https://host` from the request's Host header and the scheme a proxy forwarded. A host that is no host name gives localhost. */
export function originOf(host: string | undefined, forwardedProto?: string): string {
  const name = host && HOST.test(host) ? host.toLowerCase() : 'localhost';
  const scheme = forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : LOCAL.test(name) ? 'http' : 'https';
  return `${scheme}://${name}`;
}

/** The page with every `__ORIGIN__` in it replaced by that address. */
export function withOrigin(page: string, origin: string): string {
  return page.replaceAll('__ORIGIN__', origin);
}
