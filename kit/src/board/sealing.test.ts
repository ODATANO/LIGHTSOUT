import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { addField, CompactTypeField, CompactTypeVector, persistentHash, transientCommit, transientHash } from '@midnight-ntwrk/compact-runtime';
import { randomField } from './field.js';
import { blocksOf, chainOf, compress, decrypt, fullBlocks, INITIAL, keyHash, sealContent, stateAfter } from './sealing.js';

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');
const digest = (state: readonly bigint[]) => state.map((word) => word.toString(16).padStart(8, '0')).join('');
const fields2 = new CompactTypeVector(2, CompactTypeField);

// A block's ciphertext as the board's encrypt circuit computes it.
function encrypt(block: Buffer, key: bigint, index: number): bigint[] {
  const words = Array.from({ length: 16 }, (_, i) => BigInt(block.readUInt32BE(4 * i)));
  const packed = (part: bigint[]) => part.reduce((acc, w) => acc * 4294967296n + w, 0n);
  return [words.slice(0, 7), words.slice(7, 14), words.slice(14)].map((part, j) => addField(packed(part), transientHash(fields2, [key, BigInt(3 * index + j)])));
}

test('compressing the padded blocks of a content reaches its SHA-256 hash', () => {
  for (const length of [0, 1, 55, 56, 63, 64, 119, 120, 150, 4096]) {
    const content = randomBytes(length);
    const blocks = blocksOf(content);
    assert.equal(digest(stateAfter(blocks, blocks.length)), createHash('sha256').update(content).digest('hex'), `length ${length}`);
  }
  assert.equal(digest(stateAfter([], 0)), digest(INITIAL));
  assert.throws(() => compress(INITIAL, randomBytes(63)), /64-byte block/);
});

test('a content is padded to whole blocks, one or two of them after the full ones', () => {
  for (const [length, blocks, full] of [[0, 1, 0], [55, 1, 0], [56, 2, 0], [64, 2, 1], [119, 2, 1], [120, 3, 1], [150, 3, 2], [4096, 65, 64]] as const) {
    const padded = blocksOf(randomBytes(length));
    assert.equal(padded.length, blocks, `length ${length}`);
    assert.ok(padded.every((block) => block.length === 64));
    assert.equal(fullBlocks(length), full);
    assert.ok(blocks - full === 1 || blocks - full === 2);
  }
  const content = randomBytes(150);
  const data = Buffer.concat(blocksOf(content));
  assert.equal(hex(data.subarray(0, 150)), hex(content));
  assert.equal(data[150], 0x80);
  assert.equal(data.readBigUInt64BE(184), 1200n);
});

test('every sealing draws a fresh random key, and the key hash is the board\'s', () => {
  const content = randomBytes(100);
  const drops = Array.from({ length: 50 }, () => sealContent(content));
  assert.equal(new Set(drops.map((drop) => drop.key)).size, 50);
  const [first] = drops;
  assert.ok(first);
  assert.equal(hex(first.keyHash), hex(persistentHash(CompactTypeField, first.key)));
  assert.equal(hex(keyHash(first.key)), hex(first.keyHash));
  assert.equal(hex(first.hash), createHash('sha256').update(content).digest('hex'));
  assert.equal(first.blocks.length, 2);
  assert.equal(sealContent(randomBytes(4096)).blocks.length, 65);
});

test('the chain commitment is the board\'s: to the two halves of the state and the key, under the blind', () => {
  const [key, blind] = [randomField(), randomField()];
  const state = stateAfter(blocksOf(randomBytes(70)), 1);
  const halves = [state.slice(0, 4), state.slice(4)].map((part) => part.reduce((acc, w) => acc * 4294967296n + w, 0n));
  assert.equal(chainOf(state, key, blind), transientCommit(new CompactTypeVector(3, CompactTypeField), [halves[0]!, halves[1]!, key], blind));
  assert.notEqual(chainOf(state, key, blind), chainOf(state, key, addField(blind, 1n)));
  assert.notEqual(chainOf(state, key, blind), chainOf(state, addField(key, 1n), blind));
  assert.notEqual(chainOf(state, key, blind), chainOf(INITIAL, key, blind));
});

test('the key decrypts what the board\'s encryption stores, and another key does not', () => {
  for (const length of [0, 1, 56, 150, 4096]) {
    const content = randomBytes(length);
    const { key, blocks } = sealContent(content);
    const cipher = blocks.map((block, i) => encrypt(block, key, i));
    assert.equal(hex(decrypt(cipher, key, length)), hex(content));
    if (length > 0) assert.notEqual(hex(decrypt(cipher, addField(key, 1n), length)), hex(content));
  }
});
