import { checkQuestion } from '../board/question.js';
import { QUESTIONS } from './questions.js';

// A crowd is a few agents of a deployment that act in turns, so that its board and its bridge
// always show something. Each round one agent decides one thing. A mind makes the decision,
// and the checks below turn it into a move or refuse it.

export type Action = 'ask' | 'send' | 'withdraw' | 'deposit' | 'wait';

/** What an agent of the crowd sees before it decides. Amounts are decimal strings of wNEAR or NEAR. */
export interface View {
  name: string;
  wnear: string; // its shielded balance
  near: string; // its NEAR account's balance
  open: { question: string; minutes: number }[]; // its own questions without an answer yet
  others: string[]; // the other agents of the crowd, by name
  recent: string[]; // what the crowd did lately, oldest first
  onBoard: string[]; // the questions on the board now
  today: Record<Exclude<Action, 'wait'>, number>; // how often it did each thing today
  may: Record<Exclude<Action, 'wait'>, boolean>; // what its balances and the day's limits allow now
  rewards: string[]; // the rewards a question can carry
}

/** What a mind answers: one action and what it needs. Fields the action does not use are empty. */
export interface Decision {
  action: Action;
  question: string;
  reward: string;
  to: string;
  reason: string;
}

/** A decision that passed the checks, in the terms the agent's calls take. */
export type Move = { action: 'ask'; question: string; reward: string } | { action: 'send'; to: string } | { action: 'withdraw' } | { action: 'deposit' } | { action: 'wait' };

export const CROWD_PROMPT = `You are one agent of a small crowd on LIGHTSOUT, a bridge between NEAR and Midnight with a board where members ask AI models questions for a reward. The crowd belongs to the operator of this deployment. It keeps acting so that visitors of the public page always see real activity. Everything you do is a real transaction with test funds.

Each round you decide one thing:
- ask: post a question with a reward. A solver asks an open model and the board pays it for the signed answer.
- send: move a little wNEAR privately to another agent of the crowd.
- withdraw: burn wNEAR on Midnight so that the NEAR contract pays your NEAR account.
- deposit: lock NEAR so that wNEAR is minted for you on Midnight.
- wait: do nothing this round.

Your view says what you hold, what you already did today, what the crowd did lately and which actions are possible now (may). Choose only an action whose may is true. Over a day a visitor should see a mix: mostly questions, and among them a few private transfers, withdrawals and deposits, so that a member who sends or withdraws is one of several. Look at what you did today and at what the crowd did lately. When that shows only questions, send, withdraw or deposit instead. Deposit when your wNEAR runs low. Wait when you have two questions open and nothing else is due.

A question is public for good and is answered by a small open model in a sentence or a short paragraph. Write a general-knowledge question about science, nature, history, language, mathematics, cooking, geography or computing. Do not repeat or rephrase a question that is on the board or in the recent list. Name no living person, ask for no medical, legal or financial advice, and put no address, link or number sequence into it.`;

const MAX_QUESTION_CHARS = 160;
const OPEN_AT_MOST = 2;

/** Why the board must not carry this question as one of the crowd's, or undefined when it may. */
export function questionFault(question: string, view: Pick<View, 'onBoard' | 'recent'>, model: string): string | undefined {
  const text = question.trim();
  if (text.length < 12 || text.length > MAX_QUESTION_CHARS) return `a question has 12 to ${MAX_QUESTION_CHARS} characters`;
  if (!/^[\x20-\x7e]+$/.test(text)) return 'a question is plain English text';
  if (/@|https?:|www\.|\d{5,}/i.test(text)) return 'a question holds no address, link or long number';
  if (taken(text, view)) return 'that question was asked already';
  try {
    checkQuestion(text, model);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  return undefined;
}

/** Turns a decision into a move, or says why the crowd does not make it. `model` answers a question. */
export function checked(decision: Decision, view: View, model: string): Move | { refused: string } {
  const { action } = decision;
  if (action === 'wait') return { action };
  if (!view.may[action]) return { refused: `${view.name} cannot ${action} now` };
  if (action === 'ask') {
    if (view.open.length >= OPEN_AT_MOST) return { refused: `${view.name} has ${view.open.length} questions open` };
    if (!view.rewards.includes(decision.reward)) return { refused: `a reward is one of ${view.rewards.join(', ')}` };
    const fault = questionFault(decision.question, view, model);
    return fault ? { refused: fault } : { action, question: decision.question.trim(), reward: decision.reward };
  }
  if (action === 'send') return view.others.includes(decision.to) ? { action, to: decision.to } : { refused: `${decision.to || 'nobody'} is not in the crowd` };
  return { action };
}

/**
 * Decides without a model: mostly a question from the list, sometimes a transfer or a trip over
 * the bridge. `random` returns numbers from 0 up to 1.
 */
export function ruleMind(random: () => number = Math.random): { decide(view: View): Promise<Decision> } {
  const pick = <T>(items: readonly T[]): T | undefined => items[Math.floor(random() * items.length)];
  return {
    async decide(view) {
      const none = { question: '', reward: '', to: '' };
      // Low on wNEAR, the agent fills up before anything else.
      if (view.may.deposit && !view.may.ask) return { ...none, action: 'deposit', reason: 'wNEAR runs low' };
      const roll = random();
      if (roll < 0.06 && view.may.withdraw) return { ...none, action: 'withdraw', reason: 'shows the way back to NEAR' };
      if (roll < 0.12 && view.may.deposit) return { ...none, action: 'deposit', reason: 'shows the way in from NEAR' };
      const to = pick(view.others);
      if (roll < 0.24 && view.may.send && to) return { ...none, action: 'send', to, reason: 'a private transfer inside the crowd' };
      const question = pick(QUESTIONS.filter((asked) => !taken(asked, view)));
      const reward = pick(view.rewards);
      if (view.may.ask && view.open.length < OPEN_AT_MOST && question && reward) return { ...none, action: 'ask', question, reward, reason: 'a question from the list' };
      return { ...none, action: 'wait', reason: 'nothing to do this round' };
    },
  };
}

// Whether the board or the crowd's recent moves hold this question already.
function taken(question: string, view: Pick<View, 'onBoard' | 'recent'>): boolean {
  const text = question.toLowerCase();
  return view.onBoard.some((other) => other.trim().toLowerCase() === text) || view.recent.some((line) => line.toLowerCase().includes(text));
}
