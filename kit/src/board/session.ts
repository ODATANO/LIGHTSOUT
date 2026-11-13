import { randomBytes } from 'node:crypto';
import { deriveIdentity, type Identity, type WalletState } from '@odatano/nightgate-tx/txbuilder';
import * as bridge from 'lightsout-midnight-bridge';
import { boardFeesViaGateway, network, submitFinalized, submitTransfer, walletOptions } from '../bridge.js';
import { env } from '../env.js';
import { FeeWallet, openWallet, saveWallet, type Wallet } from '../fees.js';
import { keepFile, keptJson } from '../keep.js';
import { hold } from '../lock.js';
import { memberSecret } from '../membership.js';
import { type AgentIdentity, stateFileOf } from '../roles.js';
import { type Book, type OwnDrop, readBook, writeBook } from './book.js';
import { Board, zkConfigDirOf } from './calls.js';
import { payoutSeed, refundSeed } from './trade.js';

/** The board's address, from `MIDNIGHT_BOARD`. */
export const boardAddress = (): string => env('MIDNIGHT_BOARD');

/** An agent at the board: its wallet, its member secret and what it keeps about its own trades. */
export interface Session {
  agent: AgentIdentity;
  seed: string; // 128 hex
  wallet: Wallet;
  board: Board;
  secret: Uint8Array; // the member secret
  identity: Identity; // the addresses and shielded keys of the role's own wallet
  book: Book;
  /** Pays the fee of a shielded transfer and submits. */
  pay(txB64: string, tokenType: string, amount: bigint): Promise<string>;
  /** The keys and the shielded address of the wallet that the reward for one of the agent's drops is paid to. */
  payout(own: OwnDrop): Promise<Identity>;
  /** The wallet that a refund of one of the agent's bounties pays: its identity and its seed. `buyer` is the bounty's buyer secret. */
  refund(buyer: string): Promise<{ identity: Identity; seedHex: string }>;
  /** Writes the book. */
  keep(): Promise<void>;
  /** Saves the wallet's coins and stops it. */
  close(): Promise<void>;
}

/** Opens the wallet of an agent, catches up with the chain, and attaches to the board. */
export async function openSession(agent: AgentIdentity): Promise<Session> {
  const stateFile = stateFileOf(agent, network, 'board');
  const bookFile = stateFileOf(agent, network, 'book');
  // The wallet state and the book are read once and written whole, so one process holds them at a time.
  const release = await hold(`${bookFile}.lock`, `the board state of ${agent.name}`);
  try {
    return await sessionOf(agent, stateFile, bookFile, release);
  } catch (e) {
    await release();
    throw e;
  }
}

async function sessionOf(agent: AgentIdentity, stateFile: string, bookFile: string, release: () => Promise<void>): Promise<Session> {
  const seed = agent.seedHex;
  const saved = await keptJson<WalletState>(stateFile);
  console.log(saved ? 'Catching up from the saved wallet state...' : 'Syncing the wallet from genesis...');
  const wallet = await openWallet(walletOptions(seed), saved);
  const address = boardAddress();
  const viaGateway = boardFeesViaGateway();
  const board = await Board.open({
    board: address,
    bridge: { address: env('MIDNIGHT_BRIDGE'), module: bridge, zkConfigDir: zkConfigDirOf('lightsout-midnight-bridge') },
    wallet,
    ...(viaGateway ? { submit: submitFinalized } : {}),
  });
  const fees = new FeeWallet(wallet);
  const book = await readBook(bookFile);
  return {
    agent,
    seed,
    wallet,
    board,
    secret: memberSecret(seed),
    identity: await deriveIdentity({ seedHex: seed, networkId: network }),
    book,
    pay: (txB64, tokenType, amount) => (viaGateway ? submitTransfer(txB64, tokenType, amount, randomBytes(16).toString('hex')) : fees.submit(txB64)),
    payout: (own) => deriveIdentity({ seedHex: payoutSeed(seed, address, own.id), networkId: network }),
    refund: async (buyer) => {
      const seedHex = refundSeed(seed, address, buyer);
      return { identity: await deriveIdentity({ seedHex, networkId: network }), seedHex };
    },
    keep: () => writeBook(bookFile, book),
    async close() {
      try {
        await board.close();
        await keepFile(stateFile, JSON.stringify(await saveWallet(wallet)));
        await wallet.facade.stop();
      } finally {
        await release();
      }
    },
  };
}
