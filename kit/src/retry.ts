/** Whether a failed request is worth repeating: the service was busy or unreachable, not wrong. */
export function isTransient(e: unknown): boolean {
  const text = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|429|-429|Rate limit|Retry after|timed out|timeout|5\d\d\b/i.test(text);
}

/** Runs `attempt` up to `tries` times, doubling the wait after each transient failure. */
export async function withRetry<T>(attempt: () => Promise<T>, tries = 5, firstWaitMs = 1000): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await attempt();
    } catch (e) {
      if (i + 1 >= tries || !isTransient(e)) throw e;
      await new Promise((r) => setTimeout(r, firstWaitMs * 2 ** i));
    }
  }
}
