import type { Bounty } from '../agent.js';

// An answer takes ten minutes or more, so a bounty with less time left cannot be won.
export const LEAST_SOLVE_SECONDS = 10 * 60;

/** The bounties a solver works for, the nearest deadline first: open, of others, readable and worth `least`. */
export function forSolver(bounties: readonly Bounty[], least: bigint): Bounty[] {
  return bounties.filter((b) => b.state === 'open' && !b.mine && b.prompt !== undefined && (b.reward ?? 0n) >= least).sort((a, b) => a.deadline - b.deadline);
}

/** A solver's part of a board that several solvers answer: number `index` of `of`, counted from 1. */
export interface Share {
  index: number;
  of: number;
}

/** Reads a share as it is written, such as 2/2. */
export function shareOf(text: string): Share {
  const [index, of] = text.split('/').map(Number);
  if (!Number.isInteger(index) || !Number.isInteger(of) || index === undefined || of === undefined || index < 1 || index > of) {
    throw new Error(`a share is a solver's number and the count of solvers, such as 1/2, not ${text}`);
  }
  return { index, of };
}

/** Whether the bounty `id` falls to `share`. The id's last digits split a board evenly. */
export function fallsTo(id: string, share: Share): boolean {
  return Number(BigInt(`0x${id.slice(-8)}`) % BigInt(share.of)) === share.index - 1;
}

/** Whether a solver that starts at Unix time `nowSeconds` can still answer `bounty` by its deadline. */
export function winnable(bounty: Pick<Bounty, 'deadline'>, nowSeconds: number): boolean {
  return bounty.deadline - nowSeconds >= LEAST_SOLVE_SECONDS;
}
