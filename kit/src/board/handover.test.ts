import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addField, CompactTypeField, CompactTypeVector, ecMul, ecMulGenerator, jubjubPointX, jubjubPointY, transientHash } from '@midnight-ntwrk/compact-runtime';
import { randomField } from './field.js';
import { type Handover, keyPair, openHandover } from './handover.js';

// A handover as the board makes it when a bounty is answered.
function handOver(key: bigint, buyer: ReturnType<typeof keyPair>['point'], nonce: bigint): Handover {
  const shared = ecMul(buyer, nonce);
  const mask = transientHash(new CompactTypeVector(2, CompactTypeField), [jubjubPointX(shared), jubjubPointY(shared)]);
  return { point: ecMulGenerator(nonce), masked: addField(key, mask) };
}

test('key pairs are fresh, and the point is the secret times the generator', () => {
  const pairs = Array.from({ length: 20 }, keyPair);
  assert.equal(new Set(pairs.map((pair) => pair.secret)).size, 20);
  for (const pair of pairs) assert.deepEqual(pair.point, ecMulGenerator(pair.secret));
});

test('the buyer opens the handover made for its point, and nobody else does', () => {
  const [buyer, other] = [keyPair(), keyPair()];
  const key = randomField();
  const handover = handOver(key, buyer.point, randomField());
  assert.equal(openHandover(handover, buyer.secret), key);
  assert.notEqual(openHandover(handover, other.secret), key);
  assert.notEqual(openHandover(handOver(key, other.point, randomField()), buyer.secret), key);
});
