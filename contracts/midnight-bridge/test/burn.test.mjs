// The burn: wrapped NEAR only, at least 0.1 wNEAR, each burn under the hash of its coin.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { proven } from './helpers.mjs';
import { rawTokenType } from '@midnight-ntwrk/compact-runtime';
import { pureCircuits } from '../managed/midnight-bridge/contract/index.js';
import { ADDRESS, deploy, littleEndian, u128 } from './helpers.mjs';
import { madeUp } from './made-up.mjs';

const { head } = madeUp();
const wrapped = Buffer.from(rawTokenType(pureCircuits.wrappedDomain(), ADDRESS), 'hex');
// The smallest burn: 0.1 wNEAR in micro-NEAR.
const LEAST = 100000n;
const coin = (value = LEAST, color = wrapped) => ({ nonce: randomBytes(32), color, value });
// A NEAR account name in the 64 bytes a burn carries, zero-filled.
const recipient = (name) => Buffer.concat([Buffer.from(name), Buffer.alloc(64 - name.length)]);

// The bytes of a cell, with the zeros the encoding drops filled back in.
const cellBytes = (cell, length) => {
  assert.equal(cell.tag, 'cell');
  const bytes = Buffer.concat(cell.content.value.map((atom) => Buffer.from(atom)));
  assert.ok(bytes.length <= length);
  return Buffer.concat([bytes, Buffer.alloc(length - bytes.length)]);
};

// What the last call logged for NEAR: the three cells of its one log.
function logged(light) {
  const ops = light.transcript;
  const logs = ops.flatMap((op, i) => (op === 'log' ? [i] : []));
  assert.equal(logs.length, 1);
  const pushed = ops[logs[0] - 1].push;
  assert.equal(pushed.storage, false);
  assert.equal(pushed.value.tag, 'array');
  assert.equal(pushed.value.content.length, 3);
  return pushed.value.content;
}

// The id the last burn logged, and the burn the contract keeps under that id's first byte.
function lastBurn(light) {
  const id = cellBytes(logged(light)[2], 288).subarray(32, 64);
  return { id, kept: light.state.burns.lookup(BigInt(id[0])) };
}

proven('a burn names who is paid on NEAR and is kept under the hash of its coin', async () => {
  const light = await deploy(head, { constraints: true });
  const bob = recipient('bob.testnet');
  await light.call('burn', coin(LEAST + 2n), bob);
  const first = lastBurn(light);
  assert.deepEqual(Buffer.from(first.kept.id), first.id);
  assert.equal(first.kept.value, LEAST + 2n);
  assert.deepEqual(Buffer.from(first.kept.near_recipient), bob);

  const alice = recipient('alice.testnet');
  await light.call('burn', coin(), alice);
  const second = lastBurn(light);
  assert.notDeepEqual(second.id, first.id);
  assert.deepEqual(Buffer.from(second.kept.near_recipient), alice);
});

test('a burn of anything else or of less than 0.1 wNEAR is refused', async () => {
  const light = await deploy(head);
  const bob = recipient('bob.testnet');
  await assert.rejects(light.call('burn', coin(LEAST, randomBytes(32)), bob), /not wrapped NEAR/);
  await assert.rejects(light.call('burn', coin(0n), bob), /at least 0.1 wNEAR/);
  await assert.rejects(light.call('burn', coin(LEAST - 1n), bob), /at least 0.1 wNEAR/);
  assert.equal(light.state.burns.size(), 0n);
});

test('a burn names an account NEAR can pay', async () => {
  const light = await deploy(head);
  for (const name of ['ab', 'bob.testnet', 'a-b_c.d1.testnet', '0x' + 'a1'.repeat(20), 'f'.repeat(64)]) {
    await light.call('burn', coin(), recipient(name));
    assert.deepEqual(Buffer.from(lastBurn(light).kept.near_recipient), recipient(name));
  }
  const refused = [
    ['', /separator at an end|fewer than two/],
    ['a', /fewer than two/],
    ['Bob.testnet', /no NEAR account has/],
    ['bob .testnet', /no NEAR account has/],
    ['bob..testnet', /separator at an end or two in a row/],
    ['.bob', /separator at an end or two in a row/],
    ['bob.', /separator at an end or two in a row/],
    ['bob-_x', /separator at an end or two in a row/],
    ['f'.repeat(63) + '.', /separator at an end or two in a row/],
  ];
  for (const [name, why] of refused) await assert.rejects(light.call('burn', coin(), recipient(name)), why, name);
  // A character after the zero that ends the name.
  const tail = recipient('bob.testnet');
  tail[20] = 97;
  await assert.rejects(light.call('burn', coin(), tail), /goes on after its end/);
});

test('a burn logs its id, value and recipient for NEAR', async () => {
  const light = await deploy(head);
  const bob = recipient('bob.testnet');
  await light.call('burn', coin(), bob);
  await light.call('burn', coin(LEAST + 3n), bob);

  const [version, type, data] = logged(light);
  assert.equal(littleEndian(cellBytes(version, 4)), 1n);
  assert.equal(littleEndian(cellBytes(type, 1)), 10n);
  const name = Buffer.concat([Buffer.from('lightsout/burn'), Buffer.alloc(18)]);
  const { id } = lastBurn(light);
  assert.deepEqual(cellBytes(data, 288), Buffer.concat([name, id, u128(LEAST + 3n), bob, Buffer.alloc(144)]));
});

test('a burn reads nothing of the contract state, so no other call can outdate it', async () => {
  const light = await deploy(head);
  await light.call('burn', coin(), recipient('bob.testnet'));
  // A read of the state is a step into it that is not cached and leaves no path to write along.
  const reads = light.transcript.filter((op) => typeof op === 'object' && 'idx' in op && !op.idx.cached && !op.idx.pushPath);
  assert.equal(reads.length, 0);
});
