import { TypeRegistry } from '@polkadot/types';
import type { Header } from '@polkadot/types/interfaces';
import { compactFromU8a } from '@polkadot/util';
import { type BurnLog, burnLogs, extrinsicProof, headLogs } from 'lightsout-burn-proof';
import { ledger, type Ledger } from 'lightsout-midnight-bridge';
import { nodeRpc, stateFromNode } from './midnight-node.js';

// Storage keys of `System::Events` and `System::LastRuntimeUpgrade`.
export const EVENTS_KEY = '0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7';
export const LAST_RUNTIME_UPGRADE_KEY = '0x26aa394eea5630e07c48ae0c9558cef7f9cce9c888469bb1a0dceaa129672ef8';
// The NEAR bridge takes at most this many headers from the burn's block to a finalized one.
export const MAX_BURN_HEADERS = 300;
// Header requests sent at once.
const HEADER_BATCH = 20;

const registry = new TypeRegistry();
const b64 = (b: Uint8Array): string => Buffer.from(b).toString('base64');
const unhex = (h: string): Uint8Array => Buffer.from(h.replace(/^0x/, ''), 'hex');

/** What `prove_burn_tx` and `prove_head_tx` take, base64 where bytes. */
export interface TxProof {
  headers: string[];
  extrinsic_index: number;
  extrinsic_proof: string[];
  state_proof: string[];
}

/** The NEAR bridge's view of Midnight: its head, and whether it stored the hash of a block. */
export interface FinalizedHere {
  head: number;
  kept?: number; // optional; a block NEAR stored as an ancestor of a finalized one
  hasHash(block: number): Promise<boolean>;
}

/**
 * The Midnight transaction in an extrinsic as `chain_getBlock` returns it: a length, a bare
 * extrinsic of version 4 or 5, a call, then the transaction bytes. Null for any other extrinsic.
 */
export function midnightTx(extrinsic: Uint8Array): Uint8Array | null {
  const [lenBytes, len] = compactFromU8a(extrinsic);
  const body = extrinsic.subarray(lenBytes);
  if (body.length !== len.toNumber() || (body[0] !== 4 && body[0] !== 5) || body[2] !== 0) return null;
  const [txLenBytes, txLen] = compactFromU8a(body.subarray(3));
  const tx = body.subarray(3 + txLenBytes);
  return tx.length === txLen.toNumber() ? tx : null;
}

/**
 * The finalized block the headers run to: the first block justified after the burn's block if
 * NEAR stored it, else an ancestor NEAR kept, else NEAR's head. Null when none is within reach.
 */
export async function headersEnd(block: number, firstJustified: number | null, here: FinalizedHere): Promise<number | null> {
  for (const end of [firstJustified, here.kept ?? null, here.head]) {
    if (end !== null && end >= block && end - block < MAX_BURN_HEADERS && (await here.hasHash(end))) return end;
  }
  return null;
}

async function blockHash(n: number): Promise<string> {
  return nodeRpc<string>('chain_getBlockHash', [n]);
}

/**
 * The first block up to `head` in which `holds` is true, for something that stays true once it
 * is. Null when it is not true at `head`. It searches back from the head in growing steps
 * first, so the node needs no state older than the block it looks for.
 */
