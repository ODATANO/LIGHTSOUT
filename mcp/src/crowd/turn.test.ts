import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type Decision, ruleMind } from 'lightsout-kit/crowd/mind';
import { DEFAULT_MODEL } from 'lightsout-kit/question';
import type { Guard } from './guard.js';
import { guardOf, HEIDI, IVAN, QUESTION, server } from './helpers.js';
import { briefOf, effortOf, type Minds, play, ruleTurn, type Told } from './turn.js';

const none = { question: '', reward: '', to: '', reason: 'because' };
const fixed = (decision: Partial<Decision>) => ({ decide: async (): Promise<Decision> => ({ ...none, action: 'wait', ...decision }) });
const told = (over: Partial<Told> = {}): Told => ({ stop: 'end_turn', servedBy: 'claude-test', usage: { input: 900, cacheRead: 0, cacheWrite: 0, output: 60 }, requests: 3, said: 'I asked a question.', ...over });

test('the rules act through the same guard', async () => {
  const asked = await guardOf();
  assert.equal(await ruleTurn(asked.guard, fixed({ action: 'ask', question: QUESTION, reward: '0.01' }), DEFAULT_MODEL), 'because');
  assert.deepEqual(asked.inner.reached, [{ name: 'ask', arguments: { prompt: QUESTION, reward: '0.01', model: DEFAULT_MODEL, max_tokens: 64, deadline_minutes: 120 } }]);

  const sent = await guardOf();
  await ruleTurn(sent.guard, fixed({ action: 'send', to: 'ivan' }), DEFAULT_MODEL);
  assert.deepEqual(sent.inner.reached, [{ name: 'send', arguments: { to: IVAN, amount: '0.02' } }]);
  // The turn's action is used up for the rules as for a model.
  await ruleTurn(sent.guard, fixed({ action: 'withdraw' }), DEFAULT_MODEL);
  assert.deepEqual(sent.inner.reached.map((call) => call.name), ['send']);
  assert.deepEqual(sent.guard.calls.at(-1), { tool: 'withdraw', args: { amount: '0.1' }, outcome: 'refused', why: 'a turn has one action, and grace did it already' });

  const moved = await guardOf();
  await ruleTurn(moved.guard, fixed({ action: 'withdraw' }), DEFAULT_MODEL);
  assert.equal(moved.guard.did, 'grace withdrew 0.1 wNEAR to NEAR (withdrawal cdcdcdcd)');
  const locked = await guardOf();
  await ruleTurn(locked.guard, fixed({ action: 'deposit' }), DEFAULT_MODEL);
  assert.deepEqual(locked.inner.reached, [{ name: 'deposit', arguments: { amount: '0.1' } }]);

  const waited = await guardOf();
  assert.equal(await ruleTurn(waited.guard, fixed({}), DEFAULT_MODEL), 'because');
  assert.equal(await ruleTurn(waited.guard, fixed({ action: 'send', to: 'mallory' }), DEFAULT_MODEL), 'mallory is not in the crowd');
  assert.deepEqual(waited.inner.reached, []);

  // The kit's own rules, with rolls that pick the first question of their list.
  const rolls = [0.9, 0, 0];
  const real = await guardOf();
  await ruleTurn(real.guard, ruleMind(() => rolls.shift() ?? 0), DEFAULT_MODEL);
  assert.equal(real.inner.reached[0]?.name, 'ask');
  assert.match(real.guard.did ?? '', /^grace asked "Why is the sky blue at noon and red at sunset\?" for 0\.01 wNEAR/);
});

// Minds whose budget and spending the test can watch. The rules always withdraw.
function minds(claude: Minds['claude'], left = 5): Minds & { spent: string[] } {
  const spent: string[] = [];
  return { claude, left: async () => left - spent.length, spend: async (agent) => void spent.push(agent), rules: fixed({ action: 'withdraw' }), model: () => DEFAULT_MODEL, now: () => Date.UTC(2026, 10, 13, 9, 0, 0), spent };
}
const asks = async (guard: Guard): Promise<Told> => {
  await guard.callTool({ name: 'ask', arguments: { prompt: QUESTION, reward: '0.02' } });
  return told();
};

