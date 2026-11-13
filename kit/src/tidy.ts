import type { Ledger as Board } from 'lightsout-board';
import { type Ledger as Bridge, Stale } from 'lightsout-midnight-bridge';
import type { Call as BoardCall } from './board/calls.js';
import type { Call } from './bridge.js';

// Both contracts let anyone remove what is of no use any more, so their state stays small.
// These pick the removals a state allows. Each is a transaction of its own.

/** The NEAR blocks the bridge keeps a recorded block for after the head it was recorded under. */
export const BLOCK_KEPT_FOR = 43_200n;
const DAY_SECONDS = 86_400n;
const NO_HASH = new Uint8Array(32);
// The bridge's one removal call: a header or a block goes by its hash, a list read by its id.
const forget = (what: Stale.header | Stale.block, hash: Uint8Array): Call => ({ circuit: 'forget', args: [what, hash, 0n] });
const forgetRead = (read: bigint): Call => ({ circuit: 'forget', args: [Stale.read, NO_HASH, read] });
/** How long past its deadline a bounty stays on the board, in seconds: 30 days. */
export const BOUNTY_KEPT_SECONDS = 30n * DAY_SECONDS;
/** How many days after the day it was opened a drop stays on the board. */
export const DROP_KEPT_DAYS = 37n;
// The board's state does not list the days it holds marks of, so the last days are asked one by one.
const MARK_DAYS_BACK = 45n;

/**
 * What the Midnight bridge can drop: headers that cannot become the head any more, list reads
 * that ended and old recorded blocks. The state does not list the headers it holds signature
 * marks of, so `gone` names headers that were proposed earlier: their marks go too.
 */
export function bridgeTidy(state: Pick<Bridge, 'tip' | 'candidates' | 'signed' | 'readers' | 'blocks'>, gone: Uint8Array[] = []): Call[] {
  const { tip } = state;
  const calls: Call[] = [];
  for (const [hash, candidate] of state.candidates) {
    const passed = candidate.era !== tip.era && candidate.era !== tip.era + 1n;
    if (candidate.head.height <= tip.head.height || passed) calls.push(forget(Stale.header, hash));
  }
  for (const hash of gone) {
    if (!state.candidates.member(hash) && state.signed.member(hash)) calls.push(forget(Stale.header, hash));
  }
  for (const [read, reader] of state.readers) {
    if (reader.filling !== tip.era + 1n && read !== tip.list) calls.push(forgetRead(read));
  }
  for (const [hash, known] of state.blocks) {
    if (tip.head.height >= known.at + BLOCK_KEPT_FOR) calls.push(forget(Stale.block, hash));
  }
  return calls;
}

/**
 * What the board can drop at chain time `now`, in seconds: the marks of past days, drops past
 * their time, and bounties 30 days past their deadline. A reward nobody took back by then is
 * refunded to its refund key first, and the bounty goes with the next call.
 */
export function boardTidy(state: Pick<Board, 'marks' | 'drops' | 'bounties' | 'rewards'>, now: bigint): BoardCall[] {
  const calls: BoardCall[] = [];
  const today = now / DAY_SECONDS;
  for (let day = today - 1n; day >= 0n && day >= today - MARK_DAYS_BACK; day--) {
    if (state.marks.member(day)) calls.push({ circuit: 'forget_marks', args: [day] });
  }
  for (const [id, drop] of state.drops) {
    if ((drop.day + DROP_KEPT_DAYS) * DAY_SECONDS <= now) calls.push({ circuit: 'forget_drop', args: [id] });
  }
  for (const [id, bounty] of state.bounties) {
    if (now <= bounty.deadline + BOUNTY_KEPT_SECONDS) continue;
    calls.push({ circuit: state.rewards.member(id) ? 'refund_bounty' : 'forget_bounty', args: [id] });
  }
  return calls;
}
