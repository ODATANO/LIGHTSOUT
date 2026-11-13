import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createSwapWallet, type SwapWallet } from '@odatano/nightgate-tx/txbuilder';
import { pureCircuits } from 'lightsout-midnight-bridge';
import { chain, closeFees, network, openBridgeBuilder, send, submitTransfer, wrappedTokenType } from './bridge.js';
import { encodeNearRecipient } from './codec.js';
import { keepFile } from './keep.js';
import { hold } from './lock.js';
import { mayStillLand } from './not-landed.js';

export interface PurseOptions {
  seedHex: string; // 128 hex; the agent's Midnight seed
  bridge: string; // 64 hex; the Midnight bridge whose token the purse holds
  stateFile?: string; // optional; keeps the wallet's coins between runs, as private as the seed
  proofServerUrl?: string; // optional; proves there instead of in this process, and sees the coins
}

/** An agent's shielded wallet of the bridge token: hold it, send it, cash out. */
export class Purse {
  // Builds spend coins, so one runs at a time.
  private turn: Promise<unknown> = Promise.resolve();

  private constructor(
    private readonly wallet: SwapWallet,
    private readonly opts: PurseOptions,
    readonly tokenType: string,
    private readonly release: () => Promise<void>,
  ) {}

  static async open(opts: PurseOptions): Promise<Purse> {
    // The state file is read once and written whole, so one process holds it at a time.
    const release = opts.stateFile ? await hold(`${opts.stateFile}.lock`, `the wallet state ${opts.stateFile}`) : async () => {};
    try {
      const walletState = opts.stateFile ? await readFile(opts.stateFile, 'utf8').catch(() => undefined) : undefined;
      const wallet = await createSwapWallet({
        ...(opts.proofServerUrl ? { provingMode: 'server' as const, proofServerUrl: opts.proofServerUrl } : {}),
        seedHex: opts.seedHex,
        networkId: network,
        ...chain(),
        walletState,
      });
      const purse = new Purse(wallet, opts, wrappedTokenType(opts.bridge), release);
      await purse.coins();
      return purse;
    } catch (e) {
      await release();
      throw e;
    }
  }

  /** The shielded address others pay to. */
  get address(): string {
    return this.wallet.address;
  }

  async balance(): Promise<bigint> {
    await this.coins();
    return (await this.wallet.balances())[this.tokenType] ?? 0n;
  }

  /** Sends `amount` to a shielded address and returns once Midnight has it. */
  send(to: string, amount: bigint): Promise<string> {
    return this.alone(async () => {
      if (to === this.address) throw new Error('that is this purse\'s own address');
      await this.wallet.sync();
      const built = await this.wallet.buildTransfer({ tokenType: this.tokenType, amount, to, bind: true });
      try {
        const tx = await submitTransfer(built.txB64, this.tokenType, amount, `lightsout-send-${randomBytes(16).toString('hex')}`);
        await this.coins();
        return tx;
      } catch (e) {
        // A transfer that can still land keeps its coins set aside.
        if (!mayStillLand(e)) await built.revert();
        throw e;
      }
    });
  }

  /** Burns `amount` so the NEAR bridge pays `nearAccount` once the burn is proven there. Returns the Midnight transaction and the burn's id, 64 hex. */
  withdraw(amount: bigint, nearAccount: string): Promise<{ tx: string; id: string }> {
    return this.alone(async () => {
      await this.wallet.sync();
      const builder = await openBridgeBuilder(this.opts.seedHex, {
        walletSync: 'shielded',
        shieldedWallet: this.wallet.shieldedWallet,
        proofServerUrl: this.opts.proofServerUrl,
      });
      try {
        // A fresh coin of the token that the wallet funds; the contract sends it on to the burn address.
        const coin = { nonce: randomBytes(32), color: Buffer.from(this.tokenType, 'hex'), value: amount };
        const id = Buffer.from(pureCircuits.burnId(coin)).toString('hex');
        try {
          const tx = await send(builder, this.opts.bridge, { circuit: 'burn', args: [coin, encodeNearRecipient(nearAccount)] });
          await this.coins();
          return { tx, id };
        } catch (e) {
          // The burn can still land, and a second one would burn again.
          if (mayStillLand(e)) throw new Error(`burn ${id} was sent and no block took it in time. It can still land for half an hour, and its coins stay set aside that long. Look it up as a withdrawal before you burn again`, { cause: e });
          throw e;
        }
      } finally {
        await builder.close();
      }
    });
  }

  async close(): Promise<void> {
    try {
      await this.wallet.close();
      await closeFees();
    } finally {
      await this.release();
    }
  }

  /** The values of the purse's free coins, after catching up with the chain. Saves the wallet. */
  private async coins(): Promise<bigint[]> {
    await this.wallet.sync();
    if (this.opts.stateFile) await keepFile(this.opts.stateFile, await this.wallet.serializeState());
    return (await this.wallet.coins()).filter((c) => c.tokenType === this.tokenType).map((c) => c.amount);
  }

  private alone<T>(run: () => Promise<T>): Promise<T> {
    const next = this.turn.then(run, run);
    this.turn = next.catch(() => undefined);
    return next;
  }
}
