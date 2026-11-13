// The member proof inside seal_begin and post_bounty: who passes, how often per day, and what it shows.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { proven } from './helpers.mjs';
import { keyPair } from '../../../kit/src/board/handover.ts';
import { DAY_SECONDS as DAY, markOf, memberCommitment } from '../../../kit/src/board/member.ts';
import { bountyTerms } from '../../../kit/src/board/bounty.ts';
import { INITIAL, chainOf } from '../../../kit/src/board/sealing.ts';
import { BRIDGE, EPOCH, NOON, dropOf, hex, world } from './helpers.mjs';

// The two calls that carry a member proof: opening a drop and posting a bounty.
const begin = (w, options) => w.begin(dropOf(randomBytes(10)), options);
const TERMS = bountyTerms('Qwen/Qwen3.8-27B', Buffer.from('{"model":"Qwen/Qwen3.8-27B"}'), [randomBytes(32)]);
const ask = (w, options) => w.postBounty(TERMS, keyPair(), options);
// The marks the board holds for a day.
const marksOf = (w, day = EPOCH) => w.state.marks.lookup(day);

// Every value in the public transcripts of a call tree, as hex.
function shown({ calls }) {
  const values = new Set();
  const walk = (node) => {
    if (node instanceof Uint8Array) values.add(hex(node));
    else if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  for (const call of calls) walk(call.publicTranscript);
  return values;
}
// A number as a transcript shows it: little-endian bytes without the zeros at the end.
const little = (x) => (x === 0n ? '' : (x & 0xffn).toString(16).padStart(2, '0') + little(x >> 8n));

test('the commitment the circuit computes is the SHA-256 hash of the tag and the secret', async () => {
  const w = await world();
  const seen = [];
  w.values.path = (leaf) => {
    seen.push(leaf);
    return w.tree.findPathForLeaf(leaf);
  };
  await begin(w.as(w.secrets[1]));
  const bytes = Buffer.concat([Buffer.from('lightsout:member'), Buffer.alloc(16), w.secrets[1]]);
  assert.equal(bytes.length, 64);
  assert.equal(hex(seen[0]), createHash('sha256').update(bytes).digest('hex'));
});

proven('a member opens a drop, and the bridge is asked about the root', async () => {
  const w = await world({ constraints: true });
  const drop = dropOf(randomBytes(150));
  const { calls } = await w.as(w.secrets[1]).begin(drop);
  assert.deepEqual(calls.map((call) => `${call.contractAddress === BRIDGE ? 'bridge' : 'board'}.${call.circuitId}`), ['bridge.known_root', 'board.seal_begin']);
  const stored = w.state.drops.lookup(drop.id);
  assert.deepEqual([hex(stored.key_hash), hex(stored.content_hash), stored.length, hex(stored.payout), stored.day], [hex(drop.keyHash), hex(drop.hash), 150n, hex(drop.payout), EPOCH]);
  assert.deepEqual(w.state.seals.lookup(drop.id), { remaining: 150n, ended: false, blocks: 0n, chain: chainOf(INITIAL, drop.key, drop.blind), done: false });
  assert.ok(marksOf(w).member(markOf(w.secrets[1], EPOCH, 0n)));
  assert.equal(marksOf(w).size(), 1n);
});

test('an id that is taken is refused', async () => {
  const w = await world();
  const drop = dropOf(randomBytes(10));
  await w.begin(drop);
  await assert.rejects(w.begin(drop), /this drop exists/);
});

test('someone outside the member tree is refused, by the bridge', async () => {
  const w = await world();
  const outsider = randomBytes(32);
  // A real path of the tree with the outsider's own leaf in it: its root is none the tree has had.
  w.values.path = () => ({ ...w.tree.findPathForLeaf(memberCommitment(w.secrets[0])), leaf: memberCommitment(outsider) });
  await assert.rejects(begin(w.as(outsider)), /the root is not known/);
  await assert.rejects(ask(w), /the root is not known/);
  assert.equal(w.state.bounties.size(), 0n);
  assert.equal(w.state.drops.size(), 0n);
  assert.equal(w.state.marks.size(), 0n);
});

test('the path of another leaf is refused', async () => {
  const w = await world();
  w.values.path = () => w.tree.findPathForLeaf(memberCommitment(w.secrets[1]));
  await assert.rejects(begin(w.as(w.secrets[0])), /the path is for another leaf/);
  await assert.rejects(begin(w.as(randomBytes(32))), /the path is for another leaf/);
});

proven('a path from before the next registration still passes', async () => {
  const w = await world({ members: 3, joined: 2, constraints: true });
  const before = w.tree.findPathForLeaf(memberCommitment(w.secrets[1]));
  await w.join(2);
  w.values.path = () => before;
  await begin(w.as(w.secrets[1]));
  assert.equal(w.state.drops.size(), 1n);
});

test('a member has 32 marked actions in a day and not a 33rd', async () => {
  const w = await world();
  w.as(w.secrets[1]);
  for (let slot = 0; slot < 32; slot++) await begin(w);
  assert.equal(w.state.drops.size(), 32n);
  assert.equal(marksOf(w).size(), 32n);
  for (const slot of [32n, 33n, 255n]) await assert.rejects(begin(w, { slot }), /no such slot/);
  for (const slot of [0n, 17n, 31n]) await assert.rejects(begin(w, { slot }), /this slot of the day is used/);
  assert.equal(w.state.drops.size(), 32n);
  // Another member still has its own.
  await begin(w.as(w.secrets[0]), { slot: 31n });
  assert.equal(marksOf(w).size(), 33n);
});

test('a used slot is refused for every marked circuit', async () => {
  const w = await world();
  await begin(w);
  assert.ok(marksOf(w).member(markOf(w.secrets[0], EPOCH, 0n)));
  await assert.rejects(begin(w, { slot: 0n }), /this slot of the day is used/);
  await assert.rejects(ask(w, { slot: 0n }), /this slot of the day is used/);
  await ask(w, { slot: 1n });
  assert.equal(marksOf(w).size(), 2n);
});

test('the next day gives 32 more', async () => {
  const w = await world();
  for (let slot = 0; slot < 32; slot++) await begin(w);
  await assert.rejects(begin(w, { slot: 5n }), /this slot of the day is used/);
  const tomorrow = { time: NOON + DAY };
  for (let slot = 0; slot < 32; slot++) await begin(w, tomorrow);
  await assert.rejects(begin(w, { ...tomorrow, slot: 5n }), /this slot of the day is used/);
  assert.deepEqual([marksOf(w).size(), marksOf(w, EPOCH + 1n).size()], [32n, 32n]);
  assert.ok(marksOf(w, EPOCH + 1n).member(markOf(w.secrets[0], EPOCH + 1n, 31n)));
});

test('the marks of a day are removed once the day has passed', async () => {
  const w = await world();
  await begin(w);
  await begin(w, { time: NOON + DAY });
  const firstOfNextDay = (Number(EPOCH) + 1) * DAY;
  await assert.rejects(w.call('forget_marks', [EPOCH], { time: firstOfNextDay - 1 }), /the day has not passed/);
  await assert.rejects(w.call('forget_marks', [EPOCH - 1n], { time: firstOfNextDay }), /that day has no marks/);
  await w.call('forget_marks', [EPOCH], { time: firstOfNextDay });
  assert.equal(w.state.marks.member(EPOCH), false);
  // The next day's marks stay, and no proof of the removed day passes any more.
  assert.equal(marksOf(w, EPOCH + 1n).size(), 1n);
  await assert.rejects(begin(w, { time: firstOfNextDay, epoch: EPOCH }), /the day has passed/);
});

proven('an epoch passes only at block times of its day', async () => {
  const w = await world({ constraints: true });
  // world.call hands `time` to the runtime's createCircuitContext, which makes it the block time in seconds.
  const first = Number(EPOCH) * DAY;
  await begin(w, { time: first, epoch: EPOCH });
  await begin(w, { time: first + DAY - 1, epoch: EPOCH });
  await assert.rejects(begin(w, { time: first - 1, epoch: EPOCH }), /the day has not begun/);
  await assert.rejects(begin(w, { time: first + DAY, epoch: EPOCH }), /the day has passed/);
  await assert.rejects(begin(w, { time: first + DAY / 2, epoch: EPOCH + 1n }), /the day has not begun/);
  await assert.rejects(begin(w, { time: first + DAY / 2, epoch: EPOCH - 1n }), /the day has passed/);
  await assert.rejects(ask(w, { time: first + DAY / 2, epoch: EPOCH - 1n }), /the day has passed/);
  assert.equal(marksOf(w).size(), 2n);
});

proven('two actions of one member share no value besides the day and the root', async () => {
  const w = await world({ members: 4, joined: 3, constraints: true });
  const root = w.tree.root().field;
  const [first, second] = [shown(await begin(w.as(w.secrets[1]))), shown(await begin(w))];
  const shared = [...first].filter((value) => second.has(value));

  // What every call with a member proof shows: taken from another member, two days later, under another root.
  await w.join(3);
  const always = shown(await begin(w.as(w.secrets[2]), { time: NOON + 2 * DAY }));
  const start = EPOCH * BigInt(DAY);
  // The day shows as its number, which the marks are kept under, and as its first and last second.
  assert.deepEqual(shared.filter((value) => !always.has(value)).sort(), [little(EPOCH), little(start), little(start + BigInt(DAY)), little(root)].sort());

  for (const said of [first, second]) {
    assert.equal(said.has(hex(w.secrets[1])), false);
    assert.equal(said.has(hex(memberCommitment(w.secrets[1]))), false);
  }
  // Each action shows its own mark, which only the secret links to the other.
  assert.ok(first.has(hex(markOf(w.secrets[1], EPOCH, 0n))) && !second.has(hex(markOf(w.secrets[1], EPOCH, 0n))));
  assert.ok(second.has(hex(markOf(w.secrets[1], EPOCH, 1n))) && !first.has(hex(markOf(w.secrets[1], EPOCH, 1n))));
});
