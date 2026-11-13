// What a visitor's call may carry. The form's limits hold here too, because a visitor can post
// any JSON. A call gets only the arguments named here, in the form the agent's tools take.
import { network } from 'lightsout-kit/bridge';
import { isNearAccount, LEAST_BURN, nearOf, parseShieldedAddress, unitsOf } from 'lightsout-kit/codec';
import { checkQuestion, DEFAULT_ANSWER_TOKENS, DEFAULT_MODEL } from 'lightsout-kit/question';
import type { Tool } from './agents.js';

/** The models the sandbox's solver answers, and the answer lengths its form offers. */
export const MODELS = [DEFAULT_MODEL, 'Qwen/Qwen3.6-35B-A3B-FP8', 'deepseek-ai/DeepSeek-V4.1-Flash-1017'];
export const ANSWER_TOKENS = [24, 64, 128];
// A session lasts an hour. With this deadline a visitor can take an unanswered reward back in it.
export const QUESTION_MINUTES = 30;
const QUESTION_CHARACTERS = 300;

export interface Checked {
  args: Record<string, unknown>; // what the agent's tool gets
  spends: bigint; // micro-NEAR of wNEAR that leave the agent
}

/** A refusal with a sentence the visitor reads. */
export class Refused extends Error {}

function text(value: unknown, what: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Refused(`${what} is missing.`);
  return value.trim();
}

function amount(value: unknown, what: string): { shown: string; units: bigint } {
  const shown = text(value, what).replace(',', '.');
  let units: bigint;
  try {
    units = unitsOf(shown);
  } catch {
    throw new Refused(`${what} is an amount with at most six decimals, such as 0.01.`);
  }
  if (units <= 0n) throw new Refused(`${what} must be more than 0.`);
  return { shown, units };
}

// An amount of NEAR as the bridge locks it.
function lockOf(value: unknown, locks: readonly bigint[]): string {
  const near = amount(value, 'The amount');
  if (locks.length === 0) throw new Refused('The page has not read the bridge yet. Try again in a moment.');
  if (!locks.includes(near.units)) throw new Refused(`The bridge locks ${locks.map(nearOf).join(', ')} NEAR at a time.`);
  return nearOf(near.units);
}

/**
 * The arguments of a visitor's call as its tool takes them, and what the call spends. `locks`
 * are the amounts the bridge locks, in micro-NEAR. Throws `Refused`.
 */
export function checked(tool: Tool, given: Record<string, unknown>, leastReward: bigint, locks: readonly bigint[] = []): Checked {
  switch (tool) {
    // The NEAR of a deposit stays the agent's own: it comes back as wNEAR at its address.
    case 'deposit':
      return { args: { amount: lockOf(given.amount, locks) }, spends: 0n };
    case 'register':
      return { args: given.deposit === undefined || given.deposit === '' ? {} : { deposit: lockOf(given.deposit, locks) }, spends: 0n };
    case 'send': {
      const to = text(given.to, 'The shielded address');
      try {
        parseShieldedAddress(to, network);
      } catch {
        throw new Refused(`That is no shielded address on Midnight ${network}. One starts with mn_shield-addr_${network}.`);
      }
      const sent = amount(given.amount, 'The amount');
      return { args: { to, amount: sent.shown }, spends: sent.units };
    }
    case 'withdraw': {
      const burnt = amount(given.amount, 'The amount');
      if (burnt.units < LEAST_BURN) throw new Refused(`The bridge takes a withdrawal of ${nearOf(LEAST_BURN)} wNEAR or more.`);
      const to = given.to === undefined || given.to === '' ? undefined : text(given.to, 'The NEAR account');
      if (to !== undefined && !isNearAccount(to)) throw new Refused(`${to} is no NEAR account id.`);
      return { args: { amount: burnt.shown, ...(to === undefined ? {} : { to }) }, spends: burnt.units };
    }
    case 'withdrawal': {
      const burn = text(given.burn, 'The id of the burn');
      if (!/^[0-9a-f]{64}$/.test(burn)) throw new Refused('A burn is named by its id of 64 hex digits.');
      return { args: { burn }, spends: 0n };
    }
    case 'ask': {
      const prompt = text(given.prompt, 'The question');
      const model = given.model ?? DEFAULT_MODEL;
      const maxTokens = given.max_tokens ?? DEFAULT_ANSWER_TOKENS;
      if (typeof model !== 'string' || !MODELS.includes(model)) throw new Refused('The sandbox asks one of the models in its list.');
      if (typeof maxTokens !== 'number' || !ANSWER_TOKENS.includes(maxTokens)) throw new Refused('The sandbox offers the answer lengths in its list.');
      if ([...prompt].length > QUESTION_CHARACTERS) throw new Refused(`A question has at most ${QUESTION_CHARACTERS} characters.`);
      try {
        checkQuestion(prompt, model, maxTokens);
      } catch (e) {
        throw new Refused(`The board cannot take this question: ${e instanceof Error ? e.message : String(e)}.`);
      }
      const reward = amount(given.reward, 'The reward');
      if (reward.units < leastReward) throw new Refused(`The solver here works for ${nearOf(leastReward)} wNEAR or more.`);
      return { args: { prompt, model, max_tokens: maxTokens, reward: reward.shown, deadline_minutes: QUESTION_MINUTES }, spends: reward.units };
    }
    default:
      return { args: {}, spends: 0n };
  }
}
