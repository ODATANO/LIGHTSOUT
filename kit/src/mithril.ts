// Feeds Mithril certificates and the committee token's updates on Cardano to the bridge.

export const aggregatorUrl = (process.env.MITHRIL_AGGREGATOR_URL ?? 'https://aggregator.pre-release-preview.api.mithril.network/aggregator').replace(/\/+$/, '');
export const koiosUrl = (process.env.KOIOS_URL ?? 'https://preview.koios.rest/api/v1').replace(/\/+$/, '');

/** A certificate as the bridge takes it. 64-bit amounts and times are decimal strings. */
export interface Certificate {
  previous_hash: string;
  epoch: number;
  metadata: {
    network: string;
    version: string;
    parameters: { k: number; m: number; phi_f: number };
    initiated_at: string;
    sealed_at: string;
    signers: { party_id: string; stake: string }[];
  };
  message_parts: [string, string][];
  signed_message: string;
  aggregate_verification_key: { root: number[]; nr_leaves: number; total_stake: string };
  signed_entity: null;
  signature: { Multi: MultiSignature } | { Genesis: string };
}

export interface MultiSignature {
  signatures: { sigma: string; indexes: number[]; signer_index: number; party: { vk: string; stake: string } }[];
  batch_proof: { values: number[][]; indices: number[] };
}

export interface CertifiedTransaction {
  transaction_hash: string;
  block_number: number;
  slot_number: number;
  block_hash: string;
}

export interface MithrilView {
  epoch: number;
  token: { policy: string; tx_hash: string; index: number };
  genesis_key: string | null; // 64 hex; the Mithril genesis key whose certificates restart the chain
  token_burned_at: number | null; // the Cardano block in which the token was burned; the bridge then waits for a mint
  committee_change_pending: boolean;
}

/** The aggregator's certificate JSON, as far as the conversion reads it. */
interface AggregatorCertificate {
  hash: string;
  previous_hash: string;
  epoch: number;
  signed_entity_type: Record<string, number | number[]>;
  metadata: { network: string; version: string; parameters: { k: number; m: number; phi_f: number }; initiated_at: string; sealed_at: string; signers: { party_id: string; stake: string }[] };
  protocol_message: { message_parts: Record<string, string> };
  signed_message: string;
  aggregate_verification_key: string;
  multi_signature: string;
  genesis_signature: string;
}

interface TransactionProof {
  certificate_hash: string;
  certified_transactions: { items: CertifiedTransaction[]; proof: string } | null;
  non_certified_transactions: string[];
}

// Integers above 2^53 come back as their decimal text instead of a rounded number.
function parseExact(text: string): unknown {
  return JSON.parse(text, (_key: string, value: unknown, ...rest: unknown[]) => {
    const source = (rest[0] as { source?: string } | undefined)?.source;
    const bigInteger = typeof value === 'number' && !Number.isSafeInteger(value) && source !== undefined && /^-?\d+$/.test(source);
    return bigInteger ? source : value;
  });
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000), ...init });
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
  return parseExact(await res.text()) as T;
}

/** RFC 3339 with up to nine fraction digits into Unix nanoseconds, as a decimal string. */
export function nanos(timestamp: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/.exec(timestamp);
  if (!m) throw new Error(`not an RFC 3339 timestamp: ${timestamp}`);
  const [y, mo, d, h, mi, s] = m.slice(1, 7).map(Number) as [number, number, number, number, number, number];
  // Date.UTC counts months from zero.
  const seconds = BigInt(Date.UTC(y, mo - 1, d, h, mi, s)) / 1000n;
  const fraction = BigInt((m[7] ?? '0').padEnd(9, '0'));
  return (seconds * 1_000_000_000n + fraction).toString();
}

function hexJson<T>(hex: string): T {
  return parseExact(Buffer.from(hex, 'hex').toString('utf8')) as T;
}

const bytesHex = (bytes: number[]): string => Buffer.from(bytes).toString('hex');

interface AggregatorMultiSignature {
  signatures: [{ sigma: number[]; indexes: number[]; signer_index: number }, [number[], number | string]][];
  batch_proof: { values: number[][]; indices: number[] };
}

/** Converts the aggregator's certificate into the bridge's argument. */
export function toContractCertificate(c: AggregatorCertificate): Certificate {
  const avk = hexJson<{ mt_commitment: { root: number[]; nr_leaves: number }; total_stake: number | string }>(c.aggregate_verification_key);
  let signature: Certificate['signature'];
  if (c.multi_signature) {
    const ms = hexJson<AggregatorMultiSignature>(c.multi_signature);
    signature = {
      Multi: {
        signatures: ms.signatures.map(([sig, [vk, stake]]) => ({
          sigma: bytesHex(sig.sigma),
          indexes: sig.indexes,
          signer_index: sig.signer_index,
          party: { vk: bytesHex(vk), stake: String(stake) },
        })),
        batch_proof: ms.batch_proof,
      },
    };
  } else {
    signature = { Genesis: c.genesis_signature };
  }
  return {
    previous_hash: c.previous_hash,
    epoch: c.epoch,
    metadata: {
      network: c.metadata.network,
      version: c.metadata.version,
      parameters: c.metadata.parameters,
      initiated_at: nanos(c.metadata.initiated_at),
      sealed_at: nanos(c.metadata.sealed_at),
      signers: c.metadata.signers.map((s) => ({ party_id: s.party_id, stake: String(s.stake) })),
    },
    message_parts: Object.entries(c.protocol_message.message_parts),
    signed_message: c.signed_message,
    aggregate_verification_key: { root: avk.mt_commitment.root, nr_leaves: avk.mt_commitment.nr_leaves, total_stake: String(avk.total_stake) },
    // The contract checks nothing with the entity, and one of a shape it does not know fails the call.
    signed_entity: null,
    signature,
  };
}

