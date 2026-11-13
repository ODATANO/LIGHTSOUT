import type Anthropic from '@anthropic-ai/sdk';
import { mcpTools, type MCPToolLike } from '@anthropic-ai/sdk/helpers/beta/mcp';
import { nearOf } from 'lightsout-kit/codec';
import { SEND, WITHDRAW } from 'lightsout-kit/crowd/limits';
import { checked, CROWD_PROMPT, type Decision, type Move, type View } from 'lightsout-kit/crowd/mind';
import { reasonOf } from 'lightsout-kit/reason';
import type { Call, Guard } from './guard.js';

export const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type Effort = (typeof EFFORTS)[number];

/** The effort a setting names; throws for a word that is none. */
export function effortOf(word: string): Effort {
  const effort = EFFORTS.find((known) => known === word);
  if (!effort) throw new Error(`an effort is one of ${EFFORTS.join(', ')}, not ${word}`);
  return effort;
}

// The requests one turn makes at most. A turn that looks, acts and reports needs three or four.
const MAX_ITERATIONS = 6;

const TOOLS_NOTE = `You act through the tools of your own agent, not with a written decision. The message you get is your view without your wNEAR and without the board: balance shows what you hold, and bounties shows your open questions and the newest questions on the board. Looking changes nothing. ask, send, withdraw and deposit are the actions. Call at most one of them in a round, and none to wait. A guard in code checks every call against the limits in your view. It refuses a call that does not fit and says why. Then choose something that fits, or wait. For ask leave max_tokens and deadline_minutes out, and name a model only when your view lists more than one. For send use an address from your view. Once an action went through, the round is over: call no further tool, also not to check it. End the round with one plain sentence that says what you did and why.`;

/** What one turn of Claude came to. */
export interface Told {
  stop: string | null; // why the last reply ended
  servedBy: string; // the model that wrote the last reply
  usage: { input: number; cacheRead: number; cacheWrite: number; output: number }; // tokens of all requests of the turn
  requests: number;
  said: string; // the last reply's text, cut
}

/** What Claude gets at the start of a turn. It holds what the tools do not tell and what the limits allow. */
export function briefOf(guard: Guard): object {
  const { name, near, recent } = guard.view;
  return { name, near, recent, ...guard.allows() };
}

/**
 * One turn of Claude for one agent. Claude gets the agent's MCP tools and calls them itself.
 * Each call goes through `guard`, which is the only way to the server.
 */
export async function claudeTurn(client: Anthropic, model: string, effort: Effort, guard: Guard, tools: MCPToolLike[]): Promise<Told> {
  const runner = client.beta.messages.toolRunner({
    model,
    max_tokens: 16000,
    // When a model declines a request, the API lets another model answer it. Haiku has no such fallback.
    ...(model.startsWith('claude-haiku') ? {} : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }),
    output_config: { effort },
    // The tools and the prompt are the same in every turn, and turns lie minutes apart: cached
    // for an hour. What a turn adds is cached for its own few requests.
    cache_control: { type: 'ephemeral' },
    system: [{ type: 'text', text: `${CROWD_PROMPT}\n\n${TOOLS_NOTE}`, cache_control: { type: 'ephemeral', ttl: '1h' } }],
    tools: mcpTools(tools, guard),
    messages: [{ role: 'user', content: JSON.stringify(briefOf(guard), null, 1) }],
    max_iterations: MAX_ITERATIONS,
    // A turn is a few short requests, so each one carries the whole of it and the API keeps none.
    thread: false,
  });
  const usage = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
  let requests = 0;
  for await (const message of runner) {
    requests++;
    usage.input += message.usage.input_tokens;
    usage.cacheRead += message.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += message.usage.cache_creation_input_tokens ?? 0;
    usage.output += message.usage.output_tokens;
  }
  const last = await runner.done();
  const said = last.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join(' ').trim();
  return { stop: last.stop_reason, servedBy: last.model, usage, requests, said: said.slice(0, 300) };
}

// The tool call that makes a move. The guard fills in what an ask leaves open.
function callOf(move: Exclude<Move, { action: 'wait' }>, model: string, guard: Guard): { name: string; arguments: Record<string, unknown> } {
  const allowed = guard.allows();
  switch (move.action) {
    case 'ask':
      return { name: 'ask', arguments: { prompt: move.question, reward: move.reward, model } };
    case 'send':
      return { name: 'send', arguments: { to: allowed.send.to[move.to], amount: nearOf(SEND) } };
    case 'withdraw':
      return { name: 'withdraw', arguments: { amount: nearOf(WITHDRAW) } };
    case 'deposit':
      return { name: 'deposit', arguments: { amount: allowed.deposit?.amount } };
  }
}

/**
 * A turn without Claude: the rules decide and the move goes through the same guard. `model`
 * answers a question. Returns why the rules chose what they did, or why nothing came of it.
 */
export async function ruleTurn(guard: Guard, rules: { decide(view: View): Promise<Decision> }, model: string): Promise<string> {
  const decision = await rules.decide(guard.view);
  const move = checked(decision, guard.view, model);
  if ('refused' in move) return move.refused;
  if (move.action !== 'wait') await guard.callTool(callOf(move, model, guard));
  return decision.reason;
}

/** Who decides a turn, and the budget of the one that costs money. */
export interface Minds {
  claude?: (guard: Guard) => Promise<Told>; // absent = the rules decide every turn
  left(agent: string): Promise<number>; // the turns Claude may still take for this agent today
  spend(agent: string): Promise<void>;
  rules: { decide(view: View): Promise<Decision> };
  model(): string; // the model a question of the rules asks
  now?: () => number;
}

/** One turn as the journal keeps it. */
export interface Entry extends Partial<Told> {
  at: string;
  agent: string;
  mind: 'claude' | 'rules'; // who decided in the end
  fallback?: string; // why Claude's turn did not count
  calls: Call[];
  did?: string; // the line of the action that went through
}

/**
 * An agent's turn behind its guard. Claude takes it while its budget lasts. A spent budget, a
 * failed turn or a turn Claude declines goes to the rules.
 */
export async function play(guard: Guard, { claude, left, spend, rules, model, now = Date.now }: Minds): Promise<Entry> {
  const agent = guard.view.name;
  let told: Partial<Told> = {};
  let fallback: string | undefined;
  if (claude) {
    if ((await left(agent)) <= 0) fallback = 'its budget of model turns for today is spent';
    else {
      await spend(agent);
      try {
        told = await claude(guard);
        if (told.stop === 'refusal') fallback = 'the model declined the turn';
      } catch (e) {
        fallback = `the model did not answer: ${reasonOf(e).slice(0, 200)}`;
      }
    }
  }
  // An action Claude made before its turn broke off stands, and the rules add none.
  const byRules = (!claude || fallback !== undefined) && !guard.did && !guard.failed;
  if (byRules) told.said = await ruleTurn(guard, rules, model());
  return { at: new Date(now()).toISOString(), agent, mind: byRules ? 'rules' : 'claude', ...told, fallback, calls: guard.calls, did: guard.did };
}
