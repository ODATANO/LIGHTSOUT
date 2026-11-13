import { randomBytes } from 'node:crypto';
import { complete, fetchAttestation, fetchSignature, type TeeAttestation } from './nearai.js';
import { checkCompose, checkReportData, verifyGpu, verifyTdxQuote, verifyTeeSignature } from './verify.js';

type Step = (line: string) => void;

// One TEE of a report: its Intel TDX quote, the binding of its signing key and our nonce, its
// compose manifest and its NVIDIA GPU.
async function attestTee(tee: TeeAttestation, nonce: string, step: Step): Promise<void> {
  const tdx = await verifyTdxQuote(tee);
  step(`Intel TDX quote verified (${tdx.status})`);
  checkReportData(tee, nonce, tdx.reportData);
  step(`quote binds signer ${tee.signing_address} and our nonce`);
  step(`quote commits to compose manifest ${checkCompose(tee, tdx.mrConfigId).slice(0, 16)}...`);
  await verifyGpu(tee, nonce);
  step('NVIDIA GPU attestation verified');
}

/**
 * The ed25519 keys of the TEEs a model runs in, each attested under a fresh nonce. An answer that
 * one of them signed came out of that model's TEE.
 */
export async function attestedKeys(model: string, step: Step = () => {}): Promise<Buffer[]> {
  const nonce = randomBytes(32).toString('hex');
  const { json: report } = await fetchAttestation(model, nonce);
  const all = report.model_attestations ?? [];
  if (all.length === 0) throw new Error('the model has no TEE attestation (external providers run outside a TEE)');
  const keys: Buffer[] = [];
  for (const tee of all) {
    const key = Buffer.from(tee.signing_address.replace(/^0x/i, ''), 'hex');
    if (tee.signing_algo !== 'ed25519' || key.length !== 32) throw new Error(`a TEE of ${model} names no ed25519 key`);
    await attestTee(tee, nonce, step);
    keys.push(key);
  }
  return keys;
}

/** A model's answer to exact request bytes, with the ed25519 signature of its TEE over both. */
export interface SignedAnswer {
  response: Buffer; // the exact response bytes
  signature: Buffer; // 64 bytes
  key: Buffer; // 32 bytes; the TEE key that signed
}

/** Sends request bytes to the model unchanged and checks the TEE's ed25519 signature over them and the response. */
export async function signedAnswer(model: string, request: string): Promise<SignedAnswer> {
  const result = await complete(request);
  const signature = await fetchSignature(result.id, model);
  return { response: result.responseBody, ...verifyTeeSignature(signature, model, request, result.responseBody) };
}
