/** A transaction that was sent and that no block took in time. It can still land while it is valid. */
export class NotLanded extends Error {
  override name = 'NotLanded';

  constructor(tx: string, options?: ErrorOptions) {
    super(`transaction ${tx} was sent and no block took it in time`, options);
  }
}

/** A transaction that a block took and whose call failed there. Its fee is spent. */
export class FailedInBlock extends Error {
  override name = 'FailedInBlock';

  constructor(status: string, options?: ErrorOptions) {
    super(`the chain refused the transaction: ${status}`, options);
  }
}

const behind = (e: unknown, found: (cause: Error) => boolean): boolean => {
  for (let cause = e, depth = 0; cause instanceof Error && depth < 8; cause = cause.cause, depth++) {
    if (found(cause)) return true;
  }
  return false;
};

/**
 * Whether a failed send left a transaction that can still land: the error or one behind it is
 * `NotLanded`. Its coins stay set aside. The wallet frees them when the transaction's time ends.
 */
export function mayStillLand(e: unknown): boolean {
  return behind(e, (cause) => cause instanceof NotLanded);
}

/**
 * Whether the fee of a failed send is spent or can still be: a block took the transaction, or one
 * still can. Then its dust stays set aside. Dust that is never spent comes back after hours.
 */
export function feeMayBeSpent(e: unknown): boolean {
  return behind(e, (cause) => cause instanceof NotLanded || cause instanceof FailedInBlock);
}

// A field of an error that a library set without declaring it.
const fieldOf = (e: object, name: string): unknown => (name in e ? Object.getOwnPropertyDescriptor(e, name)?.value : undefined);

/**
 * Whether the chain refused a call because another transaction changed the contract's state
 * after the call was proven: the node's reject 1010 with code 104. Nothing of it is spent.
 */
export function outdated(e: unknown): boolean {
  return behind(e, (cause) => {
    const job = fieldOf(cause, 'job');
    if (typeof job === 'object' && job !== null && fieldOf(job, 'errorCode') === '1010/104') return true;
    // midnight-js hands the node's error on as a new one that keeps only its text.
    if (/node rejected: 1010 .*Custom error: 104\b/.test(cause.message)) return true;
    const data = fieldOf(cause, 'data');
    return fieldOf(cause, 'code') === 1010 && typeof data === 'string' && /Custom error: 104\b/.test(data);
  });
}

/**
 * Whether the chain refuses a call because it takes too long to check for its size: the node's
 * reject 1010 with code 231, or the gateway's refusal before it sends such a call.
 */
export function overTime(e: unknown): boolean {
  return behind(e, (cause) => {
    const job = fieldOf(cause, 'job');
    if (typeof job === 'object' && job !== null && fieldOf(job, 'errorCode') === '1010/231') return true;
    return /exceeded the maximum time to dismiss|node rejected: 1010 .*Custom error: 231\b/.test(cause.message);
  });
}
