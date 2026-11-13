import { createSwapWallet, type CreateSwapWalletInput } from '@odatano/nightgate-tx/txbuilder';
import { mayStillLand } from '../not-landed.js';

/** How a payout wallet reaches the chain and proves: the options of a swap wallet without its seed. */
export type PayoutChain = Omit<CreateSwapWalletInput, 'seedHex' | 'walletState'>;

/**
 * Moves what the wallet of `seedHex` holds of a token to a shielded address, in one transfer of
 * as many coins as a transfer takes. `pay` gets the fee paid and submits, since a payout wallet
 * holds no dust. Returns the amount and the transaction, or undefined when the wallet holds nothing.
 */
export async function collectPayout(seedHex: string, tokenType: string, to: string, chain: PayoutChain, pay: (txB64: string, tokenType: string, amount: bigint) => Promise<string>): Promise<{ amount: bigint; tx: string } | undefined> {
  const wallet = await createSwapWallet({ ...chain, seedHex });
  try {
    await wallet.sync();
    const amount = await wallet.spendable(tokenType);
    if (amount === 0n) return undefined;
    const built = await wallet.buildTransfer({ tokenType, amount, to, bind: true });
    try {
      return { amount, tx: await pay(built.txB64, tokenType, amount) };
    } catch (e) {
      if (!mayStillLand(e)) await built.revert();
      throw e;
    }
  } finally {
    await wallet.close();
  }
}
