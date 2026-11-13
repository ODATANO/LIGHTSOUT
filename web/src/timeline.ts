// What happened at the bridge in one order: deposits and withdrawals as both contracts show
// them, and the transactions that called the bridge on either chain.
import { nearOf, YOCTO_PER_UNIT } from 'lightsout-kit/codec';
import type { ContractCall, NearCall } from 'lightsout-kit/history';
import type { BridgeOverview } from 'lightsout-kit/overview';

export type BridgeRow =
  | {
      kind: 'deposit' | 'withdrawal';
      id: string; // a lock's number on NEAR, or a burn's id of 64 hex
      account: string; // the NEAR account that paid in, or the one that is paid
      near: string; // the amount in NEAR
      done: boolean; // wNEAR minted for the deposit, or the withdrawal paid out on NEAR
      tx?: string; // the NEAR transaction of the lock or of the payout; absent while the index does not name it
    }
  | {
      kind: 'call';
      chain: 'near' | 'midnight';
      circuit: string; // the circuit of the Midnight bridge or the method of the NEAR contract that ran
      tx: string; // the newest transaction of the row
      first: string; // the oldest one, which names the row while it grows
      at: number; // Unix seconds; the newest transaction's block time
      times: number; // calls of this kind in a row, shown as one
      ok: boolean; // the transaction ran in full; the NEAR index does not say, so true there
    };

type Call = Extract<BridgeRow, { kind: 'call' }>;

/** What indexes list of the bridge beside the contracts' own state. Each list is newest first. */
export interface Seen {
  midnight?: readonly ContractCall[]; // calls on the Midnight bridge
  near?: readonly NearCall[]; // calls on the NEAR contract
  released?: ReadonlyMap<string, string>; // burn id -> the NEAR transaction that paid it out
}

// Midnight makes a block every six seconds.
const MIDNIGHT_BLOCK_SECONDS = 6;
// A lock and a payout stand as a deposit and a withdrawal, so their calls are not listed again.
const IN_A_ROW = new Set(['lock', 'release']);

// Calls of one kind that follow each other stand as one row, under the newest of them.
function grouped(calls: readonly Omit<Call, 'kind' | 'first' | 'times'>[]): Call[] {
  const rows: Call[] = [];
  for (const call of calls) {
    const last = rows.at(-1);
    if (last && last.circuit === call.circuit && last.ok === call.ok) {
      last.times++;
      last.first = call.tx;
    } else {
      rows.push({ kind: 'call', ...call, first: call.tx, times: 1 });
    }
  }
  return rows;
}

/**
 * The bridge's deposits, withdrawals and calls, the newest first. Neither contract keeps a
 * time. A lock is placed by its NEAR transaction when the index names it, else by its NEAR
 * block. A burn is placed by its payout's transaction, else by its Midnight block.
 */
export function timeline(
  bridge: Pick<BridgeOverview['near'], 'height' | 'blockSeconds' | 'recent'>,
  midnight: Pick<BridgeOverview['midnight'], 'height' | 'burns'>,
  seen: Seen = {},
  nowSeconds = Date.now() / 1000,
): BridgeRow[] {
  const near = seen.near ?? [];
  const byTx = new Map(near.map((call) => [call.tx, call]));
  const deposits = bridge.recent.map((lock) => {
    const sent = near.find((call) => call.method === 'lock' && call.signer === lock.sender && BigInt(call.height) === lock.height);
    return {
      ago: sent ? nowSeconds - sent.at : Number(bridge.height - lock.height) * bridge.blockSeconds,
      row: { kind: 'deposit' as const, id: lock.id.toString(), account: lock.sender, near: nearOf(lock.amount / YOCTO_PER_UNIT), done: lock.minted, ...(sent ? { tx: sent.tx } : {}) },
    };
  });
  const withdrawals = midnight.burns.map((burn) => {
    const tx = seen.released?.get(burn.id);
    const paid = tx ? byTx.get(tx) : undefined;
    // A burn that NEAR has not proven yet is the newest thing there is.
    const burnt = burn.block === undefined ? 0 : Number(midnight.height - BigInt(burn.block)) * MIDNIGHT_BLOCK_SECONDS;
    return {
      ago: paid ? nowSeconds - paid.at : burnt,
      row: { kind: 'withdrawal' as const, id: burn.id, account: burn.to, near: nearOf(burn.amount), done: burn.paid, ...(tx ? { tx } : {}) },
    };
  });
  const onMidnight = grouped((seen.midnight ?? []).map((call) => ({ chain: 'midnight' as const, circuit: call.circuit, tx: call.tx, at: call.at, ok: call.ok })));
  const onNear = grouped(near.filter((call) => !IN_A_ROW.has(call.method)).map((call) => ({ chain: 'near' as const, circuit: call.method, tx: call.tx, at: call.at, ok: true })));
  const called = [...onMidnight, ...onNear].map((row) => ({ ago: nowSeconds - row.at, row }));
  return [...deposits, ...withdrawals, ...called].sort((a, b) => a.ago - b.ago).map(({ row }) => row);
}
