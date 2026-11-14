import type { MCPCallToolResultLike, MCPClientLike } from '@anthropic-ai/sdk/helpers/beta/mcp';
import { z } from 'zod';
import { nearOf, unitsOf, YOCTO_PER_UNIT } from 'lightsout-kit/codec';
import type { DayCounts } from 'lightsout-kit/crowd/counts';
import { type Act, ACTS, ANSWER_TOKENS, barred, KEEP_WNEAR, nearOfLock, PER_DAY, QUESTION_MINUTES, SEND_AT_MOST, type Sight, todayOf, viewOf, WITHDRAW } from 'lightsout-kit/crowd/limits';
import { checked, type Decision, type View } from 'lightsout-kit/crowd/mind';
import { DEFAULT_MODEL } from 'lightsout-kit/question';
import { reasonOf } from 'lightsout-kit/reason';
import { TOOLS } from '../tools.js';

// The tools that only look. With the four actions they are all a turn may call.
const LOOKS = ['balance', 'bounties'] as const;
type Tool = (typeof LOOKS)[number] | Act;
/** Whether a turn of the crowd may call the tool of this name at all. */
export const isTool = (name: string): name is Tool => [...LOOKS, ...ACTS].some((tool) => tool === name);

/** The board's list as an agent's server answers it, as far as the crowd reads it. */
export const Bounties: z.ZodType<Sight['bounties']> = z.array(z.object({ prompt: z.string().optional(), mine: z.boolean(), state: z.enum(['open', 'overdue', 'answered', 'refunded']), deadline: z.number() }));

// The questions of others a turn sees. The board keeps every question, so its list only grows.
const NEWEST = 30;

/** The board as a turn sees it. */
export interface BoardSeen {
  yours: { question: string; state: 'open' | 'overdue'; minutes_left: number }[];
  questions: number; // all the board holds
  newest: string[]; // the questions asked last, newest first
}

/** What a turn needs of the board's list at Unix time `nowSeconds`. A later deadline counts as a later question. */
export function boardSeen(all: Sight['bounties'], nowSeconds = Date.now() / 1000): BoardSeen {
  const byAge = [...all].sort((a, b) => b.deadline - a.deadline);
  return {
    yours: byAge.flatMap((b) => (b.mine && (b.state === 'open' || b.state === 'overdue') ? [{ question: b.prompt ?? '', state: b.state, minutes_left: Math.max(0, Math.round((b.deadline - nowSeconds) / 60)) }] : [])),
    questions: all.length,
    newest: byAge.flatMap((b) => (b.prompt ? [b.prompt] : [])).slice(0, NEWEST),
  };
}

/** One call of a turn, as the journal keeps it. */
export interface Call {
  tool: string;
  args: Record<string, unknown>; // long values cut
  outcome: 'ok' | 'refused' | 'failed'; // refused = the guard stopped it; failed = the server did not do it
  why?: string; // with refused and failed
}

/** What the limits leave an agent in one turn. */
export interface Allowed {
  today: Record<Act, number>;
  left_today: Record<Act, number>;
  may: Record<Act, boolean>;
  due: Act[]; // the possible actions, first the one that used least of its day's limit
  barred: Partial<Record<Act, string>>; // why an action is not possible now
  ask: { rewards: readonly string[]; models: readonly string[]; max_tokens: number };
  send: { to: Record<string, string>; at_most: string }; // wNEAR
  withdraw: { amount: string }; // wNEAR
  deposit: { amount: string } | null; // NEAR; null = the bridge takes no lock now
}

export interface GuardOptions {
  inner: MCPClientLike; // the agent's MCP server
  sight: Sight;
  addresses: Record<string, string>; // the shielded address of each other agent, by name
  counts: DayCounts;
  rewards: readonly string[]; // the rewards a question can carry
  models: readonly string[]; // the models a question can ask
}

// A call that fits. It holds what the server gets and the line the crowd keeps once it answered.
interface Fit {
  args: Record<string, unknown>;
  line(answer: MCPCallToolResultLike): string;
}

const Ask = z.object(TOOLS.ask.inputSchema);
const Send = z.object(TOOLS.send.inputSchema);
const Withdraw = z.object(TOOLS.withdraw.inputSchema);
const Deposit = z.object(TOOLS.deposit.inputSchema);

const error = (why: string): MCPCallToolResultLike => ({ content: [{ type: 'text', text: why }], isError: true });
// Arguments as the journal keeps them. A value of more than 100 characters is cut.
function short(args: Record<string, unknown>): Record<string, unknown> {
  const cut = (value: unknown): unknown => {
    const text = typeof value === 'string' ? value : (JSON.stringify(value) ?? '');
    return text.length > 100 ? `${text.slice(0, 100)}...` : value;
  };
  return Object.fromEntries(Object.entries(args).map(([key, value]) => [key, cut(value)]));
}

