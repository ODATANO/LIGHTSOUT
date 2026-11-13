import { deserializeTransaction, openTx, sealTx, submitFinalized, txIdentifiers, waitLanded, type WalletState } from '@odatano/nightgate-tx/txbuilder';
import { LedgerParameters } from '@midnightntwrk/ledger-v9';
import { type FinalizedTx, InMemoryTransactionHistoryStorage } from '@midnightntwrk/wallet-sdk-abstractions';
import { DustWallet } from '@midnightntwrk/wallet-sdk-dust-wallet';
import { WalletEntrySchema, WalletFacade, mergeWalletEntries } from '@midnightntwrk/wallet-sdk-facade';
import { HDWallet, Roles } from '@midnightntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnightntwrk/wallet-sdk-shielded';
import { PublicKey, type UnshieldedKeystore, UnshieldedWallet, createKeystore } from '@midnightntwrk/wallet-sdk-unshielded-wallet';
import { FailedInBlock, feeMayBeSpent, NotLanded } from './not-landed.js';

export interface WalletOptions {
  networkId: string;
  nodeUrl: string; // ws or wss
  indexerHttpUrl: string;
  indexerWsUrl: string;
  proofServerUrl: string; // proves what the wallet spends
  seedHex: string; // 64 or 128 hex
}

/** A wallet in step with the chain: its shielded, NIGHT and dust parts, and the key that signs for its NIGHT. */
export interface Wallet {
  facade: WalletFacade;
  keystore: UnshieldedKeystore;
  forks: Parameters<typeof sealTx>[2];
  opts: WalletOptions;
}

const TTL_MS = 30 * 60_000;
const LANDING_MS = 180_000;
// How long a fee waits for a wallet that is behind the chain.
const CATCH_UP_MS = 5 * 60_000;

/**
 * Opens the wallet of a seed and waits until it has caught up with the chain. With `saved`, the
 * state `saveWallet` returned, it catches up from there.
 */
export async function openWallet(opts: WalletOptions, saved?: WalletState): Promise<Wallet> {
  const hd = HDWallet.fromSeed(Buffer.from(opts.seedHex, 'hex'));
  if (hd.type !== 'seedOk') throw new Error('not a wallet seed');
  const account = hd.hdWallet.selectAccount(0);
  const roleSeed = (role: (typeof Roles)[keyof typeof Roles]): Uint8Array => {
    const derived = account.selectRole(role).deriveKeyAt(0);
    if (derived.type !== 'keyDerived') throw new Error('the seed derives no key');
    return derived.key;
  };
  const seeds = { shielded: roleSeed(Roles.Zswap), unshielded: roleSeed(Roles.NightExternal), dust: roleSeed(Roles.Dust) };
  const keystore = createKeystore({ kind: 'schnorr', secret: seeds.unshielded }, opts.networkId);
  hd.hdWallet.clear();
  const configuration = WalletFacade.resolveConfiguration({
    networkId: opts.networkId,
    relayURL: new URL(opts.nodeUrl),
    provers: { v9: { kind: 'server', url: new URL(opts.proofServerUrl) } },
    indexerClientConnection: { indexerHttpUrl: opts.indexerHttpUrl, indexerWsUrl: opts.indexerWsUrl },
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema, mergeWalletEntries),
    costParameters: { additionalFeeOverhead: 1n, feeBlocksMargin: 5 },
  });
  const facade = await WalletFacade.init({
    configuration,
    shielded: () => (saved?.shielded ? ShieldedWallet(configuration).restore(saved.shielded) : ShieldedWallet(configuration).startWithSeed(seeds.shielded)),
    unshielded: () => (saved?.unshielded ? UnshieldedWallet(configuration).restore(saved.unshielded) : UnshieldedWallet(configuration).startWithPublicKey(PublicKey.fromKeyStore(keystore))),
    dust: () => (saved?.dust ? DustWallet(configuration).restore(saved.dust) : DustWallet(configuration).startWithSeed(seeds.dust, LedgerParameters.initialParameters().dust)),
  });
  await facade.start(seeds);
  await facade.waitForSyncedState();
  return { facade, keystore, forks: configuration.forks, opts };
}

/** The wallet's coins as its three parts serialize them, for `openWallet`. As private as the seed. */
export async function saveWallet(wallet: Wallet): Promise<WalletState> {
  const { shielded, unshielded, dust } = wallet.facade;
  return { shielded: await shielded.serializeState(), unshielded: await unshielded.serializeState(), dust: await dust.serializeState() };
}

/** Waits until the wallet has caught up with the chain. Throws when it is still behind after `ms`. */
export async function caughtUp(facade: Pick<WalletFacade, 'waitForSyncedState'>, ms: number = CATCH_UP_MS): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`the wallet did not catch up with the chain in ${Math.round(ms / 1000)} s`)), ms);
  });
  try {
    await Promise.race([facade.waitForSyncedState(), late]);
  } finally {
    clearTimeout(timer);
  }
}

/** Puts a transaction the wallet finalized on the chain and waits for it. Returns its hash. */
export async function land(wallet: Wallet, sealed: FinalizedTx): Promise<string> {
  const finalized = await openTx(sealed);
  const identifier = txIdentifiers(finalized).at(-1);
  if (!identifier) throw new Error('the transaction has no identifier');
  await submitFinalized(finalized, { nodeUrl: wallet.opts.nodeUrl });
  const found = await waitLanded(identifier, { indexerHttpUrl: wallet.opts.indexerHttpUrl, timeoutMs: LANDING_MS, pollMs: 3_000 });
  if (!found) throw new NotLanded(identifier);
  if (!found.applied) throw new FailedInBlock(found.status);
  return found.txHash ?? identifier;
}

/** A wallet that pays the fee of transactions built elsewhere and puts them on the chain itself. */
export class FeeWallet {
  // The wallet spends dust per transaction, so one is paid at a time.
  private turn: Promise<unknown> = Promise.resolve();

  constructor(private readonly wallet: Wallet) {}

  /** Adds the fee to a proven transaction, submits it and waits for the chain. Returns its hash. */
  submit(finalizedTxB64: string): Promise<string> {
    const next = this.turn.then(() => this.pay(finalizedTxB64), () => this.pay(finalizedTxB64));
    this.turn = next.catch(() => undefined);
    return next;
  }

  private async pay(finalizedTxB64: string): Promise<string> {
    const { facade, forks } = this.wallet;
    // A fee proven against a stale dust root is refused, so the wallet catches up first.
    await caughtUp(facade);
    // sealTx returns the wallet's transaction handle untyped.
    const sealed = (await sealTx('Finalized', await deserializeTransaction(finalizedTxB64), forks)) as FinalizedTx;
    const recipe = await facade.balanceFinalizedTransaction(sealed, { ttl: new Date(Date.now() + TTL_MS), tokenKindsToBalance: ['dust'] });
    try {
      return await land(this.wallet, await facade.finalizeRecipe(recipe));
    } catch (e) {
      // Dust set aside for a transaction that no block will take would stay locked for its whole time.
      if (!feeMayBeSpent(e)) await facade.revert(recipe).catch(() => undefined);
      throw e;
    }
  }

  async close(): Promise<void> {
    await this.wallet.facade.stop();
  }
}
