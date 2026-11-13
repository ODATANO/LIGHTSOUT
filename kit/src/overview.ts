// What anyone can read of the bridge and the board. Needs no key and sends nothing.
import { bountiesOf } from './board/bounty.js';
import { ledger as boardLedger } from 'lightsout-board';
import { ledger } from 'lightsout-midnight-bridge';
import { decodeNearRecipient, YOCTO_PER_UNIT } from './codec.js';
import { env } from './env.js';
import { promptIn } from './inference/nearai.js';
import { type MidnightView, type RuntimeSigns, runtimeSigns } from './midnight-finality.js';
import { nodeRpc, stateFromNode } from './midnight-node.js';
import { bridgeAccount, type BridgeConfig, bridgeId, type Closed, closedFor, nearClock, type NearLock, type ProvenBurn, type RuntimeView, viewBridge } from './near.js';

const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');
// Locks not read before that one call looks up. The rest follow with the next calls.
const LOCKS_A_READ = 15;

export interface Burn {
  id: string; // 64 hex; the hash of the burned coin
  amount: bigint; // micro-NEAR
  to: string; // NEAR account
  paid: boolean; // released on NEAR in full
  paidOut: bigint; // micro-NEAR; paid out on NEAR or on its way
  block?: number; // the Midnight block of the burn; absent until NEAR has proven it
}

export interface PublicLock {
  id: bigint; // its number on NEAR
  sender: string; // NEAR account
  amount: bigint; // yoctoNEAR
  height: bigint; // the NEAR block it ran in
  minted: boolean; // wNEAR was minted for it on Midnight
}

export interface BridgeOverview {
  near: {
    bridge: string; // NEAR account
    midnightBridge: string; // 64 hex; the Midnight bridge it pays out for
    locks: bigint;
    locked: bigint; // yoctoNEAR
    released: bigint; // yoctoNEAR
    registered: bigint;
    dailyLimit: bigint; // yoctoNEAR; the most it locks in a day, and the most it releases
    lockedToday: bigint; // yoctoNEAR
    releasedToday: bigint; // yoctoNEAR
    denominations: bigint[]; // yoctoNEAR; the only amounts a lock takes; empty = any
    registrationFee: bigint; // yoctoNEAR
    beneficiary: string; // the NEAR account the registration fees go to
    locksOpen: boolean; // it takes new locks and registrations now
    closed?: Closed; // why it takes none; absent while it takes them
    keys: number; // access keys of its account; a holder of one can replace the contract; 0 = nobody can
    codeHash: string; // base58; the hash of the contract's code
    runtime?: RuntimeView; // what it knows of Midnight's runtime, which decides that
    midnight?: MidnightView; // how far it follows Midnight
    height: bigint; // NEAR's newest final block
    blockSeconds: number; // how long a NEAR block took of late
    recent: PublicLock[]; // its newest locks, the newest first; empty when none were asked for
  };
  midnight: {
    bridge: string; // 64 hex
    keys: number; // maintenance keys; a holder of one can replace its circuits; 0 = nobody can
    nearBridge: string; // the NEAR account it mints for
    nearHeight: bigint; // the NEAR block it follows to
    era: bigint; // epochs after its start
    nextProducersKnown: boolean;
    provenLocks: bigint;
    minted: bigint;
    members: bigint;
    burns: Burn[]; // the burns it still keeps: the newest, one per first byte of their id
    runtime: RuntimeSigns; // what Midnight itself says about its runtime now
    height: bigint; // Midnight's finalized block this was read at
    wnear?: bigint; // micro-NEAR; the wNEAR that exists; absent while not every unminted lock is read
  };
}

/**
 * Both bridge contracts, with the `newestLocks` newest locks. `known` saves the lookups of locks
 * and burns that an earlier call read.
 */
