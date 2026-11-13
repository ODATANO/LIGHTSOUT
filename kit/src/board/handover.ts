import { ecMul, ecMulGenerator, type JubjubPoint, subField } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from 'lightsout-board';
import { maskOf, randomField } from './field.js';

export type Handover = ReturnType<Ledger['answers']['lookup']>['handover'];

/** A key pair on the embedded curve: an asker's for one bounty. */
export interface KeyPair {
  secret: bigint;
  point: JubjubPoint;
}

/** A fresh random key pair. */
export function keyPair(): KeyPair {
  const secret = randomField();
  return { secret, point: ecMulGenerator(secret) };
}

/** The content key from a handover, for the asker it was made for. Another secret gives another number. */
export function openHandover(handover: Handover, secret: bigint): bigint {
  return subField(handover.masked, maskOf(ecMul(handover.point, secret)));
}
