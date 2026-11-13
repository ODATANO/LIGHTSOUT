import type { ContractExecutable } from '@midnight-ntwrk/compact-js';
import { encodeContractKeyLocation, hashVerifierKey, LedgerTransaction } from '@midnight-ntwrk/midnight-js-types';
import { ContractCallPrototype, type ContractOperation, communicationCommitmentRandomness, type RunningCost, Transaction } from '@midnightntwrk/ledger-v9';

/** One call of a built call tree: the board's own, or one it makes on another contract. */
export type BuiltCall = ContractExecutable.ContractExecutable.ContractCall;

/** A call transaction as the library built it, before it is proven. */
export interface Built {
  calls: readonly BuiltCall[]; // the calls it makes first, its own last
  private: { unprovenTx: LedgerTransaction<'Unproven', 'v9'> };
}

/** How far a call may leave the bytes it measured when it was built. Each byte costs a fee. */
export interface ByteReserve {
  written: bigint; // bytes it may write more
  deleted: bigint; // bytes it may delete fewer
}

// The chain refuses a call that writes more or deletes less than it named. A bounty that lands
// first makes a waiting call write 340 to 650 bytes more. An answer that lands first makes it
// delete about 480 fewer.
export const AFTER_A_BOUNTY: ByteReserve = { written: 768n, deleted: 0n };
export const AFTER_ANY_CALL: ByteReserve = { written: 768n, deleted: 768n };

/** The gas of a call with `reserve` on the bytes it measured. A call that writes nothing stays. */
export function reserved(gas: RunningCost, reserve: ByteReserve): RunningCost {
  if (gas.bytesWritten === 0n) return gas;
  return { ...gas, bytesWritten: gas.bytesWritten + reserve.written, bytesDeleted: gas.bytesDeleted > reserve.deleted ? gas.bytesDeleted - reserve.deleted : 0n };
}

/**
 * The unproven transaction of `built` with a byte reserve on every call. `operationOf` gives a
 * call's circuit as its contract holds it on chain. A proof covers the gas, so this runs before it.
 */
export function withByteReserve(built: Built, operationOf: (call: BuiltCall) => ContractOperation, reserve: ByteReserve): LedgerTransaction<'Unproven', 'v9'> {
  const tx = built.private.unprovenTx.deserialize({ v9: Transaction });
  const intents = [...(tx.intents ?? [])];
  const [first] = intents;
  if (!first || intents.length !== 1) throw new Error(`a call transaction holds one intent, this one holds ${intents.length}`);
  const [segment, intent] = first;
  // Only addCall binds a call to the one that makes it, so every call is added again in its order.
  intent.actions = [];
  let rebuilt = intent;
  for (const call of built.calls) {
    const operation = operationOf(call);
    const [guaranteed, fallible] = call.public.partitionedTranscript;
    const made = call.communicationCommitment;
    rebuilt = rebuilt.addCall(
      new ContractCallPrototype(
        call.contractAddress,
        call.circuitId,
        operation,
        guaranteed && { ...guaranteed, gas: reserved(guaranteed.gas, reserve) },
        fallible && { ...fallible, gas: reserved(fallible.gas, reserve) },
        call.private.privateTranscriptOutputs,
        call.private.input,
        call.private.output,
        made._tag === 'Some' ? made.value.commCommRand : communicationCommitmentRandomness(),
        encodeContractKeyLocation({ contractAddress: String(call.contractAddress), circuitId: call.circuitId, verifierKeyHash: hashVerifierKey(operation.verifierKey) }),
      ),
    );
  }
  tx.intents = new Map([[segment, rebuilt]]);
  return LedgerTransaction.seal('v9', 'Unproven', tx);
}
