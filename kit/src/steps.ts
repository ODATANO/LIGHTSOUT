import type { Account } from 'near-api-js';
import { teraToGas } from 'near-api-js';
import type { TxBuilder } from '@odatano/nightgate-tx/txbuilder';
import { ownRead, readBridge, renewRead, send } from './bridge.js';
import { isNearAccount, nearOf, type ShieldedKeys, YOCTO_PER_UNIT } from './codec.js';
import { continues, followCalls, lockCalls, registerCalls } from './feed.js';
import { burnBlock, burnTxProof, type FinalizedHere, headAt, headBlock, headersBetween, headersEnd, headTxProof, MAX_BURN_HEADERS, type TxProof } from './midnight-burn-tx.js';
import { finalityBatch, type MidnightView, nextJustified, upgradeProof } from './midnight-finality.js';
import { bridgeId, callBridge, type NearLock, nearSource, PROVE_DEPOSIT, PROVE_GAS, type ProvenBurn, type Registration, type RuntimeView, viewBridge } from './near.js';
import { findReceipt } from './near-find.js';
import { lockLine } from './near-prover.js';
import { NotLanded } from './not-landed.js';

// The steps of the bridge. Anyone can run each of them: none needs a key either contract trusts.

const FINALITY_GAS = teraToGas('300');
// Covers the block hashes of 16 blocks; the bridge refunds what storage does not use.
const FINALITY_DEPOSIT = 5n * 10n ** 22n;
const LOCK_LINE = 'lightsout:lock:';
const JOIN_LINE = 'lightsout:join:';

type Say = (line: string) => void;
const MOVED_TRIES = 8;

/**
 * Another party can move the bridge's state under a call. Then the call's check fails, or no
 * block takes its transaction. This waits before the next try, which starts from the state then.
 * It throws `e` for any other error and after `MOVED_TRIES`.
 */
async function afterMove(e: unknown, tries: number): Promise<void> {
  const moved = e instanceof NotLanded || (e instanceof Error && e.name === 'ContractExecutionError');
  if (!moved || tries >= MOVED_TRIES) throw e;
  await new Promise((r) => setTimeout(r, 15_000));
}

/**
 * Brings the Midnight bridge one step closer to NEAR's newest block: the next epoch's producer
 * list, then a header. `wanted` is a NEAR height that must end up under the head. Returns how
 * many calls it sent.
 */
export async function followNear(builder: TxBuilder, bridge: string, say: Say, wanted?: bigint): Promise<number> {
  const state = await readBridge(bridge);
  // A read of an earlier epoch or one that ended makes way for a new one.
  if (state.readers.member(ownRead()) && !continues(state, ownRead())) renewRead();
  const calls = await followCalls(state, nearSource, ownRead(), wanted);
  for (const call of calls) say(`${call.circuit} on Midnight, tx ${await send(builder, bridge, call)}`);
  return calls.length;
}

/** One step of the head towards NEAR block `height`. Waits when the bridge can take no header yet. */
async function moveHead(builder: TxBuilder, bridge: string, height: bigint, say: Say): Promise<void> {
  for (let tries = 1; ; tries++) {
    try {
      if ((await followNear(builder, bridge, say, height)) > 0) return;
      say(`waiting until the Midnight bridge can take a NEAR header above block ${height}`);
      return await new Promise((r) => setTimeout(r, 15_000));
    } catch (e) {
      await afterMove(e, tries);
    }
  }
}

/** The id of the receipt that logged a lock, among the receipts a transaction ran on the bridge. */
export function lockReceipt(receipts: { id: string; logs: string[] }[]): string {
  const receipt = receipts.find((r) => r.logs[0]?.startsWith(LOCK_LINE));
  if (!receipt) throw new Error('the transaction logged no lock on the bridge');
  return receipt.id;
}

/** The id of the receipt that logged lock `lockId`, found from the lock's record on NEAR. `coinPublicKey` is the recipient's, in hex. */
export function lockReceiptOf(lockId: bigint, lock: NearLock, coinPublicKey: string): Promise<string> {
  const line = lockLine(lockId, BigInt(lock.amount) / YOCTO_PER_UNIT, coinPublicKey);
  return findReceipt(nearSource, { signer: lock.sender, receiver: bridgeId, method: 'lock' }, line, Number(lock.block_height));
}

/** The wallet that mints its own locks: its seed and the shielded keys of its address. */
export interface Minter {
  seedHex: string;
  keys: ShieldedKeys;
}

