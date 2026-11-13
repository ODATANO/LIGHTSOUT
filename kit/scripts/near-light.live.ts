// Live check of the light client against NEAR testnet: walks epochs from an old block, then proves
// an execution outcome. Run: npx tsx scripts/near-light.live.ts
import { advance, blockHash, type LightClientBlockView, type LightClientHead, type LightClientProof, verifyOutcome } from '../src/near-light.js';
import { base58 } from '@scure/base';

const RPC = process.env.NEAR_RPC_URL ?? 'https://rpc.testnet.fastnear.com';
async function rpc<T>(method: string, params: unknown): Promise<T> {
  const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = (await r.json()) as { result?: T; error?: unknown };
  if (!j.result) throw new Error(`${method}: ${JSON.stringify(j.error)}`);
  return j.result;
}

const final = await rpc<{ header: { height: number } }>('block', { finality: 'final' });
const start = await rpc<{ header: { hash: string; height: number } }>('block', { block_id: final.header.height - 3 * 43_200 });
// The first answer is the last block of the start block's epoch: its next_bps opens the chain.
const first = await rpc<LightClientBlockView>('next_light_client_block', { last_block_hash: start.header.hash });
const firstHash = base58.encode(blockHash(first.inner_lite, first.inner_rest_hash, first.prev_block_hash));
const rpcFirst = await rpc<{ header: { hash: string } }>('block', { block_id: first.inner_lite.height });
console.log(`checkpoint ${first.inner_lite.height} hash ${firstHash === rpcFirst.header.hash ? 'matches' : 'DIFFERS'} next_bps ${first.next_bps?.length}`);

let head: LightClientHead = { hash: firstHash, inner_lite: first.inner_lite, epoch_bps: [], next_bps: first.next_bps };
for (let i = 0; i < 6; i++) {
  const next = await rpc<LightClientBlockView>('next_light_client_block', { last_block_hash: head.hash });
  if (!next.inner_lite || next.inner_lite.height <= head.inner_lite.height) break;
  head = advance(head, next);
  console.log(`verified ${head.inner_lite.height} epoch ${head.inner_lite.epoch_id.slice(0, 6)} producers ${head.epoch_bps.length}`);
}

// The bridge probe transaction from the v2 live test, proven against the verified head.
const txHash = process.env.TX ?? '2NK6aVsQbZxaDHtoDBhAkFUU3EjMWHd4r6FAgAm58Dri';
const sender = process.env.SENDER ?? 'b7adbc79858ed19dcc101002b64ac555c51da392d1a58486aa87f915820e82f6';
const proof = await rpc<LightClientProof>('light_client_proof', { type: 'transaction', transaction_hash: txHash, sender_id: sender, light_client_head: head.hash });
const o = verifyOutcome(head, proof);
console.log(`outcome of tx ${txHash} by ${o.outcome.executor_id} verified, status ${JSON.stringify(o.outcome.status).slice(0, 60)}`);

const forged = structuredClone(proof);
forged.outcome_proof.outcome.status = { SuccessValue: Buffer.from('forged').toString('base64') };
try {
  verifyOutcome(head, forged);
  console.log('FORGED OUTCOME ACCEPTED');
} catch (e) {
  console.log(`forged outcome refused: ${(e as Error).message}`);
}

// The callback receipt that logged the attestation_rejected event: proves logs and a return value.
const status = await rpc<{ receipts_outcome: { id: string; outcome: { executor_id: string; logs: string[] } }[] }>('tx', { tx_hash: txHash, sender_account_id: sender });
const logged = status.receipts_outcome.find((r) => r.outcome.logs.length > 0);
if (logged) {
  const receiptProof = await rpc<LightClientProof>('light_client_proof', { type: 'receipt', receipt_id: logged.id, receiver_id: logged.outcome.executor_id, light_client_head: head.hash });
  const r = verifyOutcome(head, receiptProof);
  console.log(`receipt ${r.id} on ${r.outcome.executor_id} verified with log: ${(r.outcome.logs[0] ?? '').slice(0, 90)}`);
  const tampered = structuredClone(receiptProof);
  tampered.outcome_proof.outcome.logs[0] = (tampered.outcome_proof.outcome.logs[0] ?? '').replace('rejected', 'accepted');
  try {
    verifyOutcome(head, tampered);
    console.log('TAMPERED LOG ACCEPTED');
  } catch (e) {
    console.log(`tampered log refused: ${(e as Error).message}`);
  }
}
