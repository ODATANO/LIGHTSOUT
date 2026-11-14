import { yoctoToNear } from 'near-api-js';
import type { Bounty } from '../agent.js';
import { LEAST_BURN, nearOf, unitsOf } from '../codec.js';
import type { BridgeConfig } from '../near.js';
import type { DayCounts } from './counts.js';
import type { Action, View } from './mind.js';

// What a crowd's agent may do, for every loop that runs a crowd. It holds the limits of a day,
// what an agent keeps back, and the view both give it.

export type Act = Exclude<Action, 'wait'>;
export const ACTS: readonly Act[] = ['ask', 'send', 'withdraw', 'deposit'];
// The order of two actions that used the same part of their limits: the bridge first.
const BRIDGE_FIRST: readonly Act[] = ['withdraw', 'deposit', 'ask', 'send'];

/** What one agent does at most in a UTC day. The board takes 32 calls a day from a member. */
export const PER_DAY: Record<Act, number> = { ask: 12, send: 8, withdraw: 16, deposit: 16 };
export const REWARDS: readonly string[] = ['0.01', '0.02', '0.05'];
/** What the rules send, and the most one transfer inside the crowd moves. */
export const SEND = unitsOf('0.02');
export const SEND_AT_MOST = unitsOf('0.05');
export const WITHDRAW = LEAST_BURN;
// A transfer or a withdrawal leaves this much wNEAR for questions, and a deposit this much NEAR for gas.
export const KEEP_WNEAR = unitsOf('0.3');
export const KEEP_NEAR = 2n * 10n ** 23n;
// Above this an agent locks no more NEAR.
export const ENOUGH_WNEAR = unitsOf('1.5');
export const RECENT = 12;
export const ANSWER_TOKENS = 64;
export const QUESTION_MINUTES = 120;

const MANY: Record<Act, string> = { ask: 'questions', send: 'transfers', withdraw: 'withdrawals', deposit: 'deposits' };

/** What a loop reads for an agent before its turn. */
export interface Sight {
  name: string;
  wnear: bigint; // micro-NEAR; its shielded balance
  near: bigint; // yoctoNEAR; its NEAR account's balance
  bounties: Pick<Bounty, 'prompt' | 'mine' | 'state' | 'deadline'>[]; // the board
  others: string[]; // the other agents of the crowd, by name
  recent: string[]; // what the crowd did lately, oldest first
  lock?: bigint; // yoctoNEAR; absent = the bridge takes no lock now; its smallest lock
}

/** The smallest amount the NEAR bridge locks, while it takes locks. */
export function smallestLock(config: Pick<BridgeConfig, 'locks_open' | 'denominations'> | undefined): bigint | undefined {
  if (!config?.locks_open) return undefined;
  return config.denominations.map(BigInt).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];
}

/** A lock's amount as the NEAR a deposit names. */
export const nearOfLock = (lock: bigint): string => yoctoToNear(lock);

/** How often `name` did each thing today. */
export async function todayOf(counts: DayCounts, name: string): Promise<Record<Act, number>> {
  const today = { ask: 0, send: 0, withdraw: 0, deposit: 0 };
  for (const act of ACTS) today[act] = await counts.of(`${name}:${act}`);
  return today;
}

/** The possible actions, first the one that used the smallest part of its day's limit. */
export function dueOf(today: Record<Act, number>, may: Record<Act, boolean>): Act[] {
  return BRIDGE_FIRST.filter((act) => may[act]).sort((a, b) => today[a] * PER_DAY[b] - today[b] * PER_DAY[a]);
}

/** Why the day's counts or the agent's funds rule an action out now. An action without an entry is possible. */
export function barred(sight: Sight, today: Record<Act, number>, rewards: readonly string[]): Partial<Record<Act, string>> {
  const { name, wnear, near, lock } = sight;
  const keeps = `${name} keeps ${nearOf(KEEP_WNEAR)} wNEAR for questions`;
  const why = (act: Act): string | undefined => {
    if (today[act] >= PER_DAY[act]) return `${name} reached today's limit of ${PER_DAY[act]} ${MANY[act]}`;
    if (act === 'ask') {
      const most = rewards.at(-1);
      if (most === undefined) return 'no reward of the crowd reaches the least one a solver takes';
      return wnear < unitsOf(most) ? `${name} holds too little wNEAR for a question` : undefined;
    }
    if (act === 'send') {
      if (sight.others.length === 0) return `${name} is alone in the crowd`;
      return wnear < SEND + KEEP_WNEAR ? keeps : undefined;
    }
    if (act === 'withdraw') return wnear < WITHDRAW + KEEP_WNEAR ? keeps : undefined;
    if (lock === undefined) return 'the bridge takes no new locks now';
    if (near < lock + KEEP_NEAR) return `${name} keeps ${yoctoToNear(KEEP_NEAR)} NEAR for gas`;
    return wnear >= ENOUGH_WNEAR ? `${name} holds enough wNEAR and locks no more NEAR` : undefined;
  };
  const bars: Partial<Record<Act, string>> = {};
  for (const act of ACTS) {
    const bar = why(act);
    if (bar) bars[act] = bar;
  }
  return bars;
}

/** The view `sight` gives its agent. `nowSeconds` is Unix time. */
export function viewOf(sight: Sight, today: Record<Act, number>, rewards: readonly string[], nowSeconds = Date.now() / 1000): View {
  const bars = barred(sight, today, rewards);
  const may = { ask: !bars.ask, send: !bars.send, withdraw: !bars.withdraw, deposit: !bars.deposit };
  return {
    name: sight.name,
    wnear: nearOf(sight.wnear),
    near: yoctoToNear(sight.near, 3),
    open: sight.bounties.filter((b) => b.mine && b.state === 'open').map((b) => ({ question: b.prompt ?? '', minutes: Math.max(0, Math.round((nowSeconds - (b.deadline - QUESTION_MINUTES * 60)) / 60)) })),
    others: sight.others,
    recent: sight.recent.slice(-RECENT),
    onBoard: sight.bounties.flatMap((b) => (b.prompt ? [b.prompt] : [])),
    today,
    may,
    due: dueOf(today, may),
    rewards: [...rewards],
  };
}
