import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { DEFAULT_MODEL } from '../board/question.js';
import { DayCounts, fileJournal } from './counts.js';
import { checked, type Decision, questionFault, ruleMind, type View } from './mind.js';
import { QUESTIONS } from './questions.js';

const view = (over: Partial<View> = {}): View => ({
  name: 'grace',
  wnear: '0.8',
  near: '0.6',
  open: [],
  others: ['heidi'],
  recent: [],
  onBoard: [],
  today: { ask: 0, send: 0, withdraw: 0, deposit: 0 },
  may: { ask: true, send: true, withdraw: true, deposit: true },
  due: ['withdraw', 'deposit', 'ask', 'send'],
  rewards: ['0.01', '0.02', '0.05'],
  ...over,
});
const decision = (over: Partial<Decision>): Decision => ({ action: 'wait', question: '', reward: '', to: '', reason: 'because', ...over });
const ask = (question: string, reward = '0.02') => decision({ action: 'ask', question, reward });

test('a decision becomes a move only inside what the view allows', () => {
  assert.deepEqual(checked(decision({}), view(), DEFAULT_MODEL), { action: 'wait' });
  assert.deepEqual(checked(ask(' Why does ice float on water? '), view(), DEFAULT_MODEL), { action: 'ask', question: 'Why does ice float on water?', reward: '0.02' });
  assert.deepEqual(checked(decision({ action: 'send', to: 'heidi' }), view(), DEFAULT_MODEL), { action: 'send', to: 'heidi' });
  assert.deepEqual(checked(decision({ action: 'withdraw' }), view(), DEFAULT_MODEL), { action: 'withdraw' });
  assert.deepEqual(checked(decision({ action: 'deposit' }), view(), DEFAULT_MODEL), { action: 'deposit' });

  const refused = (d: Decision, v: View) => {
    const move = checked(d, v, DEFAULT_MODEL);
    return 'refused' in move ? move.refused : 'taken';
  };
  assert.match(refused(decision({ action: 'withdraw' }), view({ may: { ask: true, send: true, withdraw: false, deposit: true } })), /cannot withdraw now/);
  assert.match(refused(decision({ action: 'send', to: 'mallory' }), view()), /mallory is not in the crowd/);
  assert.match(refused(decision({ action: 'send' }), view()), /nobody is not in the crowd/);
  assert.match(refused(ask('Why does ice float on water?', '0.5'), view()), /a reward is one of/);
  const two = [{ question: 'a', minutes: 5 }, { question: 'b', minutes: 9 }];
  assert.match(refused(ask('Why does ice float on water?'), view({ open: two })), /2 questions open/);
});

test('a question of the crowd is short plain text that nobody asked before', () => {
  const fault = (question: string, over: Partial<View> = {}) => questionFault(question, view(over), DEFAULT_MODEL);
  assert.equal(fault('Why does ice float on water?'), undefined);
  assert.match(fault('Why?') ?? '', /12 to 160 characters/);
  assert.match(fault(`Why ${'so '.repeat(60)}long?`) ?? '', /12 to 160 characters/);
  assert.match(fault('Warum schwimmt Eis auf Wasser, während Öl es nicht tut?') ?? '', /plain English text/);
  assert.match(fault('What is at https://example.com today?') ?? '', /no address, link or long number/);
  assert.match(fault('Who answers mail sent to someone@example.com?') ?? '', /no address, link or long number/);
  assert.match(fault('Whose phone number is 0123456789 exactly?') ?? '', /no address, link or long number/);
  assert.match(fault('why does ICE float on water?', { onBoard: ['Why does ice float on water?'] }) ?? '', /asked already/);
  assert.match(fault('Why does ice float on water?', { recent: ['heidi asked "Why does ice float on water?" for 0.02 wNEAR'] }) ?? '', /asked already/);
  // The board answers only models whose name has a length it knows.
  assert.match(questionFault('Why does ice float on water?', view(), 'some-model') ?? '', /the board answers models/);
  for (const question of QUESTIONS) assert.equal(fault(question), undefined, question);
});

test('the rules fill up first, cross the bridge most of the time and never repeat a question', async () => {
  const rolls = (...values: number[]) => () => values.shift() ?? 0.99;
  const low = view({ may: { ask: false, send: false, withdraw: false, deposit: true } });
  assert.equal((await ruleMind(rolls(0.9)).decide(low)).action, 'deposit');
  assert.equal((await ruleMind(rolls(0.01)).decide(view())).action, 'withdraw');
  assert.equal((await ruleMind(rolls(0.4)).decide(view())).action, 'deposit');
  assert.deepEqual(await ruleMind(rolls(0.65, 0)).decide(view()), decision({ action: 'send', to: 'heidi', reason: 'a private transfer inside the crowd' }));
  // A roll for a transfer with nobody to send to ends in a question.
  assert.equal((await ruleMind(rolls(0.65, 0, 0, 0)).decide(view({ others: [] }))).action, 'ask');

  const asked = await ruleMind(rolls(0.9, 0, 0, 0)).decide(view({ onBoard: [QUESTIONS[0] ?? ''] }));
  assert.equal(asked.action, 'ask');
  assert.equal(asked.question, QUESTIONS[1]);
  assert.equal(asked.reward, '0.01');
  assert.deepEqual(checked(asked, view({ onBoard: [QUESTIONS[0] ?? ''] }), DEFAULT_MODEL), { action: 'ask', question: QUESTIONS[1], reward: '0.01' });

  const all = view({ onBoard: [...QUESTIONS] });
  assert.equal((await ruleMind(rolls(0.9)).decide(all)).action, 'wait');
  const busy = view({ open: [{ question: 'a', minutes: 1 }, { question: 'b', minutes: 2 }] });
  assert.equal((await ruleMind(rolls(0.9)).decide(busy)).action, 'wait');
  const broke = view({ may: { ask: false, send: false, withdraw: false, deposit: false } });
  assert.equal((await ruleMind(rolls(0.9)).decide(broke)).action, 'wait');
});

test('counts last for one UTC day and survive a restart', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'crowd-'));
  const file = join(dir, 'day.json');
  let now = Date.UTC(2026, 10, 13, 23, 59, 0);
  const counts = new DayCounts(file, () => now);
  assert.equal(await counts.of('grace:ask'), 0);
  await counts.add('grace:ask');
  await counts.add('grace:ask');
  await counts.add('heidi:ask');
  assert.equal(await new DayCounts(file, () => now).of('grace:ask'), 2);
  assert.equal(await counts.of('heidi:ask'), 1);
  now += 2 * 60_000;
  assert.equal(await counts.of('grace:ask'), 0);
  await counts.add('grace:ask');
  assert.equal(await counts.of('grace:ask'), 1);
  assert.equal(await counts.of('heidi:ask'), 0);

  const lines = join(dir, 'deep', 'lines.jsonl');
  const write = fileJournal(lines);
  await write({ a: 1 });
  await write({ b: 'two' });
  assert.equal(await readFile(lines, 'utf8'), '{"a":1}\n{"b":"two"}\n');
});