export async function firstBlock(holds: (block: number) => Promise<boolean>, head: number): Promise<number | null> {
  if (!(await holds(head))) return null;
  let hi = head;
  let step = 1;
  let lo = Math.max(0, head - step);
  while (lo > 0 && (await holds(lo))) {
    hi = lo;
    step *= 2;
    lo = Math.max(0, hi - step);
  }
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (await holds(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

// What the node answers for a block that is older than the contract.
const NOT_DEPLOYED = 'Contract not present';

// The bridge's state in block `n`; undefined before the bridge was deployed.
async function stateAt(bridge: string, n: number): Promise<Ledger | undefined> {
  try {
    return ledger((await stateFromNode(bridge, await blockHash(n))).data);
  } catch (e) {
    if (e instanceof Error && e.message.includes(NOT_DEPLOYED)) return undefined;
    throw e;
  }
}

/**
 * The block of burn `id`: the first one up to `head` in which the bridge keeps the burn. The
 * bridge keeps a burn under the first byte of its id until a later burn takes that place. Null
 * when it does not keep it at `head`.
 */
export function burnBlock(bridge: string, id: Uint8Array, head: number): Promise<number | null> {
  const place = BigInt(id[0] ?? 0);
  return firstBlock(async (n) => {
    const burns = (await stateAt(bridge, n))?.burns;
    return burns !== undefined && burns.member(place) && Buffer.from(burns.lookup(place).id).equals(id);
  }, head);
}

/** The NEAR block that is the bridge's head in Midnight block `n`; undefined before the bridge was deployed. */
export async function headAt(bridge: string, n: number): Promise<bigint | undefined> {
  return (await stateAt(bridge, n))?.tip.head.height;
}

/** The block in which the bridge made a NEAR block of at least `height` its head; null when its head at `head` is lower. */
export function headBlock(bridge: string, height: bigint, head: number): Promise<number | null> {
  return firstBlock(async (n) => ((await stateAt(bridge, n))?.tip.head.height ?? 0n) >= height, head);
}

/** The headers of the blocks `from` to `to`, as the bridge takes them. */
export async function headersBetween(from: number, to: number): Promise<string[]> {
  const headers: Uint8Array[] = [];
  for (let n = from; n <= to; n += HEADER_BATCH) {
    const batch = await Promise.all(Array.from({ length: Math.min(HEADER_BATCH, to - n + 1) }, (_, k) => encodedHeader(n + k)));
    headers.push(...batch);
  }
  return headers.map(b64);
}

async function encodedHeader(n: number): Promise<Uint8Array> {
  return registry.createType<Header>('Header', await nodeRpc<object>('chain_getHeader', [await blockHash(n)])).toU8a();
}

// The proof of the first Midnight transaction in `block` that `fits`, built with standard node
// RPCs. Null when the block holds none.
async function txProof(block: number, fits: (tx: Uint8Array) => boolean, here: FinalizedHere, justifiedAfter: (block: number) => Promise<number | null>): Promise<TxProof | null> {
  const { block: body } = await nodeRpc<{ block: { extrinsics: string[] } }>('chain_getBlock', [await blockHash(block)]);
  const extrinsics = body.extrinsics.map(unhex);
  const extrinsicIndex = extrinsics.findIndex((x) => {
    const tx = midnightTx(x);
    if (!tx) return false;
    try {
      return fits(tx);
    } catch {
      // The reader throws for a transaction without such a call of the bridge.
      return false;
    }
  });
  if (extrinsicIndex < 0) return null;
  const { nodes } = extrinsicProof(extrinsics, extrinsicIndex);
  return { ...(await blockProof(block, here, justifiedAfter)), extrinsic_index: extrinsicIndex, extrinsic_proof: (nodes as Uint8Array[]).map(b64) };
}

/** The proof of burn `id` of the Midnight bridge at `bridge` from its transaction in `block`. */
export async function burnTxProof(bridge: string, id: Uint8Array, block: number, here: FinalizedHere, justifiedAfter: (block: number) => Promise<number | null>): Promise<TxProof> {
  const address = unhex(bridge);
  // A transaction can hold several burns.
  const proof = await txProof(block, (tx) => (burnLogs(tx, address) as BurnLog[]).some((log) => Buffer.from(log.id).equals(id)), here, justifiedAfter);
  if (!proof) throw new Error(`no transaction in Midnight block ${block} logs burn ${Buffer.from(id).toString('hex')}`);
  return proof;
}

/**
 * The proof that the Midnight bridge at `bridge` made a NEAR block its head in `block`, from
 * the transaction that did, and the height of that NEAR block. Null when no transaction of the
 * block did: the head a bridge starts with comes from its deploy.
 */
export async function headTxProof(bridge: string, block: number, here: FinalizedHere, justifiedAfter: (block: number) => Promise<number | null>): Promise<{ height: bigint; proof: TxProof } | null> {
  const address = unhex(bridge);
  let height = 0n;
  const proof = await txProof(
    block,
    (tx) => {
      // The NEAR bridge takes the highest head a transaction names.
      height = [...headLogs(tx, address)].reduce((a, b) => (a > b ? a : b));
      return true;
    },
    here,
    justifiedAfter,
  );
  return proof && { height, proof };
}

/**
 * What shows the NEAR bridge a Midnight block and its events: the headers from the block to one
 * NEAR finalized, and a read proof of `System::Events` and `System::LastRuntimeUpgrade`.
 */
async function blockProof(block: number, here: FinalizedHere, justifiedAfter: (block: number) => Promise<number | null>): Promise<{ headers: string[]; state_proof: string[] }> {
  const end = await headersEnd(block, await justifiedAfter(block - 1), here);
  if (end === null) throw new Error(`NEAR stored no block hash within ${MAX_BURN_HEADERS} blocks of block ${block}`);
  const { proof } = await nodeRpc<{ proof: string[] }>('state_getReadProof', [[EVENTS_KEY, LAST_RUNTIME_UPGRADE_KEY], await blockHash(block)]);
  return { headers: await headersBetween(block, end), state_proof: proof.map((p) => b64(unhex(p))) };
}

/**
 * The newest block from `from` down, of runtime version `spec`, that holds a Midnight
 * transaction, with the place of that transaction and the block's proof. A table for `spec`
 * proves itself on it. Null when the last `depth` blocks hold none.
 */
export async function tableTestBlock(spec: number, from: number, here: FinalizedHere, justifiedAfter: (block: number) => Promise<number | null>, depth = 600): Promise<{ block: number; proof: TxProof } | null> {
  for (let block = from; block > Math.max(0, from - depth); block--) {
    const hash = await blockHash(block);
    const { block: body } = await nodeRpc<{ block: { extrinsics: string[] } }>('chain_getBlock', [hash]);
    const extrinsics = body.extrinsics.map(unhex);
    const at = extrinsics.findIndex((x) => midnightTx(x) !== null);
    if (at < 0) continue;
    const version = await nodeRpc<{ specVersion: number }>('state_getRuntimeVersion', [hash]);
    if (version.specVersion !== spec) return null;
    const { nodes } = extrinsicProof(extrinsics, at);
    return { block, proof: { ...(await blockProof(block, here, justifiedAfter)), extrinsic_index: at, extrinsic_proof: (nodes as Uint8Array[]).map(b64) } };
  }
  return null;
}
