/** Where the next look at a numbered list starts, and the highest NEAR block among its open entries. */
export interface Open {
  from: bigint;
  highest: bigint | undefined;
}

/**
 * Looks at entries `from` up to `next` of a list the NEAR bridge numbers: its locks or its
 * registrations. An entry is open until Midnight has it. Returns the first open entry, where
 * the next look starts, and the highest NEAR block among the open ones.
 */
export async function openEntries(
  from: bigint,
  next: bigint,
  arrived: (id: bigint) => boolean,
  blockOf: (id: bigint) => Promise<bigint | undefined>,
): Promise<Open> {
  let first: bigint | undefined;
  let highest: bigint | undefined;
  for (let id = from; id < next; id++) {
    if (arrived(id)) continue;
    first ??= id;
    const block = await blockOf(id);
    if (block !== undefined && (highest === undefined || block > highest)) highest = block;
  }
  return { from: first ?? next, highest };
}

/** The highest of the heights that are there. */
export const highestOf = (...heights: (bigint | undefined)[]): bigint | undefined =>
  heights.reduce((top, height) => (height !== undefined && (top === undefined || height > top) ? height : top), undefined);
