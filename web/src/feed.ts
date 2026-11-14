// The public side of the demo: what both contracts and the board show to everyone.
import { type ContractCall, contractCalls, type NearCall, nearCalls } from 'lightsout-kit/history';
import { burnReleasedBy } from 'lightsout-kit/near';
import { type BoardOverview, type BridgeOverview, boardOverview, bridgeOverview } from 'lightsout-kit/overview';
import { type BridgeRow, timeline, together } from './timeline.js';

// The newest locks and the newest calls on either chain the page lists.
const LOCKS_SHOWN = 60;
const CALLS_SHOWN = 150;
const NEAR_CALLS_SHOWN = 100;
// The gateway's index of Midnight calls is asked less often than the chains.
const CALLS_EVERY_MS = 60_000;
// The public NEAR index allows few requests, so it is asked rarely and for few rows. The rows
// it listed before are kept. Its free plan with a key allows 420 a day: one every five minutes.
const NEAR_CALLS_EVERY_MS = (process.env.NEARBLOCKS_API_KEY ? 5 : 15) * 60_000;
const NEAR_CALLS_A_READ = 25;
// Payouts whose burn is looked up on NEAR in one round.
const PAYOUTS_A_ROUND = 4;

const failed = (what: string, e: unknown): void => console.error(`${what}:`, e instanceof Error ? e.message : e);

export class Feed {
  bridge?: BridgeOverview;
  board?: BoardOverview;
  timeline: BridgeRow[] = [];
  readAt = 0; // Unix ms
  error?: string;
  private onMidnight: ContractCall[] = [];
  private onNear: NearCall[] = [];
  private readonly released = new Map<string, string>(); // burn id -> the NEAR transaction that paid it out
  private readonly looked = new Set<string>(); // release transactions that were looked up
  private callsAt = 0; // Unix ms
  private nearCallsAt = 0; // Unix ms

  // A list that cannot be read keeps the one before. The page then shows what both contracts say.
  private async readCalls(bridge: BridgeOverview): Promise<void> {
    const now = Date.now();
    if (now - this.nearCallsAt >= NEAR_CALLS_EVERY_MS) {
      this.nearCallsAt = now;
      // The first read after a start fills the list; the later ones only add what is new.
      await nearCalls(bridge.near.bridge, this.onNear.length === 0 ? NEAR_CALLS_SHOWN : NEAR_CALLS_A_READ).then(
        (calls) => (this.onNear = together(this.onNear, calls, NEAR_CALLS_SHOWN)),
        (e: unknown) => failed('reading the calls on the NEAR contract', e),
      );
    }
    if (now - this.callsAt < CALLS_EVERY_MS) return;
    this.callsAt = now;
    await contractCalls(bridge.midnight.bridge, CALLS_SHOWN).then(
      (calls) => (this.onMidnight = calls ?? []),
      (e: unknown) => failed('reading the calls on the Midnight bridge', e),
    );
    // The index names a payout's transaction. Which burn it paid is read from NEAR itself.
    const payouts = this.onNear.filter((call) => call.method === 'release' && !this.looked.has(call.tx)).slice(0, PAYOUTS_A_ROUND);
    for (const payout of payouts) {
      this.looked.add(payout.tx);
      const burn = await burnReleasedBy(payout.tx, payout.signer);
      if (burn) this.released.set(burn, payout.tx);
    }
  }

  /** Reads both contracts and the board once. */
  async read(): Promise<void> {
    try {
      const [bridge, board] = await Promise.all([bridgeOverview(this.bridge, LOCKS_SHOWN), boardOverview()]);
      await this.readCalls(bridge);
      this.bridge = bridge;
      this.board = board;
      this.timeline = timeline(bridge.near, bridge.midnight, { midnight: this.onMidnight, near: this.onNear, released: this.released });
      this.readAt = Date.now();
      this.error = undefined;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    }
  }

  /** Reads now and then every `everyMs`, one read at a time. */
  follow(everyMs: number): void {
    const loop = async (): Promise<void> => {
      await this.read();
      setTimeout(() => void loop(), everyMs).unref();
    };
    void loop();
  }
}