export async function latestCertificate(): Promise<AggregatorCertificate> {
  const list = await fetchJson<{ hash: string }[]>(`${aggregatorUrl}/certificates`);
  if (!list[0]) throw new Error('the aggregator lists no certificate');
  return fetchJson<AggregatorCertificate>(`${aggregatorUrl}/certificate/${list[0].hash}`);
}

/**
 * The certificates the bridge still needs, oldest first: the first certificate of every epoch
 * after the bridge's, up to the epoch of `target`. The aggregator links each certificate to its
 * epoch's first one, and that one to the first of the epoch before.
 */
export async function certificatesToSubmit(view: MithrilView, target: AggregatorCertificate): Promise<AggregatorCertificate[]> {
  const chain: AggregatorCertificate[] = [];
  for (let c = target; c.epoch > view.epoch; c = await fetchJson<AggregatorCertificate>(`${aggregatorUrl}/certificate/${c.previous_hash}`)) {
    // The walk meets a later certificate of an epoch before that epoch's first one.
    if (chain[0]?.epoch === c.epoch) chain[0] = c;
    else chain.unshift(c);
  }
  return chain;
}

/** Where the committee token sits on Cardano now. */
export async function tokenOutput(policy: string): Promise<{ tx_hash: string; index: number }> {
  const utxos = await fetchJson<{ tx_hash: string; tx_index: number; is_spent: boolean }[]>(`${koiosUrl}/asset_utxos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _asset_list: [[policy, '']], _extended: false }),
  });
  const live = utxos.filter((u) => !u.is_spent);
  if (live.length !== 1) throw new Error(`the token has ${live.length} unspent outputs`);
  return { tx_hash: live[0]!.tx_hash, index: live[0]!.tx_index };
}

export async function transactionProof(txHash: string): Promise<{ certificate_hash: string; transaction: CertifiedTransaction; proof: string }> {
  const p = await fetchJson<TransactionProof>(`${aggregatorUrl}/proof/v2/cardano-transaction?transaction_hashes=${txHash}`);
  const transaction = p.certified_transactions?.items.find((t) => t.transaction_hash === txHash);
  if (!transaction || !p.certified_transactions) throw new Error(`the aggregator has not certified ${txHash} yet`);
  return { certificate_hash: p.certificate_hash, transaction, proof: p.certified_transactions.proof };
}

export async function transactionCbor(txHash: string): Promise<Buffer> {
  const rows = await fetchJson<{ cbor: string }[]>(`${koiosUrl}/tx_cbor`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _tx_hashes: [txHash] }),
  });
  if (!rows[0]?.cbor) throw new Error(`Koios has no transaction ${txHash}`);
  return Buffer.from(rows[0].cbor, 'hex');
}

export type Submit = <T extends object>(method: string, args: Record<string, unknown>) => Promise<T | null>;

/** Brings the bridge's Mithril chain to the aggregator's head and follows the committee token. */
export async function syncMithril(view: MithrilView, submit: Submit, log: (line: string) => void = console.log): Promise<MithrilView> {
  const latest = await latestCertificate();
  let current = view;
  for (const c of await certificatesToSubmit(view, latest)) {
    const next = await submit<MithrilView>('submit_mithril_certificate', { certificate: toContractCertificate(c) });
    if (!next) throw new Error('submit_mithril_certificate returned nothing');
    log(`mithril epoch ${next.epoch}, certificate ${c.hash.slice(0, 12)}`);
    current = next;
  }

  const token = await tokenOutput(current.token.policy);
  if (token.tx_hash === current.token.tx_hash && token.index === current.token.index) return current;
  const { certificate_hash, transaction, proof } = await transactionProof(token.tx_hash);
  const certificate = await fetchJson<AggregatorCertificate>(`${aggregatorUrl}/certificate/${certificate_hash}`);
  // The certificate behind the proof must be in the bridge's epoch, so the chain may need to catch up first.
  for (const c of await certificatesToSubmit(current, certificate)) {
    if (c.hash === certificate.hash) continue;
    const next = await submit<MithrilView>('submit_mithril_certificate', { certificate: toContractCertificate(c) });
    if (!next) throw new Error('submit_mithril_certificate returned nothing');
    current = next;
  }
  const cbor = await transactionCbor(token.tx_hash);
  const next = await submit<MithrilView>('submit_committee_update', {
    certificate: toContractCertificate(certificate),
    transaction,
    proof: Buffer.from(proof, 'hex').toString('base64'),
    tx_cbor: cbor.toString('base64'),
  });
  if (!next) throw new Error('submit_committee_update returned nothing');
  log(`committee token moved to ${token.tx_hash.slice(0, 12)}#${token.index}, change pending: ${next.committee_change_pending}`);
  return next;
}
