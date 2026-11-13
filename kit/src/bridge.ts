import { createHash, randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CompactTypeBytes, rawTokenType, transientHash } from '@midnight-ntwrk/compact-runtime';
import { connect, NightgateJobError } from '@odatano/nightgate-tx';
import { createTxBuilder, waitLanded, type BuiltTransaction, type CreateTxBuilderInput, type PreparedCall, type TxBuilder, type WalletState } from '@odatano/nightgate-tx/txbuilder';
import { Contract, pureCircuits, type Ledger, type Witnesses } from 'lightsout-midnight-bridge';
import { bitsOf, type ShieldedKeys } from './codec.js';
import { env } from './env.js';
import { generateOwnDust } from './dust.js';
import { FeeWallet, openWallet, type WalletOptions } from './fees.js';
import { coinSecretKey } from './keys.js';
import { readFromNode } from './midnight-node.js';
import { authFromEnv } from './nightgate-auth.js';
import { FailedInBlock, mayStillLand, NotLanded, outdated, overTime } from './not-landed.js';

// Declared gas is bound into the proof. A Set insert that adds a trie level after another
// transaction costs more than the ledger's own margin, so bridge calls ask for half as much
// again. The builder lowers that where the ledger's time cap needs it.
export const GAS_HEADROOM = 1.5;
const LANDING_MS = 180_000;

export const network = process.env.MIDNIGHT_NETWORK || 'preview';

/** The proof server a script proves on, when `MIDNIGHT_PROOF_SERVER_URL` names one that answers.
 *  Unset means proving in this process. The server sees the coins of the wallet it proves for. */
export async function proofServer(): Promise<string | undefined> {
  const url = process.env.MIDNIGHT_PROOF_SERVER_URL;
  if (!url) return undefined;
  const up = await fetch(`${url}/health`, { signal: AbortSignal.timeout(15_000) }).then((r) => r.ok, () => false);
  if (!up) throw new Error(`the proof server ${url} does not answer`);
  console.log(`Proving on ${url}; that server sees the coins of this wallet.`);
  return url;
}

/** The NIGHTGATE gateway that pays fees and serves chain data; undefined = talk to a node and an indexer directly. */
export const api = process.env.NIGHTGATE_API_URL
  ? {
      baseUrl: process.env.NIGHTGATE_API_URL.replace(/\/+$/, ''),
      get token(): string | undefined {
        const a = authFromEnv();
        return a && 'accessKey' in a ? a.accessKey : undefined;
      },
      get agentToken(): string | undefined {
        const a = authFromEnv();
        return a && 'agentToken' in a ? a.agentToken : undefined;
      },
    }
  : undefined;

interface Direct {
  indexerHttpUrl: string;
  indexerWsUrl: string;
  nodeUrl: string;
}

// The node's RPC port speaks HTTP and WebSocket alike.
function direct(): Direct {
  const indexerHttpUrl = env('MIDNIGHT_INDEXER_HTTP_URL');
  return {
    indexerHttpUrl,
    indexerWsUrl: process.env.MIDNIGHT_INDEXER_WS_URL ?? `${indexerHttpUrl.replace(/^http/, 'ws')}/ws`,
    nodeUrl: env('MIDNIGHT_NODE_URL').replace(/^http/, 'ws'),
  };
}

/** How the transaction builder and the wallets reach Midnight. */
export function chain(): { api: NonNullable<typeof api>; indexerHttpUrl?: string; indexerWsUrl?: string } | Direct {
  return api ? { api, indexerHttpUrl: process.env.MIDNIGHT_INDEXER_HTTP_URL, indexerWsUrl: process.env.MIDNIGHT_INDEXER_WS_URL } : direct();
}

const zkConfigDir = resolve(dirname(fileURLToPath(import.meta.resolve('lightsout-midnight-bridge'))), '..');
// The secret behind the producer list read this process begins. The bridge keeps the read under
// the secret's hash, so only this process can continue it.
let readSecret = randomBytes(32);

/** The key the bridge keeps this process's producer list read under. */
export function ownRead(): bigint {
  return transientHash(new CompactTypeBytes(32), readSecret);
}

/** Takes a new read secret, for a read of its own beside one that is of no use any more. */
export function renewRead(): void {
  readSecret = randomBytes(32);
}

/**
 * What the circuits ask the prover for: bit splits, which the contract checks, and for a mint the
 * coin secret key of the wallet behind `seedHex`. Without a seed a mint cannot be proven.
 */
