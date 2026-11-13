import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { unitsOf } from '../codec.js';
import { DayCounts } from './counts.js';
import { barred, nearOfLock, PER_DAY, REWARDS, type Sight, smallestLock, todayOf, viewOf } from './limits.js';

const none = { ask: 0, send: 0, withdraw: 0, deposit: 0 };
const sight = (over: Partial<Sight> = {}): Sight => ({ name: 'grace', wnear: unitsOf('0.8'), near: 6n * 10n ** 23n, bounties: [], others: ['heidi'], recent: [], lock: 10n ** 23n, ...over });

test('an agent with funds and a free day may do everything', () => {
  assert.deepEqual(barred(sight(), none, REWARDS), {});
  assert.deepEqual(viewOf(sight(), none, REWARDS).may, { ask: true, send: true, withdraw: true, deposit: true });
});

test('a day\'s limit and the reserves rule an action out, each with its reason', () => {
  assert.deepEqual(barred(sight(), PER_DAY, REWARDS), {
    ask: "grace reached today's limit of 14 questions",
    send: "grace reached today's limit of 6 transfers",
    withdraw: "grace reached today's limit of 2 withdrawals",
    deposit: "grace reached today's limit of 3 deposits",
  });
  assert.deepEqual(barred(sight({ wnear: unitsOf('0.049') }), none, REWARDS), { ask: 'grace holds too little wNEAR for a question', send: 'grace keeps 0.3 wNEAR for questions', withdraw: 'grace keeps 0.3 wNEAR for questions' });
  // A transfer of the rules needs 0.32 wNEAR and a withdrawal 0.4.
  assert.deepEqual(barred(sight({ wnear: unitsOf('0.32') }), none, REWARDS), { withdraw: 'grace keeps 0.3 wNEAR for questions' });
  assert.deepEqual(barred(sight({ wnear: unitsOf('0.4') }), none, REWARDS), {});
  assert.deepEqual(barred(sight({ others: [] }), none, REWARDS), { send: 'grace is alone in the crowd' });
  assert.deepEqual(barred(sight({ lock: undefined }), none, REWARDS), { deposit: 'the bridge takes no new locks now' });
  assert.deepEqual(barred(sight({ near: 3n * 10n ** 23n - 1n }), none, REWARDS), { deposit: 'grace keeps 0.2 NEAR for gas' });
  assert.deepEqual(barred(sight({ wnear: unitsOf('1.5') }), none, REWARDS), { deposit: 'grace holds enough wNEAR and locks no more NEAR' });
  assert.deepEqual(barred(sight(), none, []), { ask: 'no reward of the crowd reaches the least one a solver takes' });
});

test('the view shows the agent\'s open questions, the board and what it did today', () => {
  const now = 1_800_000_000;
  const bounties: Sight['bounties'] = [
    { prompt: 'Why do cats purr?', mine: true, state: 'open', deadline: now + 90 * 60 },
    { prompt: 'What causes the tides?', mine: false, state: 'open', deadline: now + 60 },
    { prompt: 'Why are there time zones?', mine: true, state: 'answered', deadline: now - 60 },
    { mine: false, state: 'refunded', deadline: now - 600 },
  ];
  const recent = Array.from({ length: 15 }, (_, i) => `line ${i}`);
  const today = { ask: 3, send: 1, withdraw: 2, deposit: 0 };
  assert.deepEqual(viewOf(sight({ bounties, recent }), today, ['0.02', '0.05'], now), {
    name: 'grace',
    wnear: '0.8',
    near: '0.6',
    open: [{ question: 'Why do cats purr?', minutes: 30 }],
    others: ['heidi'],
    recent: recent.slice(3),
    onBoard: ['Why do cats purr?', 'What causes the tides?', 'Why are there time zones?'],
    today,
    may: { ask: true, send: true, withdraw: false, deposit: true },
    rewards: ['0.02', '0.05'],
  });
});

test('a deposit takes the bridge\'s smallest lock while it takes locks', () => {
  const denominations = ['1000000000000000000000000', '100000000000000000000000', '10000000000000000000000000'];
  assert.equal(smallestLock({ locks_open: true, denominations }), 10n ** 23n);
  assert.equal(smallestLock({ locks_open: false, denominations }), undefined);
  assert.equal(smallestLock({ locks_open: true, denominations: [] }), undefined);
  assert.equal(smallestLock(undefined), undefined);
  assert.equal(nearOfLock(10n ** 23n), '0.1');
});

test('today\'s counts are read per agent', async () => {
  const counts = new DayCounts(join(await mkdtemp(join(tmpdir(), 'limits-')), 'day.json'));
  await counts.add('grace:ask');
  await counts.add('grace:ask');
  await counts.add('grace:deposit');
  await counts.add('heidi:send');
  assert.deepEqual(await todayOf(counts, 'grace'), { ask: 2, send: 0, withdraw: 0, deposit: 1 });
  assert.deepEqual(await todayOf(counts, 'heidi'), { ask: 0, send: 1, withdraw: 0, deposit: 0 });
});
