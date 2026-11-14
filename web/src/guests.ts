// Agents made for a visitor who starts from zero: a new NEAR account, paid by the faucet
// account, and a new Midnight seed. A file beside the wallets keeps them, so each one stays
// lendable after a restart.
import { randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { network } from 'lightsout-kit/bridge';
import { nearOf, YOCTO_PER_UNIT } from 'lightsout-kit/codec';
import { keepFile, keptJson } from 'lightsout-kit/keep';
import { nearAccount, nearBalance, newNearAccount, sendNear } from 'lightsout-kit/near';
import type { PoolAgent } from './pool.js';

interface Guest {
  name: string;
  account: string; // NEAR account, 64 hex
  key: string; // its NEAR private key
  seed: string; // 128 hex; its Midnight seed
  madeAt: number; // Unix ms
}

const DAY_MS = 24 * 60 * 60_000;
/** Where the page keeps what must outlast a restart, beside the wallets. */
export const STATE_DIR = process.env.LIGHTSOUT_STATE_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../kit/.wallet');

// A guest has no NIGHT, so the gateway pays its board calls as well.
const lendable = (guest: Guest): PoolAgent => ({
  id: guest.name,
  account: guest.account,
  env: { LIGHTSOUT_AGENT: '', LIGHTSOUT_NAME: guest.name, LIGHTSOUT_NEAR_ACCOUNT_ID: guest.account, LIGHTSOUT_NEAR_PRIVATE_KEY: guest.key, LIGHTSOUT_SEED_HEX: guest.seed, NIGHTGATE_BOARD_FEES: 'true' },
});

/** What a transfer of the faucet gave an agent. */
export interface Funding {
  tx: string;
  near: string; // the amount in NEAR
  from: string; // the faucet's NEAR account
}

/**
 * The faucet and the agents it paid for. `faucet` is the name behind `NEAR_<NAME>_ACCOUNT_ID`
 * and `NEAR_<NAME>_PRIVATE_KEY`; without it no agent is made and none is topped up.
 */
export class Guests {
  private list: Guest[] = [];
  private readonly file = resolve(STATE_DIR, `guests-${network}.json`);

  constructor(
    private readonly faucet: string | undefined,
    private readonly gives: bigint, // yoctoNEAR an agent from zero starts with
    private readonly perDay: number,
  ) {}

  /** The agents made before, for the pool. */
  async load(): Promise<PoolAgent[]> {
    this.list = (await keptJson<Guest[]>(this.file)) ?? [];
    return this.list.map(lendable);
  }

  /** Whether a faucet pays agents that start from zero. */
  get pays(): boolean {
    return this.faucet !== undefined;
  }

  /** Whether a new agent can be made now: a faucet pays, a gateway covers its fees, and the day has room. */
  get open(): boolean {
    const today = this.list.filter((guest) => Date.now() - guest.madeAt < DAY_MS).length;
    return this.faucet !== undefined && Boolean(process.env.NIGHTGATE_API_URL) && today < this.perDay;
  }

  /** Makes a new agent and keeps it. Its NEAR account exists once `fund` has paid it. */
  async make(): Promise<PoolAgent> {
    const near = newNearAccount();
    const guest: Guest = { name: `guest-${randomBytes(3).toString('hex')}`, account: near.accountId, key: near.privateKey, seed: randomBytes(64).toString('hex'), madeAt: Date.now() };
    this.list.push(guest);
    // Kept before it is paid: its key is nowhere else.
    await keepFile(this.file, JSON.stringify(this.list));
    return lendable(guest);
  }

  /** Tops an agent's NEAR account up to what an agent from zero starts with. Undefined when it holds that already. */
  async fund(agent: PoolAgent): Promise<Funding | undefined> {
    if (!this.faucet) return undefined;
    // An account that was never paid does not exist yet.
    const holds = await nearBalance(agent.account).catch(() => 0n);
    if (holds >= this.gives) return undefined;
    const from = nearAccount(this.faucet.toUpperCase() as Uppercase<string>);
    const tx = await sendNear(from, agent.account, this.gives - holds);
    return { tx, near: nearOf((this.gives - holds) / YOCTO_PER_UNIT), from: from.accountId };
  }
}
