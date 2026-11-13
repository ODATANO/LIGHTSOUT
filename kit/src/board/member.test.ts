import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { CompactTypeBytes, createWitnessContext, type MerkleTreePath, persistentHash } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from 'lightsout-board';
import { fieldBytes, tag } from './field.js';
import { epochOf, freeSlot, markOf, memberCommitment, memberWitnesses, SLOTS } from './member.js';
import { boardWitnesses } from './witnesses.js';

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');
const ADDRESS = '0b'.repeat(32);

// A board state of which the witnesses read the marks only: those of one day.
function boardWith(marks: Uint8Array[], day = 20000n): Ledger {
  const held = new Set(marks.map(hex));
  const ofDay = { isEmpty: () => held.size === 0, size: () => BigInt(held.size), member: (mark: Uint8Array) => held.has(hex(mark)), [Symbol.iterator]: () => marks[Symbol.iterator]() };
  const days = { isEmpty: () => false, size: () => 1n, member: (epoch: bigint) => epoch === day, lookup: () => ofDay, [Symbol.iterator]: () => [[day, ofDay] as [bigint, typeof ofDay]][Symbol.iterator]() };
  return { marks: days } as Pick<Ledger, 'marks'> as Ledger;
}

test('the day is the block time in seconds divided by 86400', () => {
  assert.equal(epochOf(0), 0n);
  assert.equal(epochOf(86399), 0n);
  assert.equal(epochOf(86400), 1n);
  assert.equal(epochOf(20000 * 86400 + 43200), 20000n);
});

test('the commitment and the mark are the hashes the board computes', () => {
  const secret = randomBytes(32);
  assert.equal(hex(memberCommitment(secret)), hex(persistentHash(new CompactTypeBytes(64), Buffer.concat([tag('lightsout:member'), secret]))));
  const mark = markOf(secret, 20000n, 5n);
  const hashed = Buffer.concat([tag('lightsout:mark'), secret, fieldBytes(20000n), fieldBytes(5n)]);
  assert.equal(hashed.length, 128);
  assert.equal(hex(mark), hex(persistentHash(new CompactTypeBytes(128), hashed)));
  assert.equal(hex(fieldBytes(20000n)), `204e${'00'.repeat(30)}`);
  for (const other of [markOf(secret, 20001n, 5n), markOf(secret, 20000n, 6n), markOf(randomBytes(32), 20000n, 5n)]) assert.notEqual(hex(other), hex(mark));
});

test('the free slot is the first of the day whose mark the board does not hold', () => {
  const secret = randomBytes(32);
  const marks = (slots: bigint[]) => boardWith(slots.map((slot) => markOf(secret, 20000n, slot))).marks;
  assert.equal(freeSlot(secret, 20000n, marks([])), 0n);
  assert.equal(freeSlot(secret, 20000n, marks([0n, 1n, 2n])), 3n);
  assert.equal(freeSlot(secret, 20000n, marks([0n, 2n, 3n])), 1n);
  // Marks of another day or another member take no slot.
  assert.equal(freeSlot(secret, 20001n, marks([0n, 1n])), 0n);
  assert.equal(freeSlot(randomBytes(32), 20000n, marks([0n, 1n])), 0n);
  const all = Array.from({ length: SLOTS }, (_, slot) => BigInt(slot));
  assert.equal(freeSlot(secret, 20000n, marks(all.slice(0, 31))), 31n);
  assert.throws(() => freeSlot(secret, 20000n, marks(all)), /used its 32 calls of the day/);
});

test('the member witnesses answer with the secret, the path of its commitment and the free slot', () => {
  const secret = randomBytes(32);
  const leaf = memberCommitment(secret);
  const path: MerkleTreePath<Uint8Array> = { leaf, path: [{ sibling: { field: 7n }, goes_left: true }] };
  const asked: Uint8Array[] = [];
  const members = {
    findPathForLeaf: (wanted: Uint8Array) => {
      asked.push(wanted);
      return hex(wanted) === hex(leaf) ? path : undefined;
    },
  };
  const witnesses = memberWitnesses<undefined>(() => ({ secret, members, epoch: 20000n }));
  const context = createWitnessContext(boardWith([markOf(secret, 20000n, 0n), markOf(secret, 20000n, 1n)]), undefined, ADDRESS);
  assert.deepEqual(witnesses.memberSecret(context), [undefined, secret]);
  assert.deepEqual(witnesses.memberPath(context, leaf), [undefined, path]);
  assert.equal(hex(asked[0]!), hex(leaf));
  assert.deepEqual(witnesses.memberSlot(context), [undefined, 2n]);
  assert.throws(() => witnesses.memberPath(context, randomBytes(32)), /no member with this commitment/);
});

test('a witness without its value throws, and the bit split has 35 bits', () => {
  const witnesses = boardWitnesses<undefined>(() => ({ key: 5n }));
  const context = createWitnessContext(boardWith([]), undefined, ADDRESS);
  assert.deepEqual(witnesses.contentKey(context), [undefined, 5n]);
  assert.throws(() => witnesses.contentBlock(context), /no content block/);
  assert.throws(() => witnesses.memberSecret(context), /no member proof/);
  assert.throws(() => witnesses.handoverNonce(context), /no handover nonce/);
  const [, bits] = witnesses.bitsOf(context, (1n << 34n) + 5n);
  assert.equal(bits.length, 35);
  assert.equal(bits.map((bit) => (bit ? '1' : '0')).join(''), `1${'0'.repeat(31)}101`);
});
