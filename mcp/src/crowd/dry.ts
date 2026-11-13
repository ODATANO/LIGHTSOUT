import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { unitsOf } from 'lightsout-kit/codec';
import type { Sight } from 'lightsout-kit/crowd/limits';
import { text, TOOLS } from '../tools.js';
import { callOn, crowdTools, type Server } from './servers.js';

const WNEAR = '0.84';
const BOARD: Sight['bounties'] = [
  { prompt: 'Why is the sky blue at noon and red at sunset?', mine: false, state: 'open', deadline: 1_800_000_000 },
  { prompt: 'What makes sourdough bread rise without added yeast?', mine: false, state: 'answered', deadline: 1_799_990_000 },
  { prompt: 'How does a hash function differ from encryption?', mine: false, state: 'answered', deadline: 1_799_980_000 },
];

/** A made-up agent for a dry run: what it holds, the board it sees and what the crowd did lately. */
export function drySight(name: string, others: string[]): Sight {
  return {
    name,
    wnear: unitsOf(WNEAR),
    near: 61n * 10n ** 22n,
    bounties: BOARD,
    others,
    recent: [`${others[0] ?? 'heidi'} asked "Why is the sky blue at noon and red at sunset?" for 0.02 wNEAR`, `${others[0] ?? 'heidi'} withdrew 0.1 wNEAR to NEAR`],
    lock: 10n ** 23n,
  };
}

/** An address that only looks like one. No wallet has its keys. */
export const dryAddress = (name: string): string => `mn_shield-addr_dry1${Buffer.from(name).toString('hex').padEnd(48, '0')}`;

/**
 * A server in this process with the real tools' definitions and canned answers. No child process
 * runs and nothing behind it reaches a chain.
 */
export async function dryServer(): Promise<Server> {
  const server = new McpServer({ name: 'lightsout-dry', version: '0.1.0' });
  const tx = '0'.repeat(64);
  server.registerTool('balance', TOOLS.balance, async () => text({ balance: WNEAR }));
  server.registerTool('bounties', TOOLS.bounties, async () => text(BOARD));
  server.registerTool('ask', TOOLS.ask, async () => text({ bounty: 'd1'.repeat(32), tx }));
  server.registerTool('send', TOOLS.send, async () => text({ tx }));
  server.registerTool('withdraw', TOOLS.withdraw, async () => text({ tx, id: 'b2'.repeat(32) }));
  server.registerTool('deposit', TOOLS.deposit, async () => text({ lock: '7', resumed: false, outcome: 'minted' }));
  const [near, far] = InMemoryTransport.createLinkedPair();
  await server.connect(far);
  const client = new Client({ name: 'lightsout-crowd', version: '0.1.0' });
  await client.connect(near);
  return { callTool: (params) => callOn(client, params), tools: () => crowdTools(client), close: () => client.close() };
}
