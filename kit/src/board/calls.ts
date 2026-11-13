import { randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CompiledContract, type Contract as CompactContract } from '@midnight-ntwrk/compact-js';
import { type ChargedState, ContractState, type Module, type StateValue } from '@midnight-ntwrk/compact-runtime';
import { type CallTxOptionsBase, createUnprovenCallTx, submitTx, type SubmitTxProviders } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type IndexerPublicDataProvider, indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { createLedger9MidnightProvider, createLedger9WalletProvider, type ProofProvider, SucceedEntirely, ZKConfigRegistry } from '@midnight-ntwrk/midnight-js-types';
import { type ContractOperation, ContractState as ChainContractState, type FinalizedTransaction, Transaction } from '@midnightntwrk/ledger-v9';
import type { UnboundTx } from '@midnightntwrk/wallet-sdk-abstractions';
import type { BalancingRecipe } from '@midnightntwrk/wallet-sdk-facade';
import { deriveIdentity, sealTx, txIdentifiers } from '@odatano/nightgate-tx/txbuilder';
import { Contract, ledger, type Ledger } from 'lightsout-board';
import type { ShieldedKeys } from '../codec.js';
import { FeeWallet, type Wallet } from '../fees.js';
import { FailedInBlock, mayStillLand, outdated } from '../not-landed.js';
import { epochOf, type MemberTree, type Membership } from './member.js';
import { AFTER_A_BOUNTY, AFTER_ANY_CALL, type BuiltCall, withByteReserve } from './reserve.js';
import { boardWitnesses, type Inputs } from './witnesses.js';

type BoardContract = Contract<undefined>;
export type Circuit = CompactContract.ProvableCircuitId<BoardContract>;
/** One call to the board: a circuit and its arguments. */
export type Call = { [K in Circuit]: { circuit: K; args: CompactContract.CircuitParameters<BoardContract, K> } }[Circuit];

const TTL_SECONDS = 30 * 60;
const PROOF_TIMEOUT_MS = 900_000;

/** The contract the board's member proof calls: the bridge, which holds the member tree. */
export interface Callee {
  address: string; // 64 hex
  module: Module & { ledger(state: StateValue | ChargedState): { members: MemberTree } }; // the compiled contract
  zkConfigDir: string; // holds keys/ and zkir/ of its circuits
}

/**
 * Pays the fee of a proven transaction, puts it on the chain and waits for it. `request` is
 * random per call: a sponsor that pays instead of the caller takes it as its idempotency key.
 */
export type Submit = (finalizedTxB64: string, request: string) => Promise<unknown>;

export interface BoardOptions {
  board: string; // 64 hex; the board's address
  bridge: Callee;
  wallet: Wallet; // the caller's; its coins pay a reward
  submit?: Submit; // default: the fee comes from the caller's own dust
}

/** A call that landed. */
export interface Landed {
  tx: string; // the transaction's hash
  block: number;
  fee: bigint; // what the chain took
  bytes: number; // the transaction on chain, fee part included
  proveMs: number; // proving the call and the calls it made
}

/** The directory with keys/ and zkir/ of an installed contract package. */
export function zkConfigDirOf(packageName: string): string {
  return resolve(dirname(fileURLToPath(import.meta.resolve(packageName))), '..');
}

/** What the last transaction of a wallet took: its proving time and the coins set aside for it. */
interface Trace {
  proveMs: number;
  recipe: BalancingRecipe | undefined;
}

/** How a wallet builds, proves and submits transactions on the board. */
export interface Reach {
  providers: SubmitTxProviders<BoardContract, Circuit>;
  data: IndexerPublicDataProvider;
  zkDir: string; // holds keys/ and zkir/ of the board's circuits
  trace: Trace;
}

/**
 * Connects a wallet to the proof server, the indexer and the node for transactions on the board.
 * With `zkDir` it is another contract's deploy, which calls no bridge.
 */
