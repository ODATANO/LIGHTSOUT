import { type Account, nearToYocto } from 'near-api-js';
import { network, openBridgeBuilder, proofServer, readBridge } from './bridge.js';
import { lockIdIn, parseShieldedAddress } from './codec.js';
import { type BridgeConfig, callBridgeForReceipts, closedBecause, configFor, nearAccountOf, type NearLock, type RuntimeView, viewBridge } from './near.js';
import type { AgentIdentity } from './roles.js';
import { lockReceipt, lockReceiptOf, proveLock } from './steps.js';

// Covers the lock record's storage; the bridge refunds what it does not need.
const STORAGE_MARGIN = 10n ** 22n;

/** A lock on the NEAR bridge: its id and the receipt that logged it. */
export interface Lock {
  lockId: bigint;
  receipt: string;
}

/**
 * Locks `amount` NEAR, one of the bridge's denominations, for a shielded address on the
 * Midnight bridge `midnightBridge`. `tx` is the NEAR transaction.
 */
export async function lockNear(sender: Account, to: string, amount: string, midnightBridge: string): Promise<Lock & { tx: string }> {
  const yocto = BigInt(nearToYocto(amount as `${number}`));
  const config = await configFor(midnightBridge);
  if (!config.locks_open) {
    const runtime = await viewBridge<RuntimeView>('get_runtime');
    throw new Error(`the bridge takes no new locks now: ${runtime ? closedBecause(runtime) : 'it does not say why'}`);
  }
  const denominations = config.denominations.map(BigInt);
  let deposit = yocto;
  // With denominations the bridge locks the largest one the deposit covers and refunds the rest.
  if (denominations.length > 0) {
    if (!denominations.includes(yocto)) throw new Error(`the bridge takes ${denominations.map((d) => `${Number(d / 10n ** 21n) / 1000}`).join(', ')} NEAR`);
    deposit = yocto + STORAGE_MARGIN;
  }
  const { tx, receipts } = await callBridgeForReceipts(sender, 'lock', { midnight_recipient: to }, deposit);
  return { lockId: BigInt(lockIdIn(receipts.flatMap((r) => r.logs))), tx, receipt: lockReceipt(receipts) };
}

/**
 * The oldest lock that `sender` made for the shielded address `to` and that Midnight has not
 * minted. `minted` tells whether the Midnight bridge minted a lock id.
 */
export async function openLock(sender: string, to: string, minted: (lockId: bigint) => boolean): Promise<Lock | undefined> {
  const next = BigInt((await viewBridge<BridgeConfig>('get_config'))?.next_lock_id ?? '0');
  for (let lockId = 0n; lockId < next; lockId++) {
    if (minted(lockId)) continue;
    const lock = await viewBridge<NearLock>('get_lock', { lock_id: lockId.toString() });
    if (lock?.sender !== sender || lock.midnight_recipient !== to) continue;
    return { lockId, receipt: await lockReceiptOf(lockId, lock, parseShieldedAddress(to, network).coinPublicKey) };
  }
  return undefined;
}

/** A deposit: the lock it used, whether an earlier run had made that lock, and how far it got. */
export interface Deposit {
  lock: bigint;
  resumed: boolean;
  outcome: 'minted' | 'proven';
}

/**
 * Locks `near` NEAR for an agent and mints it at its shielded `address` on the Midnight bridge
 * `bridge`. A lock of the agent that is not minted yet is minted first, and nothing new is
 * locked. Waits until the Midnight bridge follows NEAR past the lock, which a relay brings about.
 */
export async function deposit(identity: AgentIdentity, address: string, near: string, bridge: string, note: (line: string) => void): Promise<Deposit> {
  const lock = await lockFor(identity, address, near, bridge, note);
  const builder = await openBridgeBuilder(identity.seedHex, { proofServerUrl: await proofServer() });
  try {
    const keys = parseShieldedAddress(address, network);
    return { lock: lock.lockId, resumed: lock.resumed, outcome: await proveLock(builder, bridge, lock.lockId, lock.receipt, note, { seedHex: identity.seedHex, keys }) };
  } finally {
    await builder.close();
  }
}

/** The lock a deposit works on: one of the agent that is not minted yet, or a new one of `near` NEAR. */
export async function lockFor(identity: AgentIdentity, address: string, near: string, bridge: string, note: (line: string) => void): Promise<Lock & { resumed: boolean }> {
  const minted = (await readBridge(bridge)).minted_locks;
  const open = await openLock(identity.nearAccountId, address, (id) => minted.member(id));
  if (open) {
    note(`lock ${open.lockId} is not minted yet: minting it, and locking nothing new`);
    return { ...open, resumed: true };
  }
  const made = await lockNear(nearAccountOf(identity), address, near, bridge);
  note(`lock ${made.lockId}, tx ${made.tx}`);
  return { lockId: made.lockId, receipt: made.receipt, resumed: false };
}
