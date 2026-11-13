// Answers the open bounties on the board as one agent: asks the model on NEAR AI, seals its
// signed response, hands it over and collects the reward. Needs NEARAI_CLOUD_API_KEY.
// npm run solve -- [--as <name>] [--min <wNEAR>] [--once] [--pay-out-to <NEAR accounts>] [--keep <wNEAR>]   --min: by default LIGHTSOUT_MIN_REWARD or 0.01
import '../plain-errors.js';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { Agent } from '../agent.js';
import { forSolver, winnable } from '../board/next.js';
import { LEAST_BURN, nearOf, unitsOf } from '../codec.js';
import { say } from '../log.js';
import { reasonOf } from '../reason.js';
import { agentFromEnv, agentNamed } from '../roles.js';

const EVERY_MS = 30_000;
// A bounty this agent failed on waits before the next try, twice as long after each failure.
const RETRY_MS = 2 * 60_000;
const RETRY_MAX_MS = 60 * 60_000;

const { values } = parseArgs({
  options: {
    as: { type: 'string' },
    min: { type: 'string', default: process.env.LIGHTSOUT_MIN_REWARD || '0.01' },
    once: { type: 'boolean', default: false },
    'pay-out-to': { type: 'string', default: process.env.LIGHTSOUT_PAY_OUT_TO ?? '' },
    keep: { type: 'string', default: process.env.LIGHTSOUT_KEEP || '0.5' },
  },
});
const least = unitsOf(values.min);
const payTo = values['pay-out-to'].split(',').map((account) => account.trim()).filter(Boolean);
const keep = unitsOf(values.keep);
const agent = await Agent.open(values.as ? agentNamed(values.as) : agentFromEnv(resolve('.wallet')), { say });
// A stop lets the running call land, then saves the wallets. The next start goes on from the drop left.
const stopping = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => stopping.abort());
const failures = new Map<string, { count: number; at: number }>();
const left = new Set<string>();
let collectFailedAt = 0;

function waits(bounty: string): boolean {
  const failed = failures.get(bounty);
  return failed !== undefined && Date.now() - failed.at < Math.min(RETRY_MS * 2 ** (failed.count - 1), RETRY_MAX_MS);
}

// The board pays each reward to a wallet of its own. This moves what came in to the agent's address.
async function collect(): Promise<void> {
  if (Date.now() - collectFailedAt < RETRY_MS) return;
  try {
    const { total, txs } = await agent.collect();
    if (txs.length > 0) say(`collected ${nearOf(total)} wNEAR of rewards, tx ${txs.join(', ')}`);
  } catch (e) {
    collectFailedAt = Date.now();
    say(`collecting rewards: ${reasonOf(e)}`);
  }
}

// Pays rewards out to the accounts of --pay-out-to in turn: one smallest burn a round, while
// the agent holds more than --keep. The relay proves the burn and NEAR pays the account.
let paidOut = 0;
async function payOut(): Promise<void> {
  const to = payTo[paidOut % Math.max(payTo.length, 1)];
  if (!to) return;
  try {
    if ((await agent.balance()) < keep + LEAST_BURN) return;
    const { id } = await agent.withdraw(LEAST_BURN, to);
    paidOut++;
    say(`paid out ${nearOf(LEAST_BURN)} wNEAR to ${to}, withdrawal ${id}`);
  } catch (e) {
    say(`paying out: ${reasonOf(e)}`);
  }
}

// Removes from the board what is of no use any more. A failure waits for the next round.
async function tidy(): Promise<void> {
  try {
    const txs = await agent.tidy();
    if (txs.length > 0) say(`removed old records from the board, tx ${txs.join(', ')}`);
  } catch (e) {
    say(`removing old records: ${reasonOf(e)}`);
  }
}

// Answers the bounty whose deadline is nearest. The board is read again for each one, so a
// question with little time does not wait for all that stood before it. False when none is left.
async function answerNext(): Promise<boolean> {
  const now = Date.now() / 1000;
  const open = forSolver(await agent.bounties(), least);
  for (const { id } of open.filter((b) => !winnable(b, now) && !left.has(b.id))) {
    left.add(id);
    say(`bounty ${id}: under ten minutes to its deadline, left to its asker`);
  }
  const bounty = open.find((b) => winnable(b, now) && !waits(b.id));
  if (!bounty) return false;
  say(`bounty ${bounty.id}: ${nearOf(bounty.reward ?? 0n)} wNEAR for ${bounty.model} on "${bounty.prompt}"`);
  try {
    const { drop, tx } = await agent.solve(bounty.id, stopping.signal);
    say(`bounty ${bounty.id}: answered with drop ${drop}, tx ${tx}`);
  } catch (e) {
    if (stopping.signal.aborted) return false;
    failures.set(bounty.id, { count: (failures.get(bounty.id)?.count ?? 0) + 1, at: Date.now() });
    say(`bounty ${bounty.id}: ${reasonOf(e)}`);
  }
  return true;
}

async function round(): Promise<void> {
  while (!stopping.signal.aborted && (await answerNext()));
  if (stopping.signal.aborted) return;
  await collect();
  await payOut();
  await tidy();
}

try {
  do {
    // In the service a failed read of the board ends the round, not the process.
    await round().catch((e: unknown) => {
      if (values.once) throw e;
      say(`round failed: ${reasonOf(e)}`);
    });
    if (!values.once) await sleep(EVERY_MS, undefined, { signal: stopping.signal }).catch(() => undefined);
  } while (!values.once && !stopping.signal.aborted);
} finally {
  await agent.close();
}
// The Midnight libraries leave timers behind, which keep Node alive.
process.stdout.write('', () => process.exit(0));
