import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.21.0');

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _QualifiedShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment())));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_0.fromValue(value_0),
      color: _descriptor_0.fromValue(value_0),
      value: _descriptor_1.fromValue(value_0),
      mt_index: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.nonce).concat(_descriptor_0.toValue(value_0.color).concat(_descriptor_1.toValue(value_0.value).concat(_descriptor_2.toValue(value_0.mt_index))));
  }
}

const _descriptor_3 = new _QualifiedShieldedCoinInfo_0();

const _descriptor_4 = __compactRuntime.CompactTypeBoolean;

const _descriptor_5 = new __compactRuntime.CompactTypeBytes(48);

const _descriptor_6 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_7 = new __compactRuntime.CompactTypeVector(4, _descriptor_0);

const _descriptor_8 = __compactRuntime.CompactTypeJubjubPoint;

class _Bounty_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_5.alignment().concat(_descriptor_6.alignment().concat(_descriptor_7.alignment().concat(_descriptor_8.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment()))))));
  }
  fromValue(value_0) {
    return {
      request_hash: _descriptor_0.fromValue(value_0),
      model: _descriptor_5.fromValue(value_0),
      model_length: _descriptor_6.fromValue(value_0),
      keys: _descriptor_7.fromValue(value_0),
      buyer: _descriptor_8.fromValue(value_0),
      refund_to: _descriptor_0.fromValue(value_0),
      deadline: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.request_hash).concat(_descriptor_5.toValue(value_0.model).concat(_descriptor_6.toValue(value_0.model_length).concat(_descriptor_7.toValue(value_0.keys).concat(_descriptor_8.toValue(value_0.buyer).concat(_descriptor_0.toValue(value_0.refund_to).concat(_descriptor_2.toValue(value_0.deadline)))))));
  }
}

const _descriptor_9 = new _Bounty_0();

const _descriptor_10 = new __compactRuntime.CompactTypeBytes(512);

const _descriptor_11 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

class _Request_0 {
  alignment() {
    return _descriptor_10.alignment().concat(_descriptor_11.alignment());
  }
  fromValue(value_0) {
    return {
      text: _descriptor_10.fromValue(value_0),
      length: _descriptor_11.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_10.toValue(value_0.text).concat(_descriptor_11.toValue(value_0.length));
  }
}

const _descriptor_12 = new _Request_0();

const _descriptor_13 = __compactRuntime.CompactTypeField;

class _Handover_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_13.alignment());
  }
  fromValue(value_0) {
    return {
      point: _descriptor_8.fromValue(value_0),
      masked: _descriptor_13.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.point).concat(_descriptor_13.toValue(value_0.masked));
  }
}

const _descriptor_14 = new _Handover_0();

class _Answer_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_14.alignment());
  }
  fromValue(value_0) {
    return {
      drop: _descriptor_0.fromValue(value_0),
      handover: _descriptor_14.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.drop).concat(_descriptor_14.toValue(value_0.handover));
  }
}

const _descriptor_15 = new _Answer_0();

const _descriptor_16 = __compactRuntime.CompactTypeCurve25519Point;

const _descriptor_17 = __compactRuntime.CompactTypeCurve25519Scalar;

class _Ed25519Signature_0 {
  alignment() {
    return _descriptor_16.alignment().concat(_descriptor_17.alignment());
  }
  fromValue(value_0) {
    return {
      r: _descriptor_16.fromValue(value_0),
      s: _descriptor_17.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_16.toValue(value_0.r).concat(_descriptor_17.toValue(value_0.s));
  }
}

const _descriptor_18 = new _Ed25519Signature_0();

const _descriptor_19 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

class _Seal_0 {
  alignment() {
    return _descriptor_19.alignment().concat(_descriptor_4.alignment().concat(_descriptor_19.alignment().concat(_descriptor_13.alignment().concat(_descriptor_4.alignment()))));
  }
  fromValue(value_0) {
    return {
      remaining: _descriptor_19.fromValue(value_0),
      ended: _descriptor_4.fromValue(value_0),
      blocks: _descriptor_19.fromValue(value_0),
      chain: _descriptor_13.fromValue(value_0),
      done: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_19.toValue(value_0.remaining).concat(_descriptor_4.toValue(value_0.ended).concat(_descriptor_19.toValue(value_0.blocks).concat(_descriptor_13.toValue(value_0.chain).concat(_descriptor_4.toValue(value_0.done)))));
  }
}

const _descriptor_20 = new _Seal_0();

class _Drop_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_19.alignment().concat(_descriptor_0.alignment().concat(_descriptor_19.alignment()))));
  }
  fromValue(value_0) {
    return {
      key_hash: _descriptor_0.fromValue(value_0),
      content_hash: _descriptor_0.fromValue(value_0),
      length: _descriptor_19.fromValue(value_0),
      payout: _descriptor_0.fromValue(value_0),
      day: _descriptor_19.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.key_hash).concat(_descriptor_0.toValue(value_0.content_hash).concat(_descriptor_19.toValue(value_0.length).concat(_descriptor_0.toValue(value_0.payout).concat(_descriptor_19.toValue(value_0.day)))));
  }
}

const _descriptor_21 = new _Drop_0();

const _descriptor_22 = new __compactRuntime.CompactTypeVector(36, _descriptor_6);

const _descriptor_23 = new __compactRuntime.CompactTypeBytes(166);

const _descriptor_24 = new __compactRuntime.CompactTypeVector(16, _descriptor_6);

const _descriptor_25 = new __compactRuntime.CompactTypeBytes(146);

const _descriptor_26 = new __compactRuntime.CompactTypeVector(24, _descriptor_6);

const _descriptor_27 = new __compactRuntime.CompactTypeBytes(154);

const _descriptor_28 = new __compactRuntime.CompactTypeVector(8, _descriptor_6);

const _descriptor_29 = new __compactRuntime.CompactTypeVector(64, _descriptor_6);

class _tuple_0 {
  alignment() {
    return _descriptor_13.alignment().concat(_descriptor_13.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_13.fromValue(value_0),
      _descriptor_13.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_13.toValue(value_0[0]).concat(_descriptor_13.toValue(value_0[1]));
  }
}

const _descriptor_30 = new _tuple_0();

const _descriptor_31 = new __compactRuntime.CompactTypeVector(4, _descriptor_4);

const _descriptor_32 = new __compactRuntime.CompactTypeVector(32, _descriptor_6);

class _ShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_0.fromValue(value_0),
      color: _descriptor_0.fromValue(value_0),
      value: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.nonce).concat(_descriptor_0.toValue(value_0.color).concat(_descriptor_1.toValue(value_0.value)));
  }
}

const _descriptor_33 = new _ShieldedCoinInfo_0();

class _ZswapCoinPublicKey_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_34 = new _ZswapCoinPublicKey_0();

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_35 = new _ContractAddress_0();

class _Either_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_34.alignment().concat(_descriptor_35.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_4.fromValue(value_0),
      left: _descriptor_34.fromValue(value_0),
      right: _descriptor_35.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_left).concat(_descriptor_34.toValue(value_0.left).concat(_descriptor_35.toValue(value_0.right)));
  }
}

const _descriptor_36 = new _Either_0();

const _descriptor_37 = new __compactRuntime.CompactTypeVector(3, _descriptor_13);

class _Pad_0 {
  alignment() {
    return _descriptor_13.alignment().concat(_descriptor_13.alignment());
  }
  fromValue(value_0) {
    return {
      left: _descriptor_13.fromValue(value_0),
      ended: _descriptor_13.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_13.toValue(value_0.left).concat(_descriptor_13.toValue(value_0.ended));
  }
}

const _descriptor_38 = new _Pad_0();

const _descriptor_39 = new __compactRuntime.CompactTypeVector(8, _descriptor_13);

class _tuple_1 {
  alignment() {
    return _descriptor_39.alignment().concat(_descriptor_13.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_39.fromValue(value_0),
      _descriptor_13.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_39.toValue(value_0[0]).concat(_descriptor_13.toValue(value_0[1]));
  }
}

const _descriptor_40 = new _tuple_1();

const _descriptor_41 = new __compactRuntime.CompactTypeVector(16, _descriptor_13);

const _descriptor_42 = new __compactRuntime.CompactTypeVector(4, _descriptor_13);

const _descriptor_43 = new __compactRuntime.CompactTypeUnsignedInteger(127n, 1);

class _tuple_2 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_43.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_4.fromValue(value_0),
      _descriptor_43.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0[0]).concat(_descriptor_43.toValue(value_0[1]));
  }
}

const _descriptor_44 = new _tuple_2();

const _descriptor_45 = new __compactRuntime.CompactTypeVector(8, _descriptor_4);

const _descriptor_46 = __compactRuntime.CompactTypeJubjubScalar;

const _descriptor_47 = new __compactRuntime.CompactTypeVector(8, _descriptor_19);

const _descriptor_48 = new __compactRuntime.CompactTypeBytes(64);

class _MerkleTreeDigest_0 {
  alignment() {
    return _descriptor_13.alignment();
  }
  fromValue(value_0) {
    return {
      field: _descriptor_13.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_13.toValue(value_0.field);
  }
}

const _descriptor_49 = new _MerkleTreeDigest_0();

class _MerkleTreePathEntry_0 {
  alignment() {
    return _descriptor_49.alignment().concat(_descriptor_4.alignment());
  }
  fromValue(value_0) {
    return {
      sibling: _descriptor_49.fromValue(value_0),
      goes_left: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_49.toValue(value_0.sibling).concat(_descriptor_4.toValue(value_0.goes_left));
  }
}

const _descriptor_50 = new _MerkleTreePathEntry_0();

const _descriptor_51 = new __compactRuntime.CompactTypeVector(16, _descriptor_50);

class _MerkleTreePath_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_51.alignment());
  }
  fromValue(value_0) {
    return {
      leaf: _descriptor_0.fromValue(value_0),
      path: _descriptor_51.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.leaf).concat(_descriptor_51.toValue(value_0.path));
  }
}

const _descriptor_52 = new _MerkleTreePath_0();

const _descriptor_53 = new __compactRuntime.CompactTypeVector(4, _descriptor_6);

const _descriptor_54 = new __compactRuntime.CompactTypeVector(32, _descriptor_4);

const _descriptor_55 = new __compactRuntime.CompactTypeVector(32, _descriptor_13);

class _Word_0 {
  alignment() {
    return _descriptor_54.alignment().concat(_descriptor_55.alignment().concat(_descriptor_13.alignment()));
  }
  fromValue(value_0) {
    return {
      bits: _descriptor_54.fromValue(value_0),
      signs: _descriptor_55.fromValue(value_0),
      val: _descriptor_13.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_54.toValue(value_0.bits).concat(_descriptor_55.toValue(value_0.signs).concat(_descriptor_13.toValue(value_0.val)));
  }
}

const _descriptor_56 = new _Word_0();

const _descriptor_57 = new __compactRuntime.CompactTypeVector(8, _descriptor_56);

const _descriptor_58 = new __compactRuntime.CompactTypeVector(16, _descriptor_56);

const _descriptor_59 = new __compactRuntime.CompactTypeVector(35, _descriptor_4);

const _descriptor_60 = __compactRuntime.CompactTypeCurve25519Base;

class _tuple_3 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_27.alignment()));
  }
  fromValue(value_0) {
    return [
      _descriptor_0.fromValue(value_0),
      _descriptor_0.fromValue(value_0),
      _descriptor_27.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0[0]).concat(_descriptor_0.toValue(value_0[1]).concat(_descriptor_27.toValue(value_0[2])));
  }
}

const _descriptor_61 = new _tuple_3();

class _tuple_4 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_23.alignment()));
  }
  fromValue(value_0) {
    return [
      _descriptor_0.fromValue(value_0),
      _descriptor_0.fromValue(value_0),
      _descriptor_23.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0[0]).concat(_descriptor_0.toValue(value_0[1]).concat(_descriptor_23.toValue(value_0[2])));
  }
}

const _descriptor_62 = new _tuple_4();

class _tuple_5 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_25.alignment()));
  }
  fromValue(value_0) {
    return [
      _descriptor_0.fromValue(value_0),
      _descriptor_0.fromValue(value_0),
      _descriptor_25.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0[0]).concat(_descriptor_0.toValue(value_0[1]).concat(_descriptor_25.toValue(value_0[2])));
  }
}

const _descriptor_63 = new _tuple_5();

const _descriptor_64 = new __compactRuntime.CompactTypeBytes(21);

class _CoinPreimage_0 {
  alignment() {
    return _descriptor_64.alignment().concat(_descriptor_33.alignment().concat(_descriptor_4.alignment().concat(_descriptor_0.alignment())));
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_64.fromValue(value_0),
      info: _descriptor_33.fromValue(value_0),
      dataType: _descriptor_4.fromValue(value_0),
      data: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_64.toValue(value_0.domain_sep).concat(_descriptor_33.toValue(value_0.info).concat(_descriptor_4.toValue(value_0.dataType).concat(_descriptor_0.toValue(value_0.data))));
  }
}

const _descriptor_65 = new _CoinPreimage_0();

const _descriptor_66 = new __compactRuntime.CompactTypeBytes(53);

const _descriptor_67 = new __compactRuntime.CompactTypeBytes(128);

const _descriptor_68 = new __compactRuntime.CompactTypeBytes(6);

class _LeafPreimage_0 {
  alignment() {
    return _descriptor_68.alignment().concat(_descriptor_0.alignment());
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_68.fromValue(value_0),
      data: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_68.toValue(value_0.domain_sep).concat(_descriptor_0.toValue(value_0.data));
  }
}

const _descriptor_69 = new _LeafPreimage_0();

class _Posted_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_9.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      tag: _descriptor_0.fromValue(value_0),
      terms: _descriptor_9.fromValue(value_0),
      reward: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.tag).concat(_descriptor_9.toValue(value_0.terms).concat(_descriptor_1.toValue(value_0.reward)));
  }
}

const _descriptor_70 = new _Posted_0();

class _Maybe_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_33.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_4.fromValue(value_0),
      value: _descriptor_33.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_some).concat(_descriptor_33.toValue(value_0.value));
  }
}

const _descriptor_71 = new _Maybe_0();

class _ShieldedSendResult_0 {
  alignment() {
    return _descriptor_71.alignment().concat(_descriptor_33.alignment());
  }
  fromValue(value_0) {
    return {
      change: _descriptor_71.fromValue(value_0),
      sent: _descriptor_33.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_71.toValue(value_0.change).concat(_descriptor_33.toValue(value_0.sent));
  }
}

const _descriptor_72 = new _ShieldedSendResult_0();

class _Either_1 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_4.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_73 = new _Either_1();

class _UserAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_74 = new _UserAddress_0();

class _Either_2 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_35.alignment().concat(_descriptor_74.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_4.fromValue(value_0),
      left: _descriptor_35.fromValue(value_0),
      right: _descriptor_74.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_left).concat(_descriptor_35.toValue(value_0.left).concat(_descriptor_74.toValue(value_0.right)));
  }
}

const _descriptor_75 = new _Either_2();

class _Maybe_1 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_75.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_4.fromValue(value_0),
      value: _descriptor_75.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_some).concat(_descriptor_75.toValue(value_0.value));
  }
}