export async function reach(opts: Pick<BoardOptions, 'wallet' | 'submit'> & { bridge?: Callee; zkDir?: string }): Promise<Reach> {
  const { wallet, bridge } = opts;
  const { networkId, indexerHttpUrl, indexerWsUrl, proofServerUrl, seedHex } = wallet.opts;
  const keys = (await deriveIdentity({ seedHex, networkId })).shieldedKeys;
  const own = new FeeWallet(wallet);
  const submit = opts.submit ?? ((finalizedTxB64: string) => own.submit(finalizedTxB64));
  const zkDir = opts.zkDir ?? zkConfigDirOf('lightsout-board');
  const zkConfigProvider = new NodeZkConfigProvider<Circuit>(zkDir);
  // The prover finds the keys of a call by the contract it is on, so the callee's are listed too.
  const callees = bridge ? [new NodeZkConfigProvider(bridge.zkConfigDir)] : [];
  const prover = httpClientProofProvider(proofServerUrl, new ZKConfigRegistry([zkConfigProvider, ...callees]), { timeout: PROOF_TIMEOUT_MS });
  const trace: Trace = { proveMs: 0, recipe: undefined };
  const proofProvider: ProofProvider = {
    supportedEras: prover.supportedEras,
    proveTx: async (tx, config) => {
      const started = Date.now();
      try {
        return await prover.proveTx(tx, config);
      } finally {
        trace.proveMs = Date.now() - started;
      }
    },
  };
  const walletProvider = createLedger9WalletProvider({
    getCoinPublicKey: () => keys.coinPublicKey,
    getEncryptionPublicKey: () => keys.encryptionPublicKey,
    // Adds the coins a call takes in. The fee is added when the transaction is submitted.
    async balanceTx(sealed, ttl) {
      const tx = sealed.deserialize({ v9: Transaction });
      const handle = (await sealTx('Unbound', tx, wallet.forks)) as UnboundTx;
      const recipe = await wallet.facade.balanceUnboundTransaction(handle, { ttl: ttl ?? new Date(Date.now() + TTL_SECONDS * 1000), tokenKindsToBalance: ['shielded', 'unshielded'] });
      trace.recipe = recipe;
      const signed = await wallet.facade.signRecipe(recipe, (payload) => wallet.keystore.signDataAsync(payload));
      const finalized = await wallet.facade.finalizeRecipe(signed);
      return Transaction.deserialize('signature', 'proof', 'binding', finalized.serialize());
    },
  });
  const midnightProvider = createLedger9MidnightProvider(async (sealed) => {
    const tx: FinalizedTransaction = sealed.deserialize({ v9: Transaction });
    const identifier = txIdentifiers(tx).at(-1);
    if (!identifier) throw new Error('the transaction has no identifier');
    await submit(Buffer.from(tx.serialize()).toString('base64'), randomBytes(16).toString('hex'));
    return identifier;
  });
  const data = indexerPublicDataProvider({ queryURL: indexerHttpUrl, subscriptionURL: indexerWsUrl });
  const providers = {
    publicDataProvider: data,
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
    config: { networkId, ttlSeconds: TTL_SECONDS },
    contractModuleProvider: { resolve: (address: string) => (bridge && address === bridge.address ? async () => bridge.module : undefined) },
  };
  return { providers, data, zkDir, trace };
}

// How often one call is built when other transactions keep outdating it.
const SEND_TRIES = 5;
// How long a call that is built again waits for the indexer to show what outdated it.
const CATCH_UP_MS = 30_000;
// The calls of someone who asks. A solver's answer can land while one of them is proven.
const OF_AN_ASKER: ReadonlySet<Circuit> = new Set<Circuit>(['post_bounty', 'refund_bounty']);

/** Builds, proves and submits calls to the board with the caller's own wallet, and reads the board. */
export class Board {
  private inputs: Inputs = {};
  // The witnesses answer for one call, so one call is built at a time.
  private turn: Promise<unknown> = Promise.resolve();

  private constructor(
    readonly address: string,
    private readonly opts: BoardOptions,
    private readonly providers: SubmitTxProviders<BoardContract, Circuit>,
    private readonly data: IndexerPublicDataProvider,
    private readonly compiled: CompiledContract.CompiledContract<BoardContract, undefined>,
    private readonly trace: Trace,
  ) {}

  static async open(opts: BoardOptions): Promise<Board> {
    const { providers, data, zkDir, trace } = await reach(opts);
    let board: Board;
    const compiled = CompiledContract.make<BoardContract>('board', Contract).pipe(
      CompiledContract.withWitnesses(boardWitnesses<undefined>(() => board.inputs)),
      CompiledContract.withCompiledFileAssets(zkDir),
    );
    board = new Board(opts.board, opts, providers, data, compiled, trace);
    return board;
  }

  /** The board's public state as the indexer has it. */
  async state(): Promise<Ledger> {
    return ledger(await this.contractState(this.address));
  }

