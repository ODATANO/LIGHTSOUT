import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Burn = { id: Uint8Array; near_recipient: Uint8Array; value: bigint
                   };

export enum Stale { header = 0, read = 1, block = 2 }

export type Witnesses<PS> = {
  bitsOf(context: __compactRuntime.WitnessContext<Ledger, PS>, x_0: bigint): [PS, boolean[]];
  bitsOfByte(context: __compactRuntime.WitnessContext<Ledger, PS>, x_0: bigint): [PS, boolean[]];
  lowBit(context: __compactRuntime.WitnessContext<Ledger, PS>, x_0: bigint): [PS, [boolean,
                                                                                   bigint]];
  coinSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  readSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  propose(context: __compactRuntime.CircuitContext<PS>,
          lite_0: Uint8Array,
          innerRest_0: Uint8Array,
          previous_0: Uint8Array,
          nextInner_0: Uint8Array,
          target_0: Uint8Array,
          built_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  approve(context: __compactRuntime.CircuitContext<PS>,
          hash_0: Uint8Array,
          index_0: bigint,
          signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
          point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  accept(context: __compactRuntime.CircuitContext<PS>, hash_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  begin(context: __compactRuntime.CircuitContext<PS>, length_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  absorb(context: __compactRuntime.CircuitContext<PS>, block_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  know(context: __compactRuntime.CircuitContext<PS>,
       lite_0: Uint8Array,
       innerRest_0: Uint8Array,
       previous_0: Uint8Array,
       path_0: { hash: Uint8Array, side: bigint }[]): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forget(context: __compactRuntime.CircuitContext<PS>,
         what_0: Stale,
         key_0: Uint8Array,
         read_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  prove_lock(context: __compactRuntime.CircuitContext<PS>,
             block_0: Uint8Array,
             receipt_0: Uint8Array,
             count_0: bigint,
             receipts_0: Uint8Array[],
             gas_0: Uint8Array,
             tokens_0: Uint8Array,
             lock_0: Uint8Array,
             amount_0: Uint8Array,
             recipient_0: Uint8Array,
             eventHash_0: Uint8Array,
             outcomePath_0: { hash: Uint8Array, side: bigint }[],
             shardPath_0: { hash: Uint8Array, side: bigint }[]): Promise<__compactRuntime.CircuitResults<PS, []>>;
  prove_register(context: __compactRuntime.CircuitContext<PS>,
                 block_0: Uint8Array,
                 receipt_0: Uint8Array,
                 count_0: bigint,
                 receipts_0: Uint8Array[],
                 gas_0: Uint8Array,
                 tokens_0: Uint8Array,
                 index_0: Uint8Array,
                 commitment_0: Uint8Array,
                 eventHash_0: Uint8Array,
                 outcomePath_0: { hash: Uint8Array, side: bigint }[],
                 shardPath_0: { hash: Uint8Array, side: bigint }[]): Promise<__compactRuntime.CircuitResults<PS, []>>;
  known_root(context: __compactRuntime.CircuitContext<PS>,
             root_0: { field: bigint }): Promise<__compactRuntime.CircuitResults<PS, []>>;
  mint(context: __compactRuntime.CircuitContext<PS>, lock_id_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  burn(context: __compactRuntime.CircuitContext<PS>,
       coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint },
       near_recipient_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  propose(context: __compactRuntime.CircuitContext<PS>,
          lite_0: Uint8Array,
          innerRest_0: Uint8Array,
          previous_0: Uint8Array,
          nextInner_0: Uint8Array,
          target_0: Uint8Array,
          built_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  approve(context: __compactRuntime.CircuitContext<PS>,
          hash_0: Uint8Array,
          index_0: bigint,
          signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
          point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  accept(context: __compactRuntime.CircuitContext<PS>, hash_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  begin(context: __compactRuntime.CircuitContext<PS>, length_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  absorb(context: __compactRuntime.CircuitContext<PS>, block_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  know(context: __compactRuntime.CircuitContext<PS>,
       lite_0: Uint8Array,
       innerRest_0: Uint8Array,
       previous_0: Uint8Array,
       path_0: { hash: Uint8Array, side: bigint }[]): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forget(context: __compactRuntime.CircuitContext<PS>,
         what_0: Stale,
         key_0: Uint8Array,
         read_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  prove_lock(context: __compactRuntime.CircuitContext<PS>,
             block_0: Uint8Array,
             receipt_0: Uint8Array,
             count_0: bigint,
             receipts_0: Uint8Array[],
             gas_0: Uint8Array,
             tokens_0: Uint8Array,
             lock_0: Uint8Array,
             amount_0: Uint8Array,
             recipient_0: Uint8Array,
             eventHash_0: Uint8Array,
             outcomePath_0: { hash: Uint8Array, side: bigint }[],
             shardPath_0: { hash: Uint8Array, side: bigint }[]): Promise<__compactRuntime.CircuitResults<PS, []>>;
  prove_register(context: __compactRuntime.CircuitContext<PS>,
                 block_0: Uint8Array,
                 receipt_0: Uint8Array,
                 count_0: bigint,
                 receipts_0: Uint8Array[],
                 gas_0: Uint8Array,
                 tokens_0: Uint8Array,
                 index_0: Uint8Array,
                 commitment_0: Uint8Array,
                 eventHash_0: Uint8Array,
                 outcomePath_0: { hash: Uint8Array, side: bigint }[],
                 shardPath_0: { hash: Uint8Array, side: bigint }[]): Promise<__compactRuntime.CircuitResults<PS, []>>;
  known_root(context: __compactRuntime.CircuitContext<PS>,
             root_0: { field: bigint }): Promise<__compactRuntime.CircuitResults<PS, []>>;
  mint(context: __compactRuntime.CircuitContext<PS>, lock_id_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  burn(context: __compactRuntime.CircuitContext<PS>,
       coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint },
       near_recipient_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
  wrappedDomain(): Uint8Array;
  burnId(coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): Uint8Array;
}

export type Circuits<PS> = {
  propose(context: __compactRuntime.CircuitContext<PS>,
          lite_0: Uint8Array,
          innerRest_0: Uint8Array,
          previous_0: Uint8Array,
          nextInner_0: Uint8Array,
          target_0: Uint8Array,
          built_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  approve(context: __compactRuntime.CircuitContext<PS>,
          hash_0: Uint8Array,
          index_0: bigint,
          signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
          point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  accept(context: __compactRuntime.CircuitContext<PS>, hash_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  begin(context: __compactRuntime.CircuitContext<PS>, length_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  absorb(context: __compactRuntime.CircuitContext<PS>, block_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  know(context: __compactRuntime.CircuitContext<PS>,
       lite_0: Uint8Array,
       innerRest_0: Uint8Array,
       previous_0: Uint8Array,
       path_0: { hash: Uint8Array, side: bigint }[]): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forget(context: __compactRuntime.CircuitContext<PS>,
         what_0: Stale,
         key_0: Uint8Array,
         read_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  prove_lock(context: __compactRuntime.CircuitContext<PS>,
             block_0: Uint8Array,
             receipt_0: Uint8Array,
             count_0: bigint,
             receipts_0: Uint8Array[],
             gas_0: Uint8Array,
             tokens_0: Uint8Array,
             lock_0: Uint8Array,
             amount_0: Uint8Array,
             recipient_0: Uint8Array,
             eventHash_0: Uint8Array,
             outcomePath_0: { hash: Uint8Array, side: bigint }[],
             shardPath_0: { hash: Uint8Array, side: bigint }[]): Promise<__compactRuntime.CircuitResults<PS, []>>;
  prove_register(context: __compactRuntime.CircuitContext<PS>,
                 block_0: Uint8Array,
                 receipt_0: Uint8Array,
                 count_0: bigint,
                 receipts_0: Uint8Array[],
                 gas_0: Uint8Array,
                 tokens_0: Uint8Array,
                 index_0: Uint8Array,
                 commitment_0: Uint8Array,
                 eventHash_0: Uint8Array,
                 outcomePath_0: { hash: Uint8Array, side: bigint }[],
                 shardPath_0: { hash: Uint8Array, side: bigint }[]): Promise<__compactRuntime.CircuitResults<PS, []>>;
  known_root(context: __compactRuntime.CircuitContext<PS>,
             root_0: { field: bigint }): Promise<__compactRuntime.CircuitResults<PS, []>>;
  wrappedDomain(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  mint(context: __compactRuntime.CircuitContext<PS>, lock_id_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  burnId(context: __compactRuntime.CircuitContext<PS>,
         coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint }): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  burn(context: __compactRuntime.CircuitContext<PS>,
       coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint },
       near_recipient_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  minted_locks: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: bigint): boolean;
    [Symbol.iterator](): Iterator<bigint>
  };
  burns: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Burn;
    [Symbol.iterator](): Iterator<[bigint, Burn]>
  };
  readonly bridge: Uint8Array;
  readonly tip: { head: { height: bigint,
                          epoch: Uint8Array,
                          nextEpoch: Uint8Array,
                          nextProducers: Uint8Array,
                          blockRoot: Uint8Array
                        },
                  era: bigint,
                  total: bigint,
                  nextTotal: bigint,
                  list: bigint,
                  nextList: bigint
                };
  producers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): {
      isEmpty(): boolean;
      size(): bigint;
      member(key_1: bigint): boolean;
      lookup(key_1: bigint): { keyLow: bigint, keyHigh: bigint, stake: bigint };
      [Symbol.iterator](): Iterator<[bigint, { keyLow: bigint, keyHigh: bigint, stake: bigint }]>
    }
  };
  candidates: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { head: { height: bigint,
                                         epoch: Uint8Array,
                                         nextEpoch: Uint8Array,
                                         nextProducers: Uint8Array,
                                         blockRoot: Uint8Array
                                       },
                                 message: Uint8Array,
                                 era: bigint,
                                 stake: bigint,
                                 built: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { head: { height: bigint,
          epoch: Uint8Array,
          nextEpoch: Uint8Array,
          nextProducers: Uint8Array,
          blockRoot: Uint8Array
        },
  message: Uint8Array,
  era: bigint,
  stake: bigint,
  built: bigint
}]>
  };
  signed: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): {
      isEmpty(): boolean;
      size(): bigint;
      member(elem_0: bigint): boolean;
      [Symbol.iterator](): Iterator<bigint>
    }
  };
  readers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): { sha: bigint[],
                             parse: { phase: bigint,
                                      rem: bigint,
                                      scale: bigint,
                                      count: bigint,
                                      len: bigint,
                                      keyLow: bigint,
                                      keyHigh: bigint,
                                      stake: bigint,
                                      index: bigint,
                                      total: bigint,
                                      left: bigint,
                                      ended: bigint,
                                      emitted: bigint,
                                      outLow: bigint,
                                      outHigh: bigint,
                                      outStake: bigint
                                    },
                             bitLength: bigint,
                             expected: Uint8Array,
                             filling: bigint,
                             active: boolean
                           };
    [Symbol.iterator](): Iterator<[bigint, { sha: bigint[],
  parse: { phase: bigint,
           rem: bigint,
           scale: bigint,
           count: bigint,
           len: bigint,
           keyLow: bigint,
           keyHigh: bigint,
           stake: bigint,
           index: bigint,
           total: bigint,
           left: bigint,
           ended: bigint,
           emitted: bigint,
           outLow: bigint,
           outHigh: bigint,
           outStake: bigint
         },
  bitLength: bigint,
  expected: Uint8Array,
  filling: bigint,
  active: boolean
}]>
  };
  blocks: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { outcomes: Uint8Array, at: bigint };
    [Symbol.iterator](): Iterator<[Uint8Array, { outcomes: Uint8Array, at: bigint }]>
  };
  locks: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): { amount: bigint, recipient: Uint8Array };
    [Symbol.iterator](): Iterator<[bigint, { amount: bigint, recipient: Uint8Array }]>
  };
  members: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  joined: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: bigint): boolean;
    [Symbol.iterator](): Iterator<bigint>
  };
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               height_0: bigint,
               epoch_0: Uint8Array,
               nextEpoch_0: Uint8Array,
               nextProducers_0: Uint8Array,
               blockRoot_0: Uint8Array,
               account_0: Uint8Array): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
export declare const circuitSignatures: __compactRuntime.CircuitSignatures;
export declare const declaredInterfaces: __compactRuntime.DeclaredInterfaces;
