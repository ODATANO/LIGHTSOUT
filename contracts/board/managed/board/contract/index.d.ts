import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  bitsOf(context: __compactRuntime.WitnessContext<Ledger, PS>, x_0: bigint): [PS, boolean[]];
  memberSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  memberPath(context: __compactRuntime.WitnessContext<Ledger, PS>,
             leaf_0: Uint8Array): [PS, { leaf: Uint8Array,
                                         path: { sibling: { field: bigint },
                                                 goes_left: boolean
                                               }[]
                                       }];
  memberSlot(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  contentKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  contentBlock(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  sealState(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint[]];
  sealBlind(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  sealNextBlind(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  handoverNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  coinSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  bitsOfByte(context: __compactRuntime.WitnessContext<Ledger, PS>, x_0: bigint): [PS, boolean[]];
  lowBit(context: __compactRuntime.WitnessContext<Ledger, PS>, x_0: bigint): [PS, [boolean,
                                                                                   bigint]];
}

export type ImpureCircuits<PS> = {
  forget_marks(context: __compactRuntime.CircuitContext<PS>, epoch_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  seal_begin(context: __compactRuntime.CircuitContext<PS>,
             id_0: Uint8Array,
             key_hash_0: Uint8Array,
             content_hash_0: Uint8Array,
             length_0: bigint,
             payout_0: Uint8Array,
             epoch_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  seal_block(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  seal_finish(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forget_drop(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  post_bounty(context: __compactRuntime.CircuitContext<PS>,
              request_hash_0: Uint8Array,
              model_0: Uint8Array,
              model_length_0: bigint,
              keys_0: Uint8Array[],
              text_0: Uint8Array,
              text_length_0: bigint,
              coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint },
              buyer_0: __compactRuntime.JubjubPoint,
              refund_to_0: Uint8Array,
              deadline_0: bigint,
              epoch_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  answer_16(context: __compactRuntime.CircuitContext<PS>,
            bounty_0: Uint8Array,
            drop_0: Uint8Array,
            signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
            point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  answer_24(context: __compactRuntime.CircuitContext<PS>,
            bounty_0: Uint8Array,
            drop_0: Uint8Array,
            signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
            point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  answer_36(context: __compactRuntime.CircuitContext<PS>,
            bounty_0: Uint8Array,
            drop_0: Uint8Array,
            signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
            point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  refund_bounty(context: __compactRuntime.CircuitContext<PS>,
                bounty_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forget_bounty(context: __compactRuntime.CircuitContext<PS>,
                bounty_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  forget_marks(context: __compactRuntime.CircuitContext<PS>, epoch_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  seal_begin(context: __compactRuntime.CircuitContext<PS>,
             id_0: Uint8Array,
             key_hash_0: Uint8Array,
             content_hash_0: Uint8Array,
             length_0: bigint,
             payout_0: Uint8Array,
             epoch_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  seal_block(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  seal_finish(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forget_drop(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  post_bounty(context: __compactRuntime.CircuitContext<PS>,
              request_hash_0: Uint8Array,
              model_0: Uint8Array,
              model_length_0: bigint,
              keys_0: Uint8Array[],
              text_0: Uint8Array,
              text_length_0: bigint,
              coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint },
              buyer_0: __compactRuntime.JubjubPoint,
              refund_to_0: Uint8Array,
              deadline_0: bigint,
              epoch_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  answer_16(context: __compactRuntime.CircuitContext<PS>,
            bounty_0: Uint8Array,
            drop_0: Uint8Array,
            signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
            point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  answer_24(context: __compactRuntime.CircuitContext<PS>,
            bounty_0: Uint8Array,
            drop_0: Uint8Array,
            signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
            point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  answer_36(context: __compactRuntime.CircuitContext<PS>,
            bounty_0: Uint8Array,
            drop_0: Uint8Array,
            signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
            point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  refund_bounty(context: __compactRuntime.CircuitContext<PS>,
                bounty_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forget_bounty(context: __compactRuntime.CircuitContext<PS>,
                bounty_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
  bountyId(terms_0: { request_hash: Uint8Array,
                      model: Uint8Array,
                      model_length: bigint,
                      keys: Uint8Array[],
                      buyer: __compactRuntime.JubjubPoint,
                      refund_to: Uint8Array,
                      deadline: bigint
                    },
           reward_0: bigint): Uint8Array;
}

export type Circuits<PS> = {
  forget_marks(context: __compactRuntime.CircuitContext<PS>, epoch_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  seal_begin(context: __compactRuntime.CircuitContext<PS>,
             id_0: Uint8Array,
             key_hash_0: Uint8Array,
             content_hash_0: Uint8Array,
             length_0: bigint,
             payout_0: Uint8Array,
             epoch_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  seal_block(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  seal_finish(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forget_drop(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  bountyId(context: __compactRuntime.CircuitContext<PS>,
           terms_0: { request_hash: Uint8Array,
                      model: Uint8Array,
                      model_length: bigint,
                      keys: Uint8Array[],
                      buyer: __compactRuntime.JubjubPoint,
                      refund_to: Uint8Array,
                      deadline: bigint
                    },
           reward_0: bigint): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  post_bounty(context: __compactRuntime.CircuitContext<PS>,
              request_hash_0: Uint8Array,
              model_0: Uint8Array,
              model_length_0: bigint,
              keys_0: Uint8Array[],
              text_0: Uint8Array,
              text_length_0: bigint,
              coin_0: { nonce: Uint8Array, color: Uint8Array, value: bigint },
              buyer_0: __compactRuntime.JubjubPoint,
              refund_to_0: Uint8Array,
              deadline_0: bigint,
              epoch_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  answer_16(context: __compactRuntime.CircuitContext<PS>,
            bounty_0: Uint8Array,
            drop_0: Uint8Array,
            signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
            point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  answer_24(context: __compactRuntime.CircuitContext<PS>,
            bounty_0: Uint8Array,
            drop_0: Uint8Array,
            signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
            point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  answer_36(context: __compactRuntime.CircuitContext<PS>,
            bounty_0: Uint8Array,
            drop_0: Uint8Array,
            signature_0: { r: __compactRuntime.Curve25519Point, s: bigint },
            point_0: __compactRuntime.Curve25519Point): Promise<__compactRuntime.CircuitResults<PS, []>>;
  refund_bounty(context: __compactRuntime.CircuitContext<PS>,
                bounty_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forget_bounty(context: __compactRuntime.CircuitContext<PS>,
                bounty_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  readonly bridge: { bytes: Uint8Array };
  readonly token: Uint8Array;
  drops: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { key_hash: Uint8Array,
                                 content_hash: Uint8Array,
                                 length: bigint,
                                 payout: Uint8Array,
                                 day: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { key_hash: Uint8Array,
  content_hash: Uint8Array,
  length: bigint,
  payout: Uint8Array,
  day: bigint
}]>
  };
  seals: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { remaining: bigint,
                                 ended: boolean,
                                 blocks: bigint,
                                 chain: bigint,
                                 done: boolean
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { remaining: bigint,
  ended: boolean,
  blocks: bigint,
  chain: bigint,
  done: boolean
}]>
  };
  cipher: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): {
      isEmpty(): boolean;
      size(): bigint;
      member(key_1: bigint): boolean;
      lookup(key_1: bigint): bigint[];
      [Symbol.iterator](): Iterator<[bigint, bigint[]]>
    }
  };
  marks: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): {
      isEmpty(): boolean;
      size(): bigint;
      member(elem_0: Uint8Array): boolean;
      [Symbol.iterator](): Iterator<Uint8Array>
    }
  };
  bounties: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { request_hash: Uint8Array,
                                 model: Uint8Array,
                                 model_length: bigint,
                                 keys: Uint8Array[],
                                 buyer: __compactRuntime.JubjubPoint,
                                 refund_to: Uint8Array,
                                 deadline: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { request_hash: Uint8Array,
  model: Uint8Array,
  model_length: bigint,
  keys: Uint8Array[],
  buyer: __compactRuntime.JubjubPoint,
  refund_to: Uint8Array,
  deadline: bigint
}]>
  };
  requests: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { text: Uint8Array, length: bigint };
    [Symbol.iterator](): Iterator<[Uint8Array, { text: Uint8Array, length: bigint }]>
  };
  rewards: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { nonce: Uint8Array,
                                 color: Uint8Array,
                                 value: bigint,
                                 mt_index: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { nonce: Uint8Array, color: Uint8Array, value: bigint, mt_index: bigint }]>
  };
  answers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { drop: Uint8Array,
                                 handover: { point: __compactRuntime.JubjubPoint,
                                             masked: bigint
                                           }
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { drop: Uint8Array,
  handover: { point: __compactRuntime.JubjubPoint, masked: bigint }
}]>
  };
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               bridge_address_0: { bytes: Uint8Array },
               color_0: Uint8Array): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
export declare const circuitSignatures: __compactRuntime.CircuitSignatures;
export declare const declaredInterfaces: __compactRuntime.DeclaredInterfaces;
