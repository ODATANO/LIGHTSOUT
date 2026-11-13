// Readies the agents before they start: registered, members, dust and a wNEAR balance. Then no
// agent call waits long. Run `npm run relay` beside the agents.
// npm run warm -- [--agents alice,bob] [--fund 0.1] [--min 0.1]   --fund: NEAR to lock for an agent that holds less than --min wNEAR
import '../plain-errors.js';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { closeFees, network, openBridgeBuilder, proofServer, readBridge } from '../bridge.js';
import { openSession } from '../board/session.js';
import { nearOf, parseShieldedAddress, unitsOf } from '../codec.js';
import { type Lock, lockNear, openLock } from '../deposit.js';
import { generateOwnDust } from '../dust.js';
import { env } from '../env.js';
import { register, registrationOf } from '../join.js';
import { say } from '../log.js';
import { nearAccount, nearAccountOf, type Registration } from '../near.js';
import { Purse } from '../purse.js';
import { type AgentIdentity, agentNamed, stateFileOf } from '../roles.js';
import { followMidnight, proveLock, proveRegistration, registrationReceipt } from '../steps.js';

const { values } = parseArgs({ options: { agents: { type: 'string', default: 'alice,bob' }, fund: { type: 'string', default: '0.1' }, min: { type: 'string', default: '0.1' } } });
const agents = values.agents.split(',').map((name) => agentNamed(name.trim()));
const min = unitsOf(values.min);
const bridge = env('MIDNIGHT_BRIDGE');
const server = await proofServer();

interface Pending {
  agent: AgentIdentity;
  registration: Registration;
  lock?: Lock;
  address: string; // the agent's shielded address
}

// 1. Every NEAR transaction first, so that one move of the Midnight bridge's head covers them all.
const pending: Pending[] = [];
const minted = (await readBridge(bridge)).minted_locks;
for (const agent of agents) {
  const account = nearAccountOf(agent);
  let registration = await registrationOf(agent.nearAccountId);
  if (!registration) {
    registration = await register(account, agent.seedHex, bridge);
    say(`${agent.name}: registered as ${registration.index}`);
  }
  const purse = await Purse.open({ seedHex: agent.seedHex, bridge, stateFile: stateFileOf(agent, network, 'swap'), proofServerUrl: server });
  try {
    const balance = await purse.balance();
    let lock: Lock | undefined;
    if (balance < min) {
      // A lock that an earlier run left unminted is finished before a new one is made.
      lock = await openLock(agent.nearAccountId, purse.address, (id) => minted.member(id));
      if (lock) {
        say(`${agent.name}: holds ${nearOf(balance)} wNEAR, lock ${lock.lockId} is not minted yet`);
      } else {
        const made = await lockNear(account, purse.address, values.fund, bridge);
        say(`${agent.name}: holds ${nearOf(balance)} wNEAR, locked ${values.fund} NEAR as lock ${made.lockId}, tx ${made.tx}`);
        lock = made;
      }
    }
    pending.push({ agent, registration, lock, address: purse.address });
  } finally {
    await purse.close();
  }
}

// 2. The proofs on Midnight. The first one moves the head past every block above.
const anyone = await openBridgeBuilder(randomBytes(64).toString('hex'), { proofServerUrl: server });
try {
  for (const { agent, registration } of pending) {
    if ((await readBridge(bridge)).joined.member(BigInt(registration.index))) continue;
    await proveRegistration(anyone, bridge, registration, await registrationReceipt(agent.nearAccountId, registration), say);
    say(`${agent.name}: a member on Midnight`);
  }
  for (const { agent, lock, address } of pending) {
    if (!lock) continue;
    const own = await openBridgeBuilder(agent.seedHex, { proofServerUrl: server });
    try {
      await proveLock(own, bridge, lock.lockId, lock.receipt, say, { seedHex: agent.seedHex, keys: parseShieldedAddress(address, network) });
      say(`${agent.name}: lock ${lock.lockId} minted`);
    } finally {
      await own.close();
    }
  }
} finally {
  await anyone.close();
}

// 3. Dust for each agent's board calls, from its own NIGHT. The wallets save their state.
for (const { agent } of pending) {
  const session = await openSession(agent);
  try {
    await generateOwnDust(session.wallet, (line) => say(`${agent.name}: ${line}`));
    say(`${agent.name}: dust ${(await session.wallet.facade.waitForSyncedState()).dust.balance(new Date())}`);
  } finally {
    await session.close();
  }
}

// 4. NEAR's light client of Midnight up to date, so that a burn pays out soon. A relay does the same.
if (process.env.NEAR_RELAYER_ACCOUNT_ID) {
  const m = await followMidnight(nearAccount('RELAYER'), say, { calls: 64 });
  say(`warm: NEAR follows Midnight to block ${m.finalized_number}`);
}
await closeFees();
// The Midnight libraries leave timers behind, which keep Node alive.
process.stdout.write('', () => process.exit(0));