const _descriptor_76 = new _Maybe_1();

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.bitsOf) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named bitsOf');
    }
    if (typeof(witnesses_0.memberSecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named memberSecret');
    }
    if (typeof(witnesses_0.memberPath) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named memberPath');
    }
    if (typeof(witnesses_0.memberSlot) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named memberSlot');
    }
    if (typeof(witnesses_0.contentKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named contentKey');
    }
    if (typeof(witnesses_0.contentBlock) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named contentBlock');
    }
    if (typeof(witnesses_0.sealState) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named sealState');
    }
    if (typeof(witnesses_0.sealBlind) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named sealBlind');
    }
    if (typeof(witnesses_0.sealNextBlind) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named sealNextBlind');
    }
    if (typeof(witnesses_0.handoverNonce) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named handoverNonce');
    }
    if (typeof(witnesses_0.coinSecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named coinSecretKey');
    }
    if (typeof(witnesses_0.bitsOfByte) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named bitsOfByte');
    }
    if (typeof(witnesses_0.lowBit) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named lowBit');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      forget_marks: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`forget_marks: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const epoch_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('forget_marks',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 112 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(epoch_0) === 'bigint' && epoch_0 >= 0n && epoch_0 <= 4294967295n)) {
          __compactRuntime.typeError('forget_marks',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 112 char 1',
                                     'Uint<0..4294967296>',
                                     epoch_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_19.toValue(epoch_0),
            alignment: _descriptor_19.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._forget_marks_0(context,
                                                    partialProofData,
                                                    epoch_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      seal_begin: async (...args_1) => {
        if (args_1.length !== 7) {
          throw new __compactRuntime.CompactError(`seal_begin: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        const key_hash_0 = args_1[2];
        const content_hash_0 = args_1[3];
        const length_0 = args_1[4];
        const payout_0 = args_1[5];
        const epoch_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('seal_begin',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 164 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('seal_begin',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 164 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        if (!(key_hash_0.buffer instanceof ArrayBuffer && key_hash_0.BYTES_PER_ELEMENT === 1 && key_hash_0.length === 32)) {
          __compactRuntime.typeError('seal_begin',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'board.compact line 164 char 1',
                                     'Bytes<32>',
                                     key_hash_0)
        }
        if (!(content_hash_0.buffer instanceof ArrayBuffer && content_hash_0.BYTES_PER_ELEMENT === 1 && content_hash_0.length === 32)) {
          __compactRuntime.typeError('seal_begin',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'board.compact line 164 char 1',
                                     'Bytes<32>',
                                     content_hash_0)
        }
        if (!(typeof(length_0) === 'bigint' && length_0 >= 0n && length_0 <= 4294967295n)) {
          __compactRuntime.typeError('seal_begin',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'board.compact line 164 char 1',
                                     'Uint<0..4294967296>',
                                     length_0)
        }
        if (!(payout_0.buffer instanceof ArrayBuffer && payout_0.BYTES_PER_ELEMENT === 1 && payout_0.length === 32)) {
          __compactRuntime.typeError('seal_begin',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'board.compact line 164 char 1',
                                     'Bytes<32>',
                                     payout_0)
        }
        if (!(typeof(epoch_0) === 'bigint' && epoch_0 >= 0n && epoch_0 <= 4294967295n)) {
          __compactRuntime.typeError('seal_begin',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'board.compact line 164 char 1',
                                     'Uint<0..4294967296>',
                                     epoch_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0).concat(_descriptor_0.toValue(key_hash_0).concat(_descriptor_0.toValue(content_hash_0).concat(_descriptor_19.toValue(length_0).concat(_descriptor_0.toValue(payout_0).concat(_descriptor_19.toValue(epoch_0)))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_19.alignment().concat(_descriptor_0.alignment().concat(_descriptor_19.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._seal_begin_0(context,
                                                  partialProofData,
                                                  id_0,
                                                  key_hash_0,
                                                  content_hash_0,
                                                  length_0,
                                                  payout_0,
                                                  epoch_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      seal_block: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`seal_block: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('seal_block',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 175 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('seal_block',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 175 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._seal_block_0(context,
                                                  partialProofData,
                                                  id_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      seal_finish: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`seal_finish: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('seal_finish',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 202 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('seal_finish',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 202 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._seal_finish_0(context,
                                                   partialProofData,
                                                   id_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      forget_drop: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`forget_drop: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const id_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('forget_drop',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 240 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
          __compactRuntime.typeError('forget_drop',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 240 char 1',
                                     'Bytes<32>',
                                     id_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(id_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._forget_drop_0(context,
                                                   partialProofData,
                                                   id_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      async bountyId(context, ...args_1) {
        return { result: pureCircuits.bountyId(...args_1), context };
      },
      post_bounty: async (...args_1) => {
        if (args_1.length !== 12) {
          throw new __compactRuntime.CompactError(`post_bounty: expected 12 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const request_hash_0 = args_1[1];
        const model_0 = args_1[2];
        const model_length_0 = args_1[3];
        const keys_0 = args_1[4];
        const text_0 = args_1[5];
        const text_length_0 = args_1[6];
        const coin_0 = args_1[7];
        const buyer_0 = args_1[8];
        const refund_to_0 = args_1[9];
        const deadline_0 = args_1[10];
        const epoch_0 = args_1[11];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(request_hash_0.buffer instanceof ArrayBuffer && request_hash_0.BYTES_PER_ELEMENT === 1 && request_hash_0.length === 32)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'Bytes<32>',
                                     request_hash_0)
        }
        if (!(model_0.buffer instanceof ArrayBuffer && model_0.BYTES_PER_ELEMENT === 1 && model_0.length === 48)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'Bytes<48>',
                                     model_0)
        }
        if (!(typeof(model_length_0) === 'bigint' && model_length_0 >= 0n && model_length_0 <= 255n)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'Uint<0..256>',
                                     model_length_0)
        }
        if (!(Array.isArray(keys_0) && keys_0.length === 4 && keys_0.every((t) => t.buffer instanceof ArrayBuffer && t.BYTES_PER_ELEMENT === 1 && t.length === 32))) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'Vector<4, Bytes<32>>',
                                     keys_0)
        }
        if (!(text_0.buffer instanceof ArrayBuffer && text_0.BYTES_PER_ELEMENT === 1 && text_0.length === 512)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'Bytes<512>',
                                     text_0)
        }
        if (!(typeof(text_length_0) === 'bigint' && text_length_0 >= 0n && text_length_0 <= 65535n)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'Uint<0..65536>',
                                     text_length_0)
        }
        if (!(typeof(coin_0) === 'object' && coin_0.nonce.buffer instanceof ArrayBuffer && coin_0.nonce.BYTES_PER_ELEMENT === 1 && coin_0.nonce.length === 32 && coin_0.color.buffer instanceof ArrayBuffer && coin_0.color.BYTES_PER_ELEMENT === 1 && coin_0.color.length === 32 && typeof(coin_0.value) === 'bigint' && coin_0.value >= 0n && coin_0.value <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                     coin_0)
        }
        if (!(typeof(buyer_0.x) === 'bigint' && buyer_0.x >= 0n && buyer_0.x <= __compactRuntime.MAX_FIELD && typeof(buyer_0.y) === 'bigint' && buyer_0.y >= 0n && buyer_0.y <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 8 (argument 9 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'JubjubPoint',
                                     buyer_0)
        }
        if (!(refund_to_0.buffer instanceof ArrayBuffer && refund_to_0.BYTES_PER_ELEMENT === 1 && refund_to_0.length === 32)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 9 (argument 10 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'Bytes<32>',
                                     refund_to_0)
        }
        if (!(typeof(deadline_0) === 'bigint' && deadline_0 >= 0n && deadline_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 10 (argument 11 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'Uint<0..18446744073709551616>',
                                     deadline_0)
        }
        if (!(typeof(epoch_0) === 'bigint' && epoch_0 >= 0n && epoch_0 <= 4294967295n)) {
          __compactRuntime.typeError('post_bounty',
                                     'argument 11 (argument 12 as invoked from Typescript)',
                                     'board.compact line 259 char 1',
                                     'Uint<0..4294967296>',
                                     epoch_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(request_hash_0).concat(_descriptor_5.toValue(model_0).concat(_descriptor_6.toValue(model_length_0).concat(_descriptor_7.toValue(keys_0).concat(_descriptor_10.toValue(text_0).concat(_descriptor_11.toValue(text_length_0).concat(_descriptor_33.toValue(coin_0).concat(_descriptor_8.toValue(buyer_0).concat(_descriptor_0.toValue(refund_to_0).concat(_descriptor_2.toValue(deadline_0).concat(_descriptor_19.toValue(epoch_0))))))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_5.alignment().concat(_descriptor_6.alignment().concat(_descriptor_7.alignment().concat(_descriptor_10.alignment().concat(_descriptor_11.alignment().concat(_descriptor_33.alignment().concat(_descriptor_8.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_19.alignment()))))))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._post_bounty_0(context,
                                                   partialProofData,
                                                   request_hash_0,
                                                   model_0,
                                                   model_length_0,
                                                   keys_0,
                                                   text_0,
                                                   text_length_0,
                                                   coin_0,
                                                   buyer_0,
                                                   refund_to_0,
                                                   deadline_0,
                                                   epoch_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      answer_16: async (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`answer_16: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const bounty_0 = args_1[1];
        const drop_0 = args_1[2];
        const signature_0 = args_1[3];
        const point_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('answer_16',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 372 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(bounty_0.buffer instanceof ArrayBuffer && bounty_0.BYTES_PER_ELEMENT === 1 && bounty_0.length === 32)) {
          __compactRuntime.typeError('answer_16',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 372 char 1',
                                     'Bytes<32>',
                                     bounty_0)
        }
        if (!(drop_0.buffer instanceof ArrayBuffer && drop_0.BYTES_PER_ELEMENT === 1 && drop_0.length === 32)) {
          __compactRuntime.typeError('answer_16',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'board.compact line 372 char 1',
                                     'Bytes<32>',
                                     drop_0)
        }
        if (!(typeof(signature_0) === 'object' && __compactRuntime.isValidCurve25519Point(signature_0.r) && typeof(signature_0.s) === 'bigint' && signature_0.s >= 0 && signature_0.s <= __compactRuntime.MAX_CURVE25519_SCALAR)) {
          __compactRuntime.typeError('answer_16',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'board.compact line 372 char 1',
                                     'struct Ed25519Signature<r: Curve25519Point, s: Curve25519Scalar>',
                                     signature_0)
        }
        if (!(__compactRuntime.isValidCurve25519Point(point_0))) {
          __compactRuntime.typeError('answer_16',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'board.compact line 372 char 1',
                                     'Curve25519Point',
                                     point_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(bounty_0).concat(_descriptor_0.toValue(drop_0).concat(_descriptor_18.toValue(signature_0).concat(_descriptor_16.toValue(point_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_18.alignment().concat(_descriptor_16.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._answer_16_0(context,
                                                 partialProofData,
                                                 bounty_0,
                                                 drop_0,
                                                 signature_0,
                                                 point_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      answer_24: async (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`answer_24: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const bounty_0 = args_1[1];
        const drop_0 = args_1[2];
        const signature_0 = args_1[3];
        const point_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('answer_24',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 377 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(bounty_0.buffer instanceof ArrayBuffer && bounty_0.BYTES_PER_ELEMENT === 1 && bounty_0.length === 32)) {
          __compactRuntime.typeError('answer_24',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 377 char 1',
                                     'Bytes<32>',
                                     bounty_0)
        }
        if (!(drop_0.buffer instanceof ArrayBuffer && drop_0.BYTES_PER_ELEMENT === 1 && drop_0.length === 32)) {
          __compactRuntime.typeError('answer_24',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'board.compact line 377 char 1',
                                     'Bytes<32>',
                                     drop_0)
        }
        if (!(typeof(signature_0) === 'object' && __compactRuntime.isValidCurve25519Point(signature_0.r) && typeof(signature_0.s) === 'bigint' && signature_0.s >= 0 && signature_0.s <= __compactRuntime.MAX_CURVE25519_SCALAR)) {
          __compactRuntime.typeError('answer_24',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'board.compact line 377 char 1',
                                     'struct Ed25519Signature<r: Curve25519Point, s: Curve25519Scalar>',
                                     signature_0)
        }
        if (!(__compactRuntime.isValidCurve25519Point(point_0))) {
          __compactRuntime.typeError('answer_24',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'board.compact line 377 char 1',
                                     'Curve25519Point',
                                     point_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(bounty_0).concat(_descriptor_0.toValue(drop_0).concat(_descriptor_18.toValue(signature_0).concat(_descriptor_16.toValue(point_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_18.alignment().concat(_descriptor_16.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._answer_24_0(context,
                                                 partialProofData,
                                                 bounty_0,
                                                 drop_0,
                                                 signature_0,
                                                 point_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      answer_36: async (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`answer_36: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const bounty_0 = args_1[1];
        const drop_0 = args_1[2];
        const signature_0 = args_1[3];
        const point_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('answer_36',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 382 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(bounty_0.buffer instanceof ArrayBuffer && bounty_0.BYTES_PER_ELEMENT === 1 && bounty_0.length === 32)) {
          __compactRuntime.typeError('answer_36',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 382 char 1',
                                     'Bytes<32>',
                                     bounty_0)
        }
        if (!(drop_0.buffer instanceof ArrayBuffer && drop_0.BYTES_PER_ELEMENT === 1 && drop_0.length === 32)) {
          __compactRuntime.typeError('answer_36',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'board.compact line 382 char 1',
                                     'Bytes<32>',
                                     drop_0)
        }
        if (!(typeof(signature_0) === 'object' && __compactRuntime.isValidCurve25519Point(signature_0.r) && typeof(signature_0.s) === 'bigint' && signature_0.s >= 0 && signature_0.s <= __compactRuntime.MAX_CURVE25519_SCALAR)) {
          __compactRuntime.typeError('answer_36',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'board.compact line 382 char 1',
                                     'struct Ed25519Signature<r: Curve25519Point, s: Curve25519Scalar>',
                                     signature_0)
        }
        if (!(__compactRuntime.isValidCurve25519Point(point_0))) {
          __compactRuntime.typeError('answer_36',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'board.compact line 382 char 1',
                                     'Curve25519Point',
                                     point_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(bounty_0).concat(_descriptor_0.toValue(drop_0).concat(_descriptor_18.toValue(signature_0).concat(_descriptor_16.toValue(point_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_18.alignment().concat(_descriptor_16.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._answer_36_0(context,
                                                 partialProofData,
                                                 bounty_0,
                                                 drop_0,
                                                 signature_0,
                                                 point_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      refund_bounty: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`refund_bounty: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const bounty_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('refund_bounty',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 395 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(bounty_0.buffer instanceof ArrayBuffer && bounty_0.BYTES_PER_ELEMENT === 1 && bounty_0.length === 32)) {
          __compactRuntime.typeError('refund_bounty',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 395 char 1',
                                     'Bytes<32>',
                                     bounty_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(bounty_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._refund_bounty_0(context,
                                                     partialProofData,
                                                     bounty_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      forget_bounty: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`forget_bounty: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const bounty_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('forget_bounty',
                                     'argument 1 (as invoked from Typescript)',
                                     'board.compact line 408 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(bounty_0.buffer instanceof ArrayBuffer && bounty_0.BYTES_PER_ELEMENT === 1 && bounty_0.length === 32)) {
          __compactRuntime.typeError('forget_bounty',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'board.compact line 408 char 1',
                                     'Bytes<32>',
                                     bounty_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(bounty_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._forget_bounty_0(context,
                                                     partialProofData,
                                                     bounty_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      }
    };
    this.impureCircuits = {
      forget_marks: this.circuits.forget_marks,
      seal_begin: this.circuits.seal_begin,
      seal_block: this.circuits.seal_block,
      seal_finish: this.circuits.seal_finish,
      forget_drop: this.circuits.forget_drop,
      post_bounty: this.circuits.post_bounty,
      answer_16: this.circuits.answer_16,
      answer_24: this.circuits.answer_24,
      answer_36: this.circuits.answer_36,
      refund_bounty: this.circuits.refund_bounty,
      forget_bounty: this.circuits.forget_bounty
    };
    this.provableCircuits = {
      forget_marks: this.circuits.forget_marks,
      seal_begin: this.circuits.seal_begin,
      seal_block: this.circuits.seal_block,
      seal_finish: this.circuits.seal_finish,
      forget_drop: this.circuits.forget_drop,
      post_bounty: this.circuits.post_bounty,
      answer_16: this.circuits.answer_16,
      answer_24: this.circuits.answer_24,
      answer_36: this.circuits.answer_36,
      refund_bounty: this.circuits.refund_bounty,
      forget_bounty: this.circuits.forget_bounty
    };
  }
  async initialState(...args_0) {
    if (args_0.length !== 3) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 3 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const bridge_address_0 = args_0[1];
    const color_0 = args_0[2];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(typeof(bridge_address_0) === 'object' && bridge_address_0.bytes.buffer instanceof ArrayBuffer && bridge_address_0.bytes.BYTES_PER_ELEMENT === 1 && bridge_address_0.bytes.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'board.compact line 72 char 1',
                                 'contract Bridge[known_root(struct MerkleTreeDigest<field: Field>): []]',
                                 bridge_address_0)
    }
    if (!(color_0.buffer instanceof ArrayBuffer && color_0.BYTES_PER_ELEMENT === 1 && color_0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'board.compact line 72 char 1',
                                 'Bytes<32>',
                                 color_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('forget_marks', new __compactRuntime.ContractOperation());
    state_0.setOperation('seal_begin', new __compactRuntime.ContractOperation());
    state_0.setOperation('seal_block', new __compactRuntime.ContractOperation());
    state_0.setOperation('seal_finish', new __compactRuntime.ContractOperation());
    state_0.setOperation('forget_drop', new __compactRuntime.ContractOperation());
    state_0.setOperation('post_bounty', new __compactRuntime.ContractOperation());
    state_0.setOperation('answer_16', new __compactRuntime.ContractOperation());
    state_0.setOperation('answer_24', new __compactRuntime.ContractOperation());
    state_0.setOperation('answer_36', new __compactRuntime.ContractOperation());
    state_0.setOperation('refund_bounty', new __compactRuntime.ContractOperation());
    state_0.setOperation('forget_bounty', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext({circuitId: 'constructor', contractAddress: __compactRuntime.dummyContractAddress(), coinPublicKeyOrZswapState: constructorContext_0.initialZswapLocalState.coinPublicKey, contractState: state_0.data, privateState: constructorContext_0.initialPrivateState});
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(0n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_35.toValue({ bytes: new Uint8Array(32) }),
                                                                                              alignment: _descriptor_35.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(1n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(2n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(3n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(4n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(5n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(6n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(7n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(8n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(9n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(0n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_35.toValue(bridge_address_0),
                                                                                              alignment: _descriptor_35.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(1n),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(color_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.callContext.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.callContext.currentPrivateState,
      currentZswapLocalState: context.callContext.currentZswapLocalState
    }
  }
  _some_0(value_0) { return { is_some: true, value: value_0 }; }
  _none_0() {
    return { is_some: false,
             value:
               { nonce: new Uint8Array(32), color: new Uint8Array(32), value: 0n } };
  }
  _left_0(value_0) {
    return { is_left: true, left: value_0, right: { bytes: new Uint8Array(32) } };
  }
  _right_0(value_0) {
    return { is_left: false, left: { bytes: new Uint8Array(32) }, right: value_0 };
  }
  _merkleTreePathRoot_0(path_0) {
    return { field:
               this._folder_0((...args_0) =>
                                this._merkleTreePathEntryRoot_0(...args_0),
                              this._degradeToTransient_0(this._persistentHash_3({ domain_sep:
                                                                                    new Uint8Array([109, 100, 110, 58, 108, 104]),
                                                                                  data:
                                                                                    path_0.leaf })),
                              path_0.path) };
  }
  _merkleTreePathEntryRoot_0(recursiveDigest_0, entry_0) {
    const left_0 = entry_0.goes_left ? recursiveDigest_0 : entry_0.sibling.field;
    const right_0 = entry_0.goes_left ?
                    entry_0.sibling.field :
                    recursiveDigest_0;
    return this._transientHash_0([left_0, right_0]);
  }
  async _receiveShielded_0(context, partialProofData, coin_0) {
    const recipient_0 = this._right_0(_descriptor_35.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                 partialProofData,
                                                                                                 [
                                                                                                  { dup: { n: 2 } },
                                                                                                  { idx: { cached: true,
                                                                                                           pushPath: false,
                                                                                                           path: [
                                                                                                                  { tag: 'value',
                                                                                                                    value: { value: _descriptor_6.toValue(0n),
                                                                                                                             alignment: _descriptor_6.alignment() } }] } },
                                                                                                  { popeq: { cached: true,
                                                                                                             result: undefined } }]).value));
    this._createZswapOutput_0(context, partialProofData, coin_0, recipient_0);
    const tmp_0 = this._coinCommitment_0(coin_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(1n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    return [];
  }
  async _sendShielded_0(context, partialProofData, input_0, recipient_0, value_0)
  {
    const selfAddr_0 = _descriptor_35.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 2 } },
                                                                                   { idx: { cached: true,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_6.toValue(0n),
                                                                                                              alignment: _descriptor_6.alignment() } }] } },
                                                                                   { popeq: { cached: true,
                                                                                              result: undefined } }]).value);
    this._createZswapInput_0(context, partialProofData, input_0);
    const tmp_0 = this._coinNullifier_0(this._downcastQualifiedCoin_0(input_0),
                                        selfAddr_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(0n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    let t_0;
    const change_0 = (t_0 = input_0.value,
                      (__compactRuntime.assert(t_0 >= value_0,
                                               'result of subtraction would be negative'),
                       t_0 - value_0));
    const output_0 = { nonce:
                         this._upgradeFromTransient_0(this._transientHash_0([__compactRuntime.convertBytesToUint(52435875175126190479447740508185965837690552500527637822603658699938581184512n,
                                                                                                                 28,
                                                                                                                 new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 107, 101, 114, 110, 101, 108, 58, 110, 111, 110, 99, 101, 95, 101, 118, 111, 108, 118, 101]),
                                                                                                                 'Field',
                                                                                                                 '<standard library>'),
                                                                             this._degradeToTransient_0(input_0.nonce)])),
                       color: input_0.color,
                       value: value_0 };
    this._createZswapOutput_0(context, partialProofData, output_0, recipient_0);
    const tmp_1 = this._coinCommitment_0(output_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(2n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (!recipient_0.is_left
        &&
        this._equal_0(recipient_0.right.bytes, selfAddr_0.bytes))
    {
      const tmp_2 = this._coinCommitment_0(output_0, recipient_0);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_6.toValue(1n),
                                                                    alignment: _descriptor_6.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_2),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
    }
    if (change_0 === 0n) {
      return { change: this._none_0(), sent: output_0 };
    } else {
      const changeCoin_0 = { nonce:
                               this._upgradeFromTransient_0(this._transientHash_0([__compactRuntime.convertBytesToUint(52435875175126190479447740508185965837690552500527637822603658699938581184512n,
                                                                                                                       30,
                                                                                                                       new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 107, 101, 114, 110, 101, 108, 58, 110, 111, 110, 99, 101, 95, 101, 118, 111, 108, 118, 101, 47, 50]),
                                                                                                                       'Field',
                                                                                                                       '<standard library>'),
                                                                                   this._degradeToTransient_0(input_0.nonce)])),
                             color: input_0.color,
                             value: change_0 };
      this._createZswapOutput_0(context,
                                partialProofData,
                                changeCoin_0,
                                this._right_0(selfAddr_0));
      const cm_0 = this._coinCommitment_0(changeCoin_0,
                                          this._right_0(selfAddr_0));
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_6.toValue(2n),
                                                                    alignment: _descriptor_6.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_6.toValue(1n),
                                                                    alignment: _descriptor_6.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
      return { change: this._some_0(changeCoin_0), sent: output_0 };
    }
  }
  _downcastQualifiedCoin_0(coin_0) {
    return { nonce: coin_0.nonce, color: coin_0.color, value: coin_0.value };
  }
  _coinCommitment_0(coin_0, recipient_0) {
    return this._persistentHash_6({ domain_sep:
                                      new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 99, 91, 118, 49, 93]),
                                    info: coin_0,
                                    dataType: recipient_0.is_left,
                                    data:
                                      recipient_0.is_left ?
                                      recipient_0.left.bytes :
                                      recipient_0.right.bytes });
  }
  _coinNullifier_0(coin_0, addr_0) {
    return this._persistentHash_6({ domain_sep:
                                      new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 110, 91, 118, 49, 93]),
                                    info: coin_0,
                                    dataType: false,
                                    data: addr_0.bytes });
  }
  _curve25519BaseIsOdd_0(x_0) {
    const b_0 = Array.from(__compactRuntime.convertBigintToBytes(32,
                                                                 x_0,
                                                                 '<standard library>'),
                           BigInt)[0];
    const b6_0 = b_0 >= 128n ?
                 (__compactRuntime.assert(b_0 >= 128n,
                                          'result of subtraction would be negative'),
                  b_0 - 128n)
                 :
                 b_0;
    const b5_0 = b6_0 >= 64n ?
                 (__compactRuntime.assert(b6_0 >= 64n,
                                          'result of subtraction would be negative'),
                  b6_0 - 64n)
                 :
                 b6_0;
    const b4_0 = b5_0 >= 32n ?
                 (__compactRuntime.assert(b5_0 >= 32n,
                                          'result of subtraction would be negative'),
                  b5_0 - 32n)
                 :
                 b5_0;
    const b3_0 = b4_0 >= 16n ?
                 (__compactRuntime.assert(b4_0 >= 16n,
                                          'result of subtraction would be negative'),
                  b4_0 - 16n)
                 :
                 b4_0;
    const b2_0 = b3_0 >= 8n ?
                 (__compactRuntime.assert(b3_0 >= 8n,
                                          'result of subtraction would be negative'),
                  b3_0 - 8n)
                 :
                 b3_0;
    const b1_0 = b2_0 >= 4n ?
                 (__compactRuntime.assert(b2_0 >= 4n,
                                          'result of subtraction would be negative'),
                  b2_0 - 4n)
                 :
                 b2_0;
    return (b1_0 >= 2n ?
            (__compactRuntime.assert(b1_0 >= 2n,
                                     'result of subtraction would be negative'),
             b1_0 - 2n)
            :
            b1_0)
           ===
           1n;
  }
  _ed25519Encode_0(p_0) {
    const y_0 = Array.from(__compactRuntime.convertBigintToBytes(32,
                                                                 this._curve25519PointY_0(p_0),
                                                                 '<standard library>'),
                           BigInt);
    const sign_0 = this._curve25519BaseIsOdd_0(this._curve25519PointX_0(p_0)) ?
                   128n :
                   0n;
    return Uint8Array.from([y_0[0],
                            y_0[1],
                            y_0[2],
                            y_0[3],
                            y_0[4],
                            y_0[5],
                            y_0[6],
                            y_0[7],
                            y_0[8],
                            y_0[9],
                            y_0[10],
                            y_0[11],
                            y_0[12],
                            y_0[13],
                            y_0[14],
                            y_0[15],
                            y_0[16],
                            y_0[17],
                            y_0[18],
                            y_0[19],
                            y_0[20],
                            y_0[21],
                            y_0[22],
                            y_0[23],
                            y_0[24],
                            y_0[25],
                            y_0[26],
                            y_0[27],
                            y_0[28],
                            y_0[29],
                            y_0[30],
                            ((t1) => {
                              if (t1 > 255n) {
                                throw new __compactRuntime.CompactError('<standard library>: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                              }
                              return t1;
                            })(y_0[31] + sign_0)],
                           Number);
  }
  _ed25519Verify_0(msg_0, sig_0, pk_0) {
    __compactRuntime.assert(!this._equal_1(__compactRuntime.convertBigintToBytes(32,
                                                                                 this._curve25519PointX_0(pk_0),
                                                                                 '<standard library>'),
                                           new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                            'Curve25519Point identity is not a permitted ed25519Verify verification key');
    const __compact_pattern_tmp1_0 = sig_0;
    const r_0 = __compact_pattern_tmp1_0.r;
    const s_0 = __compact_pattern_tmp1_0.s;
    const k_0 = __compactRuntime.convertBytesToField(7237005577332262213973186563042994240857116359379907606001950938285454250988n,
                                                     64,
                                                     this._sha512_0([this._ed25519Encode_0(r_0),
                                                                     this._ed25519Encode_0(pk_0),
                                                                     msg_0]),
                                                     'Curve25519Scalar',
                                                     '<standard library>');
    return this._equal_2(this._ecMulGenerator_1(s_0),
                         this._ecAdd_0(r_0, this._ecMul_1(pk_0, k_0)));
  }
  _ed25519Verify_1(msg_0, sig_0, pk_0) {
    __compactRuntime.assert(!this._equal_3(__compactRuntime.convertBigintToBytes(32,
                                                                                 this._curve25519PointX_0(pk_0),
                                                                                 '<standard library>'),
                                           new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                            'Curve25519Point identity is not a permitted ed25519Verify verification key');
    const __compact_pattern_tmp1_0 = sig_0;
    const r_0 = __compact_pattern_tmp1_0.r;
    const s_0 = __compact_pattern_tmp1_0.s;
    const k_0 = __compactRuntime.convertBytesToField(7237005577332262213973186563042994240857116359379907606001950938285454250988n,
                                                     64,
                                                     this._sha512_1([this._ed25519Encode_0(r_0),
                                                                     this._ed25519Encode_0(pk_0),
                                                                     msg_0]),
                                                     'Curve25519Scalar',
                                                     '<standard library>');
    return this._equal_4(this._ecMulGenerator_1(s_0),
                         this._ecAdd_0(r_0, this._ecMul_1(pk_0, k_0)));
  }
  _ed25519Verify_2(msg_0, sig_0, pk_0) {
    __compactRuntime.assert(!this._equal_5(__compactRuntime.convertBigintToBytes(32,
                                                                                 this._curve25519PointX_0(pk_0),
                                                                                 '<standard library>'),
                                           new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                            'Curve25519Point identity is not a permitted ed25519Verify verification key');
    const __compact_pattern_tmp1_0 = sig_0;
    const r_0 = __compact_pattern_tmp1_0.r;
    const s_0 = __compact_pattern_tmp1_0.s;
    const k_0 = __compactRuntime.convertBytesToField(7237005577332262213973186563042994240857116359379907606001950938285454250988n,
                                                     64,
                                                     this._sha512_2([this._ed25519Encode_0(r_0),
                                                                     this._ed25519Encode_0(pk_0),
                                                                     msg_0]),
                                                     'Curve25519Scalar',
                                                     '<standard library>');
    return this._equal_6(this._ecMulGenerator_1(s_0),
                         this._ecAdd_0(r_0, this._ecMul_1(pk_0, k_0)));
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_30, value_0);
    return result_0;
  }
  _transientCommit_0(value_0, rand_0) {
    const result_0 = __compactRuntime.transientCommit(_descriptor_37,
                                                      value_0,
                                                      rand_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_70, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_48, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_67, value_0);
    return result_0;
  }
  _persistentHash_3(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_69, value_0);
    return result_0;
  }
  _persistentHash_4(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_13, value_0);
    return result_0;
  }
  _persistentHash_5(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_66, value_0);
    return result_0;
  }
  _persistentHash_6(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_65, value_0);
    return result_0;
  }
  _degradeToTransient_0(x_0) {
    const result_0 = __compactRuntime.degradeToTransient(x_0);
    return result_0;
  }
  _upgradeFromTransient_0(x_0) {
    const result_0 = __compactRuntime.upgradeFromTransient(x_0);
    return result_0;
  }
  _jubjubPointX_0(pt_0) {
    const result_0 = __compactRuntime.jubjubPointX(pt_0);
    return result_0;
  }
  _jubjubPointY_0(pt_0) {
    const result_0 = __compactRuntime.jubjubPointY(pt_0);
    return result_0;
  }
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecMul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
    const result_0 = __compactRuntime.ecMulGenerator(b_0);
    return result_0;
  }
  _createZswapInput_0(context, partialProofData, coin_0) {
    const result_0 = __compactRuntime.createZswapInput(context, coin_0);
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _createZswapOutput_0(context, partialProofData, coin_0, recipient_0) {
    const result_0 = __compactRuntime.createZswapOutput(context,
                                                        coin_0,
                                                        recipient_0);
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _sha512_0(value_0) {
    const result_0 = __compactRuntime.sha512(_descriptor_63, value_0);
    return result_0;
  }
  _sha512_1(value_0) {
    const result_0 = __compactRuntime.sha512(_descriptor_61, value_0);
    return result_0;
  }
  _sha512_2(value_0) {
    const result_0 = __compactRuntime.sha512(_descriptor_62, value_0);
    return result_0;
  }
  _curve25519PointX_0(pt_0) {
    const result_0 = __compactRuntime.curve25519PointX(pt_0);
    return result_0;
  }
  _curve25519PointY_0(pt_0) {
    const result_0 = __compactRuntime.curve25519PointY(pt_0);
    return result_0;
  }
  _ecAdd_0(a_0, b_0) {
    const result_0 = __compactRuntime.curve25519Add(a_0, b_0);
    return result_0;
  }
  _ecMul_1(a_0, b_0) {
    const result_0 = __compactRuntime.curve25519Mul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_1(b_0) {
    const result_0 = __compactRuntime.curve25519MulGenerator(b_0);
    return result_0;
  }
  _bitsOf_0(context, partialProofData, x_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.bitsOf(witnessContext_0,
                                                                 x_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 35 && result_0.every((t) => typeof(t) === 'boolean'))) {
      __compactRuntime.typeError('bitsOf',
                                 'return value',
                                 'Sha256.compact line 11 char 3',
                                 'Vector<35, Boolean>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_59.toValue(result_0),
      alignment: _descriptor_59.alignment()
    });
    return result_0;
  }
  async _reduce_0(context, partialProofData, sum_0) {
    const bits_0 = this._bitsOf_0(context, partialProofData, sum_0);
    const packed_0 = await this._folder_1(context,
                                          partialProofData,
                                          (async (context,
                                                  partialProofData,
                                                  acc_0,
                                                  bit_0) =>
                                           {
                                             return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                                        2n),
                                                                              bit_0
                                                                              ?
                                                                              1n
                                                                              :
                                                                              0n);
                                           }),
                                          0n,
                                          bits_0);
    __compactRuntime.assert(packed_0 === sum_0, 'bits do not match the sum');
    const carry_0 = __compactRuntime.addField(__compactRuntime.addField(__compactRuntime.mulField(bits_0[0]
                                                                                                  ?
                                                                                                  1n
                                                                                                  :
                                                                                                  0n,
                                                                                                  4n),
                                                                        __compactRuntime.mulField(bits_0[1]
                                                                                                  ?
                                                                                                  1n
                                                                                                  :
                                                                                                  0n,
                                                                                                  2n)),
                                              bits_0[2] ? 1n : 0n);
    const low_0 = ((e) => e.slice(3, 35))(bits_0);
    const minusTwo_0 = 52435875175126190479447740508185965837690552500527637822603658699938581184511n;
    return { bits: low_0,
             signs:
               await this._mapper_0(context,
                                    partialProofData,
                                    (async (context, partialProofData, bit_1) =>
                                     {
                                       return __compactRuntime.addField(1n,
                                                                        __compactRuntime.mulField(bit_1
                                                                                                  ?
                                                                                                  1n
                                                                                                  :
                                                                                                  0n,
                                                                                                  minusTwo_0));
                                     }),
                                    low_0),
             val:
               __compactRuntime.subField(sum_0,
                                         __compactRuntime.mulField(carry_0,
                                                                   4294967296n)) };
  }
  _xor3_0(x_0, y_0, z_0) {
    const half_0 = 26217937587563095239723870254092982918845276250263818911301829349969290592257n;
    return __compactRuntime.mulField(__compactRuntime.subField(4294967295n,
                                                               this._folder_2(((acc_0,
                                                                                a_0,
                                                                                b_0,
                                                                                c_0) =>
                                                                               {
                                                                                 return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                                                                            2n),
                                                                                                                  __compactRuntime.mulField(__compactRuntime.mulField(a_0,
                                                                                                                                                                      b_0),
                                                                                                                                            c_0));
                                                                               }),
                                                                              0n,
                                                                              x_0,
                                                                              y_0,
                                                                              z_0)),
                                     half_0);
  }
  _choose_0(e_0, f_0, g_0) {
    return __compactRuntime.addField(g_0.val,
                                     this._folder_3(((acc_0, a_0, b_0, c_0) =>
                                                     {
                                                       return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                                                  2n),
                                                                                        __compactRuntime.mulField(a_0
                                                                                                                  ?
                                                                                                                  1n
                                                                                                                  :
                                                                                                                  0n,
                                                                                                                  __compactRuntime.subField(b_0
                                                                                                                                            ?
                                                                                                                                            1n
                                                                                                                                            :
                                                                                                                                            0n,
                                                                                                                                            c_0
                                                                                                                                            ?
                                                                                                                                            1n
                                                                                                                                            :
                                                                                                                                            0n)));
                                                     }),
                                                    0n,
                                                    e_0.bits,
                                                    f_0.bits,
                                                    g_0.bits));
  }
  _majority_0(a_0, b_0, c_0) {
    const half_0 = 26217937587563095239723870254092982918845276250263818911301829349969290592257n;
    return __compactRuntime.mulField(__compactRuntime.subField(__compactRuntime.addField(__compactRuntime.addField(a_0.val,
                                                                                                                   b_0.val),
                                                                                         c_0.val),
                                                               this._xor3_0(a_0.signs,
                                                                            b_0.signs,
                                                                            c_0.signs)),
                                     half_0);
  }
  _bigSigma0_0(x_0) {
    return this._xor3_0([...((e) => e.slice(30, 32))(x_0),
                         ...((e) => e.slice(0, 30))(x_0)],
                        [...((e) => e.slice(19, 32))(x_0),
                         ...((e) => e.slice(0, 19))(x_0)],
                        [...((e) => e.slice(10, 32))(x_0),
                         ...((e) => e.slice(0, 10))(x_0)]);
  }
  _bigSigma1_0(x_0) {
    return this._xor3_0([...((e) => e.slice(26, 32))(x_0),
                         ...((e) => e.slice(0, 26))(x_0)],
                        [...((e) => e.slice(21, 32))(x_0),
                         ...((e) => e.slice(0, 21))(x_0)],
                        [...((e) => e.slice(7, 32))(x_0),
                         ...((e) => e.slice(0, 7))(x_0)]);
  }
  _smallSigma0_0(x_0) {
    const one_0 = 1n;
    const zero_0 = [one_0, one_0, one_0];
    return this._xor3_0([...((e) => e.slice(25, 32))(x_0),
                         ...((e) => e.slice(0, 25))(x_0)],
                        [...((e) => e.slice(14, 32))(x_0),
                         ...((e) => e.slice(0, 14))(x_0)],
                        [...zero_0, ...((e) => e.slice(0, 29))(x_0)]);
  }
  _smallSigma1_0(x_0) {
    const one_0 = 1n;
    const zero_0 = [one_0,
                    one_0,
                    one_0,
                    one_0,
                    one_0,
                    one_0,
                    one_0,
                    one_0,
                    one_0,
                    one_0];
    return this._xor3_0([...((e) => e.slice(15, 32))(x_0),
                         ...((e) => e.slice(0, 15))(x_0)],
                        [...((e) => e.slice(13, 32))(x_0),
                         ...((e) => e.slice(0, 13))(x_0)],
                        [...zero_0, ...((e) => e.slice(0, 22))(x_0)]);
  }
  async _round_0(context, partialProofData, v_0, k_0, w_0) {
    const t1_0 = __compactRuntime.addField(__compactRuntime.addField(__compactRuntime.addField(__compactRuntime.addField(v_0[7].val,
                                                                                                                         this._bigSigma1_0(v_0[4].signs)),
                                                                                               this._choose_0(v_0[4],
                                                                                                              v_0[5],
                                                                                                              v_0[6])),
                                                                     k_0),
                                           w_0);
    const t2_0 = __compactRuntime.addField(this._bigSigma0_0(v_0[0].signs),
                                           this._majority_0(v_0[0],
                                                            v_0[1],
                                                            v_0[2]));
    return [await this._reduce_0(context,
                                 partialProofData,
                                 __compactRuntime.addField(t1_0, t2_0)),
            v_0[0],
            v_0[1],
            v_0[2],
            await this._reduce_0(context,
                                 partialProofData,
                                 __compactRuntime.addField(v_0[3].val, t1_0)),
            v_0[4],
            v_0[5],
            v_0[6]];
  }
  async _extend_0(context, partialProofData, w_0) {
    return await this._reduce_0(context,
                                partialProofData,
                                __compactRuntime.addField(__compactRuntime.addField(__compactRuntime.addField(this._smallSigma1_0(w_0[14].signs),
                                                                                                              w_0[9].val),
                                                                                    this._smallSigma0_0(w_0[1].signs)),
                                                          w_0[0].val));
  }
  _bigEndian_0(v_0) {
    return __compactRuntime.addField(__compactRuntime.addField(__compactRuntime.addField(__compactRuntime.mulField(v_0[0],
                                                                                                                   16777216n),
                                                                                         __compactRuntime.mulField(v_0[1],
                                                                                                                   65536n)),
                                                               __compactRuntime.mulField(v_0[2],
                                                                                         256n)),
                                     v_0[3]);
  }
  _initialState_0() {
    return [1779033703n,
            3144134277n,
            1013904242n,
            2773480762n,
            1359893119n,
            2600822924n,
            528734635n,
            1541459225n];
  }
  async _compress_0(context, partialProofData, state_0, block_0) {
    const early_0 = [1116352408n,
                     1899447441n,
                     3049323471n,
                     3921009573n,
                     961987163n,
                     1508970993n,
                     2453635748n,
                     2870763221n,
                     3624381080n,
                     310598401n,
                     607225278n,
                     1426881987n,
                     1925078388n,
                     2162078206n,
                     2614888103n,
                     3248222580n,
                     3835390401n,
                     4022224774n,
                     264347078n,
                     604807628n,
                     770255983n,
                     1249150122n,
                     1555081692n,
                     1996064986n,
                     2554220882n,
                     2821834349n,
                     2952996808n,
                     3210313671n,
                     3336571891n,
                     3584528711n,
                     113926993n,
                     338241895n,
                     666307205n,
                     773529912n,
                     1294757372n,
                     1396182291n,
                     1695183700n,
                     1986661051n,
                     2177026350n,
                     2456956037n,
                     2730485921n,
                     2820302411n,
                     3259730800n,
                     3345764771n,
                     3516065817n,
                     3600352804n,
                     4094571909n,
                     275423344n];
    const late_0 = [430227734n,
                    506948616n,
                    659060556n,
                    883997877n,
                    958139571n,
                    1322822218n,
                    1537002063n,
                    1747873779n,
                    1955562222n,
                    2024104815n,
                    2227730452n,
                    2361852424n,
                    2428436474n,
                    2756734187n,
                    3204031479n,
                    3329325298n];
    const before_0 = await this._mapper_1(context,
                                          partialProofData,
                                          (async (context, partialProofData, x_0) =>
                                           {
                                             return await this._reduce_0(context,
                                                                         partialProofData,
                                                                         x_0);
                                           }),
                                          state_0);
    const start_0 = { window:
                        await this._mapper_2(context,
                                             partialProofData,
                                             (async (context,
                                                     partialProofData,
                                                     x_1) =>
                                              {
                                                return await this._reduce_0(context,
                                                                            partialProofData,
                                                                            x_1);
                                              }),
                                             block_0),
                      vars: before_0 };
    const middle_0 = await this._folder_4(context,
                                          partialProofData,
                                          (async (context,
                                                  partialProofData,
                                                  run_0,
                                                  k_0) =>
                                           {
                                             return { window:
                                                        [...((e) => e.slice(1, 16))(run_0.window),
                                                         await this._extend_0(context,
                                                                              partialProofData,
                                                                              run_0.window)],
                                                      vars:
                                                        await this._round_0(context,
                                                                            partialProofData,
                                                                            run_0.vars,
                                                                            k_0,
                                                                            run_0.window[0].val) };
                                           }),
                                          start_0,
                                          early_0);
    const after_0 = await this._folder_5(context,
                                         partialProofData,
                                         (async (context,
                                                 partialProofData,
                                                 v_0,
                                                 k_1,
                                                 w_0) =>
                                          {
                                            return await this._round_0(context,
                                                                       partialProofData,
                                                                       v_0,
                                                                       k_1,
                                                                       w_0.val);
                                          }),
                                         middle_0.vars,
                                         late_0,
                                         middle_0.window);
    return await this._mapper_3(context,
                                partialProofData,
                                (async (context, partialProofData, x_2, y_0) =>
                                 {
                                   return (await this._reduce_0(context,
                                                                partialProofData,
                                                                __compactRuntime.addField(x_2.val,
                                                                                          y_0.val))).val;
                                 }),
                                before_0,
                                after_0);
  }
  _memberSecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.memberSecret(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('memberSecret',
                                 'return value',
                                 'board.compact line 53 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _memberPath_0(context, partialProofData, leaf_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.memberPath(witnessContext_0,
                                                                     leaf_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.leaf.buffer instanceof ArrayBuffer && result_0.leaf.BYTES_PER_ELEMENT === 1 && result_0.leaf.length === 32 && Array.isArray(result_0.path) && result_0.path.length === 16 && result_0.path.every((t) => typeof(t) === 'object' && typeof(t.sibling) === 'object' && typeof(t.sibling.field) === 'bigint' && t.sibling.field >= 0 && t.sibling.field <= __compactRuntime.MAX_FIELD && typeof(t.goes_left) === 'boolean'))) {
      __compactRuntime.typeError('memberPath',
                                 'return value',
                                 'board.compact line 54 char 1',
                                 'struct MerkleTreePath<leaf: Bytes<32>, path: Vector<16, struct MerkleTreePathEntry<sibling: struct MerkleTreeDigest<field: Field>, goes_left: Boolean>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_52.toValue(result_0),
      alignment: _descriptor_52.alignment()
    });
    return result_0;
  }
  _memberSlot_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.memberSlot(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 255n)) {
      __compactRuntime.typeError('memberSlot',
                                 'return value',
                                 'board.compact line 56 char 1',
                                 'Uint<0..256>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_6.toValue(result_0),
      alignment: _descriptor_6.alignment()
    });
    return result_0;
  }
  _contentKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.contentKey(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0 && result_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('contentKey',
                                 'return value',
                                 'board.compact line 57 char 1',
                                 'Field',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_13.toValue(result_0),
      alignment: _descriptor_13.alignment()
    });
    return result_0;
  }
  _contentBlock_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.contentBlock(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 64)) {
      __compactRuntime.typeError('contentBlock',
                                 'return value',
                                 'board.compact line 58 char 1',
                                 'Bytes<64>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_48.toValue(result_0),
      alignment: _descriptor_48.alignment()
    });
    return result_0;
  }
  _sealState_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.sealState(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 8 && result_0.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 4294967295n))) {
      __compactRuntime.typeError('sealState',
                                 'return value',
                                 'board.compact line 60 char 1',
                                 'Vector<8, Uint<0..4294967296>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_47.toValue(result_0),
      alignment: _descriptor_47.alignment()
    });
    return result_0;
  }
  _sealBlind_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.sealBlind(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0 && result_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('sealBlind',
                                 'return value',
                                 'board.compact line 62 char 1',
                                 'Field',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_13.toValue(result_0),
      alignment: _descriptor_13.alignment()
    });
    return result_0;
  }
  _sealNextBlind_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.sealNextBlind(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0 && result_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('sealNextBlind',
                                 'return value',
                                 'board.compact line 63 char 1',
                                 'Field',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_13.toValue(result_0),
      alignment: _descriptor_13.alignment()
    });
    return result_0;
  }
  _handoverNonce_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.handoverNonce(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0 && result_0 <= __compactRuntime.MAX_JUBJUB_SCALAR)) {
      __compactRuntime.typeError('handoverNonce',
                                 'return value',
                                 'board.compact line 64 char 1',
                                 'JubjubScalar',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_46.toValue(result_0),
      alignment: _descriptor_46.alignment()
    });
    return result_0;
  }
  _coinSecretKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.coinSecretKey(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('coinSecretKey',
                                 'return value',
                                 'board.compact line 66 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _bitsOfByte_0(context, partialProofData, x_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.bitsOfByte(witnessContext_0,
                                                                     x_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 8 && result_0.every((t) => typeof(t) === 'boolean'))) {
      __compactRuntime.typeError('bitsOfByte',
                                 'return value',
                                 'board.compact line 68 char 1',
                                 'Vector<8, Boolean>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_45.toValue(result_0),
      alignment: _descriptor_45.alignment()
    });
    return result_0;
  }
  _lowBit_0(context, partialProofData, x_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.lowBit(witnessContext_0,
                                                                 x_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 2  && typeof(result_0[0]) === 'boolean' && typeof(result_0[1]) === 'bigint' && result_0[1] >= 0n && result_0[1] <= 127n)) {
      __compactRuntime.typeError('lowBit',
                                 'return value',
                                 'board.compact line 70 char 1',
                                 '[Boolean, Uint<0..128>]',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_44.toValue(result_0),
      alignment: _descriptor_44.alignment()
    });
    return result_0;
  }
  _bountyTime_0() { return 2592000n; }
  _dropAnswersDays_0() { return 7n; }
  _dropKeptDays_0() { return 37n; }
  async _prove_member_0(context, partialProofData, epoch_0) {
    const day_0 = epoch_0;
    let tmp_0;
    __compactRuntime.assert(!(tmp_0 = day_0 * 86400n,
                              _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                        partialProofData,
                                                                                        [
                                                                                         { dup: { n: 2 } },
                                                                                         { idx: { cached: true,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_6.toValue(2n),
                                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                                         { push: { storage: false,
                                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                                                                alignment: _descriptor_2.alignment() }).encode() } },
                                                                                         'lt',
                                                                                         { popeq: { cached: true,
                                                                                                    result: undefined } }]).value)),
                            'the day has not begun');
    let tmp_1;
    __compactRuntime.assert((tmp_1 = day_0 * 86400n + 86400n,
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_1),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the day has passed');
    const secret_0 = Array.from(this._memberSecret_0(context, partialProofData),
                                BigInt);
    const leaf_0 = this._persistentHash_1(Uint8Array.from([...Array.from(new Uint8Array([108, 105, 103, 104, 116, 115, 111, 117, 116, 58, 109, 101, 109, 98, 101, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                                         BigInt),
                                                           ...secret_0],
                                                          Number));
    const path_0 = this._memberPath_0(context, partialProofData, leaf_0);
    __compactRuntime.assert(this._equal_7(path_0.leaf, leaf_0),
                            'the path is for another leaf');
    await __compactRuntime.crossContractCall({
     context,
     interfaceName: 'Bridge',
     declaration: declaredInterfaces['Bridge'],
     calleeCircuitId: 'known_root',
     calleeAddress: __compactRuntime.decodeContractAddress((_descriptor_35.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                                       partialProofData,
                                                                                                                       [
                                                                                                                        { dup: { n: 0 } },
                                                                                                                        { idx: { cached: false,
                                                                                                                                 pushPath: false,
                                                                                                                                 path: [
                                                                                                                                        { tag: 'value',
                                                                                                                                          value: { value: _descriptor_6.toValue(0n),
                                                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                                                        { popeq: { cached: false,
                                                                                                                                   result: undefined } }]).value)).bytes),
     partialProofData,
     args: [this._merkleTreePathRoot_0(path_0)]
    });
    const slot_0 = this._memberSlot_0(context, partialProofData);
    __compactRuntime.assert(slot_0 < 32n, 'no such slot');
    const mark_0 = this._persistentHash_2(Uint8Array.from([...Array.from(new Uint8Array([108, 105, 103, 104, 116, 115, 111, 117, 116, 58, 109, 97, 114, 107, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                                         BigInt),
                                                           ...secret_0,
                                                           ...Array.from(__compactRuntime.convertBigintToBytes(32,
                                                                                                               day_0,
                                                                                                               'board.compact line 102 char 10'),
                                                                         BigInt),
                                                           ...Array.from(__compactRuntime.convertBigintToBytes(32,
                                                                                                               slot_0,
                                                                                                               'board.compact line 102 char 69'),
                                                                         BigInt)],
                                                          Number));
    if (!_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                   partialProofData,
                                                                   [
                                                                    { dup: { n: 0 } },
                                                                    { idx: { cached: false,
                                                                             pushPath: false,
                                                                             path: [
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_6.toValue(5n),
                                                                                               alignment: _descriptor_6.alignment() } }] } },
                                                                    { push: { storage: false,
                                                                              value: __compactRuntime.StateValue.newCell({ value: _descriptor_19.toValue(day_0),
                                                                                                                           alignment: _descriptor_19.alignment() }).encode() } },
                                                                    'member',
                                                                    { popeq: { cached: true,
                                                                               result: undefined } }]).value))
    {
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_6.toValue(5n),
                                                                    alignment: _descriptor_6.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_19.toValue(day_0),
                                                                                                alignment: _descriptor_19.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newMap(
                                                            new __compactRuntime.StateMap()
                                                          ).encode() } },
                                         { ins: { cached: false, n: 1 } },
                                         { ins: { cached: true, n: 1 } }]);
    }
    __compactRuntime.assert(!_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(5n),
                                                                                                                   alignment: _descriptor_6.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_19.toValue(day_0),
                                                                                                                   alignment: _descriptor_19.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mark_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'this slot of the day is used');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(5n),
                                                                  alignment: _descriptor_6.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_19.toValue(day_0),
                                                                  alignment: _descriptor_19.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(mark_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _forget_marks_0(context, partialProofData, epoch_0) {
    const day_0 = epoch_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(5n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_19.toValue(day_0),
                                                                                                                                              alignment: _descriptor_19.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'that day has no marks');
    let tmp_0;
    __compactRuntime.assert(!(tmp_0 = day_0 * 86400n + 86400n,
                              _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                        partialProofData,
                                                                                        [
                                                                                         { dup: { n: 2 } },
                                                                                         { idx: { cached: true,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_6.toValue(2n),
                                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                                         { push: { storage: false,
                                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                                                                alignment: _descriptor_2.alignment() }).encode() } },
                                                                                         'lt',
                                                                                         { popeq: { cached: true,
                                                                                                    result: undefined } }]).value)),
                            'the day has not passed');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(5n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_19.toValue(day_0),
                                                                                              alignment: _descriptor_19.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _packed_0(words_0) {
    return this._folder_6(((acc_0, w_0) =>
                           {
                             return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                        4294967296n),
                                                              w_0);
                           }),
                          0n,
                          words_0);
  }
  _hidden_0(state_0, key_0, blind_0) {
    return this._transientCommit_0([this._packed_0(((e) => e.slice(0, 4))(state_0)),
                                    this._packed_0(((e) => e.slice(4, 8))(state_0)),
                                    key_0],
                                   blind_0);
  }
  _wordsOf_0(bytes_0) {
    return [this._bigEndian_0(((e) => e.slice(0, 4))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(4, 8))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(8, 12))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(12, 16))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(16, 20))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(20, 24))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(24, 28))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(28, 32))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(32, 36))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(36, 40))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(40, 44))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(44, 48))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(48, 52))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(52, 56))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(56, 60))(bytes_0)),
            this._bigEndian_0(((e) => e.slice(60, 64))(bytes_0))];
  }
  _encrypt_0(words_0, key_0, index_0) {
    const a_0 = this._folder_7(((acc_0, w_0) =>
                                {
                                  return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                             4294967296n),
                                                                   w_0);
                                }),
                               0n,
                               ((e) => e.slice(0, 7))(words_0));
    const b_0 = this._folder_8(((acc_1, w_1) =>
                                {
                                  return __compactRuntime.addField(__compactRuntime.mulField(acc_1,
                                                                                             4294967296n),
                                                                   w_1);
                                }),
                               0n,
                               ((e) => e.slice(7, 14))(words_0));
    const c_0 = this._folder_9(((acc_2, w_2) =>
                                {
                                  return __compactRuntime.addField(__compactRuntime.mulField(acc_2,
                                                                                             4294967296n),
                                                                   w_2);
                                }),
                               0n,
                               ((e) => e.slice(14, 16))(words_0));
    return [__compactRuntime.addField(a_0,
                                      this._transientHash_0([key_0,
                                                             __compactRuntime.mulField(index_0,
                                                                                       3n)])),
            __compactRuntime.addField(b_0,
                                      this._transientHash_0([key_0,
                                                             __compactRuntime.addField(__compactRuntime.mulField(index_0,
                                                                                                                 3n),
                                                                                       1n)])),
            __compactRuntime.addField(c_0,
                                      this._transientHash_0([key_0,
                                                             __compactRuntime.addField(__compactRuntime.mulField(index_0,
                                                                                                                 3n),
                                                                                       2n)]))];
  }
  async _absorb_0(context, partialProofData, at_0, seal_0, key_0, bytes_0) {
    const before_0 = await this._mapper_4(context,
                                          partialProofData,
                                          (async (context,
                                                  partialProofData,
                                                  word_0) =>
                                           {
                                             return word_0;
                                           }),
                                          this._sealState_0(context,
                                                            partialProofData));
    __compactRuntime.assert(this._hidden_0(before_0,
                                           key_0,
                                           this._sealBlind_0(context,
                                                             partialProofData))
                            ===
                            seal_0.chain,
                            'not the hidden state');
    const words_0 = this._wordsOf_0(bytes_0);
    const state_0 = await this._compress_0(context,
                                           partialProofData,
                                           before_0,
                                           words_0);
    const tmp_0 = seal_0.blocks;
    const tmp_1 = this._encrypt_0(words_0, key_0, seal_0.blocks);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(4n),
                                                                  alignment: _descriptor_6.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_0.toValue(at_0),
                                                                  alignment: _descriptor_0.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_19.toValue(tmp_0),
                                                                                              alignment: _descriptor_19.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_37.toValue(tmp_1),
                                                                                              alignment: _descriptor_37.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [state_0,
            this._hidden_0(state_0,
                           key_0,
                           this._sealNextBlind_0(context, partialProofData))];
  }
  async _seal_begin_0(context,
                      partialProofData,
                      id_0,
                      key_hash_0,
                      content_hash_0,
                      length_0,
                      payout_0,
                      epoch_0)
  {
    await this._prove_member_0(context, partialProofData, epoch_0);
    const at_0 = id_0;
    __compactRuntime.assert(length_0 <= 4096n,
                            'the content is longer than 4096 bytes');
    __compactRuntime.assert(!_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'this drop exists');
    const tmp_0 = { key_hash: key_hash_0,
                    content_hash: content_hash_0,
                    length: length_0,
                    payout: payout_0,
                    day: epoch_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(2n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_21.toValue(tmp_0),
                                                                                              alignment: _descriptor_21.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = { remaining: length_0,
                    ended: false,
                    blocks: 0n,
                    chain:
                      this._hidden_0(this._initialState_0(),
                                     this._contentKey_0(context,
                                                        partialProofData),
                                     this._sealNextBlind_0(context,
                                                           partialProofData)),
                    done: false };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(3n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_20.toValue(tmp_1),
                                                                                              alignment: _descriptor_20.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(4n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _seal_block_0(context, partialProofData, id_0) {
    const at_0 = id_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(3n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no such drop');
    const seal_0 = _descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_6.toValue(3n),
                                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_0.toValue(at_0),
                                                                                                          alignment: _descriptor_0.alignment() } }] } },
                                                                               { popeq: { cached: false,
                                                                                          result: undefined } }]).value);
    __compactRuntime.assert(!seal_0.done, 'the drop is sealed');
    let t_0;
    __compactRuntime.assert((t_0 = seal_0.remaining, t_0 >= 64n),
                            'no full block remains');
    const next_0 = await this._absorb_0(context,
                                        partialProofData,
                                        at_0,
                                        seal_0,
                                        this._contentKey_0(context,
                                                           partialProofData),
                                        Array.from(this._contentBlock_0(context,
                                                                        partialProofData),
                                                   BigInt));
    let t_1;
    const tmp_0 = { remaining:
                      (t_1 = seal_0.remaining,
                       (__compactRuntime.assert(t_1 >= 64n,
                                                'result of subtraction would be negative'),
                        t_1 - 64n)),
                    ended: false,
                    blocks:
                      ((t1) => {
                        if (t1 > 4294967295n) {
                          throw new __compactRuntime.CompactError('board.compact line 182 char 95: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 4294967295');
                        }
                        return t1;
                      })(seal_0.blocks + 1n),
                    chain: next_0[1],
                    done: false };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(3n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_20.toValue(tmp_0),
                                                                                              alignment: _descriptor_20.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _padStep_0(p_0, byte_0, skip_0) {
    const b_0 = byte_0;
    const zero_0 = 0n;
    const live_0 = __compactRuntime.mulField(__compactRuntime.subField(1n,
                                                                       skip_0),
                                             __compactRuntime.subField(1n,
                                                                       p_0.ended));
    const marker_0 = __compactRuntime.mulField(live_0,
                                               p_0.left === zero_0 ? 1n : 0n);
    __compactRuntime.assert(__compactRuntime.mulField(marker_0,
                                                      __compactRuntime.subField(b_0,
                                                                                128n))
                            ===
                            zero_0,
                            'the byte after the content must be 0x80');
    __compactRuntime.assert(__compactRuntime.mulField(__compactRuntime.mulField(__compactRuntime.subField(1n,
                                                                                                          skip_0),
                                                                                p_0.ended),
                                                      b_0)
                            ===
                            zero_0,
                            'padding must be zero');
    return { left:
               __compactRuntime.subField(p_0.left,
                                         __compactRuntime.subField(live_0,
                                                                   marker_0)),
             ended: __compactRuntime.addField(p_0.ended, marker_0) };
  }
  async _seal_finish_0(context, partialProofData, id_0) {
    const at_0 = id_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(3n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no such drop');
    const seal_0 = _descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_6.toValue(3n),
                                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_0.toValue(at_0),
                                                                                                          alignment: _descriptor_0.alignment() } }] } },
                                                                               { popeq: { cached: false,
                                                                                          result: undefined } }]).value);
    __compactRuntime.assert(!seal_0.done, 'the drop is sealed');
    let t_0;
    __compactRuntime.assert((t_0 = seal_0.remaining, t_0 < 64n),
                            'full blocks remain');
    const drop_0 = _descriptor_21.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_6.toValue(2n),
                                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_0.toValue(at_0),
                                                                                                          alignment: _descriptor_0.alignment() } }] } },
                                                                               { popeq: { cached: false,
                                                                                          result: undefined } }]).value);
    const key_0 = this._contentKey_0(context, partialProofData);
    __compactRuntime.assert(this._equal_8(this._persistentHash_4(key_0),
                                          drop_0.key_hash),
                            'not the key behind the hash');
    const bytes_0 = Array.from(this._contentBlock_0(context, partialProofData),
                               BigInt);
    const zero_0 = 0n;
    const body_0 = await this._folder_10(context,
                                         partialProofData,
                                         (async (context,
                                                 partialProofData,
                                                 p_0,
                                                 byte_0) =>
                                          {
                                            return this._padStep_0(p_0,
                                                                   byte_0,
                                                                   0n);
                                          }),
                                         { left: seal_0.remaining,
                                           ended: seal_0.ended ? 1n : 0n },
                                         ((e) => e.slice(0, 56))(bytes_0));
    const closing_0 = body_0.ended;
    const back_0 = await this._folder_11(context,
                                         partialProofData,
                                         (async (context,
                                                 partialProofData,
                                                 p_1,
                                                 byte_1) =>
                                          {
                                            return this._padStep_0(p_1,
                                                                   byte_1,
                                                                   closing_0);
                                          }),
                                         body_0,
                                         ((e) => e.slice(56, 64))(bytes_0));
    const trailer_0 = await this._folder_12(context,
                                            partialProofData,
                                            (async (context,
                                                    partialProofData,
                                                    acc_0,
                                                    byte_2) =>
                                             {
                                               return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                                          256n),
                                                                                byte_2);
                                             }),
                                            zero_0,
                                            ((e) => e.slice(56, 64))(bytes_0));
    __compactRuntime.assert(__compactRuntime.mulField(closing_0,
                                                      __compactRuntime.subField(trailer_0,
                                                                                __compactRuntime.mulField(drop_0.length,
                                                                                                          8n)))
                            ===
                            zero_0,
                            'the length in the padding is wrong');
    const next_0 = await this._absorb_0(context,
                                        partialProofData,
                                        at_0,
                                        seal_0,
                                        key_0,
                                        bytes_0);
    const want_0 = Array.from(drop_0.content_hash, BigInt);
    const digest_0 = [this._bigEndian_0(((e) => e.slice(0, 4))(want_0)),
                      this._bigEndian_0(((e) => e.slice(4, 8))(want_0)),
                      this._bigEndian_0(((e) => e.slice(8, 12))(want_0)),
                      this._bigEndian_0(((e) => e.slice(12, 16))(want_0)),
                      this._bigEndian_0(((e) => e.slice(16, 20))(want_0)),
                      this._bigEndian_0(((e) => e.slice(20, 24))(want_0)),
                      this._bigEndian_0(((e) => e.slice(24, 28))(want_0)),
                      this._bigEndian_0(((e) => e.slice(28, 32))(want_0))];
    __compactRuntime.assert(__compactRuntime.mulField(closing_0,
                                                      __compactRuntime.subField(1n,
                                                                                this._equal_9(next_0[0],
                                                                                              digest_0)
                                                                                ?
                                                                                1n
                                                                                :
                                                                                0n))
                            ===
                            zero_0,
                            'the content does not match its hash');
    const tmp_0 = { remaining: 0n,
                    ended: back_0.ended === 1n,
                    blocks:
                      ((t1) => {
                        if (t1 > 4294967295n) {
                          throw new __compactRuntime.CompactError('board.compact line 227 char 72: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 4294967295');
                        }
                        return t1;
                      })(seal_0.blocks + 1n),
                    chain: next_0[1],
                    done: closing_0 === 1n };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(3n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_20.toValue(tmp_0),
                                                                                              alignment: _descriptor_20.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _handOver_0(context, partialProofData, buyer_0, key_0) {
    const nonce_0 = this._handoverNonce_0(context, partialProofData);
    const shared_0 = this._ecMul_0(buyer_0, nonce_0);
    const mask_0 = this._transientHash_0([this._jubjubPointX_0(shared_0),
                                          this._jubjubPointY_0(shared_0)]);
    return { point: this._ecMulGenerator_0(nonce_0),
             masked: __compactRuntime.addField(key_0, mask_0) };
  }
  async _forget_drop_0(context, partialProofData, id_0) {
    const at_0 = id_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(2n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no such drop');
    let tmp_0;
    __compactRuntime.assert(!(tmp_0 = (_descriptor_21.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                  partialProofData,
                                                                                                  [
                                                                                                   { dup: { n: 0 } },
                                                                                                   { idx: { cached: false,
                                                                                                            pushPath: false,
                                                                                                            path: [
                                                                                                                   { tag: 'value',
                                                                                                                     value: { value: _descriptor_6.toValue(2n),
                                                                                                                              alignment: _descriptor_6.alignment() } }] } },
                                                                                                   { idx: { cached: false,
                                                                                                            pushPath: false,
                                                                                                            path: [
                                                                                                                   { tag: 'value',
                                                                                                                     value: { value: _descriptor_0.toValue(at_0),
                                                                                                                              alignment: _descriptor_0.alignment() } }] } },
                                                                                                   { popeq: { cached: false,
                                                                                                              result: undefined } }]).value).day
                                       +
                                       this._dropKeptDays_0())
                                      *
                                      86400n,
                              _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                        partialProofData,
                                                                                        [
                                                                                         { dup: { n: 2 } },
                                                                                         { idx: { cached: true,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_6.toValue(2n),
                                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                                         { push: { storage: false,
                                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                                                                alignment: _descriptor_2.alignment() }).encode() } },
                                                                                         'lt',
                                                                                         { popeq: { cached: true,
                                                                                                    result: undefined } }]).value)),
                            'the drop is still kept');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(2n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(3n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(4n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _bountyId_0(terms_0, reward_0) {
    return this._persistentHash_0({ tag:
                                      new Uint8Array([108, 105, 103, 104, 116, 115, 111, 117, 116, 58, 98, 111, 117, 110, 116, 121, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    terms: terms_0,
                                    reward: reward_0 });
  }
  async _post_bounty_0(context,
                       partialProofData,
                       request_hash_0,
                       model_0,
                       model_length_0,
                       keys_0,
                       text_0,
                       text_length_0,
                       coin_0,
                       buyer_0,
                       refund_to_0,
                       deadline_0,
                       epoch_0)
  {
    await this._prove_member_0(context, partialProofData, epoch_0);
    const length_0 = model_length_0;
    __compactRuntime.assert(length_0 === 16n || length_0 === 24n
                            ||
                            length_0 === 36n,
                            'no answer circuit takes a model name of this length');
    const size_0 = text_length_0;
    __compactRuntime.assert(size_0 <= 512n,
                            'the request is longer than 512 bytes');
    const c_0 = coin_0;
    __compactRuntime.assert(this._equal_10(c_0.color,
                                           _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value)),
                            'the coin is not the payment token');
    let t_0;
    __compactRuntime.assert((t_0 = c_0.value, t_0 > 0n),
                            'a bounty needs a reward');
    const until_0 = deadline_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 2 } },
                                                                                       { idx: { cached: true,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(2n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(until_0),
                                                                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                                                                       'lt',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the deadline has passed');
    let tmp_0, t_1;
    __compactRuntime.assert(!(tmp_0 = (t_1 = this._bountyTime_0(),
                                       (__compactRuntime.assert(until_0 >= t_1,
                                                                'result of subtraction would be negative'),
                                        until_0 - t_1)),
                              _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                        partialProofData,
                                                                                        [
                                                                                         { dup: { n: 2 } },
                                                                                         { idx: { cached: true,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_6.toValue(2n),
                                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                                         { push: { storage: false,
                                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                                                                alignment: _descriptor_2.alignment() }).encode() } },
                                                                                         'lt',
                                                                                         { popeq: { cached: true,
                                                                                                    result: undefined } }]).value)),
                            'the deadline lies more than 30 days ahead');
    const terms_0 = { request_hash: request_hash_0,
                      model: model_0,
                      model_length: length_0,
                      keys: keys_0,
                      buyer: buyer_0,
                      refund_to: refund_to_0,
                      deadline: until_0 };
    const at_0 = this._bountyId_0(terms_0, c_0.value);
    __compactRuntime.assert(!_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(6n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'this bounty exists');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(6n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(terms_0),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = { text: text_0, length: size_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(7n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(tmp_1),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    await this._receiveShielded_0(context, partialProofData, c_0);
    const tmp_2 = this._right_0(_descriptor_35.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                           partialProofData,
                                                                                           [
                                                                                            { dup: { n: 2 } },
                                                                                            { idx: { cached: true,
                                                                                                     pushPath: false,
                                                                                                     path: [
                                                                                                            { tag: 'value',
                                                                                                              value: { value: _descriptor_6.toValue(0n),
                                                                                                                       alignment: _descriptor_6.alignment() } }] } },
                                                                                            { popeq: { cached: true,
                                                                                                       result: undefined } }]).value));
    __compactRuntime.hasCoinCommitment(context, c_0, tmp_2) ? __compactRuntime.queryLedgerState(context,
                                                                                                partialProofData,
                                                                                                [
                                                                                                 { idx: { cached: false,
                                                                                                          pushPath: true,
                                                                                                          path: [
                                                                                                                 { tag: 'value',
                                                                                                                   value: { value: _descriptor_6.toValue(8n),
                                                                                                                            alignment: _descriptor_6.alignment() } }] } },
                                                                                                 { push: { storage: false,
                                                                                                           value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                                                        alignment: _descriptor_0.alignment() }).encode() } },
                                                                                                 { dup: { n: 5 } },
                                                                                                 { push: { storage: false,
                                                                                                           value: __compactRuntime.StateValue.newCell(__compactRuntime.runtimeCoinCommitment(
                                                                                                                                                        { value: _descriptor_33.toValue(c_0),
                                                                                                                                                          alignment: _descriptor_33.alignment() },
                                                                                                                                                        { value: _descriptor_36.toValue(tmp_2),
                                                                                                                                                          alignment: _descriptor_36.alignment() }
                                                                                                                                                      )).encode() } },
                                                                                                 { idx: { cached: true,
                                                                                                          pushPath: false,
                                                                                                          path: [
                                                                                                                 { tag: 'value',
                                                                                                                   value: { value: _descriptor_6.toValue(1n),
                                                                                                                            alignment: _descriptor_6.alignment() } },
                                                                                                                 { tag: 'stack' }] } },
                                                                                                 { push: { storage: false,
                                                                                                           value: __compactRuntime.StateValue.newCell({ value: _descriptor_33.toValue(c_0),
                                                                                                                                                        alignment: _descriptor_33.alignment() }).encode() } },
                                                                                                 { swap: { n: 0 } },
                                                                                                 { concat: { cached: true,
                                                                                                             n: 91 } },
                                                                                                 { ins: { cached: false,
                                                                                                          n: 1 } },
                                                                                                 { ins: { cached: true,
                                                                                                          n: 1 } }]) : (() => { throw new __compactRuntime.CompactError(`board.compact line 283 char 3: Coin commitment not found. Check the coin has been received (or call 'createZswapOutput')`); })();
    return [];
  }
  _littleEndian16_0(v_0) {
    return this._folder_13(((acc_0, byte_0) =>
                            {
                              return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                         256n),
                                                               byte_0);
                            }),
                           0n,
                           [v_0[15],
                            v_0[14],
                            v_0[13],
                            v_0[12],
                            v_0[11],
                            v_0[10],
                            v_0[9],
                            v_0[8],
                            v_0[7],
                            v_0[6],
                            v_0[5],
                            v_0[4],
                            v_0[3],
                            v_0[2],
                            v_0[1],
                            v_0[0]]);
  }
  _halves_0(key_0) {
    return [this._littleEndian16_0(((e) => e.slice(0, 16))(key_0)),
            this._littleEndian16_0(((e) => e.slice(16, 32))(key_0))];
  }
  async _keyOf_0(context, partialProofData, point_0) {
    const x_0 = Array.from(__compactRuntime.convertBigintToBytes(32,
                                                                 this._curve25519PointX_0(point_0),
                                                                 'board.compact line 298 char 14'),
                           BigInt);
    const y_0 = Array.from(__compactRuntime.convertBigintToBytes(32,
                                                                 this._curve25519PointY_0(point_0),
                                                                 'board.compact line 299 char 14'),
                           BigInt);
    const split_0 = this._lowBit_0(context, partialProofData, x_0[0]);
    __compactRuntime.assert(__compactRuntime.addField(split_0[0] ? 1n : 0n,
                                                      __compactRuntime.mulField(2n,
                                                                                split_0[1]))
                            ===
                            x_0[0],
                            'wrong low bit');
    const half_0 = this._halves_0(y_0);
    return [half_0[0],
            __compactRuntime.addField(half_0[1],
                                      __compactRuntime.mulField(split_0[0] ?
                                                                1n :
                                                                0n,
                                                                170141183460469231731687303715884105728n))];
  }
  _pinned_0(keys_0, key_0) {
    const zero_0 = 0n;
    return this._folder_14(((found_0, entry_0) =>
                            {
                              const half_0 = this._halves_0(Array.from(entry_0,
                                                                       BigInt));
                              return found_0
                                     ||
                                     !(half_0[0] === zero_0
                                       &&
                                       half_0[1] === zero_0)
                                     &&
                                     half_0[0] === key_0[0]
                                     &&
                                     half_0[1] === key_0[1];
                            }),
                           false,
                           keys_0);
  }
  _hexDigit_0(bits_0) {
    const b2_0 = bits_0[1] ? 1n : 0n;
    const b1_0 = bits_0[2] ? 1n : 0n;
    const value_0 = __compactRuntime.addField(__compactRuntime.addField(__compactRuntime.addField(__compactRuntime.mulField(bits_0[0]
                                                                                                                            ?
                                                                                                                            1n
                                                                                                                            :
                                                                                                                            0n,
                                                                                                                            8n),
                                                                                                  __compactRuntime.mulField(b2_0,
                                                                                                                            4n)),
                                                                        __compactRuntime.mulField(b1_0,
                                                                                                  2n)),
                                              bits_0[3] ? 1n : 0n);
    const letter_0 = __compactRuntime.mulField(bits_0[0] ? 1n : 0n,
                                               __compactRuntime.subField(__compactRuntime.addField(b2_0,
                                                                                                   b1_0),
                                                                         __compactRuntime.mulField(b2_0,
                                                                                                   b1_0)));
    return ((t1) => {
             if (t1 > 255n) {
               throw new __compactRuntime.CompactError('board.compact line 322 char 10: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
             }
             return t1;
           })(__compactRuntime.addField(__compactRuntime.addField(48n, value_0),
                                        __compactRuntime.mulField(39n, letter_0)));
  }
  async _hex8_0(context, partialProofData, v_0) {
    const d_0 = await this._mapper_5(context,
                                     partialProofData,
                                     (async (context, partialProofData, byte_0) =>
                                      {
                                        const bits_0 = this._bitsOfByte_0(context,
                                                                          partialProofData,
                                                                          byte_0);
                                        const packed_0 = await this._folder_15(context,
                                                                               partialProofData,
                                                                               (async (context,
                                                                                       partialProofData,
                                                                                       acc_0,
                                                                                       bit_0) =>
                                                                                {
                                                                                  return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                                                                             2n),
                                                                                                                   bit_0
                                                                                                                   ?
                                                                                                                   1n
                                                                                                                   :
                                                                                                                   0n);
                                                                                }),
                                                                               0n,
                                                                               bits_0);
                                        __compactRuntime.assert(packed_0
                                                                ===
                                                                byte_0,
                                                                'bits do not match the byte');
                                        return [this._hexDigit_0(((e) => e.slice(0, 4))(bits_0)),
                                                this._hexDigit_0(((e) => e.slice(4, 8))(bits_0))];
                                      }),
                                     v_0);
    return [d_0[0][0],
            d_0[0][1],
            d_0[1][0],
            d_0[1][1],
            d_0[2][0],
            d_0[2][1],
            d_0[3][0],
            d_0[3][1],
            d_0[4][0],
            d_0[4][1],
            d_0[5][0],
            d_0[5][1],
            d_0[6][0],
            d_0[6][1],
            d_0[7][0],
            d_0[7][1]];
  }
  async _hex32_0(context, partialProofData, hash_0) {
    const v_0 = Array.from(hash_0, BigInt);
    return [...await this._hex8_0(context,
                                  partialProofData,
                                  ((e) => e.slice(0, 8))(v_0)),
            ...await this._hex8_0(context,
                                  partialProofData,
                                  ((e) => e.slice(8, 16))(v_0)),
            ...await this._hex8_0(context,
                                  partialProofData,
                                  ((e) => e.slice(16, 24))(v_0)),
            ...await this._hex8_0(context,
                                  partialProofData,
                                  ((e) => e.slice(24, 32))(v_0))];
  }
  async _signedText_0(context, partialProofData, model_0, request_0, response_0)
  {
    return Uint8Array.from([...model_0,
                            58n,
                            ...await this._hex32_0(context,
                                                   partialProofData,
                                                   request_0),
                            58n,
                            ...await this._hex32_0(context,
                                                   partialProofData,
                                                   response_0)],
                           Number);
  }
  async _signedText_1(context, partialProofData, model_0, request_0, response_0)
  {
    return Uint8Array.from([...model_0,
                            58n,
                            ...await this._hex32_0(context,
                                                   partialProofData,
                                                   request_0),
                            58n,
                            ...await this._hex32_0(context,
                                                   partialProofData,
                                                   response_0)],
                           Number);
  }
  async _signedText_2(context, partialProofData, model_0, request_0, response_0)
  {
    return Uint8Array.from([...model_0,
                            58n,
                            ...await this._hex32_0(context,
                                                   partialProofData,
                                                   request_0),
                            58n,
                            ...await this._hex32_0(context,
                                                   partialProofData,
                                                   response_0)],
                           Number);
  }
  async _settle_0(context,
                  partialProofData,
                  bounty_0,
                  drop_0,
                  signature_0,
                  point_0)
  {
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(8n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(bounty_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the bounty is not open');
    const wanted_0 = _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_6.toValue(6n),
                                                                                                           alignment: _descriptor_6.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(bounty_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    let tmp_0;
    __compactRuntime.assert((tmp_0 = wanted_0.deadline,
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the deadline has passed');
    __compactRuntime.assert(wanted_0.model_length === 16n,
                            "the model's name has another length");
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(3n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(drop_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no such drop');
    __compactRuntime.assert(_descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(3n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_0.toValue(drop_0),
                                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value).done,
                            'the drop is not sealed');
    const answered_0 = _descriptor_21.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 0 } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_6.toValue(2n),
                                                                                                              alignment: _descriptor_6.alignment() } }] } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_0.toValue(drop_0),
                                                                                                              alignment: _descriptor_0.alignment() } }] } },
                                                                                   { popeq: { cached: false,
                                                                                              result: undefined } }]).value);
    let tmp_1;
    __compactRuntime.assert((tmp_1 = (answered_0.day + this._dropAnswersDays_0())
                                     *
                                     86400n,
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_1),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the drop is too old to answer with');
    __compactRuntime.assert(this._pinned_0(wanted_0.keys,
                                           await this._keyOf_0(context,
                                                               partialProofData,
                                                               point_0)),
                            'the bounty does not name this key');
    const name_0 = ((e) => e.slice(0, 16))(Array.from(wanted_0.model, BigInt));
    __compactRuntime.assert(this._ed25519Verify_0(await this._signedText_0(context,
                                                                           partialProofData,
                                                                           name_0,
                                                                           wanted_0.request_hash,
                                                                           answered_0.content_hash),
                                                  signature_0,
                                                  point_0),
                            'the TEE did not sign this answer');
    const key_0 = this._contentKey_0(context, partialProofData);
    __compactRuntime.assert(this._equal_11(this._persistentHash_4(key_0),
                                           answered_0.key_hash),
                            'not the key behind the hash');
    const tmp_2 = { drop: drop_0,
                    handover:
                      await this._handOver_0(context,
                                             partialProofData,
                                             wanted_0.buyer,
                                             key_0) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(9n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(bounty_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(tmp_2),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const coin_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(8n),
                                                                                                         alignment: _descriptor_6.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(bounty_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    await this._sendShielded_0(context,
                               partialProofData,
                               coin_0,
                               this._left_0({ bytes: answered_0.payout }),
                               coin_0.value);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(8n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(bounty_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _settle_1(context,
                  partialProofData,
                  bounty_0,
                  drop_0,
                  signature_0,
                  point_0)
  {
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(8n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(bounty_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the bounty is not open');
    const wanted_0 = _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_6.toValue(6n),
                                                                                                           alignment: _descriptor_6.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(bounty_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    let tmp_0;
    __compactRuntime.assert((tmp_0 = wanted_0.deadline,
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the deadline has passed');
    __compactRuntime.assert(wanted_0.model_length === 24n,
                            "the model's name has another length");
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(3n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(drop_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no such drop');
    __compactRuntime.assert(_descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(3n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_0.toValue(drop_0),
                                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value).done,
                            'the drop is not sealed');
    const answered_0 = _descriptor_21.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 0 } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_6.toValue(2n),
                                                                                                              alignment: _descriptor_6.alignment() } }] } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_0.toValue(drop_0),
                                                                                                              alignment: _descriptor_0.alignment() } }] } },
                                                                                   { popeq: { cached: false,
                                                                                              result: undefined } }]).value);
    let tmp_1;
    __compactRuntime.assert((tmp_1 = (answered_0.day + this._dropAnswersDays_0())
                                     *
                                     86400n,
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_1),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the drop is too old to answer with');
    __compactRuntime.assert(this._pinned_0(wanted_0.keys,
                                           await this._keyOf_0(context,
                                                               partialProofData,
                                                               point_0)),
                            'the bounty does not name this key');
    const name_0 = ((e) => e.slice(0, 24))(Array.from(wanted_0.model, BigInt));
    __compactRuntime.assert(this._ed25519Verify_1(await this._signedText_1(context,
                                                                           partialProofData,
                                                                           name_0,
                                                                           wanted_0.request_hash,
                                                                           answered_0.content_hash),
                                                  signature_0,
                                                  point_0),
                            'the TEE did not sign this answer');
    const key_0 = this._contentKey_0(context, partialProofData);
    __compactRuntime.assert(this._equal_12(this._persistentHash_4(key_0),
                                           answered_0.key_hash),
                            'not the key behind the hash');
    const tmp_2 = { drop: drop_0,
                    handover:
                      await this._handOver_0(context,
                                             partialProofData,
                                             wanted_0.buyer,
                                             key_0) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(9n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(bounty_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(tmp_2),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const coin_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(8n),
                                                                                                         alignment: _descriptor_6.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(bounty_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    await this._sendShielded_0(context,
                               partialProofData,
                               coin_0,
                               this._left_0({ bytes: answered_0.payout }),
                               coin_0.value);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(8n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(bounty_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _settle_2(context,
                  partialProofData,
                  bounty_0,
                  drop_0,
                  signature_0,
                  point_0)
  {
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(8n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(bounty_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the bounty is not open');
    const wanted_0 = _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_6.toValue(6n),
                                                                                                           alignment: _descriptor_6.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(bounty_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    let tmp_0;
    __compactRuntime.assert((tmp_0 = wanted_0.deadline,
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the deadline has passed');
    __compactRuntime.assert(wanted_0.model_length === 36n,
                            "the model's name has another length");
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(3n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(drop_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no such drop');
    __compactRuntime.assert(_descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(3n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_0.toValue(drop_0),
                                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value).done,
                            'the drop is not sealed');
    const answered_0 = _descriptor_21.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 0 } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_6.toValue(2n),
                                                                                                              alignment: _descriptor_6.alignment() } }] } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_0.toValue(drop_0),
                                                                                                              alignment: _descriptor_0.alignment() } }] } },
                                                                                   { popeq: { cached: false,
                                                                                              result: undefined } }]).value);
    let tmp_1;
    __compactRuntime.assert((tmp_1 = (answered_0.day + this._dropAnswersDays_0())
                                     *
                                     86400n,
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_1),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the drop is too old to answer with');
    __compactRuntime.assert(this._pinned_0(wanted_0.keys,
                                           await this._keyOf_0(context,
                                                               partialProofData,
                                                               point_0)),
                            'the bounty does not name this key');
    const name_0 = ((e) => e.slice(0, 36))(Array.from(wanted_0.model, BigInt));
    __compactRuntime.assert(this._ed25519Verify_2(await this._signedText_2(context,
                                                                           partialProofData,
                                                                           name_0,
                                                                           wanted_0.request_hash,
                                                                           answered_0.content_hash),
                                                  signature_0,
                                                  point_0),
                            'the TEE did not sign this answer');
    const key_0 = this._contentKey_0(context, partialProofData);
    __compactRuntime.assert(this._equal_13(this._persistentHash_4(key_0),
                                           answered_0.key_hash),
                            'not the key behind the hash');
    const tmp_2 = { drop: drop_0,
                    handover:
                      await this._handOver_0(context,
                                             partialProofData,
                                             wanted_0.buyer,
                                             key_0) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(9n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(bounty_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(tmp_2),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const coin_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(8n),
                                                                                                         alignment: _descriptor_6.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(bounty_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    await this._sendShielded_0(context,
                               partialProofData,
                               coin_0,
                               this._left_0({ bytes: answered_0.payout }),
                               coin_0.value);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(8n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(bounty_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _answer_16_0(context,
                     partialProofData,
                     bounty_0,
                     drop_0,
                     signature_0,
                     point_0)
  {
    await this._settle_0(context,
                         partialProofData,
                         bounty_0,
                         drop_0,
                         signature_0,
                         point_0);
    return [];
  }
  async _answer_24_0(context,
                     partialProofData,
                     bounty_0,
                     drop_0,
                     signature_0,
                     point_0)
  {
    await this._settle_1(context,
                         partialProofData,
                         bounty_0,
                         drop_0,
                         signature_0,
                         point_0);
    return [];
  }
  async _answer_36_0(context,
                     partialProofData,
                     bounty_0,
                     drop_0,
                     signature_0,
                     point_0)
  {
    await this._settle_2(context,
                         partialProofData,
                         bounty_0,
                         drop_0,
                         signature_0,
                         point_0);
    return [];
  }
  _coinKeyOf_0(secret_0) {
    const tag_0 = Array.from(new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 112, 107, 91, 118, 49, 93]),
                             BigInt);
    return this._persistentHash_5(Uint8Array.from([...tag_0,
                                                   ...Array.from(secret_0,
                                                                 BigInt)],
                                                  Number));
  }
  async _refund_bounty_0(context, partialProofData, bounty_0) {
    const at_0 = bounty_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(8n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the bounty is not open');
    const wanted_0 = _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_6.toValue(6n),
                                                                                                           alignment: _descriptor_6.alignment() } }] } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_0.toValue(at_0),
                                                                                                           alignment: _descriptor_0.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
    let tmp_0;
    __compactRuntime.assert((tmp_0 = wanted_0.deadline,
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        { dup: { n: 3 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the deadline has not passed');
    const holder_0 = this._equal_14(this._coinKeyOf_0(this._coinSecretKey_0(context,
                                                                            partialProofData)),
                                    wanted_0.refund_to);
    let tmp_1;
    __compactRuntime.assert(holder_0
                            ||
                            (tmp_1 = ((t1) => {
                                       if (t1 > 18446744073709551615n) {
                                         throw new __compactRuntime.CompactError('board.compact line 401 char 48: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                       }
                                       return t1;
                                     })(wanted_0.deadline + this._bountyTime_0()),
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_1),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        { dup: { n: 3 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'only the holder of the refund key refunds in the first 30 days');
    const coin_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(8n),
                                                                                                         alignment: _descriptor_6.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(at_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    await this._sendShielded_0(context,
                               partialProofData,
                               coin_0,
                               this._left_0({ bytes: wanted_0.refund_to }),
                               coin_0.value);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(8n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _forget_bounty_0(context, partialProofData, bounty_0) {
    const at_0 = bounty_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_6.toValue(6n),
                                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no such bounty');
    __compactRuntime.assert(!_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(8n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'the reward is still on the board');
    let tmp_0;
    __compactRuntime.assert((tmp_0 = ((t1) => {
                                       if (t1 > 18446744073709551615n) {
                                         throw new __compactRuntime.CompactError('board.compact line 412 char 38: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                       }
                                       return t1;
                                     })(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                  partialProofData,
                                                                                                  [
                                                                                                   { dup: { n: 0 } },
                                                                                                   { idx: { cached: false,
                                                                                                            pushPath: false,
                                                                                                            path: [
                                                                                                                   { tag: 'value',
                                                                                                                     value: { value: _descriptor_6.toValue(6n),
                                                                                                                              alignment: _descriptor_6.alignment() } }] } },
                                                                                                   { idx: { cached: false,
                                                                                                            pushPath: false,
                                                                                                            path: [
                                                                                                                   { tag: 'value',
                                                                                                                     value: { value: _descriptor_0.toValue(at_0),
                                                                                                                              alignment: _descriptor_0.alignment() } }] } },
                                                                                                   { popeq: { cached: false,
                                                                                                              result: undefined } }]).value).deadline
                                        +
                                        this._bountyTime_0()),
                             _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        { dup: { n: 3 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the bounty is still kept');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(6n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_6.toValue(7n),
                                                                  alignment: _descriptor_6.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    if (_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                  partialProofData,
                                                                  [
                                                                   { dup: { n: 0 } },
                                                                   { idx: { cached: false,
                                                                            pushPath: false,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_6.toValue(9n),
                                                                                              alignment: _descriptor_6.alignment() } }] } },
                                                                   { push: { storage: false,
                                                                             value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                                          alignment: _descriptor_0.alignment() }).encode() } },
                                                                   'member',
                                                                   { popeq: { cached: true,
                                                                              result: undefined } }]).value))
    {
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_6.toValue(9n),
                                                                    alignment: _descriptor_6.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(at_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { rem: { cached: false } },
                                         { ins: { cached: true, n: 1 } }]);
    }
    return [];
  }
  _folder_0(f, x, a0) {
    for (let i = 0; i < 16; i++) { x = f(x, a0[i]); }
    return x;
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (x0.x != y0.x || x0.y != y0.y) {
      return false;
    }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (x0.x != y0.x || x0.y != y0.y) {
      return false;
    }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (x0.x != y0.x || x0.y != y0.y) {
      return false;
    }
    return true;
  }
  async _folder_1(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 35; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _mapper_0(context, partialProofData, f, a0) {
    let a = [];
    for (let i = 0; i < 32; i++) { a[i] = await f(context, partialProofData, a0[i]); }
    return a;
  }
  _folder_2(f, x, a0, a1, a2) {
    for (let i = 0; i < 32; i++) { x = f(x, a0[i], a1[i], a2[i]); }
    return x;
  }
  _folder_3(f, x, a0, a1, a2) {
    for (let i = 0; i < 32; i++) { x = f(x, a0[i], a1[i], a2[i]); }
    return x;
  }
  async _mapper_1(context, partialProofData, f, a0) {
    let a = [];
    for (let i = 0; i < 8; i++) { a[i] = await f(context, partialProofData, a0[i]); }
    return a;
  }
  async _mapper_2(context, partialProofData, f, a0) {
    let a = [];
    for (let i = 0; i < 16; i++) { a[i] = await f(context, partialProofData, a0[i]); }
    return a;
  }
  async _folder_4(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 48; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _folder_5(context, partialProofData, f, x, a0, a1) {
    for (let i = 0; i < 16; i++) { x = await f(context, partialProofData, x, a0[i], a1[i]); }
    return x;
  }
  async _mapper_3(context, partialProofData, f, a0, a1) {
    let a = [];
    for (let i = 0; i < 8; i++) { a[i] = await f(context, partialProofData, a0[i], a1[i]); }
    return a;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _folder_6(f, x, a0) {
    for (let i = 0; i < 4; i++) { x = f(x, a0[i]); }
    return x;
  }
  _folder_7(f, x, a0) {
    for (let i = 0; i < 7; i++) { x = f(x, a0[i]); }
    return x;
  }
  _folder_8(f, x, a0) {
    for (let i = 0; i < 7; i++) { x = f(x, a0[i]); }
    return x;
  }
  _folder_9(f, x, a0) {
    for (let i = 0; i < 2; i++) { x = f(x, a0[i]); }
    return x;
  }
  async _mapper_4(context, partialProofData, f, a0) {
    let a = [];
    for (let i = 0; i < 8; i++) { a[i] = await f(context, partialProofData, a0[i]); }
    return a;
  }
  _equal_8(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  async _folder_10(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 56; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _folder_11(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _folder_12(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_9(x0, y0) {
    for (let i0 = 0; i0 < 8; i0++) {
      let x1 = x0[i0];
      let y1 = y0[i0];
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  _equal_10(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _folder_13(f, x, a0) {
    for (let i = 0; i < 16; i++) { x = f(x, a0[i]); }
    return x;
  }
  _folder_14(f, x, a0) {
    for (let i = 0; i < 4; i++) { x = f(x, a0[i]); }
    return x;
  }
  async _folder_15(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _mapper_5(context, partialProofData, f, a0) {
    let a = [];
    for (let i = 0; i < 8; i++) { a[i] = await f(context, partialProofData, a0[i]); }
    return a;
  }
  _equal_11(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_12(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_13(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_14(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    callContext: { currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() },
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get bridge() {
      return _descriptor_35.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(0n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    get token() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    drops: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(2n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(2n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'board.compact line 39 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(2n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'board.compact line 39 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_21.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_6.toValue(2n),
                                                                                                      alignment: _descriptor_6.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_0.toValue(key_0),
                                                                                                      alignment: _descriptor_0.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_21.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    seals: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(3n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(3n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'board.compact line 40 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(3n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'board.compact line 40 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_6.toValue(3n),
                                                                                                      alignment: _descriptor_6.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_0.toValue(key_0),
                                                                                                      alignment: _descriptor_0.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[3];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_20.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    cipher: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(4n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(4n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'board.compact line 42 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(4n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'board.compact line 42 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        if (state.asArray()[4].asMap().get({ value: _descriptor_0.toValue(key_0),
                                             alignment: _descriptor_0.alignment() }) === undefined) {
          throw new __compactRuntime.CompactError(`Map value undefined for ${key_0}`);
        }
        return {
          isEmpty(...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_1.length}`);
            }
            return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(4n),
                                                                                                         alignment: _descriptor_6.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(key_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              'size',
                                                                              { push: { storage: false,
                                                                                        value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                     alignment: _descriptor_2.alignment() }).encode() } },
                                                                              'eq',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          size(...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_1.length}`);
            }
            return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(4n),
                                                                                                         alignment: _descriptor_6.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(key_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              'size',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          member(...args_1) {
            if (args_1.length !== 1) {
              throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_1.length}`);
            }
            const key_1 = args_1[0];
            if (!(typeof(key_1) === 'bigint' && key_1 >= 0n && key_1 <= 4294967295n)) {
              __compactRuntime.typeError('member',
                                         'argument 1',
                                         'board.compact line 42 char 38',
                                         'Uint<0..4294967296>',
                                         key_1)
            }
            return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(4n),
                                                                                                         alignment: _descriptor_6.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(key_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { push: { storage: false,
                                                                                        value: __compactRuntime.StateValue.newCell({ value: _descriptor_19.toValue(key_1),
                                                                                                                                     alignment: _descriptor_19.alignment() }).encode() } },
                                                                              'member',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          lookup(...args_1) {
            if (args_1.length !== 1) {
              throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_1.length}`);
            }
            const key_1 = args_1[0];
            if (!(typeof(key_1) === 'bigint' && key_1 >= 0n && key_1 <= 4294967295n)) {
              __compactRuntime.typeError('lookup',
                                         'argument 1',
                                         'board.compact line 42 char 38',
                                         'Uint<0..4294967296>',
                                         key_1)
            }
            return _descriptor_37.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_6.toValue(4n),
                                                                                                          alignment: _descriptor_6.alignment() } },
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_0.toValue(key_0),
                                                                                                          alignment: _descriptor_0.alignment() } }] } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_19.toValue(key_1),
                                                                                                          alignment: _descriptor_19.alignment() } }] } },
                                                                               { popeq: { cached: false,
                                                                                          result: undefined } }]).value);
          },
          [Symbol.iterator](...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_1.length}`);
            }
            const self_0 = state.asArray()[4].asMap().get({ value: _descriptor_0.toValue(key_0),
                                                            alignment: _descriptor_0.alignment() });
            return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_19.fromValue(key.value),      _descriptor_37.fromValue(value.value)    ];  })[Symbol.iterator]();
          }
        }
      }
    },
    marks: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(5n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(5n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 4294967295n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'board.compact line 44 char 1',
                                     'Uint<0..4294967296>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(5n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_19.toValue(key_0),
                                                                                                                                 alignment: _descriptor_19.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 4294967295n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'board.compact line 44 char 1',
                                     'Uint<0..4294967296>',
                                     key_0)
        }
        if (state.asArray()[5].asMap().get({ value: _descriptor_19.toValue(key_0),
                                             alignment: _descriptor_19.alignment() }) === undefined) {
          throw new __compactRuntime.CompactError(`Map value undefined for ${key_0}`);
        }
        return {
          isEmpty(...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_1.length}`);
            }
            return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(5n),
                                                                                                         alignment: _descriptor_6.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_19.toValue(key_0),
                                                                                                         alignment: _descriptor_19.alignment() } }] } },
                                                                              'size',
                                                                              { push: { storage: false,
                                                                                        value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                     alignment: _descriptor_2.alignment() }).encode() } },
                                                                              'eq',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          size(...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_1.length}`);
            }
            return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(5n),
                                                                                                         alignment: _descriptor_6.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_19.toValue(key_0),
                                                                                                         alignment: _descriptor_19.alignment() } }] } },
                                                                              'size',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          member(...args_1) {
            if (args_1.length !== 1) {
              throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_1.length}`);
            }
            const elem_0 = args_1[0];
            if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
              __compactRuntime.typeError('member',
                                         'argument 1',
                                         'board.compact line 44 char 36',
                                         'Bytes<32>',
                                         elem_0)
            }
            return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_6.toValue(5n),
                                                                                                         alignment: _descriptor_6.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_19.toValue(key_0),
                                                                                                         alignment: _descriptor_19.alignment() } }] } },
                                                                              { push: { storage: false,
                                                                                        value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(elem_0),
                                                                                                                                     alignment: _descriptor_0.alignment() }).encode() } },
                                                                              'member',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          [Symbol.iterator](...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_1.length}`);
            }
            const self_0 = state.asArray()[5].asMap().get({ value: _descriptor_19.toValue(key_0),
                                                            alignment: _descriptor_19.alignment() });
            return self_0.asMap().keys().map((elem) => _descriptor_0.fromValue(elem.value))[Symbol.iterator]();
          }
        }
      }
    },
    bounties: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(6n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(6n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'board.compact line 46 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(6n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'board.compact line 46 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(6n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[6];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_9.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    requests: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(7n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(7n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'board.compact line 48 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(7n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'board.compact line 48 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_12.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_6.toValue(7n),
                                                                                                      alignment: _descriptor_6.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_0.toValue(key_0),
                                                                                                      alignment: _descriptor_0.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[7];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_12.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    rewards: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(8n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(8n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'board.compact line 50 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(8n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'board.compact line 50 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(8n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[8];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_3.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    answers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(9n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(9n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'board.compact line 51 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_6.toValue(9n),
                                                                                                     alignment: _descriptor_6.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'board.compact line 51 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_15.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_6.toValue(9n),
                                                                                                      alignment: _descriptor_6.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_0.toValue(key_0),
                                                                                                      alignment: _descriptor_0.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[9];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_15.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  callContext: { currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() }
};
const _dummyContract = new Contract({
  bitsOf: (...args) => undefined,
  memberSecret: (...args) => undefined,
  memberPath: (...args) => undefined,
  memberSlot: (...args) => undefined,
  contentKey: (...args) => undefined,
  contentBlock: (...args) => undefined,
  sealState: (...args) => undefined,
  sealBlind: (...args) => undefined,
  sealNextBlind: (...args) => undefined,
  handoverNonce: (...args) => undefined,
  coinSecretKey: (...args) => undefined,
  bitsOfByte: (...args) => undefined,
  lowBit: (...args) => undefined
});
export const pureCircuits = {
  bountyId: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`bountyId: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const terms_0 = args_0[0];
    const reward_0 = args_0[1];
    if (!(typeof(terms_0) === 'object' && terms_0.request_hash.buffer instanceof ArrayBuffer && terms_0.request_hash.BYTES_PER_ELEMENT === 1 && terms_0.request_hash.length === 32 && terms_0.model.buffer instanceof ArrayBuffer && terms_0.model.BYTES_PER_ELEMENT === 1 && terms_0.model.length === 48 && typeof(terms_0.model_length) === 'bigint' && terms_0.model_length >= 0n && terms_0.model_length <= 255n && Array.isArray(terms_0.keys) && terms_0.keys.length === 4 && terms_0.keys.every((t) => t.buffer instanceof ArrayBuffer && t.BYTES_PER_ELEMENT === 1 && t.length === 32) && typeof(terms_0.buyer.x) === 'bigint' && terms_0.buyer.x >= 0n && terms_0.buyer.x <= __compactRuntime.MAX_FIELD && typeof(terms_0.buyer.y) === 'bigint' && terms_0.buyer.y >= 0n && terms_0.buyer.y <= __compactRuntime.MAX_FIELD && terms_0.refund_to.buffer instanceof ArrayBuffer && terms_0.refund_to.BYTES_PER_ELEMENT === 1 && terms_0.refund_to.length === 32 && typeof(terms_0.deadline) === 'bigint' && terms_0.deadline >= 0n && terms_0.deadline <= 18446744073709551615n)) {
      __compactRuntime.typeError('bountyId',
                                 'argument 1',
                                 'board.compact line 253 char 1',
                                 'struct Bounty<request_hash: Bytes<32>, model: Bytes<48>, model_length: Uint<0..256>, keys: Vector<4, Bytes<32>>, buyer: JubjubPoint, refund_to: Bytes<32>, deadline: Uint<0..18446744073709551616>>',
                                 terms_0)
    }
    if (!(typeof(reward_0) === 'bigint' && reward_0 >= 0n && reward_0 <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.typeError('bountyId',
                                 'argument 2',
                                 'board.compact line 253 char 1',
                                 'Uint<0..340282366920938463463374607431768211456>',
                                 reward_0)
    }
    return _dummyContract._bountyId_0(terms_0, reward_0);
  }
};
export const expectedVk = {
  'answer_16': '126ead8cdc77cd8ea4bb89f533d597c1e4e384ac67e3baa38d27d8ff0aa2c65d',
  'answer_24': '58b395a1f1ba9dd8d03d91c4aeac89836df451cea23f15e771d1e3d62c4ceac4',
  'answer_36': '844965531724df5f5f5dbcb9b3cdef684a83eef576777a9148842cc3b425baf1',
  'forget_bounty': 'b0a24374ca060aa9f01238bf65f65dd142a134386c9cefd3c9f3eb27e646048a',
  'forget_drop': '3d094559385d012121aeff069edb2d1b6dd89b0ecabc14b99712f0971916f8d4',
  'forget_marks': 'e11aacfac4fe0090bd97ec1927cfd064eeb78410aa362df90ba04599074b4aab',
  'post_bounty': '4ee5257b3dda14534b11d8e3187b936a78dd79fbeb711d93843180926ea4448b',
  'refund_bounty': '7d7f0211678799aaa734d2a3fb8fad1b716f0f36adf488d5be6131bab0d6f49a',
  'seal_begin': '9d10dc34d3db284e8c68f3f60f7b8fc716b4f83e5ee29dc4585dca67c7501c8b',
  'seal_block': '5a1b417e4dd1ff95dbe4b5359fc9b7cca22c0f19d93aa99ec2b7e389bce5fade',
  'seal_finish': '80560d4bf87b02221069c66053e41edb71dadbd8b23a3b4b6fb8f4c8ea0c4bd0',
};

export const circuitSignatures = {
  'forget_marks': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '4294967295'}], resultType: {tag: 'Tuple', types: []}},
  'seal_begin': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '4294967295'}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '4294967295'}], resultType: {tag: 'Tuple', types: []}},
  'seal_block': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'seal_finish': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'forget_drop': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'bountyId': {pure: true, provable: false, argumentTypes: [{tag: 'Struct', name: 'Bounty', elements: [{name: 'request_hash', type: {tag: 'Bytes', length: 32}}, {name: 'model', type: {tag: 'Bytes', length: 48}}, {name: 'model_length', type: {tag: 'Uint', maxval: '255'}}, {name: 'keys', type: {tag: 'Vector', length: 4, type: {tag: 'Bytes', length: 32}}}, {name: 'buyer', type: {tag: 'JubjubPoint'}}, {name: 'refund_to', type: {tag: 'Bytes', length: 32}}, {name: 'deadline', type: {tag: 'Uint', maxval: '18446744073709551615'}}]}, {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}], resultType: {tag: 'Bytes', length: 32}},
  'post_bounty': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 48}, {tag: 'Uint', maxval: '255'}, {tag: 'Vector', length: 4, type: {tag: 'Bytes', length: 32}}, {tag: 'Bytes', length: 512}, {tag: 'Uint', maxval: '65535'}, {tag: 'Struct', name: 'ShieldedCoinInfo', elements: [{name: 'nonce', type: {tag: 'Bytes', length: 32}}, {name: 'color', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}}]}, {tag: 'JubjubPoint'}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '4294967295'}], resultType: {tag: 'Tuple', types: []}},
  'answer_16': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Struct', name: 'Ed25519Signature', elements: [{name: 'r', type: {tag: 'Curve25519Point'}}, {name: 's', type: {tag: 'Curve25519Scalar'}}]}, {tag: 'Curve25519Point'}], resultType: {tag: 'Tuple', types: []}},
  'answer_24': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Struct', name: 'Ed25519Signature', elements: [{name: 'r', type: {tag: 'Curve25519Point'}}, {name: 's', type: {tag: 'Curve25519Scalar'}}]}, {tag: 'Curve25519Point'}], resultType: {tag: 'Tuple', types: []}},
  'answer_36': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Struct', name: 'Ed25519Signature', elements: [{name: 'r', type: {tag: 'Curve25519Point'}}, {name: 's', type: {tag: 'Curve25519Scalar'}}]}, {tag: 'Curve25519Point'}], resultType: {tag: 'Tuple', types: []}},
  'refund_bounty': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'forget_bounty': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
};

export const declaredInterfaces = {
  'Bridge': {'known_root': {argumentTypes: [{tag: 'Struct', name: 'MerkleTreeDigest', elements: [{name: 'field', type: {tag: 'Field'}}]}], resultType: {tag: 'Tuple', types: []}}},
};

//# sourceMappingURL=index.js.map