test('Claude takes the turn, and its calls and its tokens go into the journal', async () => {
  const { guard, inner } = await guardOf();
  const minded = minds(async (g) => {
    await g.callTool({ name: 'balance' });
    await g.callTool({ name: 'send', arguments: { to: HEIDI, amount: '0.5' } });
    return asks(g);
  });
  assert.deepEqual(await play(guard, minded), {
    at: '2026-11-13T09:00:00.000Z',
    agent: 'grace',
    mind: 'claude',
    ...told(),
    fallback: undefined,
    calls: [
      { tool: 'balance', args: {}, outcome: 'ok' },
      { tool: 'send', args: { to: HEIDI, amount: '0.5' }, outcome: 'refused', why: 'a transfer in the crowd is more than nothing and at most 0.05 wNEAR' },
      { tool: 'ask', args: { prompt: QUESTION, reward: '0.02', model: DEFAULT_MODEL, max_tokens: 64, deadline_minutes: 120 }, outcome: 'ok' },
    ],
    did: `grace asked "${QUESTION}" for 0.02 wNEAR (question abababab)`,
  });
  assert.deepEqual(minded.spent, ['grace']);
  assert.deepEqual(inner.reached.map((call) => call.name), ['balance', 'ask']);

  // A turn in which Claude does nothing is a wait, and the rules stay out of it.
  const idle = await guardOf();
  const waited = await play(idle.guard, minds(async () => told({ said: 'Two questions are open, so I wait.' })));
  assert.equal(waited.mind, 'claude');
  assert.equal(waited.did, undefined);
  assert.deepEqual(idle.inner.reached, []);
});

test('a spent budget, a failed turn and a declined turn go to the rules', async () => {
  const spentUp = await guardOf();
  let called = 0;
  const broke = minds(async () => {
    called++;
    return told();
  }, 0);
  const first = await play(spentUp.guard, broke);
  assert.equal(first.fallback, 'its budget of model turns for today is spent');
  assert.equal(first.mind, 'rules');
  assert.equal(first.said, 'because');
  assert.equal(called, 0);
  assert.deepEqual(broke.spent, []);
  assert.deepEqual(spentUp.inner.reached, [{ name: 'withdraw', arguments: { amount: '0.1' } }]);

  const failing = await guardOf();
  const second = await play(failing.guard, minds(async () => Promise.reject(new Error('529 overloaded'))));
  assert.equal(second.fallback, 'the model did not answer: 529 overloaded');
  assert.equal(second.mind, 'rules');
  assert.equal(second.did, 'grace withdrew 0.1 wNEAR to NEAR (withdrawal cdcdcdcd)');

  const declined = await guardOf();
  const third = await play(declined.guard, minds(async () => told({ stop: 'refusal', said: '' })));
  assert.equal(third.fallback, 'the model declined the turn');
  assert.equal(third.mind, 'rules');
  assert.equal(third.servedBy, 'claude-test');
  assert.deepEqual(declined.inner.reached.map((call) => call.name), ['withdraw']);

  // Without Claude the rules decide every turn and no budget is touched.
  const plain = await guardOf();
  const ruled = minds(undefined);
  const fourth = await play(plain.guard, ruled);
  assert.equal(fourth.mind, 'rules');
  assert.equal(fourth.fallback, undefined);
  assert.deepEqual(ruled.spent, []);
  assert.deepEqual(plain.inner.reached.map((call) => call.name), ['withdraw']);
});

test('the rules add nothing to a turn in which Claude acted or an action failed', async () => {
  const acted = await guardOf();
  const first = await play(acted.guard, minds(async (guard) => {
    await asks(guard);
    throw new Error('connection reset');
  }));
  assert.equal(first.fallback, 'the model did not answer: connection reset');
  assert.equal(first.mind, 'claude');
  assert.deepEqual(acted.inner.reached.map((call) => call.name), ['ask']);

  const failed = await guardOf({ inner: server({ ask: 'the proof server does not answer' }) });
  const second = await play(failed.guard, minds(async (guard) => {
    await asks(guard);
    return told({ stop: 'refusal' });
  }));
  assert.equal(second.fallback, 'the model declined the turn');
  assert.equal(second.did, undefined);
  assert.deepEqual(failed.inner.reached.map((call) => call.name), ['ask']);
});

test('a turn starts from what the tools do not tell', async () => {
  const { guard } = await guardOf({ see: { recent: ['heidi withdrew 0.1 wNEAR to NEAR'] } });
  assert.deepEqual(briefOf(guard), { name: 'grace', near: '0.6', recent: ['heidi withdrew 0.1 wNEAR to NEAR'], ...guard.allows() });
  assert.equal('wnear' in briefOf(guard), false);
  assert.equal('onBoard' in briefOf(guard), false);
});

test('an effort is one of the five the API knows', () => {
  assert.equal(effortOf('low'), 'low');
  assert.equal(effortOf('xhigh'), 'xhigh');
  assert.throws(() => effortOf('fast'), /an effort is one of low, medium, high, xhigh, max, not fast/);
});
