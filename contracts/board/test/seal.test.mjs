// Sealing a drop: the public ciphertext is the content with the SHA-256 hash the drop names, under
// the key behind the key hash it names.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { proven } from './helpers.mjs';
import { addField } from '@midnight-ntwrk/compact-runtime';
import { randomField } from '../../../kit/src/board/field.ts';
import { INITIAL, chainOf, decrypt, keyHash } from '../../../kit/src/board/sealing.ts';
import { DAY_SECONDS } from '../../../kit/src/board/member.ts';
import { EPOCH, NOON, dropOf, hex, world } from './helpers.mjs';

// The drop with one of the solver's values changed.
const changed = (drop, change) => ({ ...drop, ...change });
const flipped = (block, at) => {
  const copy = Buffer.from(block);
  copy[at] ^= 1;
  return copy;
};

proven('a content of 150 bytes is sealed in two full blocks and one closing block', async () => {
  const w = await world({ constraints: true });
  const drop = dropOf(randomBytes(150));
  await w.begin(drop);
  assert.equal(w.state.seals.lookup(drop.id).chain, chainOf(INITIAL, drop.key, drop.blind));
  for (const block of drop.blocks.slice(0, 2)) {
    await w.sealBlock(drop, block);
    assert.equal(w.state.seals.lookup(drop.id).done, false);
  }
  assert.deepEqual(w.state.seals.lookup(drop.id), { remaining: 22n, ended: false, blocks: 2n, chain: chainOf(drop.state, drop.key, drop.blind), done: false });
  await w.sealFinish(drop, drop.blocks[2]);
  assert.deepEqual(w.state.seals.lookup(drop.id), { remaining: 0n, ended: true, blocks: 3n, chain: chainOf(drop.state, drop.key, drop.blind), done: true });
  // The solver's last state is the hash the drop names.
  assert.equal(drop.state.map((word) => word.toString(16).padStart(8, '0')).join(''), hex(drop.hash));
  assert.deepEqual(decrypt(w.cipherOf(drop.id), drop.key, 150), drop.content);
  assert.notDeepEqual(decrypt(w.cipherOf(drop.id), addField(drop.key, 1n), 150), drop.content);
});

for (const [length, calls] of [[0, 1], [1, 1], [55, 1], [56, 2], [63, 2], [64, 2], [119, 2], [120, 3], [150, 3], [4096, 65]]) {
  test(`a content of ${length} bytes is sealed in ${calls} ${calls === 1 ? 'call' : 'calls'} and decrypts with the key`, async () => {
    const w = await world();
    const drop = await w.sealed(dropOf(randomBytes(length)));
    assert.equal(drop.blocks.length, calls);
    assert.deepEqual(w.state.seals.lookup(drop.id), { remaining: 0n, ended: true, blocks: BigInt(calls), chain: chainOf(drop.state, drop.key, drop.blind), done: true });
    assert.deepEqual(decrypt(w.cipherOf(drop.id), drop.key, length), drop.content);
  });
}

proven('a content of 56 bytes is not sealed before the block with the length', async () => {
  const w = await world({ constraints: true });
  const drop = dropOf(randomBytes(56));
  await w.begin(drop);
  await w.sealFinish(drop, drop.blocks[0]);
  assert.deepEqual(w.state.seals.lookup(drop.id), { remaining: 0n, ended: true, blocks: 1n, chain: chainOf(drop.state, drop.key, drop.blind), done: false });
  await assert.rejects(w.sealBlock(drop, drop.blocks[1]), /no full block remains/);
  await w.sealFinish(drop, drop.blocks[1]);
  assert.equal(w.state.seals.lookup(drop.id).done, true);
});

test('a content longer than 4096 bytes is refused when the drop is opened', async () => {
  const w = await world();
  await assert.rejects(w.begin(dropOf(randomBytes(4097))), /the content is longer than 4096 bytes/);
  assert.equal(w.state.drops.size(), 0n);
});

test('a block that is not the content does not reach the hash', async () => {
  const w = await world();
  const drop = dropOf(randomBytes(150));
  await w.begin(drop);
  await w.sealBlock(drop, drop.blocks[0]);
  await w.sealBlock(drop, flipped(drop.blocks[1], 5));
  await assert.rejects(w.sealFinish(drop, drop.blocks[2]), /the content does not match its hash/);
  assert.equal(w.state.seals.lookup(drop.id).done, false);
});

test('a hash that is not the content\'s is never reached', async () => {
  const w = await world();
  const drop = changed(dropOf(randomBytes(100)), { hash: randomBytes(32) });
  await w.begin(drop);
  await w.sealBlock(drop, drop.blocks[0]);
  await assert.rejects(w.sealFinish(drop, drop.blocks[1]), /the content does not match its hash/);
});

test('a key that is not behind the key hash cannot finish', async () => {
  const w = await world();
  const drop = changed(dropOf(randomBytes(100)), { keyHash: keyHash(randomField()) });
  await w.begin(drop);
  await w.sealBlock(drop, drop.blocks[0]);
  await assert.rejects(w.sealFinish(drop, drop.blocks[1]), /not the key behind the hash/);
});

