import { createHmac } from 'node:crypto';
import { unshieldedToken } from '@midnightntwrk/ledger-v9';
import { DustAddress, MidnightBech32m, UnshieldedAddress } from '@midnightntwrk/wallet-sdk-address-format';
import { isInsufficientDustForFeeError } from '@midnightntwrk/wallet-sdk-dust-wallet';
import type { BalancingRecipe, UtxoWithMeta } from '@midnightntwrk/wallet-sdk-facade';
import { land, type Wallet } from './fees.js';
import { mayStillLand } from './not-landed.js';

// Dust for a member: NIGHT of a sponsor that generates dust for the member's dust address.
// A NIGHT key generates dust for one address, the one its last registration named, and so does
// every output the key receives later. So each member's NIGHT sits under a key of its own.

type Say = (line: string) => void;

const NIGHT = unshieldedToken().raw;
export const STARS_PER_NIGHT = 1_000_000n;
const TTL_MS = 30 * 60_000;
const ARRIVAL_MS = 180_000;
// A registration pays its fee from the dust its NIGHT has generated. It waits this long for that.
const PATIENCE_S = 600n;

/** NIGHT that has not generated the fee of its registration yet. `seconds` is how long that takes. */
export class DustNotCovered extends Error {
  constructor(readonly seconds: bigint) {
    super(`its NIGHT has generated the fee of the registration in about ${seconds} s`);
  }
}

/** A NIGHT amount in stars, from decimal text like `100` or `2.5`. */
export function stars(night: string): bigint {
  const parts = /^(\d+)(?:\.(\d{1,6}))?$/.exec(night);
  if (!parts) throw new Error(`not a NIGHT amount: ${night}`);
  const amount = BigInt(parts[1]!) * STARS_PER_NIGHT + BigInt((parts[2] ?? '').padEnd(6, '0'));
  if (amount === 0n) throw new Error('the NIGHT amount is zero');
  return amount;
}

/** The seed of the wallet that holds a sponsor's NIGHT for registration `index` of one NEAR bridge. */
export function outputSeed(sponsorSeedHex: string, nearBridge: string, index: bigint): string {
  return createHmac('sha256', Buffer.from(sponsorSeedHex, 'hex')).update(`lightsout:sponsor-output:${nearBridge}:${index}`).digest('hex');
}

/** A dust address of this network from its text. Throws for another network or another kind of address. */
export function parseDustAddress(text: string, networkId: string): DustAddress {
  return MidnightBech32m.parse(text).decode(DustAddress, networkId);
}

async function nightOf(wallet: Wallet): Promise<readonly UtxoWithMeta[]> {
  const state = await wallet.facade.waitForSyncedState();
  return state.unshielded.availableCoins.filter((coin) => coin.utxo.type === NIGHT);
}

// A refused transaction gives back the coins the wallet set aside for it.
async function landRecipe(wallet: Wallet, recipe: BalancingRecipe): Promise<string> {
  try {
    return await land(wallet, await wallet.facade.finalizeRecipe(recipe));
  } catch (e) {
    if (!mayStillLand(e)) await wallet.facade.revert(recipe).catch(() => undefined);
    throw e;
  }
}

/**
 * Registers NIGHT outputs of `wallet` so that they generate dust for `receiver`, or for the
 * wallet itself without one. The outputs pay the fee from the dust they have generated so far.
 */
async function registerNight(wallet: Wallet, coins: readonly UtxoWithMeta[], receiver: DustAddress | undefined, say: Say): Promise<string> {
  const { facade, keystore } = wallet;
  const register = () => facade.registerNightUtxosForDustGeneration(coins, keystore.getPublicKey(), keystore.signDataAsync, receiver);
  const recipe = await register().catch(async (e: unknown) => {
    if (!isInsufficientDustForFeeError(e)) throw e;
    if (e.estimate._tag !== 'Reachable') throw new Error(`this NIGHT never generates the fee of its registration: ${e.estimate.reason}`);
    if (e.estimate.seconds > PATIENCE_S) throw new DustNotCovered(e.estimate.seconds);
    say(`waiting ${e.estimate.seconds} s until the NIGHT has generated the fee of its registration`);
    await facade.waitForGeneratedDust(coins, e.fee, { timeoutMs: Number(e.estimate.seconds) * 1000 + 60_000 });
    return register();
  });
  return landRecipe(wallet, recipe);
}

/** Makes the wallet's NIGHT that generates no dust yet generate dust for the wallet itself. */
export async function generateOwnDust(wallet: Wallet, say: Say): Promise<void> {
  const idle = (await nightOf(wallet)).filter((coin) => !coin.meta.registeredForDustGeneration);
  if (idle.length === 0) return;
  say(`${idle.length} NIGHT outputs of the wallet generate dust for it from now on, tx ${await registerNight(wallet, idle, undefined, say)}`);
  // The wallet can pay a fee once it sees the dust.
  for (const until = Date.now() + ARRIVAL_MS; (await wallet.facade.waitForSyncedState()).dust.balance(new Date()) === 0n; ) {
    if (Date.now() > until) throw new Error('the wallet did not see its dust in time');
    await new Promise((r) => setTimeout(r, 3_000));
  }
}

/**
 * Gives a member dust: moves `amount` stars of NIGHT from `treasury` into `output`, a wallet that
 * serves this member only, and registers them for the member's dust address. The treasury pays
 * the fee of the move. Does nothing when `output` generates dust already.
 */
export async function sponsorDust(treasury: Wallet, output: Wallet, member: DustAddress, amount: bigint, say: Say): Promise<void> {
  let coins = await nightOf(output);
  if (coins.some((coin) => coin.meta.registeredForDustGeneration)) return;
  if (coins.length === 0) {
    const receiverAddress = output.keystore.getBech32Address().decode(UnshieldedAddress, output.opts.networkId);
    const ttl = new Date(Date.now() + TTL_MS);
    const transfer = await treasury.facade.transferTransaction([{ type: 'unshielded', outputs: [{ type: NIGHT, receiverAddress, amount }] }], { ttl, payFees: true });
    const signed = await treasury.facade.signRecipe(transfer, treasury.keystore.signDataAsync).catch(async (e: unknown) => {
      await treasury.facade.revert(transfer).catch(() => undefined);
      throw e;
    });
    say(`moved ${amount} stars of NIGHT into an output of its own, tx ${await landRecipe(treasury, signed)}`);
    for (const until = Date.now() + ARRIVAL_MS; coins.length === 0; coins = await nightOf(output)) {
      if (Date.now() > until) throw new Error('the NIGHT did not arrive in its output in time');
      await new Promise((r) => setTimeout(r, 3_000));
    }
  }
  say(`NIGHT registered for the dust address, tx ${await registerNight(output, coins, member, say)}`);
}
