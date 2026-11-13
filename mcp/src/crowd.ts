// A crowd whose agents act through their MCP servers. Each round Claude gets one agent's tools
// and calls them itself, behind a guard. Without Claude the rules decide, through the same tools.
// npm run crowd -- [--agents grace,heidi] [--round-seconds 600] [--rounds 0] [--mind claude|rules] [--dry]
import 'lightsout-kit/plain-errors';
import { existsSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import type { MCPToolLike } from '@anthropic-ai/sdk/helpers/beta/mcp';
import { unitsOf } from 'lightsout-kit/codec';
import { DayCounts, fileJournal } from 'lightsout-kit/crowd/counts';
import { RECENT, REWARDS, type Sight, smallestLock } from 'lightsout-kit/crowd/limits';
import { ruleMind } from 'lightsout-kit/crowd/mind';
import { keepFile, keptJson } from 'lightsout-kit/keep';
import { say } from 'lightsout-kit/log';
import type { BridgeConfig } from 'lightsout-kit/near';
import { DEFAULT_MODEL } from 'lightsout-kit/question';
import { reasonOf } from 'lightsout-kit/reason';
import { dryAddress, dryServer, drySight } from './crowd/dry.js';
import { Bounties, Guard } from './crowd/guard.js';
import { AgentServer, answerOf, Balance, Collected, Refunds, type Who, Whoami } from './crowd/servers.js';
import { claudeTurn, effortOf, type Minds, play } from './crowd/turn.js';

const { values } = parseArgs({
  options: {
    agents: { type: 'string', default: process.env.LIGHTSOUT_CROWD ?? '' },
    'round-seconds': { type: 'string', default: process.env.CROWD_ROUND_SECONDS || '600' },
    rounds: { type: 'string', default: '0' },
    mind: { type: 'string', default: process.env.CROWD_MIND || (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? 'claude' : 'rules') },
    dry: { type: 'boolean', default: false },
  },
});
// A name counts once, so that no agent gets two server processes.
const names = [...new Set(values.agents.split(',').map((name) => name.trim().toLowerCase()).filter(Boolean))];
const roundMs = Number(values['round-seconds']) * 1000;
const rounds = Number(values.rounds);
const claudeBudget = Number(process.env.CLAUDE_BUDGET || '200');
if (!(roundMs > 0) || !Number.isInteger(rounds) || rounds < 0 || !['claude', 'rules'].includes(values.mind) || (!values.dry && names.length === 0)) {
  console.error('usage: npm run crowd -- --agents <name,name,...> [--round-seconds 600] [--rounds 0] [--mind claude|rules] [--dry]');
  process.exit(2);
}
if (!Number.isInteger(claudeBudget) || claudeBudget < 0) throw new Error(`CLAUDE_BUDGET is a whole number of turns a day, not ${process.env.CLAUDE_BUDGET}`);

const MCP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The folder the agents' servers keep their wallets in.
const stateDir = resolve(MCP, process.env.LIGHTSOUT_STATE_DIR ?? '../kit/.wallet');
// The kit's default. Its own constant sits in a module that loads the whole Midnight stack.
const network = process.env.MIDNIGHT_NETWORK || 'preview';
const stopFile = resolve(stateDir, 'crowd.stop');
const recentFile = resolve(stateDir, `crowd-${network}.json`);
const least = unitsOf(process.env.LIGHTSOUT_MIN_REWARD || '0.01');
const rewards = REWARDS.filter((reward) => unitsOf(reward) >= least);
const models = (process.env.CROWD_MODELS || DEFAULT_MODEL).split(',').map((model) => model.trim());

const claudeModel = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const effort = effortOf(process.env.CLAUDE_EFFORT || 'low');
const claude = values.mind === 'claude' ? new Anthropic() : undefined;

const minds = (counts: DayCounts, tools: MCPToolLike[]): Minds => ({
  claude: claude && ((guard) => claudeTurn(claude, claudeModel, effort, guard, tools)),
  left: async (agent) => claudeBudget - (await counts.of(`${agent}:claude`)),
  spend: (agent) => counts.add(`${agent}:claude`),
  rules: ruleMind(),
  model: () => models[Math.floor(Math.random() * models.length)] ?? DEFAULT_MODEL,
});

if (values.dry) {
  // One turn on a made-up agent with canned tools, to see the mind and the guard work.
  const name = names[0] ?? 'grace';
  const others = names.slice(1).length ? names.slice(1) : ['heidi'];
  const counts = new DayCounts(join(await mkdtemp(join(tmpdir(), 'crowd-dry-')), 'day.json'));
  for (const done of ['ask', 'ask', 'ask', 'send']) await counts.add(`${name}:${done}`);
  const server = await dryServer();
  const guard = await Guard.open({ inner: server, sight: drySight(name, others), addresses: Object.fromEntries(others.map((other) => [other, dryAddress(other)])), counts, rewards, models });
  const entry = await play(guard, minds(counts, await server.tools()));
  for (const call of entry.calls) console.log(`${call.tool} ${JSON.stringify(call.args)}: ${call.outcome}${call.why ? `, ${call.why}` : ''}`);
  console.log(JSON.stringify(entry, null, 1));
  await server.close();
  process.exit(0);
}

const { nearBalance, viewBridge } = await import('lightsout-kit/near');
const counts = new DayCounts(resolve(stateDir, `crowd-${network}-day.json`));
const journal = fileJournal(resolve(stateDir, `crowd-${network}-turns.jsonl`));
const stopping = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => stopping.abort());
const recent: string[] = (await keptJson<{ recent: string[] }>(recentFile))?.recent ?? [];
async function did(line: string): Promise<void> {
  say(line);
  recent.push(line);
  await keepFile(recentFile, JSON.stringify({ recent: recent.slice(-RECENT) }));
}