test('another key, state or blind than the committed one is refused', async () => {
  const w = await world();
  const drop = dropOf(randomBytes(150));
  await w.begin(drop);
  await w.sealBlock(drop, drop.blocks[0]);
  const others = [{ key: addField(drop.key, 1n) }, { state: [drop.state[0] ^ 1n, ...drop.state.slice(1)] }, { blind: addField(drop.blind, 1n) }];
  for (const other of others) {
    await assert.rejects(w.sealBlock(changed(drop, other), drop.blocks[1]), /not the hidden state/);
  }
  await w.sealBlock(drop, drop.blocks[1]);
  for (const other of others.slice(1)) {
    await assert.rejects(w.sealFinish(changed(drop, other), drop.blocks[2]), /not the hidden state/);
  }
  await w.sealFinish(drop, drop.blocks[2]);
});

test('wrong padding is refused', async () => {
  const w = await world();
  const drop = dropOf(randomBytes(150));
  await w.begin(drop);
  await assert.rejects(w.sealFinish(drop, drop.blocks[0]), /full blocks remain/);
  await w.sealBlock(drop, drop.blocks[0]);
  await w.sealBlock(drop, drop.blocks[1]);
  const last = drop.blocks[2];
  const withByte = (at, value) => {
    const copy = Buffer.from(last);
    copy[at] = value;
    return copy;
  };
  await assert.rejects(w.sealFinish(drop, withByte(22, 0)), /the byte after the content must be 0x80/);
  await assert.rejects(w.sealFinish(drop, withByte(30, 1)), /padding must be zero/);
  await assert.rejects(w.sealFinish(drop, flipped(last, 63)), /the length in the padding is wrong/);
  await w.sealFinish(drop, last);
});

test('a sealed drop takes no more blocks, and an unknown drop none', async () => {
  const w = await world();
  const drop = await w.sealed(dropOf(randomBytes(70)));
  await assert.rejects(w.sealBlock(drop, drop.blocks[0]), /the drop is sealed/);
  await assert.rejects(w.sealFinish(drop, drop.blocks[1]), /the drop is sealed/);
  const unknown = dropOf(randomBytes(70));
  await assert.rejects(w.sealBlock(unknown, unknown.blocks[0]), /no such drop/);
  await assert.rejects(w.sealFinish(unknown, unknown.blocks[1]), /no such drop/);
});

test('a drop is removed with its ciphertext 37 days after the day it was opened', async () => {
  const w = await world();
  const drop = await w.sealed(dropOf(randomBytes(70)));
  const kept = (Number(EPOCH) + 37) * DAY_SECONDS;
  await assert.rejects(w.call('forget_drop', [drop.id], { time: NOON }), /the drop is still kept/);
  await assert.rejects(w.call('forget_drop', [drop.id], { time: kept - 1 }), /the drop is still kept/);
  await assert.rejects(w.call('forget_drop', [randomBytes(32)], { time: kept }), /no such drop/);
  await w.call('forget_drop', [drop.id], { time: kept });
  assert.deepEqual([w.state.drops.member(drop.id), w.state.seals.member(drop.id), w.state.cipher.member(drop.id)], [false, false, false]);
  await assert.rejects(w.call('forget_drop', [drop.id], { time: kept }), /no such drop/);
});

test('someone without the seller\'s hidden state cannot seal another\'s drop', async () => {
  const w = await world();
  const drop = dropOf(randomBytes(70));
  await w.begin(drop);
  const guess = changed(drop, { blind: randomField() });
  await assert.rejects(w.sealBlock(guess, randomBytes(64)), /not the hidden state/);
});

test('the transcripts of a sealing show nothing of the content, the key or the states between blocks', async () => {
  const w = await world();
  const drop = dropOf(randomBytes(150));
  const said = [];
  const states = [];
  const text = (calls) => JSON.stringify(calls.map((call) => call.publicTranscript), (_, v) => (typeof v === 'bigint' ? v.toString(16) : v instanceof Uint8Array ? hex(v) : v));
  said.push(text((await w.begin(drop)).calls));
  for (const [i, block] of drop.blocks.entries()) {
    said.push(text((await (i < 2 ? w.sealBlock(drop, block) : w.sealFinish(drop, block))).calls));
    if (i < 2) states.push(Buffer.from(drop.state.map((word) => word.toString(16).padStart(8, '0')).join(''), 'hex'));
  }
  const all = said.join('');
  const keyBytes = Buffer.from(drop.key.toString(16).padStart(64, '0'), 'hex');
  // No eight bytes in a row of a secret, in either byte order.
  for (const secret of [drop.content, keyBytes, ...states]) {
    for (const bytes of [secret, Buffer.from(secret).reverse()]) {
      for (let at = 0; at + 8 <= bytes.length; at++) assert.equal(all.includes(hex(bytes.subarray(at, at + 8))), false);
    }
  }
});
