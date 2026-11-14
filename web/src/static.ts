import { serveStatic } from '@hono/node-server/serve-static';
import type { MiddlewareHandler } from 'hono';
import { etag } from 'hono/etag';

/**
 * The page's files under `root`. A browser asks again on every load and gets a short answer
 * while a file is unchanged, so one deployment's script never runs under the next one's page.
 */
export const pageFiles = (root: string): MiddlewareHandler[] => [
  etag(),
  async (c, next) => {
    await next();
    c.header('cache-control', 'no-cache');
  },
  serveStatic({ root }),
];
