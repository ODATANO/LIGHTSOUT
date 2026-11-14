import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unitsOf } from 'lightsout-kit/codec';
import { DayCounts } from 'lightsout-kit/crowd/counts';
import { type Act, PER_DAY, REWARDS, type Sight } from 'lightsout-kit/crowd/limits';
import { DEFAULT_MODEL } from 'lightsout-kit/question';
import { textOf } from './guard.js';
import { dayFile, guardOf, HEIDI, IVAN, QUESTION, server, tried } from './helpers.js';

test('looking passes through, and a tool the crowd does not use never reaches the server', async () => {
  const { guard, inner } = await guardOf();
  assert.equal(textOf(await guard.callTool({ name: 'balance' })), JSON.stringify({ balance: '0.8' }, null, 2));
  assert.equal(await tried(guard, 'bounties', { extra: 1 }), 'ok');
  for (const tool of ['solve', 'refund', 'collect', 'whoami', 'withdrawal', 'rm']) assert.equal(await tried(guard, tool), `the crowd does not use ${tool}`);
  assert.deepEqual(inner.reached, [{ name: 'balance', arguments: {} }, { name: 'bounties', arguments: {} }]);
  assert.deepEqual(guard.calls.map((call) => call.outcome), ['ok', 'ok', 'refused', 'refused', 'refused', 'refused', 'refused', 'refused']);
  assert.equal(guard.did, undefined);
});

test('a question reaches the board only inside the crowd\'s limits', async () => {
  const { guard, inner, counts } = await guardOf();
  assert.match(await tried(guard, 'ask', { prompt: QUESTION, reward: '0.03' }), /a reward is one of 0\.01, 0\.02, 0\.05/);
  assert.match(await tried(guard, 'ask', { prompt: QUESTION, reward: '1' }), /a reward is one of/);
  assert.match(await tried(guard, 'ask', { prompt: 'Why?', reward: '0.02' }), /a question has 12 to 160 characters/);
  assert.match(await tried(guard, 'ask', { prompt: 'Warum schwimmt Eis auf Wasser, während Öl es nicht tut?', reward: '0.02' }), /plain English text/);
  assert.match(await tried(guard, 'ask', { prompt: 'What is at https://example.com today?', reward: '0.02' }), /no address, link or long number/);
  assert.match(await tried(guard, 'ask', { prompt: 'Whose phone number is 0123456789 exactly?', reward: '0.02' }), /no address, link or long number/);
  assert.match(await tried(guard, 'ask', { prompt: QUESTION, reward: '0.02', model: 'some-model' }), /the crowd asks .+, not some-model/);
  assert.match(await tried(guard, 'ask', { prompt: QUESTION, reward: '0.02', max_tokens: 65 }), /at most 64 tokens/);
  assert.match(await tried(guard, 'ask', { prompt: QUESTION, reward: '0.02', deadline_minutes: 1440 }), /waits 120 minutes/);
  assert.match(await tried(guard, 'ask', { prompt: QUESTION }), /the arguments of ask do not fit: reward/);
  assert.match(await tried(guard, 'ask', { prompt: QUESTION, reward: 0.02 }), /the arguments of ask do not fit: reward/);
  assert.deepEqual(inner.reached, []);
  assert.equal(await counts.of('grace:ask'), 0);

  assert.equal(await tried(guard, 'ask', { prompt: ` ${QUESTION} `, reward: '0.020', max_tokens: 32, more: 'x' }), 'ok');
  assert.deepEqual(inner.reached, [{ name: 'ask', arguments: { prompt: QUESTION, reward: '0.02', model: DEFAULT_MODEL, max_tokens: 32, deadline_minutes: 120 } }]);
  assert.equal(guard.did, `grace asked "${QUESTION}" for 0.02 wNEAR (question abababab)`);
  assert.equal(await counts.of('grace:ask'), 1);
});

