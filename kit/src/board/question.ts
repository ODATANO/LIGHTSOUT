// The question of a bounty: one chat request to a NEAR AI model, which the board publishes.
import { randomInt } from 'node:crypto';
import { chatRequest } from '../inference/nearai.js';
import { REQUEST_BYTES, answerCircuit } from './bounty.js';

/** The NEAR AI model a bounty asks when none is named. */
export const DEFAULT_MODEL = 'Qwen/Qwen3.8-27B';
// A response holds about 500 bytes besides the text, and a drop 4096 in all.
export const MAX_ANSWER_TOKENS = 512;
export const DEFAULT_ANSWER_TOKENS = 64;
// Each request carries a random seed below this, so that no two bounties share a signed answer.
const SEEDS = 2 ** 31;

const requestOf = (prompt: string, model: string, maxTokens: number, seed: number): string => chatRequest(model, [{ role: 'user', content: prompt }], maxTokens, seed);

/** Throws when the board cannot take this question: a model it does not answer, too many tokens or too long a request. */
export function checkQuestion(prompt: string, model = DEFAULT_MODEL, maxTokens = DEFAULT_ANSWER_TOKENS): void {
  answerCircuit(model);
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > MAX_ANSWER_TOKENS) throw new Error(`an answer has 1 to ${MAX_ANSWER_TOKENS} tokens, not ${maxTokens}`);
  if (prompt.trim() === '') throw new Error('the question is empty');
  // The request's length varies with its seed, so the longest seed decides.
  const over = Buffer.byteLength(requestOf(prompt, model, maxTokens, SEEDS - 1)) - REQUEST_BYTES;
  if (over > 0) throw new Error(`the question is ${over} bytes too long for the board`);
}

/** The exact request bytes of a question that passed `checkQuestion`, with a seed of their own. */
export function questionRequest(prompt: string, model: string, maxTokens: number): string {
  checkQuestion(prompt, model, maxTokens);
  return requestOf(prompt, model, maxTokens, randomInt(SEEDS));
}
