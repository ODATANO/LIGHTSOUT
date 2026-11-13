import { TypeRegistry } from '@polkadot/types';
import type { H256, Header } from '@polkadot/types/interfaces';
import type { Bytes, Vec } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import { nodeRpc } from './midnight-node.js';
import type { RuntimeView } from './near.js';

// The bridge contract takes at most this many blocks per call.
export const MAX_FINALITY_BLOCKS = 16;

const registry = new TypeRegistry();

/** A Midnight header and the GRANDPA justification that finalizes it, as the bridge takes them. */
export interface FinalityProof {
  number: number;
  hash: string; // 0x and 64 hex; the block's hash
  /** SCALE-encoded header, base64. */
  header: string;
  /** SCALE-encoded justification, base64. */
  justification: string;
}

// Storage key of `System::AuthorizedUpgrade`, set from the vote for a new runtime until it is applied.
export const AUTHORIZED_UPGRADE_KEY = '0x26aa394eea5630e07c48ae0c9558cef72fa9f1bf25567808771bff091dc89ecd';

// `Council::Proposals` and `TechnicalCommittee::Proposals`: the votes that are open in Midnight's two bodies.
const COUNCIL_PROPOSALS_KEY = '0xaebd463ed9925c488c112434d61debc088c2f7188c6fdd1dffae2fa0d171f440';
const TECHNICAL_PROPOSALS_KEY = '0xed25f63942de25ac5253ba64b5eb64d188c2f7188c6fdd1dffae2fa0d171f440';

/** What Midnight's own chain says about its runtime now. */
export interface RuntimeSigns {
  spec: number; // the spec version of the runtime that runs
  authorized: boolean; // a new runtime is voted in and not applied yet
  proposals: number; // open votes in the Council and the Technical Committee; a runtime upgrade starts as one
}

/** Reads the runtime version, an authorized upgrade and the open votes from the node. */
export async function runtimeSigns(): Promise<RuntimeSigns> {
  const [version, authorized, council, technical] = await Promise.all([
    nodeRpc<{ specVersion: number }>('state_getRuntimeVersion', []),
    nodeRpc<string | null>('state_getStorage', [AUTHORIZED_UPGRADE_KEY]),
    nodeRpc<string | null>('state_getStorage', [COUNCIL_PROPOSALS_KEY]),
    nodeRpc<string | null>('state_getStorage', [TECHNICAL_PROPOSALS_KEY]),
  ]);
  // A list of 32-byte hashes behind a one-byte count, for the few votes these bodies hold.
  const count = (list: string | null): number => (list && list.length > 4 ? (list.length - 4) / 64 : 0);
  return { spec: version.specVersion, authorized: authorized !== null, proposals: count(council) + count(technical) };
}

// The bridge closes to new locks when its check for a runtime upgrade is an hour old.
const CHECK_RENEW_MS = 40 * 60_000;

/**
 * Whether the bridge needs Midnight's newest block now, and not only the next end of an
 * authority set: its upgrade check grows old, or Midnight's runtime differs from what it knows.
 */
export function newestIsDue(known: RuntimeView | null | undefined, signs: RuntimeSigns, now = Date.now()): boolean {
  if (!known?.upgrade) return true;
  const checkedAt = Number(BigInt(known.upgrade.at) / 1_000_000n);
  return now - checkedAt > CHECK_RENEW_MS || known.upgrade.authorized !== signs.authorized || known.spec !== signs.spec;
}

/** The proof the bridge takes of whether Midnight had a runtime upgrade authorized in a block: base64 trie nodes. */
export async function upgradeProof(blockHash: string): Promise<string[]> {
  const { proof } = await nodeRpc<{ proof: string[] }>('state_getReadProof', [[AUTHORIZED_UPGRADE_KEY], blockHash]);
  return proof.map((node) => Buffer.from(node.replace(/^0x/, ''), 'hex').toString('base64'));
}

/** The bridge's Midnight light client, from `get_midnight`. */
export interface MidnightView {
  set_id: number;
  authorities: number;
  finalized_number: number;
  finalized_hash: string;
}

/**
 * The first justified block after `after`: the last block of its authority set, or the newest
 * justified block when the set has not changed since. Null when nothing newer is justified.
 * `finalized` is the node's finalized height, when the caller has just read it.
 */
export async function nextJustified(after: number, finalized?: number): Promise<FinalityProof | null> {
  // The node answers with an error, not null, for a block it has not finalized.
  if (after >= (finalized ?? (await finalizedNumber()))) return null;
  const raw = await nodeRpc<string | null>('grandpa_proveFinality', [after + 1]);
  if (!raw) return null;
  const [hash, justification] = registry.createType<ITuple<[H256, Bytes, Vec<Header>]>>('(H256, Bytes, Vec<Header>)', raw);
  const header = registry.createType<Header>('Header', await nodeRpc<object>('chain_getHeader', [hash.toHex()]));
  if (!header.hash.eq(hash)) throw new Error(`header of ${hash.toHex()} re-encodes to another hash`);
  const number = header.number.toNumber();
  if (number <= after) return null;
  return {
    number,
    hash: hash.toHex(),
    header: Buffer.from(header.toU8a()).toString('base64'),
    justification: Buffer.from(justification.toU8a(true)).toString('base64'),
  };
}

async function finalizedNumber(): Promise<number> {
  const hash = await nodeRpc<string>('chain_getFinalizedHead', []);
  return parseInt((await nodeRpc<{ number: string }>('chain_getHeader', [hash])).number, 16);
}

/** Up to 16 consecutive justified blocks after `after`, in order. */
export async function finalityBatch(after: number): Promise<FinalityProof[]> {
  const batch: FinalityProof[] = [];
  const finalized = await finalizedNumber();
  while (batch.length < MAX_FINALITY_BLOCKS) {
    const next = await nextJustified(batch.at(-1)?.number ?? after, finalized);
    if (!next) break;
    batch.push(next);
  }
  return batch;
}
