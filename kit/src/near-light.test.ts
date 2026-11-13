import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { base58 } from '@scure/base';
import { advance, blockHash, type LightClientBlockView, type LightClientHead, type LightClientProof, verifyOutcome } from './near-light.js';

// Real NEAR testnet data, recorded by scripts/record-near-fixture.ts.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/near-testnet.json', import.meta.url), 'utf8')) as {
  checkpoint: LightClientBlockView;
  blocks: LightClientBlockView[];
  txProof: LightClientProof;
  receiptProof: LightClientProof;
};

function checkpointHead(): LightClientHead {
  const c = fixture.checkpoint;
  return {
    hash: base58.encode(blockHash(c.inner_lite, c.inner_rest_hash, c.prev_block_hash)),
    inner_lite: c.inner_lite,
    epoch_bps: [],
    next_bps: c.next_bps,
  };
}

const verifiedHead = (): LightClientHead => fixture.blocks.reduce(advance, checkpointHead());

test('the recorded chain verifies into the next epoch', () => {
  const head = verifiedHead();
  assert.notEqual(head.inner_lite.epoch_id, fixture.checkpoint.inner_lite.epoch_id);
  assert.equal(head.epoch_bps.length, fixture.checkpoint.next_bps?.length);
});

test('a forged or missing approval is refused', () => {
  const block = structuredClone(fixture.blocks[0]!);
  const i = block.approvals_after_next.findIndex((a) => a);
  const sig = base58.decode(block.approvals_after_next[i]!.slice(8));
  sig[0]! ^= 1;
  block.approvals_after_next[i] = `ed25519:${base58.encode(sig)}`;
  assert.throws(() => advance(checkpointHead(), block), /bad approval/);

  const thin = structuredClone(fixture.blocks[0]!);
  thin.approvals_after_next = thin.approvals_after_next.map((a, j) => (j % 2 ? null : a));
  assert.throws(() => advance(checkpointHead(), thin), /2\/3 stake/);
});

test('a header that does not hash to the signed block is refused', () => {
  const block = structuredClone(fixture.blocks[0]!);
  block.inner_lite.outcome_root = block.inner_lite.prev_state_root;
  assert.throws(() => advance(checkpointHead(), block), /bad approval|2\/3/);
});

test('a producer list the block does not commit to is refused', () => {
  const block = structuredClone(fixture.blocks[0]!);
  assert.ok(block.next_bps, 'the recorded block carries next_bps');
  block.next_bps[0]!.stake = '1';
  assert.throws(() => advance(checkpointHead(), block), /next_bp_hash/);
});

test('an older block or one from an unknown epoch is refused', () => {
  const head = verifiedHead();
  assert.throws(() => advance(head, fixture.blocks[0]!), /not newer/);
  const stranger = structuredClone(fixture.blocks[0]!);
  stranger.inner_lite.height = head.inner_lite.height + 1;
  stranger.inner_lite.epoch_id = fixture.checkpoint.inner_lite.prev_state_root;
  assert.throws(() => advance(head, stranger), /unknown epoch/);
});

test('transaction and receipt outcomes prove against the verified head', () => {
  const head = verifiedHead();
  const tx = verifyOutcome(head, fixture.txProof);
  assert.equal(tx.id, '2NK6aVsQbZxaDHtoDBhAkFUU3EjMWHd4r6FAgAm58Dri');
  const receipt = verifyOutcome(head, fixture.receiptProof);
  assert.equal(receipt.outcome.executor_id, 'v2.nightshade-probe.testnet');
  assert.match(receipt.outcome.logs[0]!, /attestation_rejected/);
});

test('a changed status, log, receipt id or block path is refused', () => {
  const head = verifiedHead();
  const cases: [string, (p: LightClientProof) => void][] = [
    ['status', (p) => void (p.outcome_proof.outcome.status = { SuccessValue: Buffer.from('true').toString('base64') })],
    ['log', (p) => void (p.outcome_proof.outcome.logs[0] = p.outcome_proof.outcome.logs[0]!.replace('rejected', 'accepted'))],
    ['receipt id', (p) => void (p.outcome_proof.outcome.receipt_ids = [])],
    ['block path', (p) => void p.block_proof.reverse()],
    ['header', (p) => void (p.block_header_lite.inner_rest_hash = p.block_header_lite.prev_block_hash)],
  ];
  for (const [name, change] of cases) {
    const proof = structuredClone(fixture.receiptProof);
    change(proof);
    assert.throws(() => verifyOutcome(head, proof), Error, name);
  }
  const stale = checkpointHead();
  assert.throws(() => verifyOutcome(stale, fixture.receiptProof), /ancestor/);
});
