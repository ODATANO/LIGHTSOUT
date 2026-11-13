import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { ledger, type Ledger } from 'lightsout-midnight-bridge';
import { env } from './env.js';

const DEFAULT_MIN_INTERVAL_MS = 250;
// A node that does not answer in this time counts as failed, so a stalled socket ends the step.
const TIMEOUT_MS = 60_000;
let nextSlot = 0;

// Public nodes block a client that asks too fast. Each request takes the next free slot, also when requests run concurrently.
async function awaitSlot(): Promise<void> {
  const interval = Number(process.env.MIDNIGHT_NODE_MIN_INTERVAL_MS ?? DEFAULT_MIN_INTERVAL_MS);
  if (!Number.isFinite(interval) || interval < 0) throw new Error('MIDNIGHT_NODE_MIN_INTERVAL_MS must be a number of milliseconds');
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + interval;
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));
}

export async function nodeRpc<T>(method: string, params: unknown[]): Promise<T> {
  await awaitSlot();
  const res = await fetch(env('MIDNIGHT_NODE_URL').replace(/^ws/, 'http'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // A node behind a proxy answers an outage with a page, not with JSON.
  if (!res.ok) throw new Error(`the node answered ${res.status} to ${method}`);
  const body = (await res.json()) as { result?: T; error?: unknown };
  if (body.result === undefined) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

/** A contract's state in block `at`, by default the node's finalized head. */
export async function stateFromNode(address: string, at?: string): Promise<ContractState> {
  const block = at ?? (await nodeRpc<string>('chain_getFinalizedHead', []));
  const hex = await nodeRpc<string>('midnight_contractState', [address, block]);
  return ContractState.deserialize(Buffer.from(hex.replace(/^0x/, ''), 'hex'));
}

/** The bridge state at the node's finalized head. */
export async function readFromNode(bridge: string): Promise<Ledger> {
  return ledger((await stateFromNode(bridge)).data);
}
