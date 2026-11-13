import { createHash } from 'node:crypto';
import { ed25519 } from '@noble/curves/ed25519.js';
import { getCollateralFromPcs, type TcbStatus, verify } from '@phala/dcap-qvl';
import type { ResponseSignature, TeeAttestation } from './nearai.js';

const NVIDIA_NRAS_URL = 'https://nras.attestation.nvidia.com/v3/attest/gpu';
// OutOfDate means the platform TCB is behind Intel's advisory baseline; the quote itself still verifies.
const TDX_STATUS_OK = new Set<TcbStatus>(['UpToDate', 'OutOfDate']);

export const sha256Hex = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

export interface TdxResult {
  status: string;
  reportData: string; // hex
  mrConfigId: string; // hex
}

/** Verifies the TDX quote against Intel's collateral, the QE identity's signature included. */
export async function verifyTdxQuote(attestation: TeeAttestation): Promise<TdxResult> {
  const quote = Buffer.from(attestation.intel_quote, 'hex');
  const verdict = verify(quote, await getCollateralFromPcs(quote), Math.floor(Date.now() / 1000));
  if (!TDX_STATUS_OK.has(verdict.status)) throw new Error(`TDX quote rejected: ${verdict.status}`);
  const td = verdict.report.asTd10();
  if (!td) throw new Error(`not a TDX 1.0 quote but ${verdict.report.type}`);
  return { status: verdict.status, reportData: Buffer.from(td.reportData).toString('hex'), mrConfigId: Buffer.from(td.mrConfigId).toString('hex') };
}

/** report_data = 32-byte signing address, right-padded, followed by the 32-byte request nonce. */
export function checkReportData(attestation: TeeAttestation, nonce: string, reportDataHex: string): void {
  const reportData = Buffer.from(reportDataHex.replace(/^0x/i, ''), 'hex');
  const address = Buffer.from(attestation.signing_address.replace(/^0x/i, ''), 'hex');
  if (address.length > 32) throw new Error('signing address longer than 32 bytes');
  const expected = Buffer.concat([address, Buffer.alloc(32 - address.length)]);
  if (!reportData.subarray(0, 32).equals(expected)) throw new Error('TDX report does not bind the signing address');
  if (!reportData.subarray(32, 64).equals(Buffer.from(nonce, 'hex'))) throw new Error('TDX report does not embed our nonce');
}

/** The quote's mr_config_id commits to the attested docker compose manifest. */
export function checkCompose(attestation: TeeAttestation, mrConfigId: string): string {
  const raw = attestation.info?.tcb_info;
  const tcb = typeof raw === 'string' ? (JSON.parse(raw) as { app_compose?: string }) : raw;
  if (!tcb?.app_compose) throw new Error('attestation carries no app_compose');
  const composeHash = sha256Hex(tcb.app_compose);
  if (!mrConfigId.toLowerCase().startsWith(`01${composeHash}`)) throw new Error('mr_config_id does not match the compose manifest');
  return composeHash;
}

export async function verifyGpu(attestation: TeeAttestation, nonce: string): Promise<boolean> {
  if (!attestation.nvidia_payload) throw new Error('attestation carries no GPU evidence');
  const payload = JSON.parse(attestation.nvidia_payload) as { nonce: string };
  if (payload.nonce.toLowerCase() !== nonce.toLowerCase()) throw new Error('GPU evidence does not carry our nonce');
  const res = await fetch(NVIDIA_NRAS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`NVIDIA NRAS answered ${res.status}: ${text.slice(0, 200)}`);
  const jwt = (JSON.parse(text) as [string, string][])[0]?.[1];
  if (!jwt) throw new Error('NVIDIA NRAS returned no token');
  const claims = JSON.parse(Buffer.from(jwt.split('.')[1] ?? '', 'base64url').toString('utf8')) as Record<string, unknown>;
  if (claims['x-nvidia-overall-att-result'] !== true) throw new Error('NVIDIA attestation verdict is not true');
  return true;
}

// The TEE signs the model's name and the hashes of the exact request and response bytes.
function checkSignedText(sig: ResponseSignature, model: string, requestBody: string, responseBody: Buffer): void {
  const expected = `${model}:${sha256Hex(requestBody)}:${sha256Hex(responseBody)}`;
  if (sig.signature_kind !== 'provider_tee') throw new Error(`signature kind ${sig.signature_kind}, expected provider_tee`);
  if (sig.text !== expected) throw new Error('signed text does not match our request and response hashes');
}

/** Checks an ed25519 signature of a TEE over exactly these request and response bytes. Returns it with its key. */
export function verifyTeeSignature(sig: ResponseSignature, model: string, requestBody: string, responseBody: Buffer): { signature: Buffer; key: Buffer } {
  checkSignedText(sig, model, requestBody, responseBody);
  const signature = Buffer.from(sig.signature.replace(/^0x/i, ''), 'hex');
  const key = Buffer.from(sig.signing_address.replace(/^0x/i, ''), 'hex');
  if (signature.length !== 64 || key.length !== 32) throw new Error('not an ed25519 signature and key');
  if (!ed25519.verify(signature, Buffer.from(sig.text, 'utf8'), key)) throw new Error('the ed25519 signature of the TEE does not verify');
  return { signature, key };
}
