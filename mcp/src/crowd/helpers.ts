import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MCPCallToolResultLike, MCPClientLike } from '@anthropic-ai/sdk/helpers/beta/mcp';
import { unitsOf } from 'lightsout-kit/codec';
import { DayCounts } from 'lightsout-kit/crowd/counts';
import { REWARDS, type Sight } from 'lightsout-kit/crowd/limits';
import { DEFAULT_MODEL } from 'lightsout-kit/question';
import { text } from '../tools.js';
import { Guard, type GuardOptions, textOf } from './guard.js';

// What the tests of the crowd share: a server that only notes its calls, and a guard before it.

export const HEIDI = 'mn_shield-addr_test1heidi';
export const IVAN = 'mn_shield-addr_test1ivan';
export const QUESTION = 'Why does ice float on water?';

interface Reached {
  name: string;
  arguments?: Record<string, unknown>;
}

/** A server that only notes what reaches it. `answers` holds an answer or a failure by tool. */
export function server(answers: Record<string, unknown> = {}): MCPClientLike & { reached: Reached[] } {
  const reached: Reached[] = [];
  const canned: Record<string, unknown> = { balance: { balance: '0.8' }, bounties: [], ask: { bounty: 'ab'.repeat(32), tx: 't1' }, send: { tx: 't2' }, withdraw: { tx: 't3', id: 'cd'.repeat(32) }, deposit: { lock: '7', resumed: false, outcome: 'minted' } };
  return {
    reached,
    async callTool(params): Promise<MCPCallToolResultLike> {
      reached.push(params);
      const answer = params.name in answers ? answers[params.name] : canned[params.name];
      if (answer instanceof Error) throw answer;
      if (typeof answer === 'string') return { ...text({ error: answer }), isError: true };
      return text(answer);
    },
  };
}

export const sight = (over: Partial<Sight> = {}): Sight => ({ name: 'grace', wnear: unitsOf('0.8'), near: 6n * 10n ** 23n, bounties: [], others: ['heidi', 'ivan'], recent: [], lock: 10n ** 23n, ...over });

export async function dayFile(): Promise<string> {
  return join(await mkdtemp(join(tmpdir(), 'guard-')), 'day.json');
}

type Over = Partial<Pick<GuardOptions, 'addresses' | 'counts' | 'rewards' | 'models'>> & { see?: Partial<Sight>; inner?: ReturnType<typeof server> };

export async function guardOf({ see, inner = server(), ...over }: Over = {}): Promise<{ guard: Guard; inner: ReturnType<typeof server>; counts: DayCounts }> {
  const counts = over.counts ?? new DayCounts(await dayFile());
  const guard = await Guard.open({ sight: sight(see), addresses: { heidi: HEIDI, ivan: IVAN }, rewards: REWARDS, models: [DEFAULT_MODEL], ...over, inner, counts });
  return { guard, inner, counts };
}

/** What a call came to: 'ok', or the sentence it was refused or failed with. */
export async function tried(guard: Guard, name: string, args: Record<string, unknown> = {}): Promise<string> {
  const result = await guard.callTool({ name, arguments: args });
  return result.isError ? textOf(result) : 'ok';
}
