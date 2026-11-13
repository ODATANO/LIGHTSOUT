// One agent from the command line, on the same calls as the MCP server.
// npm run agent -- <command> [--as <name>] [options]; `npm run agent -- help` lists the commands.
import './plain-errors.js';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { Agent } from './agent.js';
import { checkQuestion } from './board/question.js';
import { network } from './bridge.js';
import { parseShieldedAddress, unitsOf } from './codec.js';
import { deposit } from './deposit.js';
import { join } from './join.js';
import { env } from './env.js';
import { agentFromEnv, agentNamed } from './roles.js';
import { shownBalance, shownBounties, shownCollected, shownWithdrawal } from './shown.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    as: { type: 'string' },
    amount: { type: 'string' },
    to: { type: 'string' },
    burn: { type: 'string' },
    deadline: { type: 'string', default: '120' },
    prompt: { type: 'string' },
    reward: { type: 'string' },
    model: { type: 'string' },
    'max-tokens': { type: 'string' },
    bounty: { type: 'string' },
    all: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

const COMMANDS: Record<string, string> = {
  whoami: 'name, NEAR account and what it holds, shielded address, NIGHT address, registration and membership',
  register: '[--amount <NEAR>]: registers the NEAR account at the bridge for the fee, once, and proves that to Midnight: the agent is a member then; with --amount it also locks and mints that NEAR',
  balance: 'wNEAR held',
  deposit: '--amount <NEAR>: locks on NEAR and mints here; an earlier lock that is not minted yet is minted first, and nothing new is locked',
  send: '--to <shielded address> --amount <wNEAR>',
  withdraw: '--amount <wNEAR> [--to <NEAR account>]: burns; the relay pays out',
  withdrawal: '--burn <id>: how much of it is paid out',
  refund: 'takes back the reward of own bounties that nobody answered by their deadline',
  collect: '[--all]: moves rewards and refunds to the own address; --all looks again at the ones it moved before',
  ask: '--prompt <question> --reward <wNEAR> [--model <id>] [--max-tokens <n>] [--deadline <minutes>]: a reward for the model\'s signed answer',
  bounties: 'the bounties on the board, with the answers of own ones',
  solve: '--bounty <id>: asks the model, seals its answer and takes the reward',
};

const [command] = positionals;
if (values.help || !command || !(command in COMMANDS)) {
  console.error('usage: npm run agent -- <command> [--as <name>]   an agent of .env, by default the one LIGHTSOUT_AGENT names, else alice; amounts such as 0.01\n');
  for (const [name, help] of Object.entries(COMMANDS)) console.error(`  ${name.padEnd(11)} ${help}`);
  process.exit(values.help || command === 'help' ? 0 : 2);
}
const need = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`${command} needs --${name}`);
  return value;
};
const amount = (name: 'amount' | 'reward'): bigint => unitsOf(need(values[name], name));
// stdout carries the result alone, so that it can be piped. Everything else goes to stderr.
const note = (line: string): void => console.error(line);
console.log = console.error;
console.info = console.error;
const show = (value: unknown): void => void process.stdout.write(`${JSON.stringify(value, (_, v: unknown) => (typeof v === 'bigint' ? v.toString() : v), 2)}
`);

// Reads the command's arguments and returns what it does on the open agent. A missing or
// wrong argument is said here, before the wallets sync.
function action(): (agent: Agent) => Promise<unknown> {
  switch (command) {
    case 'whoami':
      return (agent) => agent.whoami();
    case 'register': {
      const near = values.amount;
      if (near) unitsOf(near);
      return (agent) => join(agent.identity, env('MIDNIGHT_BRIDGE'), note, near ? { near, address: agent.address } : undefined);
    }
    case 'balance':
      return async (agent) => shownBalance(await agent.balance());
    case 'deposit': {
      const near = need(values.amount, 'amount');
      unitsOf(near);
      return (agent) => deposit(agent.identity, agent.address, near, env('MIDNIGHT_BRIDGE'), note);
    }
    case 'send': {
      const [to, units] = [need(values.to, 'to'), amount('amount')];
      parseShieldedAddress(to, network);
      return async (agent) => ({ tx: await agent.send(to, units) });
    }
    case 'withdraw': {
      const units = amount('amount');
      return (agent) => agent.withdraw(units, values.to);
    }
    case 'withdrawal': {
      const burn = need(values.burn, 'burn');
      return async (agent) => shownWithdrawal(await agent.withdrawal(burn));
    }
    case 'refund':
      return (agent) => agent.refund();
    case 'collect':
      return async (agent) => shownCollected(await agent.collect({ all: values.all }));
    case 'ask': {
      const [prompt, reward] = [need(values.prompt, 'prompt'), amount('reward')];
      const opts = { model: values.model, maxTokens: values['max-tokens'] ? Number(values['max-tokens']) : undefined, deadlineMinutes: Number(values.deadline) };
      checkQuestion(prompt, opts.model, opts.maxTokens);
      return (agent) => agent.ask(prompt, reward, opts);
    }
    case 'bounties':
      return async (agent) => shownBounties(await agent.bounties());
    case 'solve': {
      const bounty = need(values.bounty, 'bounty');
      return (agent) => agent.solve(bounty);
    }
    default:
      throw new Error(`unknown command ${command}`);
  }
}

const run = action();
// Without --as it is the agent the environment names, as for the MCP server and the solver.
const named = values.as ?? (process.env.LIGHTSOUT_AGENT || process.env.LIGHTSOUT_NAME ? undefined : 'alice');
const agent = await Agent.open(named ? agentNamed(named) : agentFromEnv(resolve('.wallet')));
// A stop saves the wallets' state before the process ends.
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => void agent.close().finally(() => process.exit(130)));
try {
  show(await run(agent));
} finally {
  await agent.close();
}
// The Midnight libraries leave timers behind, which keep Node alive.
process.stdout.write('', () => process.exit(0));