export async function bridgeOverview(known?: BridgeOverview, newestLocks = 0): Promise<BridgeOverview> {
  const bridge = env('MIDNIGHT_BRIDGE');
  const config = await viewBridge<BridgeConfig>('get_config');
  if (!config) throw new Error(`${bridgeId} answers no get_config`);
  const midnight = await viewBridge<MidnightView>('get_midnight');
  const runtime = await viewBridge<RuntimeView>('get_runtime');
  const account = await bridgeAccount();
  const clock = await nearClock();
  const head = await nodeRpc<string>('chain_getFinalizedHead', []);
  const { number } = await nodeRpc<{ number: string }>('chain_getHeader', [head]);
  const contract = await stateFromNode(bridge, head);
  const state = ledger(contract.data);
  const burntBefore = new Map(known?.midnight.burns.map((burn) => [burn.id, burn]));
  const burns: Burn[] = [];
  for (const [, burn] of state.burns) {
    const id = hex(burn.id);
    const old = burntBefore.get(id);
    // A burn that is paid in full stays so. Any other is asked about again.
    const proven = old?.paid ? undefined : await viewBridge<ProvenBurn>('get_proven_burn', { burn_id: id });
    const block = old?.block ?? proven?.block;
    const paidOut = old?.paid ? old.paidOut : proven ? BigInt(proven.paid) / YOCTO_PER_UNIT : 0n;
    // NEAR releases only a burn it has proven.
    const paid = old?.paid === true || (proven != null && (await viewBridge<boolean>('is_released', { burn_id: id })) === true);
    burns.push({ id, amount: burn.value, to: decodeNearRecipient(burn.near_recipient), paid, paidOut, block });
  }
  const lockedBefore = new Map(known?.near.recent.map((lock) => [lock.id, lock]));
  const recent: PublicLock[] = [];
  let fresh = 0;
  for (let id = BigInt(config.next_lock_id) - 1n; id >= 0n && recent.length < newestLocks; id--) {
    const minted = state.minted_locks.member(id);
    const old = lockedBefore.get(id);
    if (old) {
      recent.push({ ...old, minted });
      continue;
    }
    if (fresh++ >= LOCKS_A_READ) break;
    const lock = await viewBridge<NearLock>('get_lock', { lock_id: id.toString() });
    if (lock) recent.push({ id, sender: lock.sender, amount: BigInt(lock.amount), height: BigInt(lock.block_height), minted });
  }
  // What exists on Midnight: the NEAR the contract holds, less locks not minted and burns not paid yet.
  const unminted = recent.filter((lock) => !lock.minted);
  const everyUnmintedRead = BigInt(unminted.length) === BigInt(config.next_lock_id) - state.minted_locks.size();
  const held = BigInt(config.total_locked) - BigInt(config.total_released) - unminted.reduce((sum, lock) => sum + lock.amount, 0n);
  const wnear = everyUnmintedRead ? held / YOCTO_PER_UNIT - burns.reduce((sum, burn) => sum + burn.amount - burn.paidOut, 0n) : undefined;
  return {
    near: {
      bridge: bridgeId,
      midnightBridge: config.midnight_bridge,
      locks: BigInt(config.next_lock_id),
      locked: BigInt(config.total_locked),
      released: BigInt(config.total_released),
      registered: BigInt(config.registered),
      dailyLimit: BigInt(config.daily_limit),
      lockedToday: BigInt(config.locked_today),
      releasedToday: BigInt(config.released_today),
      denominations: config.denominations.map(BigInt),
      registrationFee: BigInt(config.registration_fee),
      beneficiary: config.beneficiary,
      locksOpen: config.locks_open,
      closed: runtime ? closedFor(runtime) : undefined,
      keys: account.keys,
      codeHash: account.codeHash,
      runtime,
      midnight,
      height: clock.height,
      blockSeconds: clock.blockSeconds,
      recent,
    },
    midnight: {
      bridge,
      keys: contract.maintenanceAuthority.committee.length,
      nearBridge: Buffer.from(state.bridge).toString(),
      nearHeight: state.tip.head.height,
      era: state.tip.era,
      nextProducersKnown: state.tip.nextTotal !== 0n,
      provenLocks: state.locks.size(),
      minted: state.minted_locks.size(),
      members: state.joined.size(),
      burns,
      runtime: await runtimeSigns(),
      height: BigInt(number),
      wnear,
    },
  };
}

export interface PublicBounty {
  id: string; // 64 hex
  model: string;
  prompt?: string; // the question, when its request is on the board
  reward?: bigint; // units of wNEAR, while the board keeps it
  deadline: bigint; // Unix seconds; a refund is possible after it
  answer?: string; // 64 hex; the drop that answered it
}

export interface BoardOverview {
  board: string; // 64 hex
  keys: number; // maintenance keys; a holder of one can replace its circuits; 0 = nobody can
  bounties: PublicBounty[];
  drops: bigint; // answers that are being sealed or are sealed
  sealing: { blocks: bigint; left: bigint }[]; // answers being sealed now: 64-byte parts stored, content bytes left
}

/** The board as everyone sees it: no asker and no solver. */
export async function boardOverview(): Promise<BoardOverview> {
  const board = env('MIDNIGHT_BOARD');
  const contract = await stateFromNode(board);
  const state = boardLedger(contract.data);
  const bounties = bountiesOf(state).map((b) => ({ id: b.id, model: b.model, prompt: promptIn(b.request ?? ''), reward: b.reward, deadline: b.deadline, answer: b.answer }));
  const sealing = [...state.seals].filter(([, seal]) => !seal.done).map(([, seal]) => ({ blocks: seal.blocks, left: seal.remaining }));
  return { board, keys: contract.maintenanceAuthority.committee.length, bounties, drops: state.drops.size(), sealing };
}