/**
 * Proves the lock that `receiptId` logged to the Midnight bridge, after moving the head past the
 * lock's block when needed. With `minter` it also mints, when the lock names that wallet.
 */
export async function proveLock(builder: TxBuilder, bridge: string, lockId: bigint, receiptId: string, say: Say, minter?: Minter): Promise<'minted' | 'proven'> {
  const lock = await viewBridge<NearLock>('get_lock', { lock_id: lockId.toString() });
  if (!lock) throw new Error(`${bridgeId} has no lock ${lockId}`);
  const height = BigInt(lock.block_height);
  for (let tries = 1; ; ) {
    const state = await readBridge(bridge);
    if (state.minted_locks.member(lockId)) return 'minted';
    if (state.tip.head.height <= height) {
      await moveHead(builder, bridge, height, say);
      continue;
    }
    const proof = await nearSource.receiptProof(receiptId, await nearSource.hashAt(state.tip.head.height));
    const calls = lockCalls(state, proof, minter?.keys);
    if (calls.length === 0) return 'proven';
    try {
      for (const call of calls) say(`${call.circuit} for lock ${lockId} on Midnight, tx ${await send(builder, bridge, call, minter?.seedHex)}`);
    } catch (e) {
      // The proof holds for one head. A relay beside this run can set a newer one first.
      await afterMove(e, tries++);
    }
  }
}

/**
 * The id of the receipt in which `account` made `registration`, found from the account and the
 * block alone. It misses a registration that another contract made for the account.
 */
export function registrationReceipt(account: string, registration: Registration): Promise<string> {
  const line = `${JOIN_LINE}${BigInt(registration.index).toString(16).padStart(16, '0')}${registration.commitment}`;
  return findReceipt(nearSource, { signer: account, receiver: bridgeId, method: 'register' }, line, Number(registration.block_height));
}

/**
 * Proves the registration that `receiptId` logged to the Midnight bridge, after moving the head
 * past the registration's block when needed. Returns once the bridge has the index.
 */
export async function proveRegistration(builder: TxBuilder, bridge: string, registration: Registration, receiptId: string, say: Say): Promise<void> {
  const index = BigInt(registration.index);
  const height = BigInt(registration.block_height);
  for (let tries = 1; ; ) {
    const state = await readBridge(bridge);
    if (state.joined.member(index)) return;
    if (state.tip.head.height <= height) {
      await moveHead(builder, bridge, height, say);
      continue;
    }
    const proof = await nearSource.receiptProof(receiptId, await nearSource.hashAt(state.tip.head.height));
    try {
      for (const call of registerCalls(state, proof)) say(`${call.circuit} for registration ${index} on Midnight, tx ${await send(builder, bridge, call)}`);
    } catch (e) {
      // The proof holds for one head. A relay beside this run can set a newer one first.
      await afterMove(e, tries++);
    }
  }
}

export interface FollowOptions {
  calls?: number; // default 8; the most batches it submits
  newest?: boolean; // default true; false submits only when an authority set ended, since each stored block costs NEAR
}

/** Feeds the NEAR bridge the justified Midnight blocks it lacks. Returns its view after. */
export async function followMidnight(account: Account, say: Say, { calls = 8, newest = true }: FollowOptions = {}): Promise<MidnightView> {
  for (let i = 0; ; i++) {
    const m = await viewBridge<MidnightView>('get_midnight');
    if (!m) throw new Error('get_midnight returned nothing');
    const blocks = i < calls ? await finalityBatch(m.finalized_number) : [];
    // One block alone is the newest justified one. Before it come the last blocks of sets that ended.
    if (blocks.length === 0 || (blocks.length === 1 && !newest)) return m;
    // With the newest block goes the proof of whether Midnight has a runtime upgrade authorized.
    const upgrade_proof = await upgradeProof(blocks.at(-1)!.hash);
    await callBridge(account, 'submit_midnight_finality', { blocks: blocks.map(({ header, justification }) => ({ header, justification })), upgrade_proof }, FINALITY_DEPOSIT, FINALITY_GAS);
    say(`NEAR finalized Midnight to block ${blocks.at(-1)!.number}`);
  }
}

// What the bridge answers when the table it was told to read a block with does not fit that block.
const TABLE_DOES_NOT_FIT = /events: |runtime \d+: |extrinsic is not an unsigned Midnight/;