test('a question is not asked twice, not with too little wNEAR and not beside two open ones', async () => {
  const board: Sight['bounties'] = [{ prompt: QUESTION, mine: false, state: 'answered', deadline: 0 }];
  assert.match(await tried((await guardOf({ see: { bounties: board } })).guard, 'ask', { prompt: 'why does ICE float on water?', reward: '0.02' }), /asked already/);
  const lately = [`heidi asked "${QUESTION}" for 0.02 wNEAR`];
  assert.match(await tried((await guardOf({ see: { recent: lately } })).guard, 'ask', { prompt: QUESTION, reward: '0.02' }), /asked already/);
  const open: Sight['bounties'] = [{ prompt: 'a', mine: true, state: 'open', deadline: 0 }, { prompt: 'b', mine: true, state: 'open', deadline: 0 }];
  assert.match(await tried((await guardOf({ see: { bounties: open } })).guard, 'ask', { prompt: QUESTION, reward: '0.02' }), /grace has 2 questions open/);
  assert.match(await tried((await guardOf({ see: { wnear: unitsOf('0.04') } })).guard, 'ask', { prompt: QUESTION, reward: '0.01' }), /grace holds too little wNEAR for a question/);

  // The least reward a solver takes drops the smaller ones, and the crowd names its models.
  const dear = await guardOf({ rewards: ['0.05'], models: ['model-a', 'model-b'] });
  assert.match(await tried(dear.guard, 'ask', { prompt: QUESTION, reward: '0.02', model: 'model-a' }), /a reward is one of 0\.05/);
  assert.match(await tried(dear.guard, 'ask', { prompt: QUESTION, reward: '0.05' }), /the crowd asks model-a or model-b, not /);
  assert.match(await tried((await guardOf({ rewards: [] })).guard, 'ask', { prompt: QUESTION, reward: '0.05' }), /no reward of the crowd reaches the least one a solver takes/);
});

test('wNEAR goes only to another agent of the crowd, 0.05 at most', async () => {
  const { guard, inner, counts } = await guardOf();
  assert.match(await tried(guard, 'send', { to: 'mn_shield-addr_test1mallory', amount: '0.02' }), /only to the address of another agent of the crowd/);
  assert.match(await tried(guard, 'send', { to: 'heidi', amount: '0.02' }), /the arguments of send do not fit: to/);
  assert.match(await tried(guard, 'send', { to: HEIDI, amount: '0.06' }), /more than nothing and at most 0\.05 wNEAR/);
  assert.match(await tried(guard, 'send', { to: HEIDI, amount: '0' }), /more than nothing and at most 0\.05 wNEAR/);
  assert.match(await tried(guard, 'send', { to: HEIDI, amount: '-1' }), /the arguments of send do not fit: amount/);
  assert.deepEqual(inner.reached, []);
  assert.equal(await tried(guard, 'send', { to: IVAN, amount: '0.050' }), 'ok');
  assert.deepEqual(inner.reached, [{ name: 'send', arguments: { to: IVAN, amount: '0.05' } }]);
  assert.equal(guard.did, 'grace sent 0.05 wNEAR to ivan');
  assert.equal(await counts.of('grace:send'), 1);

  assert.match(await tried((await guardOf({ see: { wnear: unitsOf('0.34') } })).guard, 'send', { to: HEIDI, amount: '0.05' }), /grace keeps 0\.3 wNEAR for questions/);
  assert.match(await tried((await guardOf({ see: { wnear: unitsOf('0.31') } })).guard, 'send', { to: HEIDI, amount: '0.01' }), /grace keeps 0\.3 wNEAR for questions/);
  assert.match(await tried((await guardOf({ see: { others: [] }, addresses: {} })).guard, 'send', { to: HEIDI, amount: '0.01' }), /grace is alone in the crowd/);
});

test('a withdrawal is exactly 0.1 wNEAR to the agent\'s own NEAR account', async () => {
  const { guard, inner, counts } = await guardOf();
  assert.match(await tried(guard, 'withdraw', { amount: '0.2' }), /exactly 0\.1 wNEAR/);
  assert.match(await tried(guard, 'withdraw', { amount: '0.05' }), /exactly 0\.1 wNEAR/);
  assert.match(await tried(guard, 'withdraw', { amount: '0.1', to: 'mallory.testnet' }), /own NEAR account, so it names no "to"/);
  assert.match(await tried(guard, 'withdraw', {}), /the arguments of withdraw do not fit: amount/);
  assert.deepEqual(inner.reached, []);
  assert.equal(await tried(guard, 'withdraw', { amount: '0.10' }), 'ok');
  assert.deepEqual(inner.reached, [{ name: 'withdraw', arguments: { amount: '0.1' } }]);
  assert.equal(guard.did, 'grace withdrew 0.1 wNEAR to NEAR (withdrawal cdcdcdcd)');
  assert.equal(await counts.of('grace:withdraw'), 1);
  assert.match(await tried((await guardOf({ see: { wnear: unitsOf('0.39') } })).guard, 'withdraw', { amount: '0.1' }), /grace keeps 0\.3 wNEAR for questions/);
});

