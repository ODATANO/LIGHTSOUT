// Runs the whole bridge flow once: lock with its proof and mint, private transfer, burn with its
// proof and release. Every step is the agents' own. The lock needs a bridge that a relay keeps
// open. Each run locks again.
// npm run demo -- [--from alice] [--to bob] [--amount 0.5] [--send 0.1]   --amount: NEAR to lock; --send: wNEAR to pass on
import './plain-errors.js';
import { parseArgs } from 'node:util';
import { nearToYocto, yoctoToNear } from 'near-api-js';
import { Agent } from './agent.js';
import { closeFees, network, openBridgeBuilder, proofServer } from './bridge.js';
import { nearOf, parseShieldedAddress, unitsOf } from './codec.js';
import { lockNear } from './deposit.js';
import { env } from './env.js';
import { say } from './log.js';
import { bridgeId, nearAccountOf, rpcUrl } from './near.js';
import { identityOf, userRole } from './roles.js';
import { proveLock, releaseBurn } from './steps.js';

const { values } = parseArgs({
  options: { from: { type: 'string' }, to: { type: 'string', default: 'bob' }, amount: { type: 'string', default: '0.5' }, send: { type: 'string', default: '0.1' } },
});
const from = identityOf(userRole(values.from));
const to = identityOf(userRole(values.to));
if (from.name === to.name) throw new Error('sender and recipient are the same agent');
const bridge = env('MIDNIGHT_BRIDGE');
const units = unitsOf(values.send);
const started = Date.now();
const elapsed = () => `${Math.round((Date.now() - started) / 1000)}s`;

async function balance(id: string): Promise<bigint> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'query', params: { request_type: 'view_account', finality: 'final', account_id: id } }),
  });
  const { result } = (await res.json()) as { result: { amount: string } };
  return BigInt(result.amount);
}
const near = (yocto: bigint) => `${yoctoToNear(yocto, 3)} NEAR`;

console.log(`demo on ${bridgeId}, Midnight bridge ${bridge} (${network}): ${from.name} locks ${values.amount} NEAR, sends ${nearOf(units)} wNEAR to ${to.name}, ${to.name} burns it`);
// The lock leaves the sender's account, and the proofs attach gas and a deposit.
const needed = nearToYocto(values.amount as `${number}`) + nearToYocto(1);
if ((await balance(from.nearAccountId)) < needed) throw new Error(`${from.nearAccountId} needs at least ${near(needed)} for this run`);

const sender = await Agent.open(from);
const recipient = await Agent.open(to);
const summary: [string, string][] = [];
try {
  // 1. Lock on NEAR, then prove and mint on Midnight.
  const lock = await lockNear(nearAccountOf(from), sender.address, values.amount, bridge);
  say(`lock ${lock.lockId}, tx ${lock.tx}`);
  const builder = await openBridgeBuilder(from.seedHex, { proofServerUrl: await proofServer() });
  try {
    await proveLock(builder, bridge, lock.lockId, lock.receipt, say, { seedHex: from.seedHex, keys: parseShieldedAddress(sender.address, network) });
  } finally {
    await builder.close();
  }
  summary.push([`lock ${lock.lockId}`, `${values.amount} NEAR locked, proven and minted on Midnight`]);

  // 2. Private transfer.
  const transfer = await sender.send(recipient.address, units);
  say(`${from.name} sent ${nearOf(units)} wNEAR to ${to.name}, tx ${transfer}`);
  summary.push(['transfer', transfer]);

  // 3. Burn, then prove it to the NEAR bridge and release it.
  const before = await balance(to.nearAccountId);
  const burn = await recipient.withdraw(units);
  say(`${to.name} burned ${nearOf(units)} wNEAR as burn ${burn.id}, tx ${burn.tx}`);
  summary.push(['burn', burn.tx]);
  while ((await releaseBurn(nearAccountOf(to), bridge, burn.id, say)) !== 'released') await new Promise((r) => setTimeout(r, 30_000));
  // The payout is a transfer of its own and reaches the account a block after the release.
  let after = await balance(to.nearAccountId);
  while (after <= before) {
    await new Promise((r) => setTimeout(r, 3_000));
    after = await balance(to.nearAccountId);
  }
  summary.push(['release', `${to.nearAccountId} ${near(before)} -> ${near(after)}`]);
} finally {
  await sender.close();
  await recipient.close();
  await closeFees();
}

console.log(`\nok  done in ${elapsed()}`);
for (const [what, value] of summary) console.log(`  ${what.padEnd(18)} ${value}`);
// The Midnight libraries leave timers behind, which keep Node alive.
process.stdout.write('', () => process.exit(0));
