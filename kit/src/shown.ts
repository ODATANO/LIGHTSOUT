// An agent's results as the command line and the MCP server print them: amounts in wNEAR or NEAR.
import type { Bounty, Withdrawal } from './agent.js';
import { nearOf } from './codec.js';

export const shownBalance = (units: bigint) => ({ balance: nearOf(units) });

export const shownWithdrawal = (w: Withdrawal) => ({ ...w, amount: nearOf(w.amount), paid: nearOf(w.paid) });

export const shownBounties = (bounties: Bounty[]) => bounties.map((b) => ({ ...b, reward: b.reward === undefined ? undefined : nearOf(b.reward) }));

export const shownCollected = (c: { total: bigint; txs: string[] }) => ({ ...c, total: nearOf(c.total) });
