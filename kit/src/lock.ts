import { randomBytes } from 'node:crypto';
import { mkdir, open, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

interface Held {
  token: string; // names the process that holds the lock
  at: number; // Unix ms; the holder's last sign of life
}

/** How a lock keeps time. A holder that gave no sign of life for `staleMs` is passed over. */
export interface LockTimes {
  beatMs: number;
  staleMs: number;
  waitMs: number;
  now: () => number;
}

const TIMES: LockTimes = { beatMs: 15_000, staleMs: 60_000, waitMs: 75_000, now: Date.now };

const failedWith = (e: unknown, code: string): boolean => e instanceof Error && 'code' in e && e.code === code;

// The holder of the lock file, or undefined when there is no file. A file that cannot be read
// is in the middle of a write, so its holder counts as alive since the file last changed.
async function heldBy(file: string): Promise<Held | undefined> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as Held;
  } catch (e) {
    if (failedWith(e, 'ENOENT')) return undefined;
    const changed = await stat(file).then((s) => s.mtimeMs, () => undefined);
    return changed === undefined ? undefined : { token: '', at: changed };
  }
}

/**
 * Takes the lock file `file` for this process and returns the call that gives it back. State
 * that a process reads once and writes whole, such as a wallet or a book, loses what a second
 * process wrote. `what` names that state in the error a second process gets.
 */
export async function hold(file: string, what: string, times: LockTimes = TIMES): Promise<() => Promise<void>> {
  const token = randomBytes(8).toString('hex');
  const mine = (): string => JSON.stringify({ token, at: times.now() } satisfies Held);
  await mkdir(dirname(file), { recursive: true });
  for (const started = times.now(); ; ) {
    try {
      const handle = await open(file, 'wx');
      await handle.writeFile(mine());
      await handle.close();
      break;
    } catch (e) {
      if (!failedWith(e, 'EEXIST')) throw e;
    }
    const held = await heldBy(file);
    // Given back in the meantime: the next try takes it.
    if (!held) continue;
    if (times.now() - held.at > times.staleMs) {
      // Taken over only if it is still the same stale holder.
      const again = await heldBy(file);
      if (again?.token === held.token && again.at === held.at) await rm(file, { force: true });
      continue;
    }
    if (times.now() - started > times.waitMs) throw new Error(`${what} is open in another process. Two processes on it would lose each other's changes.`);
    await sleep(Math.min(1000, times.staleMs / 10));
  }
  let given = false;
  // One sign of life after the other, so that giving the lock back can wait for the last one.
  let beating: Promise<void> = Promise.resolve();
  const beat = setInterval(() => {
    beating = beating
      .then(async () => {
        if (!given && (await heldBy(file))?.token === token) await writeFile(file, mine());
      })
      .catch(() => undefined);
  }, times.beatMs);
  beat.unref();
  return async () => {
    clearInterval(beat);
    given = true;
    // A sign of life on its way would write the file again after it was removed.
    await beating;
    if ((await heldBy(file))?.token === token) await rm(file, { force: true });
  };
}
