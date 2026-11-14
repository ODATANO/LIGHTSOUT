import assert from 'node:assert/strict';
import { test } from 'node:test';
import { originOf, withOrigin } from './origin.js';

test('the origin is the host the visitor asked, under the scheme the proxy saw', () => {
  assert.equal(originOf('lightsout.example', 'https'), 'https://lightsout.example');
  assert.equal(originOf('LightsOut.Example'), 'https://lightsout.example');
  assert.equal(originOf('127.0.0.1:8787'), 'http://127.0.0.1:8787');
  assert.equal(originOf('localhost:8787', 'https'), 'https://localhost:8787');
});

test('a Host header that is no host name does not reach the page', () => {
  assert.equal(originOf('evil.example"><script>'), 'http://localhost');
  assert.equal(originOf(undefined), 'http://localhost');
  assert.equal(originOf('lightsout.example', 'javascript'), 'https://lightsout.example');
});

test('every place in the page gets the origin', () => {
  assert.equal(withOrigin('<meta content="__ORIGIN__/og.png"><meta content="__ORIGIN__/">', 'https://a.example'), '<meta content="https://a.example/og.png"><meta content="https://a.example/">');
});