// A NEAR transaction carries 1.5 MB. A node of a state proof above `STAGE_ABOVE` bytes goes to
// the bridge in parts of `PART_BYTES` first: the events of a full Midnight block.
const STAGE_ABOVE = 500_000;
const PART_BYTES = 900_000;
// What the bridge keeps per staged part beside its bytes, generously; it refunds the rest.
const PART_OVERHEAD_BYTES = 500;
const STORAGE_BYTE_YOCTO = 10n ** 19n;

/** A proof as the bridge takes it, and what gives staged parts back when the proof is not used. */
export interface Sendable {
  proof: TxProof & { staged?: number };
  drop(): Promise<void>;
}

/**
 * Makes a proof fit NEAR's transactions: its largest state node, when too large for one call,
 * is staged on the bridge in parts, which the proof's call then takes. The parts hold a deposit
 * of 0.01 NEAR per kB until that call or `drop`.
 */
export async function sendable(account: Account, proof: TxProof): Promise<Sendable> {
  const sizes = proof.state_proof.map((node) => Buffer.byteLength(node, 'base64'));
  const largest = sizes.indexOf(Math.max(...sizes));
  if ((sizes[largest] ?? 0) <= STAGE_ABOVE) return { proof, drop: async () => undefined };
  const node = Buffer.from(proof.state_proof[largest]!, 'base64');
  // Removing 1.5 MB of parts takes about 50 Tgas, the default of a call.
  const drop = async (): Promise<void> => {
    await callBridge(account, 'drop_staged', {}, undefined, PROVE_GAS);
  };
  // Parts of an earlier try would stand in the way.
  await drop();
  let staged = 0;
  for (let at = 0; at < node.length; at += PART_BYTES, staged++) {
    const bytes = node.subarray(at, at + PART_BYTES);
    await callBridge(account, 'stage', { part: staged, bytes: bytes.toString('base64') }, BigInt(bytes.length + PART_OVERHEAD_BYTES) * STORAGE_BYTE_YOCTO, PROVE_GAS);
  }
  return { proof: { ...proof, state_proof: proof.state_proof.filter((_, i) => i !== largest), staged }, drop };
}

// Sends the proof of a Midnight transaction to `method` of the bridge. A runtime version can
// have several tables, and anyone can add one. A table that does not fit the transaction's
// block is passed over for the version's next one.
async function proveTx(account: Account, method: 'prove_burn_tx' | 'prove_head_tx', proof: TxProof, deposit?: bigint): Promise<void> {
  const { proof: sent, drop } = await sendable(account, proof);
  let first: Error | undefined;
  for (let table = 0; ; table++) {
    try {
      await callBridge(account, method, { ...sent, table }, deposit, PROVE_GAS);
      return;
    } catch (e) {
      const moveOn = e instanceof Error && e.name === 'ContractExecutionError' && !e.message.includes('the bridge has no table') && TABLE_DOES_NOT_FIT.test(e.message);
      if (moveOn) {
        first ??= e;
        continue;
      }
      // A call that failed left its parts staged.
      await drop().catch(() => undefined);
      throw e instanceof Error && e.message.includes('the bridge has no table') ? (first ?? e) : e;
    }
  }
}

// What the NEAR bridge finalized of Midnight, as a proof of a Midnight transaction needs it.
function finalizedHere(m: MidnightView): FinalizedHere {
  return { head: m.finalized_number, hasHash: async (block: number) => (await viewBridge<string>('get_finalized_hash', { block })) != null };
}

const justifiedAfter = async (block: number): Promise<number | null> => (await nextJustified(block))?.number ?? null;

/**
 * What the NEAR bridge finalized, with Midnight block `block` within reach of a proof. A proof
 * links its block to a stored one through at most 300 headers. When the bridge stored none
 * that close, it is made to keep ancestors of its head, one every 299 blocks back.
 */
async function reachOf(account: Account, block: number, m: MidnightView, say: Say): Promise<FinalizedHere> {
  const here = finalizedHere(m);
  if ((await headersEnd(block, await justifiedAfter(block - 1), here)) !== null) return here;
  let end = here.head;
  while (end - block >= MAX_BURN_HEADERS) {
    const from = end - (MAX_BURN_HEADERS - 1);
    await callBridge(account, 'keep_ancestor', { headers: await headersBetween(from, end) }, PROVE_DEPOSIT, PROVE_GAS);
    say(`NEAR keeps Midnight block ${from}, an ancestor of block ${end}`);
    end = from;
  }
  return { ...here, kept: end };
}

