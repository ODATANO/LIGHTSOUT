import { posix } from 'node:path';
import { env } from './env.js';

export type Role = 'ALICE' | 'BOB' | 'OWNER' | 'RELAYER';
/** The two agents that lock, transfer and burn. */
export type UserRole = 'ALICE' | 'BOB';

/** An agent: its NEAR account, its Midnight wallet, and where it keeps that wallet's state. */
export interface AgentIdentity {
  name: string; // names the agent's state files
  nearAccountId: string;
  nearPrivateKey: string; // ed25519:...
  seedHex: string; // 128 hex; the Midnight seed
  stateDir: string; // as private as the seed
}

/** The `--as` value of lock, burn and transfer; `alice` when absent. */
export function userRole(value: string | undefined): UserRole {
  const role = (value ?? 'alice').toUpperCase();
  if (role !== 'ALICE' && role !== 'BOB') throw new Error(`unknown role ${value}, use alice or bob`);
  return role;
}

/** The names of the three variables that hold an agent in `.env`. */
export function agentVariables(name: string): { account: string; key: string; seed: string } {
  const upper = name.toUpperCase();
  if (!/^[A-Z][A-Z0-9_]*$/.test(upper)) throw new Error(`an agent's name has letters, digits and _, and starts with a letter: ${name}`);
  return { account: `NEAR_${upper}_ACCOUNT_ID`, key: `NEAR_${upper}_PRIVATE_KEY`, seed: `MIDNIGHT_${upper}_SEED_HEX` };
}

/** The agent `.env` holds under this name, with its state in `.wallet`. `npm run make-agent` adds one. */
export function agentNamed(name: string): AgentIdentity {
  const names = agentVariables(name);
  return { name: name.toLowerCase(), nearAccountId: env(names.account), nearPrivateKey: env(names.key), seedHex: env(names.seed), stateDir: '.wallet' };
}

/** The agent behind `NEAR_<ROLE>_*` and `MIDNIGHT_<ROLE>_SEED_HEX`, with its state in `.wallet`. */
export function identityOf(role: UserRole): AgentIdentity {
  return agentNamed(role);
}

/**
 * The agent a process acts for: `LIGHTSOUT_AGENT` names one of `.env`, such as alice. Or the four
 * variables `LIGHTSOUT_NAME`, `LIGHTSOUT_NEAR_ACCOUNT_ID`, `LIGHTSOUT_NEAR_PRIVATE_KEY` and `LIGHTSOUT_SEED_HEX`.
 * `LIGHTSOUT_STATE_DIR` names where its wallet state lies, by default `stateDir`.
 */
export function agentFromEnv(stateDir: string): AgentIdentity {
  const dir = process.env.LIGHTSOUT_STATE_DIR ?? stateDir;
  const { LIGHTSOUT_AGENT: role, LIGHTSOUT_NAME: name, LIGHTSOUT_NEAR_ACCOUNT_ID: account, LIGHTSOUT_NEAR_PRIVATE_KEY: key, LIGHTSOUT_SEED_HEX: seed } = process.env;
  if (role) return { ...agentNamed(role), stateDir: dir };
  if (!name || !account || !key || !seed) throw new Error('set LIGHTSOUT_AGENT, or LIGHTSOUT_NAME, LIGHTSOUT_NEAR_ACCOUNT_ID, LIGHTSOUT_NEAR_PRIVATE_KEY and LIGHTSOUT_SEED_HEX');
  return { name, nearAccountId: account, nearPrivateKey: key, seedHex: seed, stateDir: dir };
}

export type StateKind = 'swap' | 'board' | 'book';

/** A wallet state file, as private as the seed. The swap and board wallets keep their own, and `book` holds the agent's trades. */
export function stateFileOf(agent: Pick<AgentIdentity, 'name' | 'stateDir'>, network: string, kind?: StateKind): string {
  return posix.join(agent.stateDir, `${agent.name}-${network}${kind ? `-${kind}` : ''}.json`);
}

export function walletStateFile(role: UserRole, network: string, kind?: StateKind): string {
  return stateFileOf({ name: role.toLowerCase(), stateDir: '.wallet' }, network, kind);
}
