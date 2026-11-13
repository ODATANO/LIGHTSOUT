import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { type BurnLog, burnLogs, extrinsicProof, headLogs } from 'lightsout-burn-proof';
import { EVENTS_KEY, headersEnd, LAST_RUNTIME_UPGRADE_KEY, MAX_BURN_HEADERS, midnightTx } from './midnight-burn-tx.js';

// A burn on preview: block 61761, extrinsic 3. Its contract logs a burn in another layout than
// the bridge, so the log tests read the transactions the Rust reader's tests rewrite from it.
const rewritten = (name: string): Uint8Array => readFileSync(new URL(`../../crates/midnight-tx/tests/data/${name}`, import.meta.url));
const fixture = JSON.parse(readFileSync(new URL('../../contracts/near-bridge/tests/fixtures/burn-tx.json', import.meta.url), 'utf8')) as {
  bridge: string;
  block: { number: number; extrinsics_root: string };
  extrinsic_index: number;
  tx: string;
  extrinsics: string[];
  storage_keys: string[];
};
const unhex = (h: string): Uint8Array => Buffer.from(h.replace(/^0x/, ''), 'hex');
const extrinsics = fixture.extrinsics.map(unhex);

test('the storage keys are those of System::Events and System::LastRuntimeUpgrade', () => {
  assert.deepEqual([EVENTS_KEY, LAST_RUNTIME_UPGRADE_KEY], fixture.storage_keys);
});

test('the transaction comes out of its extrinsic whole', () => {
  assert.deepEqual(midnightTx(extrinsics[fixture.extrinsic_index]!), unhex(fixture.tx));
  const longer = Buffer.concat([extrinsics[fixture.extrinsic_index]!, Buffer.from([0])]);
  assert.equal(midnightTx(longer), null);
});

test('a burn of the bridge gives its id, value and recipient', () => {
  const logs = burnLogs(rewritten('burn-tx-id.bin'), unhex(fixture.bridge)) as BurnLog[];
  const to = Buffer.alloc(64);
  to.write('bob.lightsout.odatano.testnet');
  assert.deepEqual(logs.map((log) => [Buffer.from(log.id).toString('hex'), log.value, Buffer.from(log.nearRecipient)]), [['1d'.repeat(32), '100000', to]]);
  assert.throws(() => headLogs(rewritten('burn-tx-id.bin'), unhex(fixture.bridge)), /NoHeadCall/);
});

test('a header the bridge accepted gives its NEAR height', () => {
  assert.deepEqual([...headLogs(rewritten('head-tx.bin'), unhex(fixture.bridge))], [277_000_000n]);
  assert.throws(() => burnLogs(rewritten('head-tx.bin'), unhex(fixture.bridge)), /NoBurnCall/);
});

test('the logs of another bridge are refused', () => {
  const other = unhex(fixture.bridge);
  other[0]! ^= 1;
  assert.throws(() => burnLogs(rewritten('burn-tx-id.bin'), other), /NoBurnCall/);
  assert.throws(() => headLogs(rewritten('head-tx.bin'), other), /NoHeadCall/);
});

test('the extrinsic proof is against the header root', () => {
  const { root, nodes } = extrinsicProof(extrinsics, fixture.extrinsic_index);
  assert.equal(`0x${Buffer.from(root).toString('hex')}`, fixture.block.extrinsics_root);
  assert.ok(nodes.length > 0);
  assert.throws(() => extrinsicProof(extrinsics, extrinsics.length), /no such extrinsic/);
});

test('the headers run to the first justified block NEAR stored, else to its head', async () => {
  const stored = (blocks: number[], head: number) => ({ head, hasHash: async (b: number) => blocks.includes(b) || b === head });
  assert.equal(await headersEnd(100, 120, stored([120], 500)), 120);
  assert.equal(await headersEnd(100, 120, stored([], 300)), 300);
  assert.equal(await headersEnd(100, null, stored([], 100)), 100);
  assert.equal(await headersEnd(100, 120, stored([], 100 + MAX_BURN_HEADERS)), null);
  assert.equal(await headersEnd(100, 90, stored([90], 99)), null);
  // An ancestor NEAR kept brings a block within reach that its head is too far from.
  assert.equal(await headersEnd(100, null, { ...stored([350], 900), kept: 350 }), 350);
  assert.equal(await headersEnd(100, null, { ...stored([], 900), kept: 350 }), null);
});
