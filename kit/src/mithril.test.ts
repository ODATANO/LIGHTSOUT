import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { nanos, toContractCertificate } from './mithril.js';

const fixture = (name: string) => JSON.parse(readFileSync(new URL(`../../crates/mithril-light/tests/data/${name}`, import.meta.url), 'utf8'));

test('nanos keeps every digit of a Mithril timestamp', () => {
  assert.equal(nanos('2026-11-04T08:05:29.494682833Z'), '1793779529494682833');
  assert.equal(nanos('1970-01-01T00:00:01Z'), '1000000000');
  assert.throws(() => nanos('2026-11-04 08:05:29'));
});

test('an aggregator certificate becomes the bridge argument', () => {
  const c = toContractCertificate(fixture('certificate-1471-car.json'));
  assert.equal(c.epoch, 1471);
  assert.strictEqual(c.metadata.parameters.phi_f, 0.7);
  assert.strictEqual(c.metadata.parameters.k, 5);
  assert.equal(c.previous_hash, 'c2a9415496db0f3a918ee131791653f99dcfa5db34a4a83691899fb677966926');
  assert.equal(c.signed_entity, null);
  assert.equal(c.metadata.initiated_at, '1793779529494682833');
  assert.equal(c.metadata.signers[1]?.stake, '68097073629791');
  assert.equal(c.aggregate_verification_key.total_stake, '461627496048297');
  assert.equal(c.aggregate_verification_key.root.length, 32);
  assert.equal(c.message_parts.find(([k]) => k === 'current_epoch')?.[1], '1471');
  assert.ok('Multi' in c.signature);
  const multi = c.signature.Multi;
  assert.equal(multi.signatures.length, 1);
  assert.equal(multi.signatures[0]?.sigma.length, 96);
  assert.equal(multi.signatures[0]?.party.vk.length, 192);
  assert.equal(multi.signatures[0]?.party.stake, '69055687303101');
  assert.deepEqual(multi.batch_proof.indices, [15]);
});

test('a genesis-style certificate keeps its ed25519 signature', () => {
  const raw = fixture('certificate-1469-mit.json');
  const c = toContractCertificate({ ...raw, multi_signature: '', genesis_signature: 'ab'.repeat(64) });
  assert.deepEqual(c.signature, { Genesis: 'ab'.repeat(64) });
});
