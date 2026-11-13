import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { type BlockView, callsIn, type ChunkView, findReceipt, type NearBlocks, newChunks, type ReceiptLogs, receiptWith, searchHeights, type SignedCall } from './near-find.js';

// Real NEAR testnet data: one function call, the blocks from its transaction to its logged
// receipt with their chunks, and its outcome, reduced to the fields the search reads.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/near-call.json', import.meta.url), 'utf8')) as {
  call: SignedCall;
  txHash: string;
  receipt: ReceiptLogs & { height: number };
  blocks: Record<string, BlockView>;
  chunks: Record<string, ChunkView>;
  status: { receipts_outcome: { id: string; outcome: { executor_id: string; logs: string[] } }[] };
};
const { call, receipt } = fixture;
const line = receipt.logs[0]!;

// An RPC that serves the recorded answers and notes what it is asked.
function recorded(change: Partial<NearBlocks> = {}): NearBlocks & { asked: string[] } {
  const asked: string[] = [];
  return {
    asked,
    block: async (height) => {
      asked.push(`block ${height}`);
      return fixture.blocks[height] ?? null;
    },
    chunk: async (hash) => {
      asked.push('chunk');
      const chunk = fixture.chunks[hash];
      if (!chunk) throw new Error(`no chunk ${hash}`);
      return chunk;
    },
    receiptsOf: async (txHash, sender) => {
      asked.push(`tx ${txHash}`);
      assert.equal(sender, call.signer);
      if (txHash !== fixture.txHash) return [];
      return fixture.status.receipts_outcome.filter((r) => r.outcome.executor_id === call.receiver).map((r) => ({ id: r.id, logs: r.outcome.logs }));
    },
    ...change,
  };
}

test('a block adds the chunks included at its height', () => {
  const block = fixture.blocks[receipt.height]!;
  assert.equal(newChunks(block).length, block.chunks.length);
  // A shard that made no chunk repeats the chunk of an earlier block.
  const [first, ...rest] = block.chunks;
  const stale = { ...block, chunks: [{ ...first!, height_included: block.header.height - 1 }, ...rest] };
  assert.deepEqual(newChunks(stale), rest.map((c) => c.chunk_hash));
});

test('a chunk gives the transactions of one signer, receiver and method', () => {
  const found = Object.values(fixture.chunks).flatMap((chunk) => callsIn(chunk, call));
  assert.deepEqual(found, [fixture.txHash]);
  for (const other of [{ ...call, signer: 'someone.testnet' }, { ...call, receiver: 'other.testnet' }, { ...call, method: 'register' }]) {
    assert.deepEqual(Object.values(fixture.chunks).flatMap((chunk) => callsIn(chunk, other)), []);
  }
  // A call among other actions counts; an action without arguments is a bare name.
  const batch: ChunkView = { transactions: [{ hash: 'h', signer_id: 'a', receiver_id: 'b', actions: ['CreateAccount', { Transfer: {} }, { FunctionCall: { method_name: 'register' } }] }] };
  assert.deepEqual(callsIn(batch, { signer: 'a', receiver: 'b', method: 'register' }), ['h']);
  assert.deepEqual(callsIn(batch, { signer: 'a', receiver: 'b', method: 'Transfer' }), []);
});

test('the receipt is the one whose first log is the line', () => {
  const receipts = [{ id: 'one', logs: [] }, { id: 'two', logs: ['other', 'lightsout:join:x'] }, { id: 'three', logs: ['lightsout:join:x', 'event'] }];
  assert.equal(receiptWith(receipts, 'lightsout:join:x'), 'three');
  assert.equal(receiptWith(receipts, 'lightsout:join:y'), undefined);
});

test('the search starts one block under the receipt and stays within its depth', () => {
  assert.deepEqual(searchHeights(100, 3), [99, 100, 98, 97]);
  assert.deepEqual(searchHeights(1, 3), [0, 1]);
});

test('the receipt is found from the caller and the block it ran in', async () => {
  const near = recorded();
  assert.equal(await findReceipt(near, call, line, receipt.height), receipt.id);
  // The transaction sits three blocks under its logged receipt; one transaction status was read.
  assert.deepEqual(near.asked.filter((a) => a.startsWith('block')), [1, 0, 2, 3].map((d) => `block ${receipt.height - d}`));
  assert.deepEqual(near.asked.filter((a) => a.startsWith('tx')), [`tx ${fixture.txHash}`]);
});

test('a height without a block is passed over', async () => {
  const missing = receipt.height - 1;
  const near = recorded({ block: async (height) => (height === missing ? null : (fixture.blocks[height] ?? null)) });
  assert.equal(await findReceipt(near, call, line, receipt.height), receipt.id);
});

test('nothing is found for another line, another caller or too small a depth', async () => {
  await assert.rejects(findReceipt(recorded(), call, 'lightsout:join:other', receipt.height), /logged this in the 7 blocks up to/);
  await assert.rejects(findReceipt(recorded(), { ...call, signer: 'someone.testnet' }, line, receipt.height), /no transaction of someone.testnet/);
  await assert.rejects(findReceipt(recorded(), call, line, receipt.height, 2), /in the 3 blocks/);
});
