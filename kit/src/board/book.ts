import { keepFile, keptJson } from '../keep.js';

/** A drop its solver made, with what only the solver knows. */
export interface OwnDrop {
  board: string; // 64 hex; the board it is on
  id: string; // 64 hex
  key: string; // decimal; the content key
  blinds: string[]; // decimal; the blinds of the last sealing calls sent, one of which the board holds
  content: string; // base64
}

/** A bounty its asker posted, with the secret that opens the answer. */
export interface OwnBounty {
  board: string; // 64 hex
  bounty: string; // 64 hex
  secret: string; // decimal; the asker's secret for this bounty
  deadline: string; // decimal; seconds, after which the asker can refund
  request: string; // the exact request bytes
  collected?: boolean; // optional; its refund is at the agent's own address
  emptySince?: number; // Unix ms; optional; when its refund wallet was first found empty
}

/** An answer its solver delivers: the drop that holds it and the TEE's signature over it. */
export interface OwnAnswer {
  board: string; // 64 hex
  bounty: string; // 64 hex
  drop: string; // 64 hex; the solver's own drop with the response bytes
  model: string;
  signature: string; // 128 hex; ed25519
  key: string; // 64 hex; the TEE key that signed
  paid: boolean; // the board took the answer and paid the reward
  collected?: boolean; // optional; its reward is at the agent's own address
  emptySince?: number; // Unix ms; optional; when its payout wallet was first found empty
}

/** What a member keeps about its own drops, bounties and answers. As private as the seed. */
export interface Book {
  drops: OwnDrop[];
  bounties: OwnBounty[];
  answers: OwnAnswer[];
}

export async function readBook(file: string): Promise<Book> {
  const book = (await keptJson<Partial<Book>>(file)) ?? {};
  return { drops: book.drops ?? [], bounties: book.bounties ?? [], answers: book.answers ?? [] };
}

export function writeBook(file: string, book: Book): Promise<void> {
  return keepFile(file, JSON.stringify(book, null, 1));
}
