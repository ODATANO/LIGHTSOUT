import type { OwnDrop } from './book.js';
import type { Session } from './session.js';
import { beginDrop, sealDrop } from './trade.js';

type Say = (line: string) => void;

/**
 * Opens one of the agent's drops on the board and seals what it still lacks. A run that stopped
 * goes on where the board stands. `signal` stops it between two calls.
 */
export async function sealOwnDrop(session: Session, own: OwnDrop, say: Say, signal?: AbortSignal): Promise<void> {
  const { board } = session;
  signal?.throwIfAborted();
  const id = Buffer.from(own.id, 'hex');
  const state = await board.state();
  if (state.seals.member(id) && state.seals.lookup(id).done) return;
  if (!state.drops.member(id)) {
    const payout = await session.payout(own);
    say(`drop ${own.id} opened, tx ${(await beginDrop(board, session.secret, own, payout.shieldedKeys.coinPublicKey)).tx}`);
  }
  await sealDrop(board, own, session.keep, say, signal);
}
