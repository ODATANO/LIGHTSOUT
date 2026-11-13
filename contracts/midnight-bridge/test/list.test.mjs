// The producer list: hashed block by block and parsed from the same bytes.
import assert from 'node:assert/strict';
import { randomBytes, randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { proven } from './helpers.mjs';
import { deploy, fixture, fromView, headOf, listBytes, littleEndian, padded, READ, readOf, sha256, witnesses } from './helpers.mjs';

// A contract whose head commits to the given list bytes.
const expecting = (bytes, options) => deploy({ height: 1, epoch: randomBytes(32), nextEpoch: randomBytes(32), nextProducers: sha256(bytes), blockRoot: randomBytes(32) }, options);

function assertStored(state, list) {
  assert.equal(state.readers.lookup(READ).active, false);
  assert.equal(state.producers.lookup(READ).size(), BigInt(list.length));
  assert.equal(state.tip.nextTotal, list.reduce((sum, p) => sum + p.stake, 0n));
  assert.equal(state.tip.nextList, READ);
  for (const [i, p] of list.entries()) {
    const got = state.producers.lookup(READ).lookup(BigInt(i));
    assert.deepEqual([got.keyLow, got.keyHigh, got.stake], [littleEndian(p.key.subarray(0, 16)), littleEndian(p.key.subarray(16)), p.stake]);
  }
}

const checkpointFile = JSON.parse(readFileSync(new URL('../../../kit/src/fixtures/near-checkpoint.json', import.meta.url), 'utf8'));
const recorded = fromView(fixture.checkpoint.next_bps);

test('two recorded testnet lists hash to next_bp_hash and give their producers', async () => {
  for (const block of [fixture.checkpoint, checkpointFile]) {
    const list = fromView(block.next_bps);
    const light = await deploy(headOf(block.inner_lite));
    await light.readList(listBytes(list));
    assertStored(light.state, list);
  }
});

proven('a recorded list satisfies the constraints of begin and absorb', async () => {
  const light = await deploy(headOf(fixture.checkpoint.inner_lite), { constraints: true });
  await light.readList(listBytes(recorded));
  assertStored(light.state, recorded);
});

test('lists of every name length and of every length around a block boundary', async () => {
  const producer = (nameLength) => ({ name: 'a'.repeat(nameLength), key: randomBytes(32), stake: littleEndian(randomBytes(randomInt(1, 17))) });
  const residues = new Set();
  const lists = Array.from({ length: 63 }, (_, i) => [producer(5), producer(i + 2)]);
  for (let n = 3; n <= 8; n += 1) lists.push(Array.from({ length: n }, () => producer(randomInt(2, 65))));
  for (const list of lists) {
    const bytes = listBytes(list);
    residues.add(bytes.length % 64);
    const light = await expecting(bytes);
    await light.readList(bytes);
    assertStored(light.state, list);
  }
  assert.ok(residues.size >= 63);
  const empty = await expecting(listBytes([]));
  await empty.readList(listBytes([]));
  assertStored(empty.state, []);
});

test('a list the head does not commit to, a wrong length or a wrong shape is refused', async () => {
  const bytes = listBytes(recorded.slice(0, 3));
  const read = async (data, length = data.length) => {
    const light = await expecting(bytes);
    await light.call('begin', BigInt(length));
    const blocks = padded(data);
    for (let at = 0; at < blocks.length; at += 64) await light.call('absorb', blocks.subarray(at, at + 64));
  };
  const changed = Buffer.from(bytes);
  changed[bytes.length - 3] ^= 1;
  await assert.rejects(read(changed), /does not hash to the expected value/);
  await assert.rejects(read(bytes, bytes.length - 1), /must be 0x80/);
  await assert.rejects(read(bytes, bytes.length + 1), /unsupported producer or key type/);
  const count = Buffer.from(bytes);
  count.writeUInt32LE(count.readUInt32LE(0) + 1);
  await assert.rejects(read(count), /wrong number of entries/);
  const version = Buffer.from(bytes);
  version[4] = 1;
  await assert.rejects(read(version), /unsupported producer or key type/);
});

test('no block is taken before a list starts or after it ends, and a known list is not read again', async () => {
  const bytes = listBytes(recorded);
  const light = await expecting(bytes);
  await assert.rejects(light.call('absorb', Buffer.alloc(64)), /no such read/);
  await light.readList(bytes);
  await assert.rejects(light.call('absorb', Buffer.alloc(64)), /this read has ended/);
  await assert.rejects(light.reading(Buffer.alloc(32, 2)).call('begin', 100n), /already known/);
});

test('a read belongs to its reader, and only the list that closed gives the producers', async () => {
  const bytes = listBytes(recorded);
  const blocks = padded(bytes);
  const light = await expecting(bytes);
  await light.call('begin', BigInt(bytes.length));
  await assert.rejects(light.call('begin', BigInt(bytes.length)), /this read exists/);
  await light.call('absorb', blocks.subarray(0, 64));
  // Another reader has no read to continue, and cannot touch this one.
  const second = Buffer.alloc(32, 3);
  await assert.rejects(light.reading(second).call('absorb', blocks.subarray(64, 128)), /no such read/);

  // A second read runs beside the first and closes; the first one cannot close after it.
  await light.reading(second).readList(bytes);
  assert.equal(light.state.tip.nextTotal, recorded.reduce((sum, p) => sum + p.stake, 0n));
  assert.equal(light.state.readers.lookup(READ).active, true);
  light.reading(undefined);
  for (let at = 64; at < blocks.length - 64; at += 64) await light.call('absorb', blocks.subarray(at, at + 64));
  await assert.rejects(light.call('absorb', blocks.subarray(blocks.length - 64)), /already known/);
  assert.equal(light.state.tip.nextList, readOf(second));
  assert.equal(light.state.producers.lookup(readOf(second)).size(), BigInt(recorded.length));
});

test('a prover that lies about a bit is refused', async () => {
  const bytes = listBytes(recorded);
  const lying = { ...witnesses, bitsOf: (context, x) => [context.privateState, Array.from({ length: 35 }, (_, i) => i === 34 || ((x >> BigInt(34 - i)) & 1n) === 1n)] };
  const light = await expecting(bytes, { using: lying });
  await light.call('begin', BigInt(bytes.length));
  await assert.rejects(light.call('absorb', padded(bytes).subarray(0, 64)), /bits do not match the sum/);
});
