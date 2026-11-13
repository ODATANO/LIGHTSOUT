/* tslint:disable */
/* eslint-disable */

/**
 * The log a burn of the bridge left in its transaction.
 */
export class BurnLog {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The hash of the burned coin, 32 bytes.
     */
    get id(): Uint8Array;
    /**
     * The hash of the burned coin, 32 bytes.
     */
    set id(value: Uint8Array | number[]);
    /**
     * The NEAR account, zero-padded to 64 bytes.
     */
    get nearRecipient(): Uint8Array;
    /**
     * The NEAR account, zero-padded to 64 bytes.
     */
    set nearRecipient(value: Uint8Array | number[]);
    /**
     * Micro-NEAR, decimal.
     */
    value: string;
}

/**
 * The root of a block's extrinsics and the nodes that prove one of them.
 */
export class ExtrinsicProof {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Trie nodes, `Uint8Array`s.
     */
    nodes: Array<any>;
    get root(): Uint8Array;
    set root(value: Uint8Array | number[]);
}

/**
 * Reads the burn logs of the bridge at `bridge` from a serialized Midnight transaction: one
 * `BurnLog` for each of its burns, in their order.
 */
export function burnLogs(tx: Uint8Array | number[], bridge: Uint8Array | number[]): Array<any>;

/**
 * The proof of extrinsic `index` among `extrinsics`, each SCALE-encoded with its length prefix.
 */
export function extrinsicProof(extrinsics: Array<any>, index: number): ExtrinsicProof;

/**
 * Reads the NEAR heights that the bridge at `bridge` made its head in a serialized Midnight
 * transaction, in the order of its `accept` calls.
 */
export function headLogs(tx: Uint8Array | number[], bridge: Uint8Array | number[]): BigUint64Array;
