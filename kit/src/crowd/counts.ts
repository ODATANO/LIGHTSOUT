import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { keepFile, keptJson } from '../keep.js';

interface Kept {
  day: string; // UTC, YYYY-MM-DD
  used: Record<string, number>;
}

const dayOf = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** Counts per name within one UTC day, kept in a file so that a restart does not reset them. */
export class DayCounts {
  constructor(
    private readonly file: string,
    private readonly now: () => number = Date.now,
  ) {}

  private async read(): Promise<Kept> {
    const today = dayOf(this.now());
    const kept = await keptJson<Kept>(this.file);
    return kept?.day === today ? kept : { day: today, used: {} };
  }

  /** How often `name` was counted today. */
  async of(name: string): Promise<number> {
    return (await this.read()).used[name] ?? 0;
  }

  async add(name: string): Promise<void> {
    const kept = await this.read();
    kept.used[name] = (kept.used[name] ?? 0) + 1;
    await keepFile(this.file, JSON.stringify(kept));
  }
}

/** Appends each entry to `file` as one line of JSON. */
export function fileJournal(file: string): (entry: object) => Promise<void> {
  return async (entry) => {
    await mkdir(dirname(file), { recursive: true });
    await appendFile(file, `${JSON.stringify(entry)}\n`);
  };
}
