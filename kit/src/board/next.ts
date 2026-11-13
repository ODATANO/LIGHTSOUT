import type { Bounty } from '../agent.js';

// An answer takes ten minutes or more, so a bounty with less time left cannot be won.
export const LEAST_SOLVE_SECONDS = 10 * 60;

/** The bounties a solver works for, the nearest deadline first: open, of others, readable and worth `least`. */
export function forSolver(bounties: readonly Bounty[], least: bigint): Bounty[] {
  return bounties.filter((b) => b.state === 'open' && !b.mine && b.prompt !== undefined && (b.reward ?? 0n) >= least).sort((a, b) => a.deadline - b.deadline);
}

/** Whether a solver that starts at Unix time `nowSeconds` can still answer `bounty` by its deadline. */
export function winnable(bounty: Pick<Bounty, 'deadline'>, nowSeconds: number): boolean {
  return bounty.deadline - nowSeconds >= LEAST_SOLVE_SECONDS;
}
