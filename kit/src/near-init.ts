import { createPublicKey, verify } from 'node:crypto';
import { TypeRegistry } from '@polkadot/types';
import type { Header } from '@polkadot/types/interfaces';
import { compactFromU8a } from '@polkadot/util';
import { aggregatorUrl, type Certificate, fetchJson, koiosUrl, tokenOutput, toContractCertificate } from './mithril.js';
import { nodeRpc } from './midnight-node.js';

// Grandpa::Authorities and Grandpa::CurrentSetId.
const AUTHORITIES_KEY = '0x5f9cc45b7a00c5899361e1c6099678dc5e0621c4869aa60c02be9adcc98a0d1d';
const SET_ID_KEY = '0x5f9cc45b7a00c5899361e1c6099678dc8a2d09463effcc78a22d75b9cb87dffc';
const GOVERNANCE_QUORUM = 2;

interface CardanoSide {
  committeePolicy: string; // the token whose datum names Midnight's committee
  governancePolicies: string[]; // the tokens whose datums name the keys that must sign an update
  securityParameter: number; // Cardano's k, in blocks
  mithrilGenesisKey: string; // 64 hex; the genesis verification key of the Mithril network that follows this chain
}

// From res/<network> of the Midnight node. The governance keys themselves are read from Cardano.
const CARDANO: Record<string, CardanoSide> = {
  preview: {
    committeePolicy: '24dccfce2576ae6fa7149bc485850656ae6faf9f4158891316773a78',
    governancePolicies: ['895f09b002941417f53e28c7a4f1a7e4d90ac2afa1da0ba5c66f8ccb', '57827ae51eed76cef38c99bd2f97cdf0055ef714d6c9bdf3078a1b9f'],
    securityParameter: 432,
    mithrilGenesisKey: '7f497ca1068983d5cf75c655b0c7a2f1447b77910de8f331e502f9cdcd27eb2c',
  },
};

export interface MidnightGenesis {
  genesis_hash: string;
  header: string;
  authorities_proof: string[];
}

export interface MithrilInit {
  certificate: Certificate;
  token: { policy: string; tx_hash: string; index: number };
  governance: { keys: string[]; threshold: number }[];
  security_depth: number;
  genesis_key: string | null; // 64 hex; null = the bridge takes no certificate of the Mithril genesis key
}

/** Whether `genesisKey` signed the genesis certificate the aggregator serves. */
export function signedByGenesisKey(genesisKey: string, certificate: { signed_message: string; genesis_signature: string }): boolean {
  // A raw ed25519 key in the DER frame node:crypto reads.
  const key = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(genesisKey, 'hex')]), format: 'der', type: 'spki' });
  return verify(null, Buffer.from(certificate.signed_message, 'utf8'), key, Buffer.from(certificate.genesis_signature, 'hex'));
}

/** The distinct keys in a `Grandpa::Authorities` value, hex, sorted. The contract checks the keys of a set, not its seats. */
export function authorityKeys(hex: string): string[] {
  const bytes = Buffer.from(hex.replace(/^0x/, ''), 'hex');
  const [offset, count] = compactFromU8a(bytes);
  const size = 40;
  if (bytes.length !== offset + count.toNumber() * size) throw new Error('Grandpa::Authorities has an unexpected length');
  const keys = Array.from({ length: count.toNumber() }, (_, i) => bytes.subarray(offset + i * size, offset + i * size + 32).toString('hex'));
  return [...new Set(keys)].sort();
}

/** The key hashes of the native scripts in a governance body's datum, CBOR hex. */
export function governanceKeys(datum: string): string[] {
  return [...datum.matchAll(/8200581c([0-9a-f]{56})/g)].map((m) => m[1]!);
}

const hexToBase64 = (hex: string) => Buffer.from(hex.replace(/^0x/, ''), 'hex').toString('base64');

async function inlineDatum(policy: string): Promise<string> {
  const { tx_hash, index } = await tokenOutput(policy);
  const rows = await fetchJson<{ inline_datum?: { bytes: string } }[]>(`${koiosUrl}/utxo_info`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ _utxo_refs: [`${tx_hash}#${index}`], _extended: true }),
  });
  const bytes = rows[0]?.inline_datum?.bytes;
  if (!bytes) throw new Error(`the output of token ${policy} holds no inline datum`);
  return bytes;
}

