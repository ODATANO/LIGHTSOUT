// A relay beside an agent moves the bridge's NEAR head for everyone. So an agent whose NEAR
// block is not under the head yet waits for a relay first, and follows NEAR itself only when
// none came in time. Nobody depends on a relay, and no agent repeats what a relay is doing.

type Say = (line: string) => void;

const POLL_MS = 15_000;
// A line every fourth poll, so one a minute.
const POLLS_A_LINE = 4;

/** How long a run leaves the head to a relay: LIGHTSOUT_RELAY_WAIT_SECONDS, by default ten minutes. */
export const RELAY_WAIT_MS = Number(process.env.LIGHTSOUT_RELAY_WAIT_SECONDS ?? '600') * 1000;

/**
 * One run's way to get the head past a NEAR block. Each call is one step: a pause while a relay
 * may still come, and `move`, which follows NEAR itself, once the wait is over.
 */
export function headMover(
  move: (height: bigint) => Promise<void>,
  say: Say,
  waitMs = RELAY_WAIT_MS,
  pause: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  now: () => number = Date.now,
): (height: bigint) => Promise<void> {
  let since: number | undefined;
  let polls = 0;
  return async (height) => {
    since ??= now();
    if (now() - since >= waitMs) return move(height);
    // A client that waits on progress sees from the lines that the call is alive.
    if (polls++ % POLLS_A_LINE === 0) say(`waiting for a relay to bring the Midnight bridge past NEAR block ${height}`);
    await pause(POLL_MS);
  };
}
