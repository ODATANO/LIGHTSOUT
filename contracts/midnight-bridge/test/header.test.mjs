// Following headers: a recorded testnet checkpoint, the block after it and its real signatures.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { proven } from './helpers.mjs';
import { ed25519 } from '@noble/curves/ed25519.js';
import { approveArgs, builtAt, knowArgs, listBlocks, proposalOf, proposeArgs, signersFor } from '../../../kit/src/near-prover.ts';
import { b58, deploy, fixture, fromView, headOf, levels, listBytes, liteBytes, padded, READ, readOf, sha256, u64 } from './helpers.mjs';
import { Stale } from '../managed/midnight-bridge/contract/index.js';

// One removal call: a header or a block goes by its hash, a list read by its id.
const forget = (light, what, key) => (what === Stale.read ? light.call('forget', what, new Uint8Array(32), key) : light.call('forget', what, key, 0n));

const { checkpoint, blocks: [block], receiptProof } = fixture;
const producers = fromView(checkpoint.next_bps);
const total = producers.reduce((sum, p) => sum + p.stake, 0n);

const lite = liteBytes(block.inner_lite);
const inner = sha256(sha256(sha256(lite), b58(block.inner_rest_hash)), b58(block.prev_block_hash));
// What the producers sign and the contract keeps the proposal under: the hash of the block after.
const hash = sha256(b58(block.next_block_inner_hash), inner);
// The second NEAR built the block in, and the oldest a header may be when it becomes the head.
const built = builtAt(block);
const MAX_AGE = 115200n;
const proposal = [lite, b58(block.inner_rest_hash), b58(block.prev_block_hash), b58(block.next_block_inner_hash), u64(block.inner_lite.height + 2), built];

// The circuit takes points in affine coordinates and the signature's scalar as a number.
const affine = (bytes) => {
  const p = ed25519.Point.fromBytes(bytes).toAffine();
  return { x: p.x, y: p.y };
};
const scalar = (bytes) => bytes.reduceRight((acc, v) => (acc << 8n) | BigInt(v), 0n);
// The approval of producer `signer`, claimed for producer `index`.
const approval = (index, signer = index) => {
  const signature = b58(block.approvals_after_next[signer]);
  return [hash, BigInt(index), { r: affine(signature.subarray(0, 32)), s: scalar(signature.subarray(32)) }, affine(producers[signer].key)];
};
// Producers that signed the block, largest stake first.
const signers = producers.map((p, i) => ({ i, stake: p.stake })).filter((s) => block.approvals_after_next[s.i]).sort((a, b) => (b.stake > a.stake ? 1 : -1));

// The block of a recorded receipt, an ancestor of the block above.
const old = receiptProof.block_header_lite;
const ancestor = [liteBytes(old.inner_lite), b58(old.inner_rest_hash), b58(old.prev_block_hash), levels(receiptProof.block_proof, 34)];

// The bytes of a cell, with the zeros the encoding drops filled back in.
const cellBytes = (cell, length) => {
  const bytes = Buffer.concat(cell.content.value.map((atom) => Buffer.from(atom)));
  return Buffer.concat([bytes, Buffer.alloc(length - bytes.length)]);
};

