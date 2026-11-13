import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { answerIn, chatRequest, promptIn, type ResponseSignature, type TeeAttestation } from './nearai.js';
import { checkCompose, checkReportData, sha256Hex, verifyTeeSignature } from './verify.js';

const key = randomBytes(32).toString('hex');
const nonce = randomBytes(32).toString('hex');
const tee = (extra: Partial<TeeAttestation> = {}): TeeAttestation => ({
  signing_address: key,
  signing_algo: 'ed25519',
  intel_quote: '',
  request_nonce: nonce,
  ...extra,
});
const reportData = (signer: string, n: string) => Buffer.concat([Buffer.from(signer, 'hex'), Buffer.from(n, 'hex')]).toString('hex');

test('report data must bind signer and nonce', () => {
  checkReportData(tee(), nonce, reportData(key, nonce));
  assert.throws(() => checkReportData(tee(), nonce, reportData(key, randomBytes(32).toString('hex'))), /nonce/);
  assert.throws(() => checkReportData(tee(), nonce, reportData(randomBytes(32).toString('hex'), nonce)), /signing address/);
});

test('mr_config_id must commit to the compose manifest', () => {
  const app_compose = JSON.stringify({ docker_compose_file: 'services: {}' });
  const attestation = tee({ info: { tcb_info: JSON.stringify({ app_compose }) } });
  assert.equal(checkCompose(attestation, `01${sha256Hex(app_compose)}00`), sha256Hex(app_compose));
  assert.throws(() => checkCompose(attestation, `01${'0'.repeat(64)}`), /compose/);
});

test('an ed25519 signature of a TEE must cover exactly the recorded request and response', () => {
  const answers = JSON.parse(readFileSync(new URL('../fixtures/nearai-answers.json', import.meta.url), 'utf8')) as { model: string; request: string; response: string; signature: string; key: string }[];
  assert.equal(answers.length, 3);
  for (const a of answers) {
    const response = Buffer.from(a.response, 'base64');
    const sig: ResponseSignature = { text: `${a.model}:${sha256Hex(a.request)}:${sha256Hex(response)}`, signature: a.signature, signing_address: a.key, signature_kind: 'provider_tee', signing_algo: 'ed25519' };
    assert.deepEqual(verifyTeeSignature(sig, a.model, a.request, response), { signature: Buffer.from(a.signature, 'hex'), key: Buffer.from(a.key, 'hex') });
    assert.throws(() => verifyTeeSignature(sig, a.model, `${a.request} `, response), /does not match/);
    assert.throws(() => verifyTeeSignature(sig, a.model, a.request, Buffer.concat([response, Buffer.of(10)])), /does not match/);
    assert.throws(() => verifyTeeSignature({ ...sig, signature_kind: 'gateway' }, a.model, a.request, response), /provider_tee/);
    assert.throws(() => verifyTeeSignature({ ...sig, signing_address: randomBytes(32).toString('hex') }, a.model, a.request, response));
    assert.throws(() => verifyTeeSignature({ ...sig, signature: a.signature.slice(2) }, a.model, a.request, response), /not an ed25519 signature/);
    assert.equal(promptIn(a.request), 'Name the capital of France in one word.');
    assert.equal(answerIn(response), 'Paris');
  }
});

test('bytes that are no chat request or response give no prompt and no answer', () => {
  for (const bytes of ['', 'not json', '{}', '{"messages":[{"role":"assistant","content":"x"}]}', '{"messages":[{"role":"user","content":7}]}']) assert.equal(promptIn(bytes), undefined);
  for (const bytes of ['', 'not json', '{}', '{"choices":[]}', '{"choices":[{"message":{"content":null}}]}']) assert.equal(answerIn(Buffer.from(bytes)), undefined);
  assert.equal(chatRequest('m', [{ role: 'user', content: 'q' }], 8), '{"model":"m","messages":[{"role":"user","content":"q"}],"max_tokens":8,"stream":false,"chat_template_kwargs":{"enable_thinking":false}}');
  assert.equal(chatRequest('m', [{ role: 'user', content: 'q' }], 8, 5), '{"model":"m","messages":[{"role":"user","content":"q"}],"max_tokens":8,"stream":false,"chat_template_kwargs":{"enable_thinking":false},"seed":5}');
});
