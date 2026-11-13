import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ed25519 } from '@noble/curves/ed25519.js';
import { base58 } from '@scure/base';
import type { LightClientBlockView, LightClientProof } from './near-light.js';
import { approveArgs, hashOf, knowArgs, levels, listBlocks, lockIn, lockLine, proposeArgs, proveLockArgs, signersFor } from './near-prover.js';

// Real NEAR testnet data, recorded by scripts/record-near-fixture.ts.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/near-testnet.json', import.meta.url), 'utf8')) as {
  checkpoint: LightClientBlockView;
  blocks: LightClientBlockView[];
  receiptProof: LightClientProof;
};
const block = fixture.blocks[0]!;
const producers = fixture.checkpoint.next_bps!;
const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest();

test('the list blocks are the padded producer list that next_bp_hash commits to', () => {
  const { length, blocks } = listBlocks(producers);
  assert.equal(length, 1542n);
  assert.equal(blocks.length, 25);
  assert.ok(blocks.every((b) => b.length === 64));
  const list = Buffer.concat(blocks).subarray(0, Number(length));
  assert.deepEqual(sha256(list), Buffer.from(base58.decode(fixture.checkpoint.inner_lite.next_bp_hash)));
  assert.equal(Buffer.concat(blocks)[Number(length)], 0x80);
  assert.equal(Buffer.concat(blocks).readBigUInt64BE(25 * 64 - 8), length * 8n);
});

test('propose takes the 208-byte inner_lite and the height plus two', () => {
  const [lite, , , , target] = proposeArgs(block);
  assert.equal(lite.length, 208);
  assert.equal(Buffer.from(lite).readBigUInt64LE(0), BigInt(block.inner_lite.height));
  assert.equal(Buffer.from(target).readBigUInt64LE(0), BigInt(block.inner_lite.height + 2));
});

test('an approval carries the producer\'s key and signature as curve points', () => {
  const index = block.approvals_after_next.findIndex((a) => a);
  const [hash, at, signature, point] = approveArgs(block, producers, index);
  assert.deepEqual(Buffer.from(hash), createHash('sha256').update(base58.decode(block.next_block_inner_hash)).update(hashOf(block)).digest());
  assert.equal(at, BigInt(index));
  const key = base58.decode(producers[index]!.public_key.slice('ed25519:'.length));
  assert.deepEqual(Buffer.from(ed25519.Point.fromAffine(point).toBytes()), Buffer.from(key));
  const raw = base58.decode(block.approvals_after_next[index]!.slice('ed25519:'.length));
  assert.deepEqual(Buffer.from(ed25519.Point.fromAffine(signature.r).toBytes()), Buffer.from(raw.subarray(0, 32)));
  assert.throws(() => approveArgs(block, producers, block.approvals_after_next.findIndex((a) => !a)), /did not sign/);
});

test('the signers chosen for a block are the fewest large ones above two thirds', () => {
  const chosen = signersFor(block, producers);
  assert.equal(chosen.length, 5);
  const total = producers.reduce((sum, p) => sum + BigInt(p.stake), 0n);
  const stake = chosen.reduce((sum, i) => sum + BigInt(producers[i]!.stake), 0n);
  assert.ok(stake * 3n > total * 2n);
  assert.ok((stake - BigInt(producers[chosen.at(-1)!]!.stake)) * 3n <= total * 2n);
  const thin = { ...block, approvals_after_next: block.approvals_after_next.map((a, i) => (i % 2 ? null : a)) };
  assert.throws(() => signersFor(thin, producers), /two thirds/);
});

test('a block path fills the contract\'s 34 levels and refuses a longer one', () => {
  const [lite, , , path] = knowArgs(fixture.receiptProof);
  assert.equal(lite.length, 208);
  assert.equal(path.length, 34);
  assert.equal(path.filter((l) => l.side !== 0n).length, fixture.receiptProof.block_proof.length);
  assert.ok(path.slice(fixture.receiptProof.block_proof.length).every((l) => l.side === 0n));
  assert.throws(() => levels(fixture.receiptProof.block_proof, 8), /22 levels/);
});

test('only an outcome with the lock line and the event becomes a lock proof', () => {
  assert.throws(() => proveLockArgs(fixture.receiptProof), /not a lock/);
  const recipient = 'ab'.repeat(32);
  const proof = structuredClone(fixture.receiptProof);
  proof.outcome_proof.outcome.logs = [`lightsout:lock:${'0'.repeat(14)}2a${'0'.repeat(11)}f4240${recipient}`, 'EVENT_JSON:{}'];
  assert.deepEqual(lockIn(proof), { id: 42n, amount: 1000000n, recipient: Buffer.from(recipient, 'hex') });
  assert.equal(lockLine(42n, 1000000n, recipient), proof.outcome_proof.outcome.logs[0]);
  const args = proveLockArgs(proof);
  assert.equal(args[2], BigInt(proof.outcome_proof.outcome.receipt_ids.length));
  assert.deepEqual(Buffer.from(args[6]), Buffer.from('000000000000002a', 'hex'));
  assert.deepEqual(Buffer.from(args[7]), Buffer.from('00000000000f4240', 'hex'));
  assert.equal(args[10].length, 16);
  assert.equal(args[11].length, 10);
  proof.outcome_proof.outcome.receipt_ids = ['11111111111111111111111111111111', '11111111111111111111111111111111', '11111111111111111111111111111111'];
  assert.throws(() => proveLockArgs(proof), /at most two/);
});