export function witnessesFor(seedHex?: string): Witnesses<undefined> {
  return {
    bitsOf: ({ privateState }, x) => [privateState, bitsOf(x, 35)],
    bitsOfByte: ({ privateState }, x) => [privateState, bitsOf(x, 8)],
    lowBit: ({ privateState }, x) => [privateState, [(x & 1n) === 1n, x >> 1n]],
    coinSecretKey: ({ privateState }) => {
      if (!seedHex) throw new Error('a mint needs the seed of the wallet the lock names');
      return [privateState, coinSecretKey(seedHex)];
    },
    readSecret: ({ privateState }) => [privateState, readSecret],
  };
}

/** The raw token type of wrapped NEAR on one bridge deployment. */
export function wrappedTokenType(bridgeAddress: string): string {
  return rawTokenType(pureCircuits.wrappedDomain(), bridgeAddress);
}

export interface BridgeBuilderOptions {
  walletSync?: CreateTxBuilderInput['walletSync']; // default false; a call that moves no coins needs no wallet
  walletState?: WalletState; // optional; saved coins, to skip a full sync
  shieldedWallet?: CreateTxBuilderInput['shieldedWallet']; // optional; a running wallet of the same seed to balance from
  onProgress?: (e: unknown) => void;
  proofServerUrl?: string; // optional; proves there several times faster, and sees the wallet's coins
}

export async function openBridgeBuilder(seedHex: string, opts: BridgeBuilderOptions = {}): Promise<TxBuilder> {
  return createTxBuilder({
    onProgress: opts.onProgress,
    ...(opts.proofServerUrl ? { provingMode: 'server' as const, proofServerUrl: opts.proofServerUrl, proofTimeoutMs: 900_000 } : {}),
    seedHex,
    networkId: network,
    ...chain(),
    walletSync: opts.walletSync ?? false,
    walletState: opts.walletState,
    shieldedWallet: opts.shieldedWallet,
    zkConfigDir,
    contractClass: Contract,
    contractName: 'midnight-bridge',
  });
}

/** The bridge state at the node's finalized head. */
export function readBridge(bridgeAddress: string): Promise<Ledger> {
  return readFromNode(bridgeAddress);
}

/** How a wallet of this process reaches Midnight. It talks to a node and an indexer, never to a gateway. */
export function walletOptions(seedHex: string): WalletOptions {
  return { ...direct(), networkId: network, seedHex, proofServerUrl: env('MIDNIGHT_PROOF_SERVER_URL') };
}

let fees: Promise<FeeWallet> | undefined;
let ownFees = false;
// Without a gateway the fee comes from the wallet behind MIDNIGHT_FEE_SEED_HEX, proven on the proof server.
// Its NIGHT that generates no dust yet starts generating dust for it first.
function feeWallet(): Promise<FeeWallet> {
  if (fees) return fees;
  const opening = openWallet(walletOptions(env('MIDNIGHT_FEE_SEED_HEX'))).then(async (wallet) => {
    await generateOwnDust(wallet, (line) => console.log(`  fee wallet: ${line}`));
    return new FeeWallet(wallet);
  });
  // A wallet that failed to open is opened again by the next call.
  opening.catch(() => {
    if (fees === opening) fees = undefined;
  });
  fees = opening;
  return fees;
}

/** Makes this process pay every fee from `wallet`, also when a gateway is set. */
export function payFeesFrom(wallet: FeeWallet): void {
  fees = Promise.resolve(wallet);
  ownFees = true;
}

/** Stops the fee wallet, if this process opened one. */
export async function closeFees(): Promise<void> {
  const open = fees;
  fees = undefined;
  // A wallet that never opened has nothing to stop.
  const wallet = await open?.catch(() => undefined);
  await wallet?.close();
}

/**
 * Gets a proven transaction paid for and onto the chain, and waits for it. The gateway sponsors
 * it when there is one; otherwise this process pays the fee. Returns the transaction's hash.
 */
export async function submit(built: BuiltTransaction, idempotencyKey: string): Promise<string> {
  if (!api || ownFees) {
    if (!built.bound) throw new Error('paying the fee here needs a bound transaction');
    return (await feeWallet()).submit(built.finalizedTxB64);
  }
  const ng = connect(api);
  return landedHash(() => (built.bound ? ng.sponsorFinalized({ finalizedTxB64: built.finalizedTxB64, idempotencyKey }) : ng.sponsorUnbound({ unboundTxB64: built.unboundTxB64, idempotencyKey })));
}

// How a gateway job ends when the gateway did not see its transaction in a block.
const UNCONFIRMED = new Set(['BROADCAST_UNCONFIRMED', 'BROADCAST_NOT_INCLUDED']);

interface SponsorJob {
  jobId: string;
  txHash?: string | null;
  transactionHash?: string | null;
}