function wrong(tool: Act, fault: z.ZodError): string {
  const issue = fault.issues[0];
  return `the arguments of ${tool} do not fit: ${issue ? `${issue.path.join('.') || 'input'}: ${issue.message}` : 'they are no object'}`;
}

/** The first text of a tool's answer. The server puts its JSON there. */
export function textOf(result: MCPCallToolResultLike): string {
  const first = result.content[0];
  return first?.type === 'text' ? first.text : '';
}

// A text field of the JSON a tool answered with.
function fieldOf(result: MCPCallToolResultLike, key: string): string | undefined {
  let answer: unknown;
  try {
    answer = JSON.parse(textOf(result));
  } catch {
    return undefined;
  }
  const fields = z.record(z.string(), z.unknown()).safeParse(answer);
  const value = fields.success ? fields.data[key] : undefined;
  return typeof value === 'string' ? value : undefined;
}

/** Why a tool failed, in the server's words. */
export const faultOf = (result: MCPCallToolResultLike): string => fieldOf(result, 'error') ?? textOf(result);

// An id in the server's answer, in brackets for the crowd's line. Empty when the answer has none.
function idIn(result: MCPCallToolResultLike, key: string, label: string, length?: number): string {
  const id = fieldOf(result, key);
  return id === undefined ? '' : ` (${label} ${id.slice(0, length)})`;
}

/**
 * Stands between one agent's turn and its MCP server. It checks every call against the crowd's
 * limits, and only a call that passes reaches the server. A refused call gets the reason back.
 */
export class Guard implements MCPClientLike {
  readonly calls: Call[] = [];
  /** The line for the crowd's recent list, once the turn's action is done. */
  did?: string;
  /** The action the server did not do. Nothing acts after it in this turn. */
  failed?: Act;
  private last: Promise<unknown> = Promise.resolve();

  private constructor(
    private readonly opts: GuardOptions,
    readonly view: View,
    private readonly bars: Partial<Record<Act, string>>,
  ) {}

  /** A guard for one turn. Its view says what the day's counts and the agent's funds allow at the start. */
  static async open(opts: GuardOptions): Promise<Guard> {
    const today = await todayOf(opts.counts, opts.sight.name);
    return new Guard(opts, viewOf(opts.sight, today, opts.rewards), barred(opts.sight, today, opts.rewards));
  }

  /** What the limits leave this turn, for whoever decides in it. */
  allows(): Allowed {
    const { sight, addresses, rewards, models } = this.opts;
    const { today, may, due } = this.view;
    const left = (act: Act): number => Math.max(0, PER_DAY[act] - today[act]);
    return {
      today,
      left_today: { ask: left('ask'), send: left('send'), withdraw: left('withdraw'), deposit: left('deposit') },
      may,
      due,
      barred: this.bars,
      ask: { rewards, models, max_tokens: ANSWER_TOKENS },
      send: { to: addresses, at_most: nearOf(SEND_AT_MOST) },
      withdraw: { amount: nearOf(WITHDRAW) },
      deposit: sight.lock === undefined ? null : { amount: nearOfLock(sight.lock) },
    };
  }

  /** Runs a call after the turn's earlier ones, so that two calls of one reply cannot both act. */
  callTool(params: { name: string; arguments?: Record<string, unknown> }): Promise<MCPCallToolResultLike> {
    const run = () => this.one(params.name, params.arguments ?? {});
    const next = this.last.then(run, run);
    this.last = next.catch(() => undefined);
    return next;
  }

  private refuse(tool: string, raw: Record<string, unknown>, why: string): MCPCallToolResultLike {
    this.calls.push({ tool, args: short(raw), outcome: 'refused', why });
    return error(why);
  }

  private async one(tool: string, raw: Record<string, unknown>): Promise<MCPCallToolResultLike> {
    if (!isTool(tool)) return this.refuse(tool, raw, `the crowd does not use ${tool}`);
    if (tool === 'balance') return this.reach(tool, {});
    if (tool === 'bounties') return this.board();
    const { sight, counts, rewards } = this.opts;
    if (this.did) return this.refuse(tool, raw, `a turn has one action, and ${sight.name} did it already`);
    if (this.failed) return this.refuse(tool, raw, `${this.failed} failed in this turn, so ${sight.name} does nothing more in it`);
    const bar = barred(sight, await todayOf(counts, sight.name), rewards)[tool];
    if (bar) return this.refuse(tool, raw, bar);
    const fit = this[tool](raw);
    if (typeof fit === 'string') return this.refuse(tool, raw, fit);
    const result = await this.reach(tool, fit.args);
    if (result.isError) {
      this.failed = tool;
      return result;
    }
    this.did = fit.line(result);
    await counts.add(`${sight.name}:${tool}`);
    return result;
  }

  // Asks the server for the board and hands the turn the short form of it.
  private async board(): Promise<MCPCallToolResultLike> {
    const result = await this.reach('bounties', {});
    if (result.isError) return result;
    let listed: unknown;
    try {
      listed = JSON.parse(textOf(result));
    } catch {
      listed = undefined;
    }
    const all = Bounties.safeParse(listed);
    return all.success ? { content: [{ type: 'text', text: JSON.stringify(boardSeen(all.data)) }] } : error('the board answered in a form the crowd does not read');
  }

