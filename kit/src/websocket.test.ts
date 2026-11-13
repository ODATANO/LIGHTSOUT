import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { WebSocket } from 'ws';
import './websocket.js';

test('the process connects with the ws package', () => {
  assert.equal(globalThis.WebSocket, WebSocket);
});

test('a refused connection ends with a close, which a client waits for before it connects again', async () => {
  const server = createServer();
  server.on('upgrade', (_, socket) => socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'));
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  try {
    const socket = new globalThis.WebSocket(`ws://127.0.0.1:${(server.address() as AddressInfo).port}`);
    const seen: string[] = [];
    socket.onerror = () => seen.push('error');
    await new Promise<void>((done) => {
      socket.onclose = () => {
        seen.push('close');
        done();
      };
    });
    assert.deepEqual(seen, ['error', 'close']);
  } finally {
    server.close();
  }
});