// The hash of the transaction a gateway job sent, once a block holds it and its call ran.
async function landedHash(sponsor: () => Promise<SponsorJob>): Promise<string> {
  let job: SponsorJob;
  try {
    job = await sponsor();
  } catch (e) {
    if (e instanceof NightgateJobError && UNCONFIRMED.has(e.job.errorCode ?? '')) throw new NotLanded(e.job.txHash ?? 'of the gateway', { cause: e });
    throw e;
  }
  if (!api || !job.txHash) throw new Error(`sponsor job ${job.jobId} ended without a transaction identifier`);
  const landed = await waitLanded(job.txHash, { api, timeoutMs: LANDING_MS });
  if (!landed) throw new NotLanded(job.txHash);
  if (!landed.applied) throw new FailedInBlock(landed.status);
  return landed.txHash ?? job.transactionHash ?? job.txHash;
}

/** Whether a gateway pays the fees of this process's bridge calls. It sponsors only contracts whose deploy it paid. */
export function feesViaGateway(): boolean {
  return api !== undefined && !ownFees;
}

/** Whether the board's calls and payouts go through the gateway too, instead of paying from the member's own dust. */
export function boardFeesViaGateway(): boolean {
  if (process.env.NIGHTGATE_BOARD_FEES !== 'true') return false;
  if (!api) throw new Error('NIGHTGATE_BOARD_FEES needs NIGHTGATE_API_URL');
  return true;
}

/** Has the gateway pay a board call that the wallet has finalized, and waits for it. */
export async function submitFinalized(finalizedTxB64: string, idempotencyKey: string): Promise<string> {
  const gateway = api;
  if (!gateway) throw new Error('paying through the gateway needs NIGHTGATE_API_URL');
  return landedHash(() => connect(gateway).sponsorFinalized({ finalizedTxB64, idempotencyKey }));
}

/** Like `submit`, for a shielded transfer a wallet built and sealed. */
export async function submitTransfer(transferTxB64: string, tokenType: string, amount: bigint, idempotencyKey: string): Promise<string> {
  const gateway = api;
  if (!gateway || ownFees) return (await feeWallet()).submit(transferTxB64);
  return landedHash(() => connect(gateway).sponsorTransfer({ transferTxB64, tokenType, amount: amount.toString(), idempotencyKey }));
}

export type Circuit = 'begin' | 'absorb' | 'propose' | 'approve' | 'accept' | 'know' | 'prove_lock' | 'prove_register' | 'mint' | 'burn' | 'forget';

/** One call to the Midnight bridge. Anyone may send any of them but `mint`, which is the recipient's. */
export interface Call {
  circuit: Circuit;
  args: unknown[];
  recipient?: ShieldedKeys; // optional; the minter's own keys, which the coin's note is encrypted to
}

// The builder hands args to the circuit unchanged; PreparedCall's type only lists the vault's argument kinds.
export function bridgeCall(circuitId: Circuit, args: unknown[], seedHex?: string): PreparedCall {
  return { circuitId, args: args as PreparedCall['args'], witnesses: witnessesFor(seedHex) };
}

const SEND_TRIES = 5;

/** Builds, proves and submits one call. A mint needs `seedHex`, the recipient's wallet seed. Returns the transaction's hash. */
export async function send(builder: TxBuilder, bridge: string, call: Call, seedHex?: string): Promise<string> {
  let headroom = true;
  for (let tries = 1; ; tries++) {
    const built = await builder.buildSponsorable({
      contractAddress: bridge,
      call: bridgeCall(call.circuit, call.args, seedHex),
      ...(call.recipient ? { recipients: [call.recipient] } : {}),
      bind: true,
      ...(headroom ? { gasHeadroom: GAS_HEADROOM } : {}),
    });
    // A refused attempt is rebuilt against the new state, so the key names the attempt.
    const attempt = createHash('sha256').update(built.finalizedTxB64).digest('hex').slice(0, 16);
    try {
      return await submit(built, `lightsout-${call.circuit}-${bridge.slice(0, 16)}-${attempt}`);
    } catch (e) {
      // A refused call gives back the coins it reserved. One that can still land keeps them.
      if (builder.walletSync !== 'none' && !mayStillLand(e)) await builder.revert(built.finalizedTxB64);
      if (tries >= SEND_TRIES) throw e;
      // The ledger caps the time a transaction takes to check by its size, and declared gas counts.
      // Over that cap the call is rebuilt with the gas it measured and no headroom.
      if (headroom && overTime(e)) headroom = false;
      // Another transaction on the contract can outdate a proven call. Nothing is spent, so it is built again.
      else if (!outdated(e)) throw e;
    }
  }
}