const servers = names.map((name) => new AgentServer(name));

/** One agent's turn: take back what is overdue, look, and let the mind do one thing. */
async function turn(server: AgentServer, me: Who, crowd: Who[], tools: MCPToolLike[]): Promise<void> {
  const { name } = me;
  const ask = async (tool: string): Promise<unknown> => answerOf(await server.callTool({ name: tool }));
  for (const back of Refunds.parse(await ask('refund'))) say(`${name}: took back the reward of question ${back.bounty}, tx ${back.tx}`);
  const collected = Collected.parse(await ask('collect'));
  if (collected.txs.length > 0) say(`${name}: collected ${collected.total} wNEAR that came back`);

  const others = crowd.filter((other) => other.name !== name);
  const sight: Sight = {
    name,
    wnear: unitsOf(Balance.parse(await ask('balance')).balance),
    near: await nearBalance(me.nearAccount),
    bounties: Bounties.parse(await ask('bounties')),
    others: others.map((other) => other.name),
    recent: recent.slice(-RECENT),
    lock: smallestLock(await viewBridge<BridgeConfig>('get_config')),
  };
  const guard = await Guard.open({ inner: server, sight, addresses: Object.fromEntries(others.map((other) => [other.name, other.address])), counts, rewards, models });
  const entry = await play(guard, minds(counts, tools));
  await journal(entry);
  if (entry.fallback) say(`${name}: ${entry.fallback}${entry.mind === 'rules' ? '; the rules decide' : ''}`);
  if (entry.did) await did(entry.did);
  const failed = entry.calls.find((call) => call.outcome === 'failed');
  if (failed) throw new Error(`${failed.tool} failed: ${failed.why}`);
  if (!entry.did) say(`${name}: waits (${entry.said || 'nothing to do this round'})`);
}

say(`a crowd of ${names.join(', ')} acts through its MCP servers about every ${Math.round(roundMs / 1000)} s; ${claude ? `${claudeModel} calls the tools, at most ${claudeBudget} turns a day for each` : 'the rules decide'}`);
try {
  // Each server opens its agent's wallets on the first call. The addresses stay for the run.
  const crowd: Who[] = [];
  for (const server of servers) crowd.push(Whoami.parse(answerOf(await server.callTool({ name: 'whoami' }))));
  const tools = (await servers[0]?.tools()) ?? [];
  for (let round = 1, failed = 0; (rounds === 0 || round <= rounds) && !stopping.signal.aborted; round++) {
    if (existsSync(stopFile)) {
      say(`${stopFile} is there, so the crowd stops`);
      break;
    }
    const at = (round - 1) % servers.length;
    const [server, me] = [servers[at], crowd[at]];
    if (!server || !me) break;
    try {
      await turn(server, me, crowd, tools);
      failed = 0;
    } catch (e) {
      failed++;
      say(`${me.name}: ${reasonOf(e)}`);
    }
    // A round that failed is followed by a longer pause, up to eight rounds long.
    const pause = roundMs * (0.75 + Math.random() / 2) * 2 ** Math.min(failed, 3);
    if (rounds === 0 || round < rounds) await sleep(pause, undefined, { signal: stopping.signal }).catch(() => undefined);
  }
} finally {
  // A server whose client goes away saves its agent's wallets and ends.
  for (const server of servers) await server.close().catch((e: unknown) => say(`closing ${server.agent}: ${reasonOf(e)}`));
}
process.stdout.write('', () => process.exit(0));
