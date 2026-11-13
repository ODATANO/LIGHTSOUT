import { Account, JsonRpcProvider, KeyPair, teraToGas, type BlockResult, type ChunkResult, type KeyPairString } from 'near-api-js';
import { AccountDoesNotExistError } from 'near-api-js/rpc-errors';
import { env } from './env.js';
import type { LightClientBlockView, LightClientProof, ValidatorStakeView } from './near-light.js';
import { withRetry } from './retry.js';
import type { AgentIdentity, Role } from './roles.js';

export const rpcUrl = process.env.NEAR_RPC_URL ?? 'https://rpc.testnet.fastnear.com';
// Transport failures and busy answers are retried with a growing pause.
const RETRY = { retries: 4, wait: 1000, backoff: 2 };
export const provider = new JsonRpcProvider({ url: rpcUrl }, RETRY);
export const bridgeId = env('NEAR_BRIDGE_CONTRACT');
// A Midnight state proof is checked in full; the deposit covers the storage of what it records.
export const PROVE_GAS = teraToGas('300');
export const PROVE_DEPOSIT = 10n ** 22n;

// near-sdk serializes U64 and NearToken as decimal strings.
export interface NearLock {
  sender: string;
  amount: string;
  midnight_recipient: string;
  /** The NEAR block the lock ran in. */
  block_height: string;
}

export interface BridgeConfig {
  daily_limit: string; // yoctoNEAR; the most it locks in a day, and the most it releases
  locked_today: string; // yoctoNEAR
  released_today: string; // yoctoNEAR
  total_locked: string;
  total_released: string;
  next_lock_id: string;
  locks_open: boolean; // whether lock and register take new funds now
  /** Address of the Midnight bridge, hex. */
  midnight_bridge: string;
  denominations: string[];
  registration_fee: string; // yoctoNEAR
  beneficiary: string; // the account the fees are paid to
  registered: string; // decimal; number of registrations
  fees_unpaid: string; // yoctoNEAR
}

/** An account that paid the fee, with the commitment the board knows it by. */
export interface Registration {
  index: string; // decimal
  commitment: string; // 64 hex
  dust_address: string; // where the account collects dust on Midnight
  message_key: string; // 128 hex; a point others can encrypt to, x then y; the board does not use it
  block_height: string; // decimal; the NEAR block the registration ran in
}

/** What the NEAR bridge knows of Midnight's runtime, from `get_runtime`. */
export interface RuntimeView {
  block: number; // the newest Midnight block it finalized
  spec: number; // the spec version of the runtime that built it; 0 = its header logs none
  readable: boolean; // it has a table for that version, so it can prove burns in such blocks
  upgrade: { block: number; authorized: boolean; at: string } | null; // its newest check for an authorized runtime upgrade; at is when Midnight built that block, Unix ns
  accepted_head: string | null; // decimal; the highest NEAR block the Midnight bridge is proven to have made its head; null = none yet
  locks_open: boolean; // readable, a check of a block built within the last hour found no upgrade authorized, and the accepted head is at most 43,200 NEAR blocks old
}

/** A burn the NEAR bridge has proven, from `get_proven_burn`. */
export interface ProvenBurn {
  near_recipient: string;
  amount: string; // yoctoNEAR
  block: number; // the Midnight block of the burn
  paid: string; // yoctoNEAR; paid out or on its way
}

const HOUR_NS = 3_600_000_000_000n;

/** Why the bridge takes no new locks: what it lacks or what it saw. */
export type Closed = 'no table' | 'no check' | 'upgrade' | 'no head' | 'old check' | 'old head';

/** Why the bridge takes no new locks at `now`, Unix ms; undefined while it takes them. */
export function closedFor(r: RuntimeView, now = Date.now()): Closed | undefined {
  if (r.locks_open) return undefined;
  if (!r.readable) return 'no table';
  if (!r.upgrade) return 'no check';
  if (r.upgrade.authorized) return 'upgrade';
  if (r.accepted_head === null) return 'no head';
  return BigInt(now) * 1_000_000n - BigInt(r.upgrade.at) > HOUR_NS ? 'old check' : 'old head';
}

/** Why the bridge takes no new locks, in words; undefined while it takes them. */
export function closedBecause(r: RuntimeView): string | undefined {
  switch (closedFor(r)) {
    case undefined:
      return undefined;
    case 'no table':
      return `it has no table for Midnight runtime ${r.spec}`;
    case 'no check':
      return 'it has no check for a runtime upgrade on Midnight yet';
    case 'upgrade':
      return `Midnight authorized a runtime upgrade (seen at block ${r.upgrade?.block})`;
    case 'no head':
      return 'nothing shows it yet that the Midnight bridge follows NEAR; a relay proves the Midnight bridge\'s head';
    case 'old check':
      return `the Midnight block it last checked for a runtime upgrade (${r.upgrade?.block}) is older than an hour; a relay renews the check`;
    case 'old head':
      return `the NEAR block the Midnight bridge last made its head for it (${r.accepted_head}) is more than 43,200 blocks old; a relay proves a newer one`;
  }
}

