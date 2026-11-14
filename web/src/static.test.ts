import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Hono } from 'hono';
import { pageFiles } from './static.js';

const app = new Hono();
app.get('/api/thing', (c) => c.json({ ok: true }));
app.use('/*', ...pageFiles('./public'));

test('a page file tells the browser to ask again on every load', async () => {
  const sent = await app.request('/app.js');
  assert.equal(sent.status, 200);
  assert.equal(sent.headers.get('cache-control'), 'no-cache');
  assert.ok(sent.headers.get('etag'));
  assert.ok((await sent.arrayBuffer()).byteLength > 0);
});

test('an unchanged file is answered without its body', async () => {
  const first = await app.request('/style.css');
  const again = await app.request('/style.css', { headers: { 'if-none-match': first.headers.get('etag') ?? '' } });
  assert.equal(again.status, 304);
  assert.equal((await again.arrayBuffer()).byteLength, 0);
});

test('a changed file is sent whole', async () => {
  const sent = await app.request('/app.js', { headers: { 'if-none-match': '"an-older-one"' } });
  assert.equal(sent.status, 200);
});

test('a route before the files keeps its own headers', async () => {
  const sent = await app.request('/api/thing');
  assert.equal(sent.headers.get('cache-control'), null);
  assert.equal(sent.headers.get('etag'), null);
});
