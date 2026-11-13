import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Stale } from 'lightsout-midnight-bridge';
import { boardTidy, bridgeTidy } from './tidy.js';

const key = (k: Uint8Array | bigint): string => (typeof k === 'bigint' ? k.toString() : Buffer.from(k).toString('hex'));

// A ledger map or set as the compiled contracts hand it out, over a few entries.
function held<K extends Uint8Array | bigint, V>(entries: [K, V][]) {
  const byKey = new Map(entries.map(([k, v]) => [key(k), v]));
  return {
    isEmpty: () => entries.length === 0,
    size: () => BigInt(entries.length),
    member: (k: K) => byKey.has(key(k)),
    lookup: (k: K) => byKey.get(key(k)) as V,
    [Symbol.iterator]: () => entries[Symbol.iterator](),
  };
}

const hash = (byte: number): Uint8Array => new Uint8Array(32).fill(byte);
const shown = (calls: { circuit: string; args: unknown[] }[]): string[] => calls.map((call) => `${call.circuit} ${key(call.args[0] as Uint8Array | bigint).slice(0, 4)}`);
// A removal on the bridge, as what it removes and the key it removes it by.
const removed = (calls: { circuit: string; args: unknown[] }[]): string[] =>
  calls.map((call) => {
    const [what, hash, read] = call.args as [Stale, Uint8Array, bigint];
    return `${call.circuit} ${Stale[what]} ${what === Stale.read ? read : key(hash).slice(0, 4)}`;
  });

test('the bridge drops past headers, ended list reads and old blocks', () => {
  const head = (height: bigint) => ({ height });
  const state = {
    tip: { head: head(50_000n), era: 5n, list: 7n },
    candidates: held([
      [hash(0xa1), { head: head(49_000n), era: 5n }], // below the head
      [hash(0xa2), { head: head(51_000n), era: 5n }], // can still become the head
      [hash(0xa3), { head: head(52_000n), era: 3n }], // of an epoch that passed
      [hash(0xa4), { head: head(53_000n), era: 6n }], // of the next epoch
    ]),
    signed: held([
      [hash(0xa1), {}],
      [hash(0xa2), {}],
      [hash(0xd1), {}],
    ]),
    readers: held([
      [7n, { filling: 5n }], // the head's list
      [8n, { filling: 6n }], // a read of the next epoch's list
      [9n, { filling: 4n }], // of a past epoch
    ]),
    blocks: held([
      [hash(0xb1), { at: 6_800n }],
      [hash(0xb2), { at: 6_801n }],
    ]),
  } as unknown as Parameters<typeof bridgeTidy>[0];

  // 0xd1 and 0xd2 were proposed earlier; only 0xd1 left marks. 0xa2 is still proposed.
  const calls = bridgeTidy(state, [hash(0xd1), hash(0xd2), hash(0xa2)]);
  assert.deepEqual(removed(calls), ['forget header a1a1', 'forget header a3a3', 'forget header d1d1', 'forget read 9', 'forget block b1b1']);
  assert.deepEqual(removed(bridgeTidy({ ...state, candidates: held([]), readers: held([]), blocks: held([]) } as typeof state)), []);
});

test('the board drops the marks of past days, old drops and bounties 30 days past their deadline', () => {
  const DAY = 86_400n;
  const now = 20_000n * DAY + DAY / 2n;
  const late = now - 30n * DAY - 1n;
  const state = {
    marks: held([
      [20_000n, {}], // today
      [19_999n, {}],
      [19_960n, {}],
      [19_900n, {}], // further back than the days that are asked
    ]),
    drops: held([
      [hash(0xc1), { day: 19_963n }], // kept until the start of day 20,000
      [hash(0xc2), { day: 19_964n }],
    ]),
    bounties: held([
      [hash(0xe1), { deadline: late }],
      [hash(0xe2), { deadline: late }],
      [hash(0xe3), { deadline: late + 1n }],
    ]),
    rewards: held([[hash(0xe2), {}]]),
  } as unknown as Parameters<typeof boardTidy>[0];

  assert.deepEqual(shown(boardTidy(state, now)), ['forget_marks 1999', 'forget_marks 1996', 'forget_drop c1c1', 'forget_bounty e1e1', 'refund_bounty e2e2']);
});