proven('the head moves into the next epoch with more than two thirds of the stake', async () => {
  const light = (await deploy(headOf(checkpoint.inner_lite), { constraints: true })).at(built + 600n);

  await assert.rejects(light.call('propose', ...proposal), /producers of that epoch are not known yet/);
  await assert.rejects(light.call('know', ...ancestor), /not under the head/);
  // A reader that starts beside the one below and never ends its read.
  const idle = Buffer.alloc(32, 9);
  await light.reading(idle).call('begin', BigInt(listBytes(producers).length));
  for (const at of [0, 64, 128]) await light.call('absorb', padded(listBytes(producers)).subarray(at, at + 64));
  await light.reading(undefined).readList(listBytes(producers));
  assert.equal(light.state.tip.nextTotal, total);

  await assert.rejects(light.call('propose', ...proposal.slice(0, 4), u64(block.inner_lite.height + 3), built), /not the height plus two/);
  await assert.rejects(light.call('propose', ...proposal.slice(0, 5), built + 1n), /not the second of the header's timestamp/);
  // A proposal of the same block with another next block does not stand in the way of the right one.
  const other = sha256(sha256(b58(block.next_block_inner_hash)), inner);
  await light.call('propose', ...proposal.slice(0, 3), sha256(b58(block.next_block_inner_hash)), proposal[4], built);
  await light.call('propose', ...proposal);
  const message = Buffer.concat([Buffer.of(0), hash, u64(block.inner_lite.height + 2)]);
  assert.deepEqual(Buffer.from(light.state.candidates.lookup(hash).message), message);
  await assert.rejects(light.call('propose', ...proposal), /already proposed/);
  await assert.rejects(forget(light, Stale.header, other), /can still become the head/);
  await assert.rejects(forget(light, Stale.header, sha256(other)), /keeps nothing of that header/);
  // A proposed header is no recorded block.
  await assert.rejects(forget(light, Stale.block, other), /block is not known/);

  await assert.rejects(light.call('approve', ...approval(signers[1].i, signers[0].i)), /not that producer's key/);
  const forged = approval(signers[0].i);
  forged[2] = { r: forged[2].r, s: forged[2].s ^ 1n };
  await assert.rejects(light.call('approve', ...forged), /does not verify/);
  await assert.rejects(light.call('approve', sha256(hash), ...approval(signers[0].i).slice(1)), /not proposed/);
  await assert.rejects(light.call('approve', hash, 20n, ...approval(signers[0].i).slice(2)), /no producer has that index/);
  await assert.rejects(light.call('accept', sha256(hash)), /not proposed/);

  let stake = 0n;
  let used = 0;
  for (const signer of signers) {
    if (stake * 3n > total * 2n) break;
    await assert.rejects(light.call('accept', hash), /not more than two thirds/);
    await light.call('approve', ...approval(signer.i));
    stake += signer.stake;
    used += 1;
  }
  assert.equal(used, 5);
  assert.equal(light.state.candidates.lookup(hash).stake, stake);
  assert.equal(light.state.signed.lookup(hash).size(), 5n);
  await assert.rejects(light.call('approve', ...approval(signers[0].i)), /already signed/);
  await assert.rejects(forget(light, Stale.header, hash), /can still become the head/);
  assert.equal(light.state.signed.lookup(hash).size(), 5n);

  // A header is taken up to 32 hours after NEAR built it, and not a second later.
  await assert.rejects(light.at(built + MAX_AGE + 1n).call('accept', hash), /older than 32 hours/);
  await light.at(built + MAX_AGE).call('accept', hash);
  // The call logs the height it accepted, for NEAR to read from the transaction.
  const ops = light.transcript;
  const logs = ops.flatMap((op, i) => (op === 'log' ? [i] : []));
  assert.equal(logs.length, 1);
  const data = cellBytes(ops[logs[0] - 1].push.value.content[2], 288);
  assert.deepEqual(data, Buffer.concat([Buffer.from('lightsout/head'), Buffer.alloc(18), u64(block.inner_lite.height), Buffer.alloc(248)]));

  const { head, era, total: current, nextTotal } = light.state.tip;
  assert.equal(head.height, BigInt(block.inner_lite.height));
  assert.deepEqual(Buffer.from(head.epoch), b58(block.inner_lite.epoch_id));
  assert.deepEqual(Buffer.from(head.nextProducers), b58(block.inner_lite.next_bp_hash));
  assert.deepEqual(Buffer.from(head.blockRoot), b58(block.inner_lite.block_merkle_root));
  assert.deepEqual([era, current, nextTotal], [1n, total, 0n]);
  assert.deepEqual([light.state.tip.list, light.state.tip.nextList], [READ, 0n]);
  assert.equal(light.state.candidates.member(hash), false);
  await assert.rejects(light.call('propose', ...proposal), /not newer than the head/);

  // What the accepted header leaves behind can go: its marks, the other proposal with its
  // marks, the idle read.
  await forget(light, Stale.header, hash);
  assert.equal(light.state.signed.member(hash), false);
  assert.ok(light.state.candidates.member(other) && light.state.signed.member(other));
  await forget(light, Stale.header, other);
  assert.equal(light.state.candidates.size(), 0n);
  assert.equal(light.state.signed.size(), 0n);
  await assert.rejects(forget(light, Stale.header, other), /keeps nothing of that header/);
  const idleRead = readOf(idle);
  await assert.rejects(forget(light, Stale.read, READ), /still in use/);
  await assert.rejects(forget(light, Stale.read, READ + 1n), /no such read/);
  assert.ok(light.state.producers.lookup(idleRead).size() > 0n);
  await forget(light, Stale.read, idleRead);
  assert.deepEqual([light.state.readers.member(idleRead), light.state.producers.member(idleRead)], [false, false]);
  assert.equal(light.state.producers.lookup(READ).size(), BigInt(producers.length));

  // The recorded receipt's block is under the new head, by its real 22-level path.
  await light.call('know', ...ancestor);
  const known = b58(receiptProof.outcome_proof.block_hash);
  assert.deepEqual(Buffer.from(light.state.blocks.lookup(known).outcomes), b58(old.inner_lite.outcome_root));
  assert.equal(light.state.blocks.lookup(known).at, BigInt(block.inner_lite.height));
  await assert.rejects(forget(light, Stale.block, known), /recorded too recently/);
  // A recorded block is no header the bridge keeps a proposal or marks of.
  await assert.rejects(forget(light, Stale.header, known), /keeps nothing of that header/);
  assert.equal(light.state.blocks.member(known), true);
  await assert.rejects(light.call('know', ...ancestor.slice(0, 3), levels([...receiptProof.block_proof].reverse(), 34)), /not under the head/);

  // The new head commits to the producers of the epoch after its own.
  const following = fromView(block.next_bps);
  await light.reading(Buffer.alloc(32, 5)).readList(listBytes(following));
  assert.equal(light.state.tip.nextTotal, following.reduce((sum, p) => sum + p.stake, 0n));
});

test('the arguments the prover builds from RPC views drive the contract', async () => {
  const light = (await deploy(headOf(checkpoint.inner_lite))).at(built + 600n);
  const list = listBlocks(checkpoint.next_bps);
  await light.call('begin', list.length);
  for (const bytes of list.blocks) await light.call('absorb', bytes);
  await light.call('propose', ...proposeArgs(block));
  for (const index of signersFor(block, checkpoint.next_bps)) await light.call('approve', ...approveArgs(block, checkpoint.next_bps, index));
  await light.call('accept', proposalOf(block));
  assert.equal(light.state.tip.head.height, BigInt(block.inner_lite.height));
  await light.call('know', ...knowArgs(receiptProof));
  assert.equal(light.state.blocks.member(b58(receiptProof.outcome_proof.block_hash)), true);
});

test('every recorded producer key matches its curve point', async () => {
  const light = await deploy(headOf(checkpoint.inner_lite));
  await light.readList(listBytes(producers));
  await light.call('propose', ...proposal);
  for (const signer of signers) await light.call('approve', ...approval(signer.i));
  assert.equal(light.state.candidates.lookup(hash).stake, signers.reduce((sum, s) => sum + s.stake, 0n));
});