  private async reach(tool: Tool, args: Record<string, unknown>): Promise<MCPCallToolResultLike> {
    let result: MCPCallToolResultLike;
    try {
      result = await this.opts.inner.callTool({ name: tool, arguments: args });
    } catch (e) {
      result = error(`${tool} did not come back: ${reasonOf(e)}`);
    }
    this.calls.push(result.isError ? { tool, args: short(args), outcome: 'failed', why: faultOf(result).slice(0, 200) } : { tool, args: short(args), outcome: 'ok' });
    return result;
  }

  // The kit's own check of the move a call stands for.
  private kit(decision: Pick<Decision, 'action'> & Partial<Decision>, model = DEFAULT_MODEL): string | undefined {
    const move = checked({ question: '', reward: '', to: '', reason: '', ...decision }, this.view, model);
    return 'refused' in move ? move.refused : undefined;
  }

  private ask(raw: Record<string, unknown>): Fit | string {
    const { sight, models } = this.opts;
    const a = Ask.safeParse(raw);
    if (!a.success) return wrong('ask', a.error);
    const model = a.data.model ?? DEFAULT_MODEL;
    if (!models.includes(model)) return `the crowd asks ${models.join(' or ')}, not ${model}`;
    const tokens = a.data.max_tokens ?? ANSWER_TOKENS;
    if (tokens > ANSWER_TOKENS) return `an answer for the crowd has at most ${ANSWER_TOKENS} tokens`;
    if ((a.data.deadline_minutes ?? QUESTION_MINUTES) !== QUESTION_MINUTES) return `a question of the crowd waits ${QUESTION_MINUTES} minutes for its answer`;
    const question = a.data.prompt.trim();
    const reward = nearOf(unitsOf(a.data.reward));
    const refused = this.kit({ action: 'ask', question, reward }, model);
    if (refused) return refused;
    return {
      args: { prompt: question, reward, model, max_tokens: tokens, deadline_minutes: QUESTION_MINUTES },
      line: (answer) => `${sight.name} asked "${question}" for ${reward} wNEAR${idIn(answer, 'bounty', 'question', 8)}`,
    };
  }

  private send(raw: Record<string, unknown>): Fit | string {
    const { sight, addresses } = this.opts;
    const a = Send.safeParse(raw);
    if (!a.success) return wrong('send', a.error);
    const to = Object.keys(addresses).find((name) => addresses[name] === a.data.to);
    if (!to) return 'wNEAR goes only to the address of another agent of the crowd';
    const amount = unitsOf(a.data.amount);
    if (amount <= 0n || amount > SEND_AT_MOST) return `a transfer in the crowd is more than nothing and at most ${nearOf(SEND_AT_MOST)} wNEAR`;
    if (sight.wnear < amount + KEEP_WNEAR) return `${sight.name} keeps ${nearOf(KEEP_WNEAR)} wNEAR for questions`;
    const refused = this.kit({ action: 'send', to });
    if (refused) return refused;
    return { args: { to: a.data.to, amount: nearOf(amount) }, line: () => `${sight.name} sent ${nearOf(amount)} wNEAR to ${to}` };
  }

  private withdraw(raw: Record<string, unknown>): Fit | string {
    const { sight } = this.opts;
    const a = Withdraw.safeParse(raw);
    if (!a.success) return wrong('withdraw', a.error);
    if (a.data.to !== undefined) return 'a withdrawal of the crowd goes to the agent\'s own NEAR account, so it names no "to"';
    if (unitsOf(a.data.amount) !== WITHDRAW) return `a withdrawal of the crowd is exactly ${nearOf(WITHDRAW)} wNEAR`;
    const refused = this.kit({ action: 'withdraw' });
    if (refused) return refused;
    return { args: { amount: nearOf(WITHDRAW) }, line: (answer) => `${sight.name} withdrew ${nearOf(WITHDRAW)} wNEAR to NEAR${idIn(answer, 'id', 'withdrawal', 8)}` };
  }

  private deposit(raw: Record<string, unknown>): Fit | string {
    const { sight } = this.opts;
    const a = Deposit.safeParse(raw);
    if (!a.success) return wrong('deposit', a.error);
    if (sight.lock === undefined) return 'the bridge takes no new locks now';
    const near = nearOfLock(sight.lock);
    if (unitsOf(a.data.amount) * YOCTO_PER_UNIT !== sight.lock) return `a deposit of the crowd is exactly ${near} NEAR`;
    const refused = this.kit({ action: 'deposit' });
    if (refused) return refused;
    return { args: { amount: near }, line: (answer) => `${sight.name} deposited ${near} NEAR${idIn(answer, 'lock', 'lock')}` };
  }
}