  /** The time of the chain's newest block, in seconds. */
  async time(): Promise<number> {
    const res = await fetch(this.opts.wallet.opts.indexerHttpUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ block { timestamp } }' }),
    });
    if (!res.ok) throw new Error(`the indexer answered ${res.status} to the question for its newest block`);
    const body = (await res.json()) as { data?: { block?: { timestamp?: number } } };
    const timestamp = body.data?.block?.timestamp;
    if (timestamp === undefined) throw new Error('the indexer names no newest block');
    return Math.floor(timestamp / 1000);
  }

  /** What a member proof of `secret` is made from now: the bridge's member tree and the chain's day. */
  async membership(secret: Uint8Array): Promise<Membership> {
    const { bridge } = this.opts;
    const [state, time] = await Promise.all([this.contractState(bridge.address), this.time()]);
    return { secret, members: bridge.module.ledger(state).members, epoch: epochOf(time) };
  }

  /**
   * Builds, proves and submits one call and waits for the chain. `inputs` are its private values,
   * `recipients` the wallets other than the caller's that the call pays a coin to.
   */
  call(call: Call, inputs: Inputs = {}, recipients: ShieldedKeys[] = []): Promise<Landed> {
    const run = () => this.send(call, inputs, recipients);
    const next = this.turn.then(run, run);
    this.turn = next.catch(() => undefined);
    return next;
  }

  async close(): Promise<void> {
    await this.data.dispose();
  }

  private async onChain(address: string) {
    const found = await this.data.queryContractState(address);
    if (!found) throw new Error(`the indexer knows no contract ${address}`);
    if (found.contractState.era !== 'v9') throw new Error(`contract ${address} is kept in an older ledger format`);
    return found.contractState;
  }

  private async contractState(address: string): Promise<ChargedState> {
    return (await this.onChain(address)).deserialize({ v9: ContractState }).data;
  }

  // The circuits of the called contracts as the chain holds them. A call names the key it is proven with.
  private async operations(calls: readonly BuiltCall[]): Promise<(call: BuiltCall) => ContractOperation> {
    const addresses = [...new Set(calls.map((call) => String(call.contractAddress)))];
    const states = new Map(await Promise.all(addresses.map(async (address) => [address, (await this.onChain(address)).deserialize({ v9: ChainContractState })] as const)));
    return (call) => {
      const operation = states.get(String(call.contractAddress))?.operation(call.circuitId);
      if (!operation) throw new Error(`contract ${call.contractAddress} has no circuit ${call.circuitId} on chain`);
      return operation;
    };
  }

  // The indexer runs behind the node. A call built before it shows what outdated the last one is refused again.
  private async caughtUp(since: number): Promise<void> {
    const newest = () => this.time().catch(() => since);
    for (const until = Date.now() + CATCH_UP_MS; Date.now() < until && (await newest()) < since; ) await new Promise((r) => setTimeout(r, 2000));
  }

  private async send(call: Call, inputs: Inputs, recipients: ShieldedKeys[]): Promise<Landed> {
    this.inputs = inputs;
    const options: CallTxOptionsBase<BoardContract, Circuit> = {
      compiledContract: this.compiled,
      contractAddress: this.address,
      circuitId: call.circuit,
      args: call.args,
      additionalCoinEncPublicKeyMappings: new Map(recipients.map((r) => [r.coinPublicKey, r.encryptionPublicKey])),
    };
    try {
      for (let tries = 1; ; tries++) {
        this.trace.recipe = undefined;
        this.trace.proveMs = 0;
        try {
          const built = await createUnprovenCallTx<BoardContract, Circuit>(this.providers, options);
          // Another call that lands first changes how many bytes this one writes and deletes.
          const reserve = OF_AN_ASKER.has(call.circuit) ? AFTER_ANY_CALL : AFTER_A_BOUNTY;
          const unprovenTx = withByteReserve(built, await this.operations(built.calls), reserve);
          const landed = await submitTx(this.providers, { unprovenTx, circuitId: call.circuit });
          if (landed.status !== SucceedEntirely) throw new FailedInBlock(landed.status);
          return { tx: landed.txHash, block: landed.blockHeight, fee: BigInt(landed.fees.paidFees), bytes: landed.tx.serialize().length, proveMs: this.trace.proveMs };
        } catch (e) {
          // A transaction that will not land gives back the coins the wallet set aside for it.
          if (this.trace.recipe && !mayStillLand(e)) await this.opts.wallet.facade.revert(this.trace.recipe).catch(() => undefined);
          // Another transaction on the board can outdate a proven call. Nothing is spent, so it is built again.
          if (tries >= SEND_TRIES || !outdated(e)) throw e;
          console.log(`the board changed under ${call.circuit}; building it again, try ${tries + 1} of ${SEND_TRIES}`);
          await this.caughtUp(Date.now() / 1000);
        }
      }
    } finally {
      this.inputs = {};
    }
  }
}