/** How `releaseBurn` ended. */
export type Released =
  | 'released' // paid in full
  | 'not final yet' // NEAR has not finalized a Midnight block in which the Midnight bridge keeps the burn
  | 'no account' // NEAR cannot pay the name the burn gives
  | 'day limit'; // the bridge paid what its limit of the day left, or nothing; the rest follows on a later day

/**
 * Proves the burn with this id, 64 hex, to the NEAR bridge and pays it out. `block` is the
 * burn's Midnight block. Without it the block is searched, which finds a burn only while the
 * Midnight bridge still keeps it.
 */
export async function releaseBurn(account: Account, bridge: string, id: string, say: Say, block?: number): Promise<Released> {
  const burn_id = id;
  const short = id.slice(0, 12);
  let proven = await viewBridge<ProvenBurn>('get_proven_burn', { burn_id });
  if (!proven) {
    const m = await followMidnight(account, say);
    const at = block ?? (await burnBlock(bridge, Buffer.from(id, 'hex'), m.finalized_number));
    if (at === null || at > m.finalized_number) return 'not final yet';
    await proveTx(account, 'prove_burn_tx', await burnTxProof(bridge, Buffer.from(id, 'hex'), at, await reachOf(account, at, m, say), justifiedAfter), PROVE_DEPOSIT);
    say(`proved burn ${short} from its transaction in Midnight block ${at}`);
    proven = await viewBridge<ProvenBurn>('get_proven_burn', { burn_id });
    if (!proven) throw new Error(`${bridgeId} does not show burn ${id} after its proof`);
  }
  if (proven.paid === proven.amount) return 'released';
  const near = (yocto: string): string => nearOf(BigInt(yocto) / YOCTO_PER_UNIT);
  const recipient = proven.near_recipient;
  // The bridge refuses a name that is no account id, and its transfer to a missing account fails.
  if (!isNearAccount(recipient)) {
    say(`burn ${short}: NEAR cannot pay ${near(proven.amount)} NEAR to "${recipient}"`);
    return 'no account';
  }
  let sent: boolean;
  try {
    sent = await callBridge<boolean>(account, 'release', { burn_id });
  } catch (e) {
    if (e instanceof Error && e.name === 'ContractExecutionError' && e.message.includes('daily release limit reached')) return 'day limit';
    throw e;
  }
  if (!sent) {
    say(`burn ${short}: NEAR cannot pay ${near(proven.amount)} NEAR to "${recipient}"`);
    return 'no account';
  }
  const now = await viewBridge<ProvenBurn>('get_proven_burn', { burn_id });
  if (now && now.paid !== now.amount) {
    say(`paid ${near(now.paid)} of ${near(now.amount)} NEAR of burn ${short} to ${recipient}; the rest follows when the bridge's limit of the day allows`);
    return 'day limit';
  }
  say(`released burn ${short}: ${near(proven.amount)} NEAR to ${recipient}`);
  return 'released';
}

/** A relay shows the NEAR bridge a newer head once the one it knows is this many NEAR blocks old: half of what the bridge allows. */
export const HEAD_REFRESH_BLOCKS = 21_600n;

/**
 * Shows the NEAR bridge the newest NEAR block that the Midnight bridge made its head, once the
 * one it knows is `HEAD_REFRESH_BLOCKS` old or it knows none. The bridge takes new funds only
 * while that block is recent. Returns the height it proved, if it proved one.
 */
export async function proveHead(account: Account, bridge: string, say: Say): Promise<bigint | undefined> {
  const runtime = await viewBridge<RuntimeView>('get_runtime');
  // The head is proven from a transaction, which NEAR reads only with a table for the runtime.
  if (!runtime?.readable) return undefined;
  const known = runtime.accepted_head == null ? undefined : BigInt(runtime.accepted_head);
  if (known !== undefined && (await nearSource.finalHeight()) - known < HEAD_REFRESH_BLOCKS) return undefined;
  const m = await viewBridge<MidnightView>('get_midnight');
  if (!m) throw new Error('get_midnight returned nothing');
  // The Midnight bridge's head in the newest Midnight block NEAR finalized, and the block that set it.
  const head = await headAt(bridge, m.finalized_number);
  if (head === undefined || (known !== undefined && head <= known)) return undefined;
  const block = await headBlock(bridge, head, m.finalized_number);
  const found = block === null ? null : await headTxProof(bridge, block, await reachOf(account, block, m, say), justifiedAfter);
  if (!found || (known !== undefined && found.height <= known)) return undefined;
  await proveTx(account, 'prove_head_tx', found.proof);
  say(`showed NEAR that the Midnight bridge follows it to block ${found.height}`);
  return found.height;
}