/** What a NEAR account holds, in yoctoNEAR. */
export async function nearBalance(accountId: string): Promise<bigint> {
  return (await provider.viewAccount({ accountId })).amount;
}

/** Who can replace the NEAR bridge's code: the access keys of its account. And the hash of that code. */
export async function bridgeAccount(): Promise<{ keys: number; codeHash: string }> {
  const [account, list] = await Promise.all([provider.viewAccount({ accountId: bridgeId }), provider.viewAccessKeyList({ accountId: bridgeId })]);
  return { keys: list.keys.length, codeHash: account.code_hash };
}

/** The account behind `NEAR_<ROLE>_ACCOUNT_ID` and `NEAR_<ROLE>_PRIVATE_KEY`. */
export function nearAccount(role: Role | Uppercase<string>): Account {
  return new Account(env(`NEAR_${role}_ACCOUNT_ID`), provider, env(`NEAR_${role}_PRIVATE_KEY`) as KeyPairString);
}

/** The NEAR account of an agent. */
export function nearAccountOf(agent: AgentIdentity): Account {
  return new Account(agent.nearAccountId, provider, agent.nearPrivateKey as KeyPairString);
}

/** A new NEAR key and the account its first transfer makes: the key's 64 hex digits. */
export function newNearAccount(): { accountId: string; privateKey: string } {
  const key = KeyPair.fromRandom('ed25519');
  return { accountId: Buffer.from(key.getPublicKey().data).toString('hex'), privateKey: key.toString() };
}

/** Sends NEAR from one account to another. Returns the NEAR transaction. */
export async function sendNear(from: Account, to: string, yocto: bigint): Promise<string> {
  return (await from.transfer({ receiverId: to, amount: yocto })).transaction_outcome.id;
}

/** Whether a transfer to this account arrives. A named account must exist; one of 64 hex is made by its first transfer. */
export async function canReceive(accountId: string): Promise<boolean> {
  if (/^[0-9a-f]{64}$/.test(accountId)) return true;
  try {
    await provider.viewAccount({ accountId });
    return true;
  } catch (e) {
    if (e instanceof AccountDoesNotExistError) return false;
    throw e;
  }
}

export async function callBridge<T extends object | string | number | boolean>(
  account: Account,
  methodName: string,
  args: Record<string, unknown>,
  deposit?: bigint,
  gas = teraToGas('50'),
): Promise<T> {
  return account.callFunction<T>({ contractId: bridgeId, methodName, args, gas, ...(deposit ? { deposit } : {}) });
}

/** One receipt a call ran on the bridge: its id and its logs. */
export interface BridgeReceipt {
  id: string;
  logs: string[];
}

/** A call that returns its transaction hash and the receipts it ran on the bridge, in order. */
export async function callBridgeForReceipts(account: Account, methodName: string, args: Record<string, unknown>, deposit?: bigint, gas = teraToGas('50')): Promise<{ tx: string; receipts: BridgeReceipt[] }> {
  const result = await account.callFunctionRaw({ contractId: bridgeId, methodName, args, gas, ...(deposit ? { deposit } : {}) });
  return { tx: result.transaction_outcome.id, receipts: result.receipts_outcome.filter((r) => r.outcome.executor_id === bridgeId).map((r) => ({ id: r.id, logs: r.outcome.logs })) };
}

export async function viewBridge<T extends object | boolean | string | number>(method: string, args: Record<string, unknown> = {}): Promise<T | undefined> {
  return provider.callFunction<T>({ contractId: bridgeId, method, args });
}

/**
 * The NEAR bridge's settings, once it names `midnightBridge` as the Midnight bridge it works
 * with. Funds that go to a NEAR bridge of another Midnight bridge never arrive there.
 */
export async function configFor(midnightBridge: string): Promise<BridgeConfig> {
  const config = await viewBridge<BridgeConfig>('get_config');
  if (!config) throw new Error(`${bridgeId} answers no get_config`);
  if (config.midnight_bridge !== midnightBridge) throw new Error(`${bridgeId} works with Midnight bridge ${config.midnight_bridge}, not ${midnightBridge}`);
  return config;
}

/** Registration `index` with the account that made it; undefined when the bridge has none. */
export async function registrationAt(index: bigint): Promise<{ account: string; registration: Registration } | undefined> {
  const account = await viewBridge<string>('get_registered', { index: index.toString() });
  const registration = account ? await viewBridge<Registration>('get_registration', { account }) : undefined;
  return account && registration ? { account, registration } : undefined;
}

async function rpc<T>(method: string, params: unknown): Promise<T | null> {
  return withRetry(async () => {
    const res = await fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(60_000) });
    const body = (await res.json()) as { result?: T | null; error?: unknown };
    if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
    return body.result ?? null;
  });
}

