#!/usr/bin/env node
import { published } from 'lightsout-kit/live';
import 'lightsout-kit/websocket';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js';
import { Agent } from 'lightsout-kit/agent';
import { unitsOf } from 'lightsout-kit/codec';
import { deposit } from 'lightsout-kit/deposit';
import { env } from 'lightsout-kit/env';
import { join as joinBridge } from 'lightsout-kit/join';
import { reasonOf } from 'lightsout-kit/reason';
import { agentFromEnv } from 'lightsout-kit/roles';
import { shownBalance, shownBounties, shownCollected, shownWithdrawal } from 'lightsout-kit/shown';
import { text, TOOLS } from './tools.js';

// stdout is the protocol channel, so everything the libraries print goes to stderr.
console.log = console.error;
console.info = console.error;

// A checkout keeps the wallet state in the kit's folder, the package from npm in the home folder.
const STATE = published ? join(homedir(), '.lightsout') : resolve(dirname(fileURLToPath(import.meta.url)), '../../kit/.wallet');

// Where the agent's progress lines go while a tool call runs, beside stderr.
let tell: ((line: string) => void) | undefined;
const say = (line: string): void => {
  console.error(line);
  tell?.(line);
};

// Connects at once and opens the wallets beside it, so that a client does not time out on start.
const opening = Agent.open(agentFromEnv(STATE), { say });
opening.catch((e: unknown) => console.error('lightsout-mcp: the agent did not open:', e));

/**
 * A tool body on the open agent. A failure comes back as the tool's error, not as a crash. A
 * client that asked for progress gets the agent's lines while the call runs.
 */
function run<A>(body: (agent: Agent, args: A) => Promise<unknown>) {
  return async (args: A, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
    const progressToken = extra._meta?.progressToken;
    let sent = 0;
    const lines = progressToken === undefined ? undefined : (message: string) => void extra.sendNotification({ method: 'notifications/progress', params: { progressToken, progress: ++sent, message } }).catch(() => undefined);
    tell = lines;
    try {
      return text(await body(await opening, args));
    } catch (e) {
      return { ...text({ error: reasonOf(e) }), isError: true };
    } finally {
      if (tell === lines) tell = undefined;
    }
  };
}

const server = new McpServer({ name: 'lightsout', version: '0.1.0' });

server.registerTool('whoami', TOOLS.whoami, run((agent) => agent.whoami()));

server.registerTool('register', TOOLS.register, run((agent, a: { deposit?: string }) => joinBridge(agent.identity, env('MIDNIGHT_BRIDGE'), say, a.deposit ? { near: a.deposit, address: agent.address } : undefined)));

server.registerTool('balance', TOOLS.balance, run(async (agent) => shownBalance(await agent.balance())));

server.registerTool('deposit', TOOLS.deposit, run((agent, a: { amount: string }) => deposit(agent.identity, agent.address, a.amount, env('MIDNIGHT_BRIDGE'), say)));

server.registerTool('send', TOOLS.send, run(async (agent, a: { to: string; amount: string }) => ({ tx: await agent.send(a.to, unitsOf(a.amount)) })));

server.registerTool('withdraw', TOOLS.withdraw, run((agent, a: { amount: string; to?: string }) => agent.withdraw(unitsOf(a.amount), a.to)));

server.registerTool('withdrawal', TOOLS.withdrawal, run(async (agent, a: { burn: string }) => shownWithdrawal(await agent.withdrawal(a.burn))));

server.registerTool('refund', TOOLS.refund, run((agent) => agent.refund()));

server.registerTool('collect', TOOLS.collect, run(async (agent) => shownCollected(await agent.collect())));

server.registerTool('ask', TOOLS.ask, run((agent, a: { prompt: string; reward: string; model?: string; max_tokens?: number; deadline_minutes?: number }) => agent.ask(a.prompt, unitsOf(a.reward), { model: a.model, maxTokens: a.max_tokens, deadlineMinutes: a.deadline_minutes })));

server.registerTool('bounties', TOOLS.bounties, run(async (agent) => shownBounties(await agent.bounties())));

server.registerTool('solve', TOOLS.solve, run((agent, a: { bounty: string }) => agent.solve(a.bounty)));

// Saves the wallets once, also when the client goes away without a signal.
let closing: Promise<void> | undefined;
const close = (): void => {
  closing ??= opening.then((agent) => agent.close()).finally(() => process.exit(0));
};
process.on('SIGINT', close);
process.on('SIGTERM', close);
process.stdin.on('end', close);
await server.connect(new StdioServerTransport());
console.error('lightsout-mcp: connected');