test('a deposit is exactly the bridge\'s smallest lock', async () => {
  const { guard, inner, counts } = await guardOf();
  assert.match(await tried(guard, 'deposit', { amount: '1' }), /exactly 0\.1 NEAR/);
  assert.match(await tried(guard, 'deposit', { amount: '0.01' }), /exactly 0\.1 NEAR/);
  assert.match(await tried(guard, 'deposit', { amount: 0.1 }), /the arguments of deposit do not fit: amount/);
  assert.deepEqual(inner.reached, []);
  assert.equal(await tried(guard, 'deposit', { amount: '0.1' }), 'ok');
  assert.deepEqual(inner.reached, [{ name: 'deposit', arguments: { amount: '0.1' } }]);
  assert.equal(guard.did, 'grace deposited 0.1 NEAR (lock 7)');
  assert.equal(await counts.of('grace:deposit'), 1);

  assert.match(await tried((await guardOf({ see: { lock: undefined } })).guard, 'deposit', { amount: '0.1' }), /the bridge takes no new locks now/);
  assert.match(await tried((await guardOf({ see: { near: 29n * 10n ** 22n } })).guard, 'deposit', { amount: '0.1' }), /grace keeps 0\.2 NEAR for gas/);
  assert.match(await tried((await guardOf({ see: { wnear: unitsOf('1.5') } })).guard, 'deposit', { amount: '0.1' }), /holds enough wNEAR and locks no more NEAR/);
  const big = await guardOf({ see: { lock: 10n ** 24n, near: 2n * 10n ** 24n } });
  assert.match(await tried(big.guard, 'deposit', { amount: '0.1' }), /exactly 1 NEAR/);
  assert.equal(await tried(big.guard, 'deposit', { amount: '1' }), 'ok');
});

test('a turn has one action: after it, only looking is left', async () => {
  const { guard, inner, counts } = await guardOf();
  // A refused call does not use the turn up.
  assert.match(await tried(guard, 'withdraw', { amount: '5' }), /exactly 0\.1 wNEAR/);
  assert.equal(await tried(guard, 'ask', { prompt: QUESTION, reward: '0.02' }), 'ok');
  const more: [Act, Record<string, unknown>][] = [['ask', { prompt: 'How does a bicycle stay upright while moving?', reward: '0.01' }], ['send', { to: HEIDI, amount: '0.01' }], ['withdraw', { amount: '0.1' }], ['deposit', { amount: '0.1' }]];
  for (const [tool, args] of more) assert.equal(await tried(guard, tool, args), 'a turn has one action, and grace did it already');
  assert.equal(await tried(guard, 'balance'), 'ok');
  assert.deepEqual(inner.reached.map((call) => call.name), ['ask', 'balance']);
  assert.equal(await counts.of('grace:ask'), 1);
  assert.equal(await counts.of('grace:send'), 0);

  // Two actions in one reply run one after the other, so the second one is refused too.
  const both = await guardOf();
  const [first, second] = await Promise.all([both.guard.callTool({ name: 'send', arguments: { to: HEIDI, amount: '0.01' } }), both.guard.callTool({ name: 'withdraw', arguments: { amount: '0.1' } })]);
  assert.equal(first.isError, undefined);
  assert.equal(textOf(second), 'a turn has one action, and grace did it already');
  assert.deepEqual(both.inner.reached.map((call) => call.name), ['send']);
});

test('an action the server fails is not counted and ends the turn\'s actions', async () => {
  const failing = server({ ask: 'the proof server does not answer', bounties: new Error('timed out') });
  const { guard, counts } = await guardOf({ inner: failing });
  assert.equal(await tried(guard, 'ask', { prompt: QUESTION, reward: '0.02' }), JSON.stringify({ error: 'the proof server does not answer' }, null, 2));
  assert.equal(guard.failed, 'ask');
  assert.equal(guard.did, undefined);
  assert.equal(await counts.of('grace:ask'), 0);
  assert.equal(await tried(guard, 'send', { to: HEIDI, amount: '0.01' }), 'ask failed in this turn, so grace does nothing more in it');
  // A call that never comes back is an error result too, not a crash of the turn.
  assert.equal(await tried(guard, 'bounties'), 'bounties did not come back: timed out');
  assert.deepEqual(failing.reached.map((call) => call.name), ['ask', 'bounties']);
  assert.deepEqual(guard.calls.map((call) => [call.tool, call.outcome, call.why]), [
    ['ask', 'failed', 'the proof server does not answer'],
    ['send', 'refused', 'ask failed in this turn, so grace does nothing more in it'],
    ['bounties', 'failed', 'bounties did not come back: timed out'],
  ]);
});