/** The burn that a `release` transaction named, read from the chain. Undefined when the node has the transaction no more or it released nothing. */
export async function burnReleasedBy(txHash: string, signer: string): Promise<string | undefined> {
  type Sent = { transaction: { actions: { FunctionCall?: { method_name: string; args: string } }[] } };
  const sent = await rpc<Sent>('tx', { tx_hash: txHash, sender_account_id: signer, wait_until: 'NONE' }).catch(() => null);
  const call = sent?.transaction.actions.find((action) => action.FunctionCall?.method_name === 'release')?.FunctionCall;
  if (!call) return undefined;
  const { burn_id: burn } = JSON.parse(Buffer.from(call.args, 'base64').toString()) as { burn_id?: unknown };
  return typeof burn === 'string' ? burn : undefined;
}

type TimedBlock = { header: { height: number; timestamp_nanosec: string } };
const secondsOf = (block: TimedBlock): number => Number(BigInt(block.header.timestamp_nanosec) / 1_000_000_000n);
const PACE_OVER = 20_000;
const PACE_KEPT_MS = 60 * 60_000;
// How long a NEAR block took over the last blocks. Measured again after an hour.
let pace: { at: number; blockSeconds: number } | undefined;

/** NEAR's newest final block and how many seconds a block took of late. */
export async function nearClock(): Promise<{ height: bigint; blockSeconds: number }> {
  const head = await rpc<TimedBlock>('block', { finality: 'final' });
  if (!head) throw new Error('NEAR names no final block');
  if (!pace || Date.now() - pace.at > PACE_KEPT_MS) {
    // A height can be without a block, so a few below it are tried.
    for (let back = PACE_OVER; back < PACE_OVER + 4; back++) {
      const earlier = await rpc<TimedBlock>('block', { block_id: head.header.height - back }).catch(() => null);
      if (!earlier) continue;
      pace = { at: Date.now(), blockSeconds: (secondsOf(head) - secondsOf(earlier)) / back };
      break;
    }
  }
  return { height: BigInt(head.header.height), blockSeconds: pace?.blockSeconds ?? 1 };
}

/** The light client views of NEAR's RPC. Nothing here is trusted: the Midnight bridge checks every value. */
export const nearSource = {
  /** The newest light client block after the block with this hash; null when there is none yet. */
  async nextBlock(lastHash: string): Promise<LightClientBlockView | null> {
    const block = await rpc<Partial<LightClientBlockView>>('next_light_client_block', { last_block_hash: lastHash });
    return block?.inner_lite ? (block as LightClientBlockView) : null;
  },
  /** The height of NEAR's newest final block. */
  async finalHeight(): Promise<bigint> {
    const block = await rpc<{ header: { height: number } }>('block', { finality: 'final' });
    if (!block) throw new Error('NEAR names no final block');
    return BigInt(block.header.height);
  },
  async hashAt(height: bigint): Promise<string> {
    const block = await rpc<{ header: { hash: string } }>('block', { block_id: Number(height) });
    if (!block) throw new Error(`NEAR has no block ${height}`);
    return block.header.hash;
  },
  /** The block producers of the epoch of the block at this height, in the order NEAR hashes them. */
  async producersAt(height: number): Promise<ValidatorStakeView[]> {
    const list = await rpc<ValidatorStakeView[]>('EXPERIMENTAL_validators_ordered', [height]);
    if (!list) throw new Error(`NEAR names no producers for block ${height}`);
    return list;
  },
  /** The proof that a receipt ran on the bridge, under the block with hash `head`. */
  async receiptProof(receiptId: string, head: string): Promise<LightClientProof> {
    const proof = await rpc<LightClientProof>('light_client_proof', { type: 'receipt', receipt_id: receiptId, receiver_id: bridgeId, light_client_head: head });
    if (!proof) throw new Error(`NEAR gives no proof for receipt ${receiptId}`);
    return proof;
  },
  /** The block at a height; null when NEAR made none there or the RPC no longer keeps it. */
  async block(height: number): Promise<BlockResult | null> {
    return rpc<BlockResult>('block', { block_id: height }).catch((e: unknown) => {
      if (e instanceof Error && e.message.includes('UNKNOWN_BLOCK')) return null;
      throw e;
    });
  },
  async chunk(hash: string): Promise<ChunkResult> {
    const chunk = await rpc<ChunkResult>('chunk', { chunk_id: hash });
    if (!chunk) throw new Error(`NEAR does not know chunk ${hash}`);
    return chunk;
  },
  /** The receipts a transaction ran on the bridge. */
  async receiptsOf(txHash: string, sender: string): Promise<BridgeReceipt[]> {
    const tx = await rpc<{ receipts_outcome: { id: string; outcome: { executor_id: string; logs: string[] } }[] }>('tx', { tx_hash: txHash, sender_account_id: sender, wait_until: 'FINAL' });
    if (!tx) throw new Error(`NEAR does not know transaction ${txHash}`);
    return tx.receipts_outcome.filter((r) => r.outcome.executor_id === bridgeId).map((r) => ({ id: r.id, logs: r.outcome.logs }));
  },
};
