import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { type Book, readBook, writeBook } from './book.js';
import { newDrop, payoutSeed, refundSeed } from './trade.js';

const BOARD = '0b'.repeat(32);

test('a new drop has an id, a key and a blind of its own, and keeps the content', () => {
  const content = randomBytes(150);
  const drops = Array.from({ length: 20 }, () => newDrop(BOARD, content));
  for (const field of ['id', 'key'] as const) assert.equal(new Set(drops.map((drop) => drop[field])).size, 20);
  assert.equal(new Set(drops.map((drop) => drop.blinds[0])).size, 20);
  const [first] = drops;
  assert.ok(first);
  assert.match(first.id, /^[0-9a-f]{64}$/);
  assert.deepEqual([first.board, first.blinds.length], [BOARD, 1]);
  assert.equal(Buffer.from(first.content, 'base64').toString('hex'), content.toString('hex'));
  assert.equal(Buffer.from(newDrop(BOARD, randomBytes(4096)).content, 'base64').length, 4096);
  assert.throws(() => newDrop(BOARD, randomBytes(4097)), /at most 4096 bytes/);
});

test('the payout seed of a drop is a wallet seed from the solver\'s seed, the board and the drop', () => {
  const solver = randomBytes(64).toString('hex');
  const drop = randomBytes(32).toString('hex');
  const seed = payoutSeed(solver, BOARD, drop);
  assert.match(seed, /^[0-9a-f]{128}$/);
  assert.equal(seed, createHmac('sha512', Buffer.from(solver, 'hex')).update(`lightsout:drop-payout:${BOARD}:${drop}`).digest('hex'));
  assert.equal(payoutSeed(solver, BOARD, drop), seed);
  for (const other of [payoutSeed(randomBytes(64).toString('hex'), BOARD, drop), payoutSeed(solver, '0c'.repeat(32), drop), payoutSeed(solver, BOARD, randomBytes(32).toString('hex'))]) {
    assert.notEqual(other, seed);
  }
});

test('the refund seed of a bounty is its own wallet seed, apart from the asker\'s payout seeds', () => {
  const asker = randomBytes(64).toString('hex');
  const bounty = randomBytes(32).toString('hex');
  const seed = refundSeed(asker, BOARD, bounty);
  assert.match(seed, /^[0-9a-f]{128}$/);
  assert.equal(seed, createHmac('sha512', Buffer.from(asker, 'hex')).update(`lightsout:bounty-refund:${BOARD}:${bounty}`).digest('hex'));
  assert.notEqual(seed, payoutSeed(asker, BOARD, bounty));
  assert.notEqual(seed, refundSeed(asker, BOARD, randomBytes(32).toString('hex')));
});

test('the book is empty before its first write and reads back what was written', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'board-book-'));
  try {
    const file = join(dir, 'nested', 'book.json');
    assert.deepEqual(await readBook(file), { drops: [], bounties: [], answers: [] });
    const drop = newDrop(BOARD, randomBytes(10));
    const book: Book = {
      drops: [drop],
      bounties: [{ board: BOARD, bounty: 'aa'.repeat(32), secret: '12345', deadline: '1700000000', request: '{"model":"m"}' }],
      answers: [{ board: BOARD, bounty: 'cc'.repeat(32), drop: drop.id, model: 'm', signature: 'dd'.repeat(64), key: 'ee'.repeat(32), paid: false }],
    };
    await writeBook(file, book);
    assert.deepEqual(await readBook(file), book);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