/** The light client's start: only the genesis hash is trusted, the contract checks the rest against it. */
async function midnightGenesis(hash: string): Promise<MidnightGenesis> {
  const header = new TypeRegistry().createType<Header>('Header', await nodeRpc<object>('chain_getHeader', [hash]));
  if (header.hash.toHex() !== hash) throw new Error(`the genesis header re-encodes to ${header.hash.toHex()}, not ${hash}`);
  const { proof } = await nodeRpc<{ proof: string[] }>('state_getReadProof', [[AUTHORITIES_KEY], hash]);
  return { genesis_hash: hash.slice(2), header: Buffer.from(header.toU8a()).toString('base64'), authorities_proof: proof.map(hexToBase64) };
}

/** Where the Mithril chain starts and which token and keys it follows on Cardano. */
async function mithrilStart(network: string): Promise<{ init: MithrilInit; committeeDatum: string }> {
  const cardano = CARDANO[network];
  if (!cardano) throw new Error(`no Cardano settings for ${network}; known: ${Object.keys(CARDANO).join(', ')}`);
  // Every certificate names its epoch's first one as previous_hash. That first one is the start.
  const [latest] = await fetchJson<{ hash: string }[]>(`${aggregatorUrl}/certificates`);
  if (!latest) throw new Error('the aggregator lists no certificate');
  const head = await fetchJson<{ previous_hash: string }>(`${aggregatorUrl}/certificate/${latest.hash}`);
  const start = await fetchJson<Parameters<typeof toContractCertificate>[0]>(`${aggregatorUrl}/certificate/${head.previous_hash}`);
  // The key the bridge will pin must be the one behind this network's own genesis certificate.
  const genesis = await fetchJson<{ signed_message: string; genesis_signature: string }>(`${aggregatorUrl}/certificate/genesis`);
  if (!signedByGenesisKey(cardano.mithrilGenesisKey, genesis)) throw new Error(`the Mithril genesis key for ${network} did not sign the aggregator's genesis certificate`);
  const governance = [];
  for (const policy of cardano.governancePolicies) {
    const keys = governanceKeys(await inlineDatum(policy));
    if (keys.length <= GOVERNANCE_QUORUM - 1) throw new Error(`the datum of governance token ${policy} names ${keys.length} keys`);
    governance.push({ keys, threshold: GOVERNANCE_QUORUM });
  }
  return {
    init: {
      certificate: toContractCertificate(start),
      token: { policy: cardano.committeePolicy, ...(await tokenOutput(cardano.committeePolicy)) },
      governance,
      security_depth: cardano.securityParameter,
      genesis_key: cardano.mithrilGenesisKey,
    },
    committeeDatum: await inlineDatum(cardano.committeePolicy),
  };
}

export interface ChainStart {
  midnight_genesis: MidnightGenesis;
  mithril: MithrilInit;
  /** Set changes since genesis, which the light client must follow one by one. */
  setChanges: number;
}

/**
 * Reads what the NEAR contract starts from. Refuses a start it could not follow: the contract takes
 * a set only with keys of the genesis set or of a committee Cardano announced after the Mithril start.
 */
export async function chainStart(network: string): Promise<ChainStart> {
  const genesisHash = await nodeRpc<string>('chain_getBlockHash', [0]);
  const finalized = await nodeRpc<string>('chain_getFinalizedHead', []);
  const atGenesis = authorityKeys(await nodeRpc<string>('state_getStorage', [AUTHORITIES_KEY, genesisHash]));
  const atHead = authorityKeys(await nodeRpc<string>('state_getStorage', [AUTHORITIES_KEY, finalized]));
  const joined = atHead.filter((key) => !atGenesis.includes(key));
  if (joined.length) throw new Error(`validators joined since genesis, so a light client from genesis cannot follow them: ${joined.join(', ')}`);
  const { init, committeeDatum } = await mithrilStart(network);
  const missing = atHead.filter((key) => !committeeDatum.includes(key));
  if (missing.length) throw new Error(`the committee token does not name these validators: ${missing.join(', ')}`);
  const setId = await nodeRpc<string>('state_getStorage', [SET_ID_KEY, finalized]);
  return {
    midnight_genesis: await midnightGenesis(genesisHash),
    mithril: init,
    setChanges: Number(Buffer.from(setId.slice(2), 'hex').readBigUInt64LE(0)),
  };
}