test('each agent has its own counts for a UTC day', async () => {
  let now = Date.UTC(2026, 10, 13, 12, 0, 0);
  const counts = new DayCounts(await dayFile(), () => now);
  const calls: [Act, Record<string, unknown>][] = [['send', { to: HEIDI, amount: '0.01' }], ['withdraw', { amount: '0.1' }], ['deposit', { amount: '0.1' }]];
  for (const [tool, args] of calls) {
    for (let done = 0; done < PER_DAY[tool]; done++) assert.equal(await tried((await guardOf({ counts })).guard, tool, args), 'ok', `${tool} ${done + 1}`);
    assert.match(await tried((await guardOf({ counts })).guard, tool, args), new RegExp(`grace reached today's limit of ${PER_DAY[tool]} `));
  }
  for (let done = 0; done < PER_DAY.ask; done++) assert.equal(await tried((await guardOf({ counts })).guard, 'ask', { prompt: `Which planet is number ${done + 1} from the Sun?`, reward: '0.01' }), 'ok');
  const full = await guardOf({ counts });
  assert.equal(await tried(full.guard, 'ask', { prompt: QUESTION, reward: '0.01' }), `grace reached today's limit of ${PER_DAY.ask} questions`);
  assert.deepEqual(full.guard.allows().left_today, { ask: 0, send: 0, withdraw: 0, deposit: 0 });
  assert.deepEqual(full.guard.view.may, { ask: false, send: false, withdraw: false, deposit: false });
  assert.deepEqual(full.inner.reached, []);

  // Another agent of the crowd is not held by grace's counts, and the next day starts at none.
  const heidi = await guardOf({ counts, see: { name: 'heidi', others: ['grace'] }, addresses: { grace: 'mn_shield-addr_test1grace' } });
  assert.equal(await tried(heidi.guard, 'withdraw', { amount: '0.1' }), 'ok');
  now += 12 * 60 * 60_000;
  const next = await guardOf({ counts });
  assert.deepEqual(next.guard.allows().left_today, PER_DAY);
  assert.equal(await tried(next.guard, 'withdraw', { amount: '0.1' }), 'ok');
});

test('what the limits allow is told before the turn', async () => {
  const { guard } = await guardOf({ see: { wnear: unitsOf('0.2'), lock: undefined } });
  assert.deepEqual(guard.allows(), {
    today: { ask: 0, send: 0, withdraw: 0, deposit: 0 },
    left_today: PER_DAY,
    may: { ask: true, send: false, withdraw: false, deposit: false },
    barred: { send: 'grace keeps 0.3 wNEAR for questions', withdraw: 'grace keeps 0.3 wNEAR for questions', deposit: 'the bridge takes no new locks now' },
    ask: { rewards: REWARDS, models: [DEFAULT_MODEL], max_tokens: 64 },
    send: { to: { heidi: HEIDI, ivan: IVAN }, at_most: '0.05' },
    withdraw: { amount: '0.1' },
    deposit: null,
  });
  assert.deepEqual((await guardOf()).guard.allows().deposit, { amount: '0.1' });
});

test('a turn sees its own open questions and the newest of the board, not the whole list', async () => {
  const now = Math.floor(Date.now() / 1000);
  const listed = Array.from({ length: 40 }, (_, i) => ({
    id: String(i).padStart(64, '0'),
    model: DEFAULT_MODEL,
    prompt: `Question number ${i}?`,
    reward: '0.02',
    state: i === 39 ? 'open' : 'answered',
    mine: i >= 38,
    deadline: now + i * 60,
    answer: 'x'.repeat(200),
  }));
  const { guard, inner } = await guardOf({ inner: server({ bounties: listed }) });
  const seen = JSON.parse(textOf(await guard.callTool({ name: 'bounties' })));
  assert.deepEqual(seen.yours, [{ question: 'Question number 39?', state: 'open', minutes_left: 39 }]);
  assert.equal(seen.questions, 40);
  assert.equal(seen.newest.length, 30);
  assert.equal(seen.newest[0], 'Question number 39?');
  assert.equal(seen.newest[29], 'Question number 10?');
  assert.ok(JSON.stringify(seen).length < 1500);
  assert.deepEqual(inner.reached, [{ name: 'bounties', arguments: {} }]);

  const odd = await guardOf({ inner: server({ bounties: { not: 'a list' } }) });
  assert.equal(await tried(odd.guard, 'bounties'), 'the board answered in a form the crowd does not read');
});
