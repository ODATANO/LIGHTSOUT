// Agents for a visitor's own machine. The visitor's browser makes the NEAR key and the seed.
// The page pays that key's account from the faucet and turns one fee code into a gateway key.
// It keeps neither key nor seed, only which codes are spent and which accounts it paid.
import { keepFile, keptJson } from 'lightsout-kit/keep';

const DAY_MS = 24 * 60 * 60_000;

/** A key that lets a gateway pay an agent's Midnight fees. */
export interface FeeKey {
  key: string;
  validUntil?: string; // ISO time; absent = the gateway named none
}

/** What redeeming a code gave: a key, or the news that the code is used up. */
export type Redeemed = FeeKey | 'spent';

interface Paid {
  account: string; // NEAR account, 64 hex
  at: number; // Unix ms
  keyed: boolean; // it got its fee key
}

interface Kept {
  spent: string[]; // codes that gave their key or were used up before
  paid: Paid[];
}

export class OwnAgents {
  private kept: Kept = { spent: [], paid: [] };
  private turn: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly codes: readonly string[],
    private readonly perDay: number,
    private readonly redeem: (code: string) => Promise<Redeemed>,
    private readonly file: string,
  ) {}

  /** Reads what a run before this one kept. */
  async load(): Promise<void> {
    this.kept = (await keptJson<Kept>(this.file)) ?? this.kept;
  }

  private get codeLeft(): boolean {
    return this.codes.some((code) => !this.kept.spent.includes(code));
  }

  /** Whether one more account can be paid now: a code is left and the day has room. */
  get open(): boolean {
    return this.codeLeft && this.kept.paid.filter((paid) => Date.now() - paid.at < DAY_MS).length < this.perDay;
  }

  /** Whether this account was paid and still waits for its fee key. */
  waits(account: string): boolean {
    return this.kept.paid.some((paid) => paid.account === account && !paid.keyed);
  }

  /** Whether this account got its fee key before. */
  has(account: string): boolean {
    return this.kept.paid.some((paid) => paid.account === account && paid.keyed);
  }

  /** Notes that the faucet paid this account. From here on it is one of the day's agents. */
  async paid(account: string): Promise<void> {
    if (this.kept.paid.some((paid) => paid.account === account)) return;
    this.kept.paid.push({ account, at: Date.now(), keyed: false });
    await keepFile(this.file, JSON.stringify(this.kept));
  }

  /** The fee key of a paid account, from the next code that still works. One caller at a time, so no code is taken twice. */
  key(account: string): Promise<FeeKey> {
    const next = this.turn.then(() => this.take(account));
    this.turn = next.catch(() => undefined);
    return next;
  }

  private async take(account: string): Promise<FeeKey> {
    const paid = this.kept.paid.find((entry) => entry.account === account);
    if (!paid || paid.keyed) throw new Error(paid ? 'this account has its fee key already' : 'this account was not paid');
    for (const code of this.codes) {
      if (this.kept.spent.includes(code)) continue;
      const redeemed = await this.redeem(code);
      this.kept.spent.push(code);
      if (redeemed !== 'spent') paid.keyed = true;
      // Kept before the key goes out: a code gives its key once.
      await keepFile(this.file, JSON.stringify(this.kept));
      if (redeemed !== 'spent') return redeemed;
    }
    throw new Error('no fee code is left');
  }
}
