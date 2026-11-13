// Records real NEAR testnet light client data for the offline tests in src/near-light.test.ts.
// Run: npx tsx scripts/record-near-fixture.ts
import { writeFile } from 'node:fs/promises';
import { base58 } from '@scure/base';
import { advance, blockHash, type LightClientBlockView, type LightClientHead } from '../src/near-light.js';

const RPC = 'https://archival-rpc.testnet.fastnear.com';
async function rpc<T>(method: string, params: unknown): Promise<T> {
  const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = (await r.json()) as { result?: T; error?: unknown };
  if (!j.result) throw new Error(`${method}: ${JSON.stringify(j.error)}`);
  return j.result;
}

// The probe transaction and its logged callback receipt, both on v2.nightshade-probe.testnet.
const TX = '2NK6aVsQbZxaDHtoDBhAkFUU3EjMWHd4r6FAgAm58Dri';
const SENDER = 'b7adbc79858ed19dcc101002b64ac555c51da392d1a58486aa87f915820e82f6';
const RECEIPT = 'ET93C1Y2ZMxcgmHHRYDK79bymLS3AybonCz8sX8xXy14';
const RECEIVER = 'v2.nightshade-probe.testnet';

const txBlock = await rpc<{ transaction_outcome: { block_hash: string } }>('tx', { tx_hash: TX, sender_account_id: SENDER });
const block = await rpc<{ header: { height: number } }>('block', { block_id: txBlock.transaction_outcome.block_hash });
const start = await rpc<{ header: { hash: string } }>('block', { block_id: block.header.height - 2 * 43_200 });
const checkpoint = await rpc<LightClientBlockView>('next_light_client_block', { last_block_hash: start.header.hash });
let head: LightClientHead = {
  hash: base58.encode(blockHash(checkpoint.inner_lite, checkpoint.inner_rest_hash, checkpoint.prev_block_hash)),
  inner_lite: checkpoint.inner_lite,
  epoch_bps: [],
  next_bps: checkpoint.next_bps,
};
const blocks: LightClientBlockView[] = [];
while (head.inner_lite.height <= block.header.height) {
  const next = await rpc<LightClientBlockView>('next_light_client_block', { last_block_hash: head.hash });
  head = advance(head, next);
  blocks.push(next);
}
const txProof = await rpc('light_client_proof', { type: 'transaction', transaction_hash: TX, sender_id: SENDER, light_client_head: head.hash });
const receiptProof = await rpc('light_client_proof', { type: 'receipt', receipt_id: RECEIPT, receiver_id: RECEIVER, light_client_head: head.hash });
await writeFile(
  new URL('../src/fixtures/near-testnet.json', import.meta.url),
  JSON.stringify({ checkpoint, blocks, txProof, receiptProof }, null, 1),
);
console.log(`checkpoint ${checkpoint.inner_lite.height}, ${blocks.length} blocks to ${head.inner_lite.height}`);
