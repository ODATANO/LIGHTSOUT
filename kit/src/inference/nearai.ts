const API_BASE = process.env.NEARAI_CLOUD_BASE_URL ?? 'https://cloud-api.near.ai';

export type SigningAlgo = 'ecdsa' | 'ed25519';

export interface TeeAttestation {
  signing_address: string;
  signing_algo: SigningAlgo;
  intel_quote: string;
  request_nonce: string;
  nvidia_payload?: string;
  tls_cert_fingerprint?: string;
  info?: { tcb_info?: string | { app_compose?: string } };
}

export interface AttestationReport {
  gateway_attestation?: TeeAttestation;
  model_attestations?: TeeAttestation[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  id: string;
  // Exact bytes on the wire. The TEE signs their SHA-256, so they are never re-serialized.
  requestBody: string;
  responseBody: Buffer;
  content: string;
}

export interface ResponseSignature {
  text: string;
  signature: string;
  signing_address: string;
  signature_kind: 'provider_tee' | 'gateway';
  signing_algo?: SigningAlgo;
}

function apiKey(): string {
  const key = process.env.NEARAI_CLOUD_API_KEY;
  if (!key) throw new Error('NEARAI_CLOUD_API_KEY is not set');
  return key;
}

// `key` signs the request in to an account. The attestation report is public and goes without.
async function getJson<T>(path: string, params: Record<string, string>, key?: string): Promise<{ json: T; raw: Buffer }> {
  const url = `${API_BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), 'x-no-aliasing': 'true' },
    signal: AbortSignal.timeout(60_000),
  });
  const raw = Buffer.from(await res.arrayBuffer());
  if (!res.ok) throw new Error(`GET ${path} answered ${res.status}: ${raw.toString('utf8').slice(0, 300)}`);
  return { json: JSON.parse(raw.toString('utf8')) as T, raw };
}

/** The attestation report of a model's TEEs with their ed25519 keys, under our nonce. It needs no account, so asking for it names nobody. */
export async function fetchAttestation(model: string, nonce: string) {
  return getJson<AttestationReport>('/v1/attestation/report', { model, nonce, signing_algo: 'ed25519' });
}

/**
 * The exact bytes of a chat request. A bounty names their SHA-256 hash, so they are built in one
 * place. A `seed` makes the request one of a kind, so an answer signed for it settles no other.
 */
export function chatRequest(model: string, messages: ChatMessage[], maxTokens = 512, seed?: number): string {
  return JSON.stringify({
    model,
    messages,
    max_tokens: maxTokens,
    stream: false,
    chat_template_kwargs: { enable_thinking: false },
    ...(seed === undefined ? {} : { seed }),
  });
}

/** Sends request bytes as they are. The TEE signs the bytes it got, so nothing serializes them again. */
export async function complete(requestBody: string): Promise<ChatResult> {
  const res = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'content-type': 'application/json',
      'accept-encoding': 'identity',
    },
    body: requestBody,
    // A model that has not answered after three minutes will not: the bounty is tried again later.
    signal: AbortSignal.timeout(180_000),
  });
  const responseBody = Buffer.from(await res.arrayBuffer());
  if (!res.ok) throw new Error(`chat answered ${res.status}: ${responseBody.toString('utf8').slice(0, 300)}`);
  const json = JSON.parse(responseBody.toString('utf8')) as { id: string };
  return { id: json.id, requestBody, responseBody, content: answerIn(responseBody) ?? '' };
}

/** The last user message of chat request bytes, or undefined when they are no such request. */
export function promptIn(requestBody: string | Uint8Array): string | undefined {
  try {
    const request = JSON.parse(Buffer.from(requestBody).toString('utf8')) as { messages?: { role?: string; content?: unknown }[] };
    const content = request.messages?.findLast((m) => m.role === 'user')?.content;
    return typeof content === 'string' ? content : undefined;
  } catch {
    return undefined;
  }
}

/** The model's text in chat response bytes, or undefined when they are no such response. */
export function answerIn(responseBody: Uint8Array): string | undefined {
  try {
    const reply = JSON.parse(Buffer.from(responseBody).toString('utf8')) as { choices?: { message?: { content?: unknown } }[] };
    const content = reply.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : undefined;
  } catch {
    return undefined;
  }
}

/** The TEE's ed25519 signature over the request and response of one chat. */
export async function fetchSignature(chatId: string, model: string) {
  const { json } = await getJson<ResponseSignature & { error_code?: string; message?: string }>(
    `/v1/signature/${encodeURIComponent(chatId)}`,
    { model, signing_algo: 'ed25519' },
    apiKey(),
  );
  if (json.error_code) throw new Error(`signature unavailable: ${json.error_code} ${json.message ?? ''}`);
  return json as ResponseSignature;
}
