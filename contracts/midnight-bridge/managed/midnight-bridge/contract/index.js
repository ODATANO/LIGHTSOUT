import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.21.0');

export var Stale;
(function (Stale) {
  Stale[Stale['header'] = 0] = 'header';
  Stale[Stale['read'] = 1] = 'read';
  Stale[Stale['block'] = 2] = 'block';
})(Stale || (Stale = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

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

const _descriptor_1 = new _ContractAddress_0();

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_3 = new __compactRuntime.CompactTypeBytes(64);

const _descriptor_4 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _Burn_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment()));
  }
  fromValue(value_0) {
    return {
      id: _descriptor_0.fromValue(value_0),
      near_recipient: _descriptor_3.fromValue(value_0),
      value: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.id).concat(_descriptor_3.toValue(value_0.near_recipient).concat(_descriptor_4.toValue(value_0.value)));
  }
}

const _descriptor_5 = new _Burn_0();

const _descriptor_6 = new __compactRuntime.CompactTypeBytes(288);

class _ShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_4.alignment()));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_0.fromValue(value_0),
      color: _descriptor_0.fromValue(value_0),
      value: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.nonce).concat(_descriptor_0.toValue(value_0.color).concat(_descriptor_4.toValue(value_0.value)));
  }
}

const _descriptor_7 = new _ShieldedCoinInfo_0();

const _descriptor_8 = __compactRuntime.CompactTypeBoolean;

class _NameCheck_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_8.alignment());
  }
  fromValue(value_0) {
    return {
      ended: _descriptor_8.fromValue(value_0),
      separator: _descriptor_8.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.ended).concat(_descriptor_8.toValue(value_0.separator));
  }
}

const _descriptor_9 = new _NameCheck_0();

const _descriptor_10 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _Lock_0 {
  alignment() {
    return _descriptor_10.alignment().concat(_descriptor_0.alignment());
  }
  fromValue(value_0) {
    return {
      amount: _descriptor_10.fromValue(value_0),
      recipient: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_10.toValue(value_0.amount).concat(_descriptor_0.toValue(value_0.recipient));
  }
}

const _descriptor_11 = new _Lock_0();

const _descriptor_12 = __compactRuntime.CompactTypeField;

class _MerkleTreeDigest_0 {
  alignment() {
    return _descriptor_12.alignment();
  }
  fromValue(value_0) {
    return {
      field: _descriptor_12.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_12.toValue(value_0.field);
  }
}

const _descriptor_13 = new _MerkleTreeDigest_0();

class _Known_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_10.alignment());
  }
  fromValue(value_0) {
    return {
      outcomes: _descriptor_0.fromValue(value_0),
      at: _descriptor_10.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.outcomes).concat(_descriptor_10.toValue(value_0.at));
  }
}

const _descriptor_14 = new _Known_0();

const _descriptor_15 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

const _descriptor_16 = new __compactRuntime.CompactTypeBytes(8);

const _descriptor_17 = new __compactRuntime.CompactTypeBytes(16);

class _Level_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_2.alignment());
  }
  fromValue(value_0) {
    return {
      hash: _descriptor_0.fromValue(value_0),
      side: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.hash).concat(_descriptor_2.toValue(value_0.side));
  }
}

const _descriptor_18 = new _Level_0();

const _descriptor_19 = new __compactRuntime.CompactTypeVector(16, _descriptor_18);

const _descriptor_20 = new __compactRuntime.CompactTypeVector(10, _descriptor_18);

const _descriptor_21 = new __compactRuntime.CompactTypeVector(8, _descriptor_2);

const _descriptor_22 = new __compactRuntime.CompactTypeVector(16, _descriptor_2);

const _descriptor_23 = new __compactRuntime.CompactTypeBytes(26);

const _descriptor_24 = new __compactRuntime.CompactTypeEnum(2, 1);

const _descriptor_25 = new __compactRuntime.CompactTypeVector(4, _descriptor_8);

class _Head_0 {
  alignment() {
    return _descriptor_10.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()))));
  }
  fromValue(value_0) {
    return {
      height: _descriptor_10.fromValue(value_0),
      epoch: _descriptor_0.fromValue(value_0),
      nextEpoch: _descriptor_0.fromValue(value_0),
      nextProducers: _descriptor_0.fromValue(value_0),
      blockRoot: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_10.toValue(value_0.height).concat(_descriptor_0.toValue(value_0.epoch).concat(_descriptor_0.toValue(value_0.nextEpoch).concat(_descriptor_0.toValue(value_0.nextProducers).concat(_descriptor_0.toValue(value_0.blockRoot)))));
  }
}

const _descriptor_26 = new _Head_0();

class _Tip_0 {
  alignment() {
    return _descriptor_26.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment())))));
  }
  fromValue(value_0) {
    return {
      head: _descriptor_26.fromValue(value_0),
      era: _descriptor_12.fromValue(value_0),
      total: _descriptor_12.fromValue(value_0),
      nextTotal: _descriptor_12.fromValue(value_0),
      list: _descriptor_12.fromValue(value_0),
      nextList: _descriptor_12.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_26.toValue(value_0.head).concat(_descriptor_12.toValue(value_0.era).concat(_descriptor_12.toValue(value_0.total).concat(_descriptor_12.toValue(value_0.nextTotal).concat(_descriptor_12.toValue(value_0.list).concat(_descriptor_12.toValue(value_0.nextList))))));
  }
}

const _descriptor_27 = new _Tip_0();

const _descriptor_28 = new __compactRuntime.CompactTypeBytes(208);

const _descriptor_29 = new __compactRuntime.CompactTypeVector(34, _descriptor_18);

const _descriptor_30 = new __compactRuntime.CompactTypeVector(8, _descriptor_12);

class _Parse_0 {
  alignment() {
    return _descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment())))))))))))))));
  }
  fromValue(value_0) {
    return {
      phase: _descriptor_12.fromValue(value_0),
      rem: _descriptor_12.fromValue(value_0),
      scale: _descriptor_12.fromValue(value_0),
      count: _descriptor_12.fromValue(value_0),
      len: _descriptor_12.fromValue(value_0),
      keyLow: _descriptor_12.fromValue(value_0),
      keyHigh: _descriptor_12.fromValue(value_0),
      stake: _descriptor_12.fromValue(value_0),
      index: _descriptor_12.fromValue(value_0),
      total: _descriptor_12.fromValue(value_0),
      left: _descriptor_12.fromValue(value_0),
      ended: _descriptor_12.fromValue(value_0),
      emitted: _descriptor_12.fromValue(value_0),
      outLow: _descriptor_12.fromValue(value_0),
      outHigh: _descriptor_12.fromValue(value_0),
      outStake: _descriptor_12.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_12.toValue(value_0.phase).concat(_descriptor_12.toValue(value_0.rem).concat(_descriptor_12.toValue(value_0.scale).concat(_descriptor_12.toValue(value_0.count).concat(_descriptor_12.toValue(value_0.len).concat(_descriptor_12.toValue(value_0.keyLow).concat(_descriptor_12.toValue(value_0.keyHigh).concat(_descriptor_12.toValue(value_0.stake).concat(_descriptor_12.toValue(value_0.index).concat(_descriptor_12.toValue(value_0.total).concat(_descriptor_12.toValue(value_0.left).concat(_descriptor_12.toValue(value_0.ended).concat(_descriptor_12.toValue(value_0.emitted).concat(_descriptor_12.toValue(value_0.outLow).concat(_descriptor_12.toValue(value_0.outHigh).concat(_descriptor_12.toValue(value_0.outStake))))))))))))))));
  }
}

const _descriptor_31 = new _Parse_0();

class _Reader_0 {
  alignment() {
    return _descriptor_30.alignment().concat(_descriptor_31.alignment().concat(_descriptor_12.alignment().concat(_descriptor_0.alignment().concat(_descriptor_12.alignment().concat(_descriptor_8.alignment())))));
  }
  fromValue(value_0) {
    return {
      sha: _descriptor_30.fromValue(value_0),
      parse: _descriptor_31.fromValue(value_0),
      bitLength: _descriptor_12.fromValue(value_0),
      expected: _descriptor_0.fromValue(value_0),
      filling: _descriptor_12.fromValue(value_0),
      active: _descriptor_8.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_30.toValue(value_0.sha).concat(_descriptor_31.toValue(value_0.parse).concat(_descriptor_12.toValue(value_0.bitLength).concat(_descriptor_0.toValue(value_0.expected).concat(_descriptor_12.toValue(value_0.filling).concat(_descriptor_8.toValue(value_0.active))))));
  }
}

const _descriptor_32 = new _Reader_0();

const _descriptor_33 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

class _Producer_0 {
  alignment() {
    return _descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment()));
  }
  fromValue(value_0) {
    return {
      keyLow: _descriptor_12.fromValue(value_0),
      keyHigh: _descriptor_12.fromValue(value_0),
      stake: _descriptor_12.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_12.toValue(value_0.keyLow).concat(_descriptor_12.toValue(value_0.keyHigh).concat(_descriptor_12.toValue(value_0.stake)));
  }
}

const _descriptor_34 = new _Producer_0();

const _descriptor_35 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

const _descriptor_36 = new __compactRuntime.CompactTypeBytes(41);

class _Candidate_0 {
  alignment() {
    return _descriptor_26.alignment().concat(_descriptor_36.alignment().concat(_descriptor_12.alignment().concat(_descriptor_12.alignment().concat(_descriptor_10.alignment()))));
  }
  fromValue(value_0) {
    return {
      head: _descriptor_26.fromValue(value_0),
      message: _descriptor_36.fromValue(value_0),
      era: _descriptor_12.fromValue(value_0),
      stake: _descriptor_12.fromValue(value_0),
      built: _descriptor_10.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_26.toValue(value_0.head).concat(_descriptor_36.toValue(value_0.message).concat(_descriptor_12.toValue(value_0.era).concat(_descriptor_12.toValue(value_0.stake).concat(_descriptor_10.toValue(value_0.built)))));
  }
}

const _descriptor_37 = new _Candidate_0();

const _descriptor_38 = __compactRuntime.CompactTypeCurve25519Point;

const _descriptor_39 = __compactRuntime.CompactTypeCurve25519Scalar;

class _Ed25519Signature_0 {
  alignment() {
    return _descriptor_38.alignment().concat(_descriptor_39.alignment());
  }
  fromValue(value_0) {
    return {
      r: _descriptor_38.fromValue(value_0),
      s: _descriptor_39.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_38.toValue(value_0.r).concat(_descriptor_39.toValue(value_0.s));
  }
}

const _descriptor_40 = new _Ed25519Signature_0();

class _tuple_0 {
  alignment() {
    return _descriptor_12.alignment().concat(_descriptor_12.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_12.fromValue(value_0),
      _descriptor_12.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_12.toValue(value_0[0]).concat(_descriptor_12.toValue(value_0[1]));
  }
}

const _descriptor_41 = new _tuple_0();

const _descriptor_42 = new __compactRuntime.CompactTypeUnsignedInteger(127n, 1);

class _tuple_1 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_42.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_8.fromValue(value_0),
      _descriptor_42.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0[0]).concat(_descriptor_42.toValue(value_0[1]));
  }
}

const _descriptor_43 = new _tuple_1();

const _descriptor_44 = new __compactRuntime.CompactTypeVector(16, _descriptor_12);

const _descriptor_45 = new __compactRuntime.CompactTypeVector(8, _descriptor_8);

const _descriptor_46 = new __compactRuntime.CompactTypeVector(4, _descriptor_2);

const _descriptor_47 = new __compactRuntime.CompactTypeVector(32, _descriptor_8);

const _descriptor_48 = new __compactRuntime.CompactTypeVector(32, _descriptor_12);

class _Word_0 {
  alignment() {
    return _descriptor_47.alignment().concat(_descriptor_48.alignment().concat(_descriptor_12.alignment()));
  }
  fromValue(value_0) {
    return {
      bits: _descriptor_47.fromValue(value_0),
      signs: _descriptor_48.fromValue(value_0),
      val: _descriptor_12.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_47.toValue(value_0.bits).concat(_descriptor_48.toValue(value_0.signs).concat(_descriptor_12.toValue(value_0.val)));
  }
}

const _descriptor_49 = new _Word_0();

const _descriptor_50 = new __compactRuntime.CompactTypeVector(8, _descriptor_49);

const _descriptor_51 = new __compactRuntime.CompactTypeVector(16, _descriptor_49);

const _descriptor_52 = new __compactRuntime.CompactTypeVector(35, _descriptor_8);

const _descriptor_53 = __compactRuntime.CompactTypeCurve25519Base;

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

const _descriptor_54 = new _ZswapCoinPublicKey_0();

class _Either_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_54.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_8.fromValue(value_0),
      left: _descriptor_54.fromValue(value_0),
      right: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.is_left).concat(_descriptor_54.toValue(value_0.left).concat(_descriptor_1.toValue(value_0.right)));
  }
}

const _descriptor_55 = new _Either_0();

class _tuple_2 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_36.alignment()));
  }
  fromValue(value_0) {
    return [
      _descriptor_0.fromValue(value_0),
      _descriptor_0.fromValue(value_0),
      _descriptor_36.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0[0]).concat(_descriptor_0.toValue(value_0[1]).concat(_descriptor_36.toValue(value_0[2])));
  }
}

const _descriptor_56 = new _tuple_2();

class _QualifiedShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_4.alignment().concat(_descriptor_10.alignment())));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_0.fromValue(value_0),
      color: _descriptor_0.fromValue(value_0),
      value: _descriptor_4.fromValue(value_0),
      mt_index: _descriptor_10.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.nonce).concat(_descriptor_0.toValue(value_0.color).concat(_descriptor_4.toValue(value_0.value).concat(_descriptor_10.toValue(value_0.mt_index))));
  }
}

const _descriptor_57 = new _QualifiedShieldedCoinInfo_0();

const _descriptor_58 = new __compactRuntime.CompactTypeBytes(21);

class _CoinPreimage_0 {
  alignment() {
    return _descriptor_58.alignment().concat(_descriptor_7.alignment().concat(_descriptor_8.alignment().concat(_descriptor_0.alignment())));
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_58.fromValue(value_0),
      info: _descriptor_7.fromValue(value_0),
      dataType: _descriptor_8.fromValue(value_0),
      data: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_58.toValue(value_0.domain_sep).concat(_descriptor_7.toValue(value_0.info).concat(_descriptor_8.toValue(value_0.dataType).concat(_descriptor_0.toValue(value_0.data))));
  }
}

const _descriptor_59 = new _CoinPreimage_0();

const _descriptor_60 = new __compactRuntime.CompactTypeBytes(53);

const _descriptor_61 = new __compactRuntime.CompactTypeBytes(95);

const _descriptor_62 = new __compactRuntime.CompactTypeBytes(127);

const _descriptor_63 = new __compactRuntime.CompactTypeBytes(132);

const _descriptor_64 = new __compactRuntime.CompactTypeBytes(111);

const _descriptor_65 = new __compactRuntime.CompactTypeBytes(63);

const _descriptor_66 = new __compactRuntime.CompactTypeVector(3, _descriptor_12);

class _Maybe_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_7.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_8.fromValue(value_0),
      value: _descriptor_7.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.is_some).concat(_descriptor_7.toValue(value_0.value));
  }
}

const _descriptor_67 = new _Maybe_0();

class _ShieldedSendResult_0 {
  alignment() {
    return _descriptor_67.alignment().concat(_descriptor_7.alignment());
  }
  fromValue(value_0) {
    return {
      change: _descriptor_67.fromValue(value_0),
      sent: _descriptor_7.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_67.toValue(value_0.change).concat(_descriptor_7.toValue(value_0.sent));
  }
}

const _descriptor_68 = new _ShieldedSendResult_0();

class _Either_1 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_8.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_69 = new _Either_1();

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

const _descriptor_70 = new _UserAddress_0();

class _Either_2 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_1.alignment().concat(_descriptor_70.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_8.fromValue(value_0),
      left: _descriptor_1.fromValue(value_0),
      right: _descriptor_70.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.is_left).concat(_descriptor_1.toValue(value_0.left).concat(_descriptor_70.toValue(value_0.right)));
  }
}

const _descriptor_71 = new _Either_2();

class _Maybe_1 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_71.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_8.fromValue(value_0),
      value: _descriptor_71.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.is_some).concat(_descriptor_71.toValue(value_0.value));
  }
}

const _descriptor_72 = new _Maybe_1();

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
    if (typeof(witnesses_0.bitsOfByte) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named bitsOfByte');
    }
    if (typeof(witnesses_0.lowBit) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named lowBit');
    }
    if (typeof(witnesses_0.coinSecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named coinSecretKey');
    }
    if (typeof(witnesses_0.readSecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named readSecret');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      propose: async (...args_1) => {
        if (args_1.length !== 7) {
          throw new __compactRuntime.CompactError(`propose: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const lite_0 = args_1[1];
        const innerRest_0 = args_1[2];
        const previous_0 = args_1[3];
        const nextInner_0 = args_1[4];
        const target_0 = args_1[5];
        const built_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('propose',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 138 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(lite_0.buffer instanceof ArrayBuffer && lite_0.BYTES_PER_ELEMENT === 1 && lite_0.length === 208)) {
          __compactRuntime.typeError('propose',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 138 char 1',
                                     'Bytes<208>',
                                     lite_0)
        }
        if (!(innerRest_0.buffer instanceof ArrayBuffer && innerRest_0.BYTES_PER_ELEMENT === 1 && innerRest_0.length === 32)) {
          __compactRuntime.typeError('propose',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'midnight-bridge.compact line 138 char 1',
                                     'Bytes<32>',
                                     innerRest_0)
        }
        if (!(previous_0.buffer instanceof ArrayBuffer && previous_0.BYTES_PER_ELEMENT === 1 && previous_0.length === 32)) {
          __compactRuntime.typeError('propose',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'midnight-bridge.compact line 138 char 1',
                                     'Bytes<32>',
                                     previous_0)
        }
        if (!(nextInner_0.buffer instanceof ArrayBuffer && nextInner_0.BYTES_PER_ELEMENT === 1 && nextInner_0.length === 32)) {
          __compactRuntime.typeError('propose',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'midnight-bridge.compact line 138 char 1',
                                     'Bytes<32>',
                                     nextInner_0)
        }
        if (!(target_0.buffer instanceof ArrayBuffer && target_0.BYTES_PER_ELEMENT === 1 && target_0.length === 8)) {
          __compactRuntime.typeError('propose',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'midnight-bridge.compact line 138 char 1',
                                     'Bytes<8>',
                                     target_0)
        }
        if (!(typeof(built_0) === 'bigint' && built_0 >= 0n && built_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('propose',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'midnight-bridge.compact line 138 char 1',
                                     'Uint<0..18446744073709551616>',
                                     built_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_28.toValue(lite_0).concat(_descriptor_0.toValue(innerRest_0).concat(_descriptor_0.toValue(previous_0).concat(_descriptor_0.toValue(nextInner_0).concat(_descriptor_16.toValue(target_0).concat(_descriptor_10.toValue(built_0)))))),
            alignment: _descriptor_28.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_16.alignment().concat(_descriptor_10.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._propose_0(context,
                                               partialProofData,
                                               lite_0,
                                               innerRest_0,
                                               previous_0,
                                               nextInner_0,
                                               target_0,
                                               built_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      approve: async (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`approve: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const hash_0 = args_1[1];
        const index_0 = args_1[2];
        const signature_0 = args_1[3];
        const point_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('approve',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 172 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(hash_0.buffer instanceof ArrayBuffer && hash_0.BYTES_PER_ELEMENT === 1 && hash_0.length === 32)) {
          __compactRuntime.typeError('approve',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 172 char 1',
                                     'Bytes<32>',
                                     hash_0)
        }
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0n && index_0 <= 65535n)) {
          __compactRuntime.typeError('approve',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'midnight-bridge.compact line 172 char 1',
                                     'Uint<0..65536>',
                                     index_0)
        }
        if (!(typeof(signature_0) === 'object' && __compactRuntime.isValidCurve25519Point(signature_0.r) && typeof(signature_0.s) === 'bigint' && signature_0.s >= 0 && signature_0.s <= __compactRuntime.MAX_CURVE25519_SCALAR)) {
          __compactRuntime.typeError('approve',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'midnight-bridge.compact line 172 char 1',
                                     'struct Ed25519Signature<r: Curve25519Point, s: Curve25519Scalar>',
                                     signature_0)
        }
        if (!(__compactRuntime.isValidCurve25519Point(point_0))) {
          __compactRuntime.typeError('approve',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'midnight-bridge.compact line 172 char 1',
                                     'Curve25519Point',
                                     point_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(hash_0).concat(_descriptor_33.toValue(index_0).concat(_descriptor_40.toValue(signature_0).concat(_descriptor_38.toValue(point_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_33.alignment().concat(_descriptor_40.alignment().concat(_descriptor_38.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._approve_0(context,
                                               partialProofData,
                                               hash_0,
                                               index_0,
                                               signature_0,
                                               point_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      accept: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`accept: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const hash_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('accept',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 194 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(hash_0.buffer instanceof ArrayBuffer && hash_0.BYTES_PER_ELEMENT === 1 && hash_0.length === 32)) {
          __compactRuntime.typeError('accept',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 194 char 1',
                                     'Bytes<32>',
                                     hash_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(hash_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._accept_0(context, partialProofData, hash_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      begin: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`begin: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const length_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('begin',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 299 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(length_0) === 'bigint' && length_0 >= 0n && length_0 <= 4294967295n)) {
          __compactRuntime.typeError('begin',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 299 char 1',
                                     'Uint<0..4294967296>',
                                     length_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_35.toValue(length_0),
            alignment: _descriptor_35.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._begin_0(context, partialProofData, length_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      absorb: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`absorb: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const block_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('absorb',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 324 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(block_0.buffer instanceof ArrayBuffer && block_0.BYTES_PER_ELEMENT === 1 && block_0.length === 64)) {
          __compactRuntime.typeError('absorb',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 324 char 1',
                                     'Bytes<64>',
                                     block_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(block_0),
            alignment: _descriptor_3.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._absorb_0(context, partialProofData, block_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      know: async (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`know: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const lite_0 = args_1[1];
        const innerRest_0 = args_1[2];
        const previous_0 = args_1[3];
        const path_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('know',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 394 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(lite_0.buffer instanceof ArrayBuffer && lite_0.BYTES_PER_ELEMENT === 1 && lite_0.length === 208)) {
          __compactRuntime.typeError('know',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 394 char 1',
                                     'Bytes<208>',
                                     lite_0)
        }
        if (!(innerRest_0.buffer instanceof ArrayBuffer && innerRest_0.BYTES_PER_ELEMENT === 1 && innerRest_0.length === 32)) {
          __compactRuntime.typeError('know',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'midnight-bridge.compact line 394 char 1',
                                     'Bytes<32>',
                                     innerRest_0)
        }
        if (!(previous_0.buffer instanceof ArrayBuffer && previous_0.BYTES_PER_ELEMENT === 1 && previous_0.length === 32)) {
          __compactRuntime.typeError('know',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'midnight-bridge.compact line 394 char 1',
                                     'Bytes<32>',
                                     previous_0)
        }
        if (!(Array.isArray(path_0) && path_0.length === 34 && path_0.every((t) => typeof(t) === 'object' && t.hash.buffer instanceof ArrayBuffer && t.hash.BYTES_PER_ELEMENT === 1 && t.hash.length === 32 && typeof(t.side) === 'bigint' && t.side >= 0n && t.side <= 255n))) {
          __compactRuntime.typeError('know',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'midnight-bridge.compact line 394 char 1',
                                     'Vector<34, struct Level<hash: Bytes<32>, side: Uint<0..256>>>',
                                     path_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_28.toValue(lite_0).concat(_descriptor_0.toValue(innerRest_0).concat(_descriptor_0.toValue(previous_0).concat(_descriptor_29.toValue(path_0)))),
            alignment: _descriptor_28.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_29.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._know_0(context,
                                            partialProofData,
                                            lite_0,
                                            innerRest_0,
                                            previous_0,
                                            path_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      forget: async (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`forget: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const what_0 = args_1[1];
        const key_0 = args_1[2];
        const read_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('forget',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 415 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(what_0) === 'number' && what_0 >= 0 && what_0 <= 2)) {
          __compactRuntime.typeError('forget',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 415 char 1',
                                     'Enum<Stale, header, read, block>',
                                     what_0)
        }
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('forget',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'midnight-bridge.compact line 415 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        if (!(typeof(read_0) === 'bigint' && read_0 >= 0 && read_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('forget',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'midnight-bridge.compact line 415 char 1',
                                     'Field',
                                     read_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_24.toValue(what_0).concat(_descriptor_0.toValue(key_0).concat(_descriptor_12.toValue(read_0))),
            alignment: _descriptor_24.alignment().concat(_descriptor_0.alignment().concat(_descriptor_12.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._forget_0(context,
                                              partialProofData,
                                              what_0,
                                              key_0,
                                              read_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      prove_lock: async (...args_1) => {
        if (args_1.length !== 13) {
          throw new __compactRuntime.CompactError(`prove_lock: expected 13 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const block_0 = args_1[1];
        const receipt_0 = args_1[2];
        const count_0 = args_1[3];
        const receipts_0 = args_1[4];
        const gas_0 = args_1[5];
        const tokens_0 = args_1[6];
        const lock_0 = args_1[7];
        const amount_0 = args_1[8];
        const recipient_0 = args_1[9];
        const eventHash_0 = args_1[10];
        const outcomePath_0 = args_1[11];
        const shardPath_0 = args_1[12];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(block_0.buffer instanceof ArrayBuffer && block_0.BYTES_PER_ELEMENT === 1 && block_0.length === 32)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Bytes<32>',
                                     block_0)
        }
        if (!(receipt_0.buffer instanceof ArrayBuffer && receipt_0.BYTES_PER_ELEMENT === 1 && receipt_0.length === 32)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Bytes<32>',
                                     receipt_0)
        }
        if (!(typeof(count_0) === 'bigint' && count_0 >= 0n && count_0 <= 255n)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Uint<0..256>',
                                     count_0)
        }
        if (!(Array.isArray(receipts_0) && receipts_0.length === 2 && receipts_0.every((t) => t.buffer instanceof ArrayBuffer && t.BYTES_PER_ELEMENT === 1 && t.length === 32))) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Vector<2, Bytes<32>>',
                                     receipts_0)
        }
        if (!(gas_0.buffer instanceof ArrayBuffer && gas_0.BYTES_PER_ELEMENT === 1 && gas_0.length === 8)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Bytes<8>',
                                     gas_0)
        }
        if (!(tokens_0.buffer instanceof ArrayBuffer && tokens_0.BYTES_PER_ELEMENT === 1 && tokens_0.length === 16)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Bytes<16>',
                                     tokens_0)
        }
        if (!(lock_0.buffer instanceof ArrayBuffer && lock_0.BYTES_PER_ELEMENT === 1 && lock_0.length === 8)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Bytes<8>',
                                     lock_0)
        }
        if (!(amount_0.buffer instanceof ArrayBuffer && amount_0.BYTES_PER_ELEMENT === 1 && amount_0.length === 8)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 8 (argument 9 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Bytes<8>',
                                     amount_0)
        }
        if (!(recipient_0.buffer instanceof ArrayBuffer && recipient_0.BYTES_PER_ELEMENT === 1 && recipient_0.length === 32)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 9 (argument 10 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Bytes<32>',
                                     recipient_0)
        }
        if (!(eventHash_0.buffer instanceof ArrayBuffer && eventHash_0.BYTES_PER_ELEMENT === 1 && eventHash_0.length === 32)) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 10 (argument 11 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Bytes<32>',
                                     eventHash_0)
        }
        if (!(Array.isArray(outcomePath_0) && outcomePath_0.length === 16 && outcomePath_0.every((t) => typeof(t) === 'object' && t.hash.buffer instanceof ArrayBuffer && t.hash.BYTES_PER_ELEMENT === 1 && t.hash.length === 32 && typeof(t.side) === 'bigint' && t.side >= 0n && t.side <= 255n))) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 11 (argument 12 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Vector<16, struct Level<hash: Bytes<32>, side: Uint<0..256>>>',
                                     outcomePath_0)
        }
        if (!(Array.isArray(shardPath_0) && shardPath_0.length === 10 && shardPath_0.every((t) => typeof(t) === 'object' && t.hash.buffer instanceof ArrayBuffer && t.hash.BYTES_PER_ELEMENT === 1 && t.hash.length === 32 && typeof(t.side) === 'bigint' && t.side >= 0n && t.side <= 255n))) {
          __compactRuntime.typeError('prove_lock',
                                     'argument 12 (argument 13 as invoked from Typescript)',
                                     'midnight-bridge.compact line 467 char 1',
                                     'Vector<10, struct Level<hash: Bytes<32>, side: Uint<0..256>>>',
                                     shardPath_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(block_0).concat(_descriptor_0.toValue(receipt_0).concat(_descriptor_2.toValue(count_0).concat(_descriptor_15.toValue(receipts_0).concat(_descriptor_16.toValue(gas_0).concat(_descriptor_17.toValue(tokens_0).concat(_descriptor_16.toValue(lock_0).concat(_descriptor_16.toValue(amount_0).concat(_descriptor_0.toValue(recipient_0).concat(_descriptor_0.toValue(eventHash_0).concat(_descriptor_19.toValue(outcomePath_0).concat(_descriptor_20.toValue(shardPath_0)))))))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_15.alignment().concat(_descriptor_16.alignment().concat(_descriptor_17.alignment().concat(_descriptor_16.alignment().concat(_descriptor_16.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_19.alignment().concat(_descriptor_20.alignment())))))))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._prove_lock_0(context,
                                                  partialProofData,
                                                  block_0,
                                                  receipt_0,
                                                  count_0,
                                                  receipts_0,
                                                  gas_0,
                                                  tokens_0,
                                                  lock_0,
                                                  amount_0,
                                                  recipient_0,
                                                  eventHash_0,
                                                  outcomePath_0,
                                                  shardPath_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      prove_register: async (...args_1) => {
        if (args_1.length !== 12) {
          throw new __compactRuntime.CompactError(`prove_register: expected 12 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const block_0 = args_1[1];
        const receipt_0 = args_1[2];
        const count_0 = args_1[3];
        const receipts_0 = args_1[4];
        const gas_0 = args_1[5];
        const tokens_0 = args_1[6];
        const index_0 = args_1[7];
        const commitment_0 = args_1[8];
        const eventHash_0 = args_1[9];
        const outcomePath_0 = args_1[10];
        const shardPath_0 = args_1[11];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('prove_register',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(block_0.buffer instanceof ArrayBuffer && block_0.BYTES_PER_ELEMENT === 1 && block_0.length === 32)) {
          __compactRuntime.typeError('prove_register',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Bytes<32>',
                                     block_0)
        }
        if (!(receipt_0.buffer instanceof ArrayBuffer && receipt_0.BYTES_PER_ELEMENT === 1 && receipt_0.length === 32)) {
          __compactRuntime.typeError('prove_register',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Bytes<32>',
                                     receipt_0)
        }
        if (!(typeof(count_0) === 'bigint' && count_0 >= 0n && count_0 <= 255n)) {
          __compactRuntime.typeError('prove_register',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Uint<0..256>',
                                     count_0)
        }
        if (!(Array.isArray(receipts_0) && receipts_0.length === 2 && receipts_0.every((t) => t.buffer instanceof ArrayBuffer && t.BYTES_PER_ELEMENT === 1 && t.length === 32))) {
          __compactRuntime.typeError('prove_register',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Vector<2, Bytes<32>>',
                                     receipts_0)
        }
        if (!(gas_0.buffer instanceof ArrayBuffer && gas_0.BYTES_PER_ELEMENT === 1 && gas_0.length === 8)) {
          __compactRuntime.typeError('prove_register',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Bytes<8>',
                                     gas_0)
        }
        if (!(tokens_0.buffer instanceof ArrayBuffer && tokens_0.BYTES_PER_ELEMENT === 1 && tokens_0.length === 16)) {
          __compactRuntime.typeError('prove_register',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Bytes<16>',
                                     tokens_0)
        }
        if (!(index_0.buffer instanceof ArrayBuffer && index_0.BYTES_PER_ELEMENT === 1 && index_0.length === 8)) {
          __compactRuntime.typeError('prove_register',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Bytes<8>',
                                     index_0)
        }
        if (!(commitment_0.buffer instanceof ArrayBuffer && commitment_0.BYTES_PER_ELEMENT === 1 && commitment_0.length === 32)) {
          __compactRuntime.typeError('prove_register',
                                     'argument 8 (argument 9 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Bytes<32>',
                                     commitment_0)
        }
        if (!(eventHash_0.buffer instanceof ArrayBuffer && eventHash_0.BYTES_PER_ELEMENT === 1 && eventHash_0.length === 32)) {
          __compactRuntime.typeError('prove_register',
                                     'argument 9 (argument 10 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Bytes<32>',
                                     eventHash_0)
        }
        if (!(Array.isArray(outcomePath_0) && outcomePath_0.length === 16 && outcomePath_0.every((t) => typeof(t) === 'object' && t.hash.buffer instanceof ArrayBuffer && t.hash.BYTES_PER_ELEMENT === 1 && t.hash.length === 32 && typeof(t.side) === 'bigint' && t.side >= 0n && t.side <= 255n))) {
          __compactRuntime.typeError('prove_register',
                                     'argument 10 (argument 11 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Vector<16, struct Level<hash: Bytes<32>, side: Uint<0..256>>>',
                                     outcomePath_0)
        }
        if (!(Array.isArray(shardPath_0) && shardPath_0.length === 10 && shardPath_0.every((t) => typeof(t) === 'object' && t.hash.buffer instanceof ArrayBuffer && t.hash.BYTES_PER_ELEMENT === 1 && t.hash.length === 32 && typeof(t.side) === 'bigint' && t.side >= 0n && t.side <= 255n))) {
          __compactRuntime.typeError('prove_register',
                                     'argument 11 (argument 12 as invoked from Typescript)',
                                     'midnight-bridge.compact line 494 char 1',
                                     'Vector<10, struct Level<hash: Bytes<32>, side: Uint<0..256>>>',
                                     shardPath_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(block_0).concat(_descriptor_0.toValue(receipt_0).concat(_descriptor_2.toValue(count_0).concat(_descriptor_15.toValue(receipts_0).concat(_descriptor_16.toValue(gas_0).concat(_descriptor_17.toValue(tokens_0).concat(_descriptor_16.toValue(index_0).concat(_descriptor_0.toValue(commitment_0).concat(_descriptor_0.toValue(eventHash_0).concat(_descriptor_19.toValue(outcomePath_0).concat(_descriptor_20.toValue(shardPath_0))))))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_15.alignment().concat(_descriptor_16.alignment().concat(_descriptor_17.alignment().concat(_descriptor_16.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_19.alignment().concat(_descriptor_20.alignment()))))))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._prove_register_0(context,
                                                      partialProofData,
                                                      block_0,
                                                      receipt_0,
                                                      count_0,
                                                      receipts_0,
                                                      gas_0,
                                                      tokens_0,
                                                      index_0,
                                                      commitment_0,
                                                      eventHash_0,
                                                      outcomePath_0,
                                                      shardPath_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      known_root: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`known_root: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const root_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('known_root',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 524 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(root_0) === 'object' && typeof(root_0.field) === 'bigint' && root_0.field >= 0 && root_0.field <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('known_root',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 524 char 1',
                                     'struct MerkleTreeDigest<field: Field>',
                                     root_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_13.toValue(root_0),
            alignment: _descriptor_13.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._known_root_0(context,
                                                  partialProofData,
                                                  root_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      async wrappedDomain(context, ...args_1) {
        return { result: pureCircuits.wrappedDomain(...args_1), context };
      },
      mint: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`mint: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const lock_id_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('mint',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 541 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(lock_id_0) === 'bigint' && lock_id_0 >= 0n && lock_id_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('mint',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 541 char 1',
                                     'Uint<0..18446744073709551616>',
                                     lock_id_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_10.toValue(lock_id_0),
            alignment: _descriptor_10.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._mint_0(context, partialProofData, lock_id_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      async burnId(context, ...args_1) {
        return { result: pureCircuits.burnId(...args_1), context };
      },
      burn: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`burn: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const coin_0 = args_1[1];
        const near_recipient_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('burn',
                                     'argument 1 (as invoked from Typescript)',
                                     'midnight-bridge.compact line 582 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(coin_0) === 'object' && coin_0.nonce.buffer instanceof ArrayBuffer && coin_0.nonce.BYTES_PER_ELEMENT === 1 && coin_0.nonce.length === 32 && coin_0.color.buffer instanceof ArrayBuffer && coin_0.color.BYTES_PER_ELEMENT === 1 && coin_0.color.length === 32 && typeof(coin_0.value) === 'bigint' && coin_0.value >= 0n && coin_0.value <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('burn',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'midnight-bridge.compact line 582 char 1',
                                     'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                     coin_0)
        }
        if (!(near_recipient_0.buffer instanceof ArrayBuffer && near_recipient_0.BYTES_PER_ELEMENT === 1 && near_recipient_0.length === 64)) {
          __compactRuntime.typeError('burn',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'midnight-bridge.compact line 582 char 1',
                                     'Bytes<64>',
                                     near_recipient_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_7.toValue(coin_0).concat(_descriptor_3.toValue(near_recipient_0)),
            alignment: _descriptor_7.alignment().concat(_descriptor_3.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._burn_0(context,
                                            partialProofData,
                                            coin_0,
                                            near_recipient_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      }
    };
    this.impureCircuits = {
      propose: this.circuits.propose,
      approve: this.circuits.approve,
      accept: this.circuits.accept,
      begin: this.circuits.begin,
      absorb: this.circuits.absorb,
      know: this.circuits.know,
      forget: this.circuits.forget,
      prove_lock: this.circuits.prove_lock,
      prove_register: this.circuits.prove_register,
      known_root: this.circuits.known_root,
      mint: this.circuits.mint,
      burn: this.circuits.burn
    };
    this.provableCircuits = {
      propose: this.circuits.propose,
      approve: this.circuits.approve,
      accept: this.circuits.accept,
      begin: this.circuits.begin,
      absorb: this.circuits.absorb,
      know: this.circuits.know,
      forget: this.circuits.forget,
      prove_lock: this.circuits.prove_lock,
      prove_register: this.circuits.prove_register,
      known_root: this.circuits.known_root,
      mint: this.circuits.mint,
      burn: this.circuits.burn
    };
  }
  async initialState(...args_0) {
    if (args_0.length !== 7) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 7 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const height_0 = args_0[1];
    const epoch_0 = args_0[2];
    const nextEpoch_0 = args_0[3];
    const nextProducers_0 = args_0[4];
    const blockRoot_0 = args_0[5];
    const account_0 = args_0[6];
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
    if (!(typeof(height_0) === 'bigint' && height_0 >= 0n && height_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'midnight-bridge.compact line 89 char 1',
                                 'Uint<0..18446744073709551616>',
                                 height_0)
    }
    if (!(epoch_0.buffer instanceof ArrayBuffer && epoch_0.BYTES_PER_ELEMENT === 1 && epoch_0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'midnight-bridge.compact line 89 char 1',
                                 'Bytes<32>',
                                 epoch_0)
    }
    if (!(nextEpoch_0.buffer instanceof ArrayBuffer && nextEpoch_0.BYTES_PER_ELEMENT === 1 && nextEpoch_0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 3 (argument 4 as invoked from Typescript)',
                                 'midnight-bridge.compact line 89 char 1',
                                 'Bytes<32>',
                                 nextEpoch_0)
    }
    if (!(nextProducers_0.buffer instanceof ArrayBuffer && nextProducers_0.BYTES_PER_ELEMENT === 1 && nextProducers_0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 4 (argument 5 as invoked from Typescript)',
                                 'midnight-bridge.compact line 89 char 1',
                                 'Bytes<32>',
                                 nextProducers_0)
    }
    if (!(blockRoot_0.buffer instanceof ArrayBuffer && blockRoot_0.BYTES_PER_ELEMENT === 1 && blockRoot_0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 5 (argument 6 as invoked from Typescript)',
                                 'midnight-bridge.compact line 89 char 1',
                                 'Bytes<32>',
                                 blockRoot_0)
    }
    if (!(account_0.buffer instanceof ArrayBuffer && account_0.BYTES_PER_ELEMENT === 1 && account_0.length === 26)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 6 (argument 7 as invoked from Typescript)',
                                 'midnight-bridge.compact line 89 char 1',
                                 'Bytes<26>',
                                 account_0)
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
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('propose', new __compactRuntime.ContractOperation());
    state_0.setOperation('approve', new __compactRuntime.ContractOperation());
    state_0.setOperation('accept', new __compactRuntime.ContractOperation());
    state_0.setOperation('begin', new __compactRuntime.ContractOperation());
    state_0.setOperation('absorb', new __compactRuntime.ContractOperation());
    state_0.setOperation('know', new __compactRuntime.ContractOperation());
    state_0.setOperation('forget', new __compactRuntime.ContractOperation());
    state_0.setOperation('prove_lock', new __compactRuntime.ContractOperation());
    state_0.setOperation('prove_register', new __compactRuntime.ContractOperation());
    state_0.setOperation('known_root', new __compactRuntime.ContractOperation());
    state_0.setOperation('mint', new __compactRuntime.ContractOperation());
    state_0.setOperation('burn', new __compactRuntime.ContractOperation());
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
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(1n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(2n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_23.toValue(new Uint8Array(26)),
                                                                                              alignment: _descriptor_23.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(3n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue({ head: { height: 0n, epoch: new Uint8Array(32), nextEpoch: new Uint8Array(32), nextProducers: new Uint8Array(32), blockRoot: new Uint8Array(32) }, era: 0n, total: 0n, nextTotal: 0n, list: 0n, nextList: 0n }),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(4n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(5n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(6n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(7n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(8n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(9n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(10n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newBoundedMerkleTree(
                                                                       new __compactRuntime.StateBoundedMerkleTree(16)
                                                                     )).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                        alignment: _descriptor_10.alignment() })).arrayPush(__compactRuntime.StateValue.newMap(
                                                                                                                                                                              new __compactRuntime.StateMap()
                                                                                                                                                                            ))
                                                          .encode() } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(2n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(11n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(2n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_23.toValue(account_0),
                                                                                              alignment: _descriptor_23.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = { head:
                      { height: height_0,
                        epoch: epoch_0,
                        nextEpoch: nextEpoch_0,
                        nextProducers: nextProducers_0,
                        blockRoot: blockRoot_0 },
                    era: 0n,
                    total: 0n,
                    nextTotal: 0n,
                    list: 0n,
                    nextList: 0n };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(3n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(tmp_0),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
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
  _tokenType_0(domain_sep_0, contractAddress_0) {
    return this._persistentCommit_0([domain_sep_0, contractAddress_0.bytes],
                                    new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 100, 101, 114, 105, 118, 101, 95, 116, 111, 107, 101, 110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  }
  async _mintShieldedToken_0(context,
                             partialProofData,
                             domain_sep_0,
                             value_0,
                             nonce_0,
                             recipient_0)
  {
    const coin_0 = { nonce: nonce_0,
                     color:
                       this._tokenType_0(domain_sep_0,
                                         _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                   partialProofData,
                                                                                                   [
                                                                                                    { dup: { n: 2 } },
                                                                                                    { idx: { cached: true,
                                                                                                             pushPath: false,
                                                                                                             path: [
                                                                                                                    { tag: 'value',
                                                                                                                      value: { value: _descriptor_2.toValue(0n),
                                                                                                                               alignment: _descriptor_2.alignment() } }] } },
                                                                                                    { popeq: { cached: true,
                                                                                                               result: undefined } }]).value)),
                     value: value_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(4n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(domain_sep_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'member',
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(value_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       'neg',
                                       { branch: { skip: 4 } },
                                       { dup: { n: 2 } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: true,
                                                pushPath: false,
                                                path: [ { tag: 'stack' }] } },
                                       'add',
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    this._createZswapOutput_0(context, partialProofData, coin_0, recipient_0);
    const cm_0 = this._coinCommitment_0(coin_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(2n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (!recipient_0.is_left
        &&
        this._equal_0(recipient_0.right.bytes,
                      _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 2 } },
                                                                                 { idx: { cached: true,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_2.toValue(0n),
                                                                                                            alignment: _descriptor_2.alignment() } }] } },
                                                                                 { popeq: { cached: true,
                                                                                            result: undefined } }]).value).bytes))
    {
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_2.toValue(1n),
                                                                    alignment: _descriptor_2.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(cm_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
    }
    return coin_0;
  }
  _evolveNonce_0(index_0, nonce_0) {
    return this._upgradeFromTransient_0(this._transientHash_1([__compactRuntime.convertBytesToUint(52435875175126190479447740508185965837690552500527637822603658699938581184512n,
                                                                                                   28,
                                                                                                   new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 107, 101, 114, 110, 101, 108, 58, 110, 111, 110, 99, 101, 95, 101, 118, 111, 108, 118, 101]),
                                                                                                   'Field',
                                                                                                   '<standard library>'),
                                                               index_0,
                                                               this._degradeToTransient_0(nonce_0)]));
  }
  _shieldedBurnAddress_0() {
    return this._left_0({ bytes: new Uint8Array(32) });
  }
  async _receiveShielded_0(context, partialProofData, coin_0) {
    const recipient_0 = this._right_0(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                partialProofData,
                                                                                                [
                                                                                                 { dup: { n: 2 } },
                                                                                                 { idx: { cached: true,
                                                                                                          pushPath: false,
                                                                                                          path: [
                                                                                                                 { tag: 'value',
                                                                                                                   value: { value: _descriptor_2.toValue(0n),
                                                                                                                            alignment: _descriptor_2.alignment() } }] } },
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
                                                         value: { value: _descriptor_2.toValue(1n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
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
    const selfAddr_0 = _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                 partialProofData,
                                                                                 [
                                                                                  { dup: { n: 2 } },
                                                                                  { idx: { cached: true,
                                                                                           pushPath: false,
                                                                                           path: [
                                                                                                  { tag: 'value',
                                                                                                    value: { value: _descriptor_2.toValue(0n),
                                                                                                             alignment: _descriptor_2.alignment() } }] } },
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
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
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
                         this._upgradeFromTransient_0(this._transientHash_2([__compactRuntime.convertBytesToUint(52435875175126190479447740508185965837690552500527637822603658699938581184512n,
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
                                                         value: { value: _descriptor_2.toValue(2n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (!recipient_0.is_left
        &&
        this._equal_1(recipient_0.right.bytes, selfAddr_0.bytes))
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
                                                           value: { value: _descriptor_2.toValue(1n),
                                                                    alignment: _descriptor_2.alignment() } }] } },
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
                               this._upgradeFromTransient_0(this._transientHash_2([__compactRuntime.convertBytesToUint(52435875175126190479447740508185965837690552500527637822603658699938581184512n,
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
                                                           value: { value: _descriptor_2.toValue(2n),
                                                                    alignment: _descriptor_2.alignment() } }] } },
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
                                                           value: { value: _descriptor_2.toValue(1n),
                                                                    alignment: _descriptor_2.alignment() } }] } },
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
  async _sendImmediateShielded_0(context,
                                 partialProofData,
                                 input_0,
                                 target_0,
                                 value_0)
  {
    return await this._sendShielded_0(context,
                                      partialProofData,
                                      this._upcastQualifiedCoin_0(input_0),
                                      target_0,
                                      value_0);
  }
  _downcastQualifiedCoin_0(coin_0) {
    return { nonce: coin_0.nonce, color: coin_0.color, value: coin_0.value };
  }
  _upcastQualifiedCoin_0(coin_0) {
    return { nonce: coin_0.nonce,
             color: coin_0.color,
             value: coin_0.value,
             mt_index: 0n };
  }
  _coinCommitment_0(coin_0, recipient_0) {
    return this._persistentHash_10({ domain_sep:
                                       new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 99, 91, 118, 49, 93]),
                                     info: coin_0,
                                     dataType: recipient_0.is_left,
                                     data:
                                       recipient_0.is_left ?
                                       recipient_0.left.bytes :
                                       recipient_0.right.bytes });
  }
  _coinNullifier_0(coin_0, addr_0) {
    return this._persistentHash_10({ domain_sep:
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
    __compactRuntime.assert(!this._equal_2(__compactRuntime.convertBigintToBytes(32,
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
    return this._equal_3(this._ecMulGenerator_0(s_0),
                         this._ecAdd_0(r_0, this._ecMul_0(pk_0, k_0)));
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_0, value_0);
    return result_0;
  }
  _transientHash_1(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_66, value_0);
    return result_0;
  }
  _transientHash_2(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_41, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_28, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_64, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_65, value_0);
    return result_0;
  }
  _persistentHash_3(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_62, value_0);
    return result_0;
  }
  _persistentHash_4(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_63, value_0);
    return result_0;
  }
  _persistentHash_5(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_61, value_0);
    return result_0;
  }
  _persistentHash_6(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_15, value_0);
    return result_0;
  }
  _persistentHash_7(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_0, value_0);
    return result_0;
  }
  _persistentHash_8(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_60, value_0);
    return result_0;
  }
  _persistentHash_9(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_7, value_0);
    return result_0;
  }
  _persistentHash_10(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_59, value_0);
    return result_0;
  }
  _persistentCommit_0(value_0, rand_0) {
    const result_0 = __compactRuntime.persistentCommit(_descriptor_15,
                                                       value_0,
                                                       rand_0);
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
    const result_0 = __compactRuntime.sha512(_descriptor_56, value_0);
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
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.curve25519Mul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
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
      value: _descriptor_52.toValue(result_0),
      alignment: _descriptor_52.alignment()
    });
    return result_0;
  }
  async _reduce_0(context, partialProofData, sum_0) {
    const bits_0 = this._bitsOf_0(context, partialProofData, sum_0);
    const packed_0 = await this._folder_0(context,
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
                                                               this._folder_1(((acc_0,
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
                                     this._folder_2(((acc_0, a_0, b_0, c_0) =>
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
    const middle_0 = await this._folder_3(context,
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
    const after_0 = await this._folder_4(context,
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
  _bitsOfByte_0(context, partialProofData, x_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.bitsOfByte(witnessContext_0,
                                                                     x_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 8 && result_0.every((t) => typeof(t) === 'boolean'))) {
      __compactRuntime.typeError('bitsOfByte',
                                 'return value',
                                 'midnight-bridge.compact line 77 char 1',
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
                                 'midnight-bridge.compact line 80 char 1',
                                 '[Boolean, Uint<0..128>]',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_43.toValue(result_0),
      alignment: _descriptor_43.alignment()
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
                                 'midnight-bridge.compact line 83 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _readSecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.readSecret(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('readSecret',
                                 'return value',
                                 'midnight-bridge.compact line 86 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _maxHeaderAge_0() { return 115200n; }
  _blockKeptFor_0() { return 43200n; }
  _pair_0(a_0, b_0) { return this._persistentHash_6([a_0, b_0]); }
  _littleEndian8_0(v_0) {
    return this._folder_5(((acc_0, byte_0) =>
                           {
                             return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                        256n),
                                                              byte_0);
                           }),
                          0n,
                          [v_0[7],
                           v_0[6],
                           v_0[5],
                           v_0[4],
                           v_0[3],
                           v_0[2],
                           v_0[1],
                           v_0[0]]);
  }
  _bigEndian8_0(v_0) {
    return this._folder_6(((acc_0, byte_0) =>
                           {
                             return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                        256n),
                                                              byte_0);
                           }),
                          0n,
                          v_0);
  }
  _littleEndian16_0(v_0) {
    return this._folder_7(((acc_0, byte_0) =>
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
  async _keyOf_0(context, partialProofData, point_0) {
    const x_0 = Array.from(__compactRuntime.convertBigintToBytes(32,
                                                                 this._curve25519PointX_0(point_0),
                                                                 'midnight-bridge.compact line 128 char 14'),
                           BigInt);
    const y_0 = Array.from(__compactRuntime.convertBigintToBytes(32,
                                                                 this._curve25519PointY_0(point_0),
                                                                 'midnight-bridge.compact line 129 char 14'),
                           BigInt);
    const split_0 = this._lowBit_0(context, partialProofData, x_0[0]);
    __compactRuntime.assert(__compactRuntime.addField(split_0[0] ? 1n : 0n,
                                                      __compactRuntime.mulField(2n,
                                                                                split_0[1]))
                            ===
                            x_0[0],
                            'wrong low bit');
    return [this._littleEndian16_0(((e) => e.slice(0, 16))(y_0)),
            __compactRuntime.addField(this._littleEndian16_0(((e) => e.slice(16, 32))(y_0)),
                                      __compactRuntime.mulField(split_0[0] ?
                                                                1n :
                                                                0n,
                                                                170141183460469231731687303715884105728n))];
  }
  async _propose_0(context,
                   partialProofData,
                   lite_0,
                   innerRest_0,
                   previous_0,
                   nextInner_0,
                   target_0,
                   built_0)
  {
    const bytes_0 = Array.from(lite_0, BigInt);
    const hash_0 = this._pair_0(nextInner_0,
                                this._pair_0(this._pair_0(this._persistentHash_0(lite_0),
                                                          innerRest_0),
                                             previous_0));
    __compactRuntime.assert(!_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_2.toValue(5n),
                                                                                                                   alignment: _descriptor_2.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(hash_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'this header is already proposed');
    const height_0 = this._littleEndian8_0(((e) => e.slice(0, 8))(bytes_0));
    const epoch_0 = Uint8Array.from(((e) => e.slice(8, 40))(bytes_0), Number);
    const now_0 = _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(3n),
                                                                                                         alignment: _descriptor_2.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    let t_0;
    __compactRuntime.assert((t_0 = ((t1) => {
                                     if (t1 > 18446744073709551615n) {
                                       throw new __compactRuntime.CompactError('midnight-bridge.compact line 145 char 10: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                     }
                                     return t1;
                                   })(height_0),
                             t_0 > now_0.head.height),
                            'the header is not newer than the head');
    const next_0 = this._equal_4(epoch_0, now_0.head.nextEpoch);
    __compactRuntime.assert(this._equal_5(epoch_0, now_0.head.epoch) || next_0,
                            'the header is from an unknown epoch');
    const set_0 = __compactRuntime.addField(now_0.era, next_0 ? 1n : 0n);
    __compactRuntime.assert((next_0 ? now_0.nextTotal : now_0.total) !== 0n,
                            'the producers of that epoch are not known yet');
    const goal_0 = Array.from(target_0, BigInt);
    __compactRuntime.assert(this._littleEndian8_0(goal_0)
                            ===
                            __compactRuntime.addField(height_0, 2n),
                            'the target is not the height plus two');
    const stamp_0 = ((t1) => {
                      if (t1 > 18446744073709551615n) {
                        throw new __compactRuntime.CompactError('midnight-bridge.compact line 153 char 17: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                      }
                      return t1;
                    })(this._littleEndian8_0(((e) => e.slice(136, 144))(bytes_0)));
    const second_0 = built_0;
    let t_1;
    __compactRuntime.assert((t_1 = second_0 * 1000000000n, t_1 <= stamp_0)
                            &&
                            stamp_0 < (second_0 + 1n) * 1000000000n,
                            "built is not the second of the header's timestamp");
    const tag_0 = [0n];
    const tmp_0 = { head:
                      { height:
                          ((t1) => {
                            if (t1 > 18446744073709551615n) {
                              throw new __compactRuntime.CompactError('midnight-bridge.compact line 159 char 15: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                            }
                            return t1;
                          })(height_0),
                        epoch: epoch_0,
                        nextEpoch:
                          Uint8Array.from(((e) => e.slice(40, 72))(bytes_0),
                                          Number),
                        nextProducers:
                          Uint8Array.from(((e) => e.slice(144, 176))(bytes_0),
                                          Number),
                        blockRoot:
                          Uint8Array.from(((e) => e.slice(176, 208))(bytes_0),
                                          Number) },
                    message:
                      Uint8Array.from([...tag_0,
                                       ...Array.from(hash_0, BigInt),
                                       ...goal_0],
                                      Number),
                    era: set_0,
                    stake: 0n,
                    built: second_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(5n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(hash_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_37.toValue(tmp_0),
                                                                                              alignment: _descriptor_37.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(6n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(hash_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _approve_0(context,
                   partialProofData,
                   hash_0,
                   index_0,
                   signature_0,
                   point_0)
  {
    const block_0 = hash_0;
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(5n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'this header is not proposed');
    const candidate_0 = _descriptor_37.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_2.toValue(5n),
                                                                                                               alignment: _descriptor_2.alignment() } }] } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_0.toValue(block_0),
                                                                                                               alignment: _descriptor_0.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value);
    const now_0 = _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(3n),
                                                                                                         alignment: _descriptor_2.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    const moves_0 = candidate_0.era === __compactRuntime.addField(now_0.era, 1n);
    __compactRuntime.assert(candidate_0.era === now_0.era || moves_0,
                            "the header's epoch has passed");
    const read_0 = moves_0 ? now_0.nextList : now_0.list;
    const place_0 = index_0;
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(4n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(read_0),
                                                                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no producer has that index');
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(4n),
                                                                                                                  alignment: _descriptor_2.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_12.toValue(read_0),
                                                                                                                  alignment: _descriptor_12.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_33.toValue(place_0),
                                                                                                                                              alignment: _descriptor_33.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no producer has that index');
    const producer_0 = _descriptor_34.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 0 } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_2.toValue(4n),
                                                                                                              alignment: _descriptor_2.alignment() } },
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_12.toValue(read_0),
                                                                                                              alignment: _descriptor_12.alignment() } }] } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_33.toValue(place_0),
                                                                                                              alignment: _descriptor_33.alignment() } }] } },
                                                                                   { popeq: { cached: false,
                                                                                              result: undefined } }]).value);
    const key_0 = await this._keyOf_0(context, partialProofData, point_0);
    __compactRuntime.assert(key_0[0] === producer_0.keyLow
                            &&
                            key_0[1] === producer_0.keyHigh,
                            "the point is not that producer's key");
    __compactRuntime.assert(!_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_2.toValue(6n),
                                                                                                                   alignment: _descriptor_2.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_0.toValue(block_0),
                                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_33.toValue(place_0),
                                                                                                                                               alignment: _descriptor_33.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'this producer has already signed');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(6n),
                                                                  alignment: _descriptor_2.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_0.toValue(block_0),
                                                                  alignment: _descriptor_0.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_33.toValue(place_0),
                                                                                              alignment: _descriptor_33.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.assert(this._ed25519Verify_0(candidate_0.message,
                                                  signature_0,
                                                  point_0),
                            'the approval does not verify');
    const tmp_0 = { head: candidate_0.head,
                    message: candidate_0.message,
                    era: candidate_0.era,
                    stake:
                      __compactRuntime.addField(candidate_0.stake,
                                                producer_0.stake),
                    built: candidate_0.built };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(5n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_37.toValue(tmp_0),
                                                                                              alignment: _descriptor_37.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _accept_0(context, partialProofData, hash_0) {
    const block_0 = hash_0;
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(5n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'this header is not proposed');
    const candidate_0 = _descriptor_37.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_2.toValue(5n),
                                                                                                               alignment: _descriptor_2.alignment() } }] } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_0.toValue(block_0),
                                                                                                               alignment: _descriptor_0.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value);
    const now_0 = _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(3n),
                                                                                                         alignment: _descriptor_2.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    let t_0;
    __compactRuntime.assert((t_0 = candidate_0.head.height,
                             t_0 > now_0.head.height),
                            'the header is not newer than the head');
    const moves_0 = candidate_0.era === __compactRuntime.addField(now_0.era, 1n);
    __compactRuntime.assert(candidate_0.era === now_0.era || moves_0,
                            "the header's epoch has passed");
    const total_0 = moves_0 ? now_0.nextTotal : now_0.total;
    let t_1;
    __compactRuntime.assert((t_1 = ((t1) => {
                                     if (t1 > 5444517870735015415413993718908291383295n) {
                                       throw new __compactRuntime.CompactError('midnight-bridge.compact line 203 char 10: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 5444517870735015415413993718908291383295');
                                     }
                                     return t1;
                                   })(__compactRuntime.mulField(candidate_0.stake,
                                                                3n)),
                             t_1
                             >
                             ((t1) => {
                               if (t1 > 5444517870735015415413993718908291383295n) {
                                 throw new __compactRuntime.CompactError('midnight-bridge.compact line 203 char 47: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 5444517870735015415413993718908291383295');
                               }
                               return t1;
                             })(__compactRuntime.mulField(total_0, 2n))),
                            'not more than two thirds of the stake signed');
    let tmp_0;
    __compactRuntime.assert((tmp_0 = ((t1) => {
                                       if (t1 > 18446744073709551615n) {
                                         throw new __compactRuntime.CompactError('midnight-bridge.compact line 204 char 35: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                                       }
                                       return t1;
                                     })(candidate_0.built
                                        +
                                        this._maxHeaderAge_0()
                                        +
                                        1n),
                             _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_2.toValue(2n),
                                                                                                                   alignment: _descriptor_2.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(tmp_0),
                                                                                                                                               alignment: _descriptor_10.alignment() }).encode() } },
                                                                                        'lt',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'the header is older than 32 hours');
    const tmp_1 = { head: candidate_0.head,
                    era: candidate_0.era,
                    total: total_0,
                    nextTotal: moves_0 ? 0n : now_0.nextTotal,
                    list: moves_0 ? now_0.nextList : now_0.list,
                    nextList: moves_0 ? 0n : now_0.nextList };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(3n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(tmp_1),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(5n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    const payload_0 = Uint8Array.from([...Array.from(__compactRuntime.convertBigintToBytes(8,
                                                                                           candidate_0.head.height,
                                                                                           'midnight-bridge.compact line 212 char 9'),
                                                     BigInt),
                                       ...Array.from(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                     BigInt)],
                                      Number);
    let t_2;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_35.toValue(1n),
                                                                                                           alignment: _descriptor_35.alignment() })).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(10n),
                                                                                                                                                                                                     alignment: _descriptor_2.alignment() })).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue((t_2 = { name:
                                                                                                                                                                                                                                                                                                                                      new Uint8Array([108, 105, 103, 104, 116, 115, 111, 117, 116, 47, 104, 101, 97, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                                                                                                                                                                                                                                                                                                    payload:
                                                                                                                                                                                                                                                                                                                                      payload_0 },
                                                                                                                                                                                                                                                                                                                            Uint8Array.from([...Array.from(t_2.name,
                                                                                                                                                                                                                                                                                                                                                           BigInt),
                                                                                                                                                                                                                                                                                                                                             ...Array.from(t_2.payload,
                                                                                                                                                                                                                                                                                                                                                           BigInt)],
                                                                                                                                                                                                                                                                                                                                            Number))),
                                                                                                                                                                                                                                                                                              alignment: _descriptor_6.alignment() }))
                                                          .encode() } },
                                       'log']);
    return [];
  }
  async _forgetHeader_0(context, partialProofData, block_0) {
    const proposed_0 = _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                 partialProofData,
                                                                                 [
                                                                                  { dup: { n: 0 } },
                                                                                  { idx: { cached: false,
                                                                                           pushPath: false,
                                                                                           path: [
                                                                                                  { tag: 'value',
                                                                                                    value: { value: _descriptor_2.toValue(5n),
                                                                                                             alignment: _descriptor_2.alignment() } }] } },
                                                                                  { push: { storage: false,
                                                                                            value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                                                                         alignment: _descriptor_0.alignment() }).encode() } },
                                                                                  'member',
                                                                                  { popeq: { cached: true,
                                                                                             result: undefined } }]).value);
    const marked_0 = _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_2.toValue(6n),
                                                                                                           alignment: _descriptor_2.alignment() } }] } },
                                                                                { push: { storage: false,
                                                                                          value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                                                                       alignment: _descriptor_0.alignment() }).encode() } },
                                                                                'member',
                                                                                { popeq: { cached: true,
                                                                                           result: undefined } }]).value);
    __compactRuntime.assert(proposed_0 || marked_0,
                            'the bridge keeps nothing of that header');
    if (proposed_0) {
      const candidate_0 = _descriptor_37.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                     partialProofData,
                                                                                     [
                                                                                      { dup: { n: 0 } },
                                                                                      { idx: { cached: false,
                                                                                               pushPath: false,
                                                                                               path: [
                                                                                                      { tag: 'value',
                                                                                                        value: { value: _descriptor_2.toValue(5n),
                                                                                                                 alignment: _descriptor_2.alignment() } }] } },
                                                                                      { idx: { cached: false,
                                                                                               pushPath: false,
                                                                                               path: [
                                                                                                      { tag: 'value',
                                                                                                        value: { value: _descriptor_0.toValue(block_0),
                                                                                                                 alignment: _descriptor_0.alignment() } }] } },
                                                                                      { popeq: { cached: false,
                                                                                                 result: undefined } }]).value);
      const now_0 = _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_2.toValue(3n),
                                                                                                           alignment: _descriptor_2.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
      const passed_0 = !(candidate_0.era === now_0.era
                         ||
                         candidate_0.era
                         ===
                         __compactRuntime.addField(now_0.era, 1n));
      let t_0;
      __compactRuntime.assert((t_0 = candidate_0.head.height,
                               t_0 <= now_0.head.height)
                              ||
                              passed_0,
                              'the header can still become the head');
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_2.toValue(5n),
                                                                    alignment: _descriptor_2.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { rem: { cached: false } },
                                         { ins: { cached: true, n: 1 } }]);
    }
    if (marked_0) {
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_2.toValue(6n),
                                                                    alignment: _descriptor_2.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { rem: { cached: false } },
                                         { ins: { cached: true, n: 1 } }]);
    }
    return [];
  }
  _at_0(phase_0, which_0) {
    if (phase_0 === which_0) { return 1n; } else { return 0n; }
  }
  _step_0(p_0, byte_0, skip_0) {
    const b_0 = byte_0;
    const zero_0 = 0n;
    const live_0 = __compactRuntime.mulField(__compactRuntime.subField(1n,
                                                                       skip_0),
                                             __compactRuntime.subField(1n,
                                                                       p_0.ended));
    const marker_0 = __compactRuntime.mulField(live_0, this._at_0(p_0.left, 0n));
    const data_0 = __compactRuntime.subField(live_0, marker_0);
    __compactRuntime.assert(__compactRuntime.mulField(marker_0,
                                                      __compactRuntime.subField(b_0,
                                                                                128n))
                            ===
                            zero_0,
                            'the byte after the list must be 0x80');
    __compactRuntime.assert(__compactRuntime.mulField(marker_0,
                                                      __compactRuntime.subField(p_0.phase,
                                                                                1n))
                            ===
                            zero_0,
                            'the list ends inside an entry');
    __compactRuntime.assert(__compactRuntime.mulField(marker_0,
                                                      __compactRuntime.subField(p_0.index,
                                                                                p_0.count))
                            ===
                            zero_0,
                            'the list has the wrong number of entries');
    __compactRuntime.assert(__compactRuntime.mulField(__compactRuntime.mulField(__compactRuntime.subField(1n,
                                                                                                          skip_0),
                                                                                p_0.ended),
                                                      b_0)
                            ===
                            zero_0,
                            'padding must be zero');
    const tag_0 = this._at_0(p_0.phase, 1n);
    const length_0 = this._at_0(p_0.phase, 2n);
    const keyTag_0 = this._at_0(p_0.phase, 4n);
    const low_0 = this._at_0(p_0.phase, 5n);
    const high_0 = this._at_0(p_0.phase, 6n);
    const stake_0 = this._at_0(p_0.phase, 7n);
    __compactRuntime.assert(__compactRuntime.mulField(__compactRuntime.mulField(data_0,
                                                                                __compactRuntime.addField(tag_0,
                                                                                                          keyTag_0)),
                                                      b_0)
                            ===
                            zero_0,
                            'unsupported producer or key type');
    const last_0 = this._at_0(p_0.rem, 1n);
    const term_0 = __compactRuntime.mulField(b_0, p_0.scale);
    const len_0 = __compactRuntime.mulField(__compactRuntime.subField(1n, tag_0),
                                            __compactRuntime.addField(p_0.len,
                                                                      __compactRuntime.mulField(length_0,
                                                                                                term_0)));
    const stakeNow_0 = __compactRuntime.mulField(__compactRuntime.subField(1n,
                                                                           keyTag_0),
                                                 __compactRuntime.addField(p_0.stake,
                                                                           __compactRuntime.mulField(stake_0,
                                                                                                     term_0)));
    const width_0 = __compactRuntime.addField(__compactRuntime.addField(__compactRuntime.addField(__compactRuntime.mulField(length_0,
                                                                                                                            len_0),
                                                                                                  __compactRuntime.mulField(4n,
                                                                                                                            tag_0)),
                                                                        __compactRuntime.mulField(16n,
                                                                                                  __compactRuntime.addField(__compactRuntime.addField(keyTag_0,
                                                                                                                                                      low_0),
                                                                                                                            high_0))),
                                              __compactRuntime.subField(__compactRuntime.subField(__compactRuntime.subField(__compactRuntime.subField(__compactRuntime.subField(1n,
                                                                                                                                                                                length_0),
                                                                                                                                                      tag_0),
                                                                                                                            keyTag_0),
                                                                                                  low_0),
                                                                        high_0));
    const done_0 = __compactRuntime.mulField(__compactRuntime.mulField(data_0,
                                                                       last_0),
                                             stake_0);
    return { phase:
               __compactRuntime.addField(p_0.phase,
                                         __compactRuntime.mulField(__compactRuntime.mulField(data_0,
                                                                                             last_0),
                                                                   __compactRuntime.subField(1n,
                                                                                             __compactRuntime.mulField(7n,
                                                                                                                       stake_0)))),
             rem:
               __compactRuntime.addField(p_0.rem,
                                         __compactRuntime.mulField(data_0,
                                                                   __compactRuntime.subField(__compactRuntime.mulField(last_0,
                                                                                                                       __compactRuntime.addField(__compactRuntime.subField(width_0,
                                                                                                                                                                           p_0.rem),
                                                                                                                                                 1n)),
                                                                                             1n))),
             scale:
               __compactRuntime.addField(p_0.scale,
                                         __compactRuntime.mulField(data_0,
                                                                   __compactRuntime.addField(__compactRuntime.mulField(255n,
                                                                                                                       p_0.scale),
                                                                                             __compactRuntime.mulField(last_0,
                                                                                                                       __compactRuntime.subField(1n,
                                                                                                                                                 __compactRuntime.mulField(256n,
                                                                                                                                                                           p_0.scale)))))),
             count:
               __compactRuntime.addField(p_0.count,
                                         __compactRuntime.mulField(__compactRuntime.mulField(data_0,
                                                                                             this._at_0(p_0.phase,
                                                                                                        0n)),
                                                                   term_0)),
             len:
               __compactRuntime.addField(p_0.len,
                                         __compactRuntime.mulField(data_0,
                                                                   __compactRuntime.subField(len_0,
                                                                                             p_0.len))),
             keyLow:
               __compactRuntime.addField(p_0.keyLow,
                                         __compactRuntime.mulField(data_0,
                                                                   __compactRuntime.subField(__compactRuntime.mulField(__compactRuntime.subField(1n,
                                                                                                                                                 keyTag_0),
                                                                                                                       __compactRuntime.addField(p_0.keyLow,
                                                                                                                                                 __compactRuntime.mulField(low_0,
                                                                                                                                                                           term_0))),
                                                                                             p_0.keyLow))),
             keyHigh:
               __compactRuntime.addField(p_0.keyHigh,
                                         __compactRuntime.mulField(data_0,
                                                                   __compactRuntime.subField(__compactRuntime.mulField(__compactRuntime.subField(1n,
                                                                                                                                                 keyTag_0),
                                                                                                                       __compactRuntime.addField(p_0.keyHigh,
                                                                                                                                                 __compactRuntime.mulField(high_0,
                                                                                                                                                                           term_0))),
                                                                                             p_0.keyHigh))),
             stake:
               __compactRuntime.addField(p_0.stake,
                                         __compactRuntime.mulField(data_0,
                                                                   __compactRuntime.subField(stakeNow_0,
                                                                                             p_0.stake))),
             index: __compactRuntime.addField(p_0.index, done_0),
             total:
               __compactRuntime.addField(p_0.total,
                                         __compactRuntime.mulField(done_0,
                                                                   stakeNow_0)),
             left: __compactRuntime.subField(p_0.left, data_0),
             ended: __compactRuntime.addField(p_0.ended, marker_0),
             emitted: __compactRuntime.addField(p_0.emitted, done_0),
             outLow:
               __compactRuntime.addField(p_0.outLow,
                                         __compactRuntime.mulField(done_0,
                                                                   __compactRuntime.subField(p_0.keyLow,
                                                                                             p_0.outLow))),
             outHigh:
               __compactRuntime.addField(p_0.outHigh,
                                         __compactRuntime.mulField(done_0,
                                                                   __compactRuntime.subField(p_0.keyHigh,
                                                                                             p_0.outHigh))),
             outStake:
               __compactRuntime.addField(p_0.outStake,
                                         __compactRuntime.mulField(done_0,
                                                                   __compactRuntime.subField(stakeNow_0,
                                                                                             p_0.outStake))) };
  }
  _withoutEmitted_0(p_0) {
    return { phase: p_0.phase,
             rem: p_0.rem,
             scale: p_0.scale,
             count: p_0.count,
             len: p_0.len,
             keyLow: p_0.keyLow,
             keyHigh: p_0.keyHigh,
             stake: p_0.stake,
             index: p_0.index,
             total: p_0.total,
             left: p_0.left,
             ended: p_0.ended,
             emitted: 0n,
             outLow: p_0.outLow,
             outHigh: p_0.outHigh,
             outStake: p_0.outStake };
  }
  async _begin_0(context, partialProofData, length_0) {
    const zero_0 = 0n;
    const now_0 = _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(3n),
                                                                                                         alignment: _descriptor_2.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    const id_0 = this._transientHash_0(this._readSecret_0(context,
                                                          partialProofData));
    __compactRuntime.assert(now_0.nextTotal === zero_0,
                            "the next epoch's producers are already known");
    __compactRuntime.assert(!_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_2.toValue(7n),
                                                                                                                   alignment: _descriptor_2.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(id_0),
                                                                                                                                               alignment: _descriptor_12.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'this read exists');
    const tmp_0 = { sha: this._initialState_0(),
                    parse:
                      { phase: zero_0,
                        rem: 4n,
                        scale: 1n,
                        count: zero_0,
                        len: zero_0,
                        keyLow: zero_0,
                        keyHigh: zero_0,
                        stake: zero_0,
                        index: zero_0,
                        total: zero_0,
                        left: length_0,
                        ended: zero_0,
                        emitted: zero_0,
                        outLow: zero_0,
                        outHigh: zero_0,
                        outStake: zero_0 },
                    bitLength: __compactRuntime.mulField(length_0, 8n),
                    expected: now_0.head.nextProducers,
                    filling: __compactRuntime.addField(now_0.era, 1n),
                    active: true };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(7n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(id_0),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(tmp_0),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(4n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(id_0),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _absorb_0(context, partialProofData, block_0) {
    const id_0 = this._transientHash_0(this._readSecret_0(context,
                                                          partialProofData));
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(7n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(id_0),
                                                                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no such read');
    const list_0 = _descriptor_32.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_2.toValue(7n),
                                                                                                          alignment: _descriptor_2.alignment() } }] } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_12.toValue(id_0),
                                                                                                          alignment: _descriptor_12.alignment() } }] } },
                                                                               { popeq: { cached: false,
                                                                                          result: undefined } }]).value);
    __compactRuntime.assert(list_0.active, 'this read has ended');
    const bytes_0 = Array.from(block_0, BigInt);
    const zero_0 = 0n;
    const one_0 = 1n;
    const front_0 = await this._folder_8(context,
                                         partialProofData,
                                         (async (context,
                                                 partialProofData,
                                                 p_0,
                                                 byte_0) =>
                                          {
                                            return this._step_0(p_0, byte_0, 0n);
                                          }),
                                         this._withoutEmitted_0(list_0.parse),
                                         ((e) => e.slice(0, 8))(bytes_0));
    if (front_0.emitted === one_0) {
      const tmp_0 = ((t1) => {
                      if (t1 > 65535n) {
                        throw new __compactRuntime.CompactError('midnight-bridge.compact line 334 char 33: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 65535');
                      }
                      return t1;
                    })(__compactRuntime.subField(front_0.index, 1n));
      const tmp_1 = { keyLow: front_0.outLow,
                      keyHigh: front_0.outHigh,
                      stake: front_0.outStake };
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_2.toValue(4n),
                                                                    alignment: _descriptor_2.alignment() } },
                                                         { tag: 'value',
                                                           value: { value: _descriptor_12.toValue(id_0),
                                                                    alignment: _descriptor_12.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_33.toValue(tmp_0),
                                                                                                alignment: _descriptor_33.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(tmp_1),
                                                                                                alignment: _descriptor_34.alignment() }).encode() } },
                                         { ins: { cached: false, n: 1 } },
                                         { ins: { cached: true, n: 2 } }]);
    }
    const body_0 = await this._folder_9(context,
                                        partialProofData,
                                        (async (context,
                                                partialProofData,
                                                p_1,
                                                byte_1) =>
                                         {
                                           return this._step_0(p_1, byte_1, 0n);
                                         }),
                                        this._withoutEmitted_0(front_0),
                                        ((e) => e.slice(8, 56))(bytes_0));
    const closing_0 = body_0.ended;
    const back_0 = await this._folder_10(context,
                                         partialProofData,
                                         (async (context,
                                                 partialProofData,
                                                 p_2,
                                                 byte_2) =>
                                          {
                                            return this._step_0(p_2,
                                                                byte_2,
                                                                closing_0);
                                          }),
                                         body_0,
                                         ((e) => e.slice(56, 64))(bytes_0));
    if (back_0.emitted === one_0) {
      const tmp_2 = ((t1) => {
                      if (t1 > 65535n) {
                        throw new __compactRuntime.CompactError('midnight-bridge.compact line 341 char 33: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 65535');
                      }
                      return t1;
                    })(__compactRuntime.subField(back_0.index, 1n));
      const tmp_3 = { keyLow: back_0.outLow,
                      keyHigh: back_0.outHigh,
                      stake: back_0.outStake };
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_2.toValue(4n),
                                                                    alignment: _descriptor_2.alignment() } },
                                                         { tag: 'value',
                                                           value: { value: _descriptor_12.toValue(id_0),
                                                                    alignment: _descriptor_12.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_33.toValue(tmp_2),
                                                                                                alignment: _descriptor_33.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(tmp_3),
                                                                                                alignment: _descriptor_34.alignment() }).encode() } },
                                         { ins: { cached: false, n: 1 } },
                                         { ins: { cached: true, n: 2 } }]);
    }
    const trailer_0 = await this._folder_11(context,
                                            partialProofData,
                                            (async (context,
                                                    partialProofData,
                                                    acc_0,
                                                    byte_3) =>
                                             {
                                               return __compactRuntime.addField(__compactRuntime.mulField(acc_0,
                                                                                                          256n),
                                                                                byte_3);
                                             }),
                                            zero_0,
                                            ((e) => e.slice(56, 64))(bytes_0));
    __compactRuntime.assert(__compactRuntime.mulField(closing_0,
                                                      __compactRuntime.subField(trailer_0,
                                                                                list_0.bitLength))
                            ===
                            zero_0,
                            'the length in the padding is wrong');
    const state_0 = await this._compress_0(context,
                                           partialProofData,
                                           list_0.sha,
                                           [this._bigEndian_0(((e) => e.slice(0, 4))(bytes_0)),
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
                                            this._bigEndian_0(((e) => e.slice(60, 64))(bytes_0))]);
    const want_0 = Array.from(list_0.expected, BigInt);
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
                                                                                this._equal_6(state_0,
                                                                                              digest_0)
                                                                                ?
                                                                                1n
                                                                                :
                                                                                0n))
                            ===
                            zero_0,
                            'the list does not hash to the expected value');
    const tmp_4 = { sha: state_0,
                    parse: back_0,
                    bitLength: list_0.bitLength,
                    expected: list_0.expected,
                    filling: list_0.filling,
                    active: closing_0 === zero_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(7n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(id_0),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_32.toValue(tmp_4),
                                                                                              alignment: _descriptor_32.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    if (closing_0 === one_0) {
      const now_0 = _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_2.toValue(3n),
                                                                                                           alignment: _descriptor_2.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value);
      __compactRuntime.assert(list_0.filling
                              ===
                              __compactRuntime.addField(now_0.era, 1n),
                              "the list is not the next epoch's");
      __compactRuntime.assert(now_0.nextTotal === zero_0,
                              "the next epoch's producers are already known");
      const tmp_5 = { head: now_0.head,
                      era: now_0.era,
                      total: now_0.total,
                      nextTotal: back_0.total,
                      list: now_0.list,
                      nextList: id_0 };
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(3n),
                                                                                                alignment: _descriptor_2.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(tmp_5),
                                                                                                alignment: _descriptor_27.alignment() }).encode() } },
                                         { ins: { cached: false, n: 1 } }]);
    }
    return [];
  }
  async _spent_0(context, partialProofData, id_0) {
    const now_0 = _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(3n),
                                                                                                         alignment: _descriptor_2.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    return _descriptor_32.fromValue(__compactRuntime.queryLedgerState(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_2.toValue(7n),
                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_12.toValue(id_0),
                                                                                                  alignment: _descriptor_12.alignment() } }] } },
                                                                       { popeq: { cached: false,
                                                                                  result: undefined } }]).value).filling
           !==
           __compactRuntime.addField(now_0.era, 1n)
           &&
           id_0 !== now_0.list;
  }
  async _forgetRead_0(context, partialProofData, id_0) {
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(7n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(id_0),
                                                                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'no such read');
    __compactRuntime.assert(await this._spent_0(context, partialProofData, id_0),
                            'the read is still in use');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(7n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(id_0),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(4n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(id_0),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _up_0(node_0, level_0) {
    const left_0 = level_0.side === 1n ? level_0.hash : node_0;
    const right_0 = level_0.side === 1n ? node_0 : level_0.hash;
    if (level_0.side === 0n) {
      return node_0;
    } else {
      return this._pair_0(left_0, right_0);
    }
  }
  async _know_0(context,
                partialProofData,
                lite_0,
                innerRest_0,
                previous_0,
                path_0)
  {
    const hash_0 = this._pair_0(this._pair_0(this._persistentHash_0(lite_0),
                                             innerRest_0),
                                previous_0);
    const root_0 = await this._folder_12(context,
                                         partialProofData,
                                         (async (context,
                                                 partialProofData,
                                                 node_0,
                                                 level_0) =>
                                          {
                                            return this._up_0(node_0, level_0);
                                          }),
                                         hash_0,
                                         path_0);
    const now_0 = _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(3n),
                                                                                                         alignment: _descriptor_2.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    __compactRuntime.assert(this._equal_7(root_0, now_0.head.blockRoot),
                            'the block is not under the head');
    const tmp_0 = { outcomes:
                      Uint8Array.from(((e) => e.slice(104, 136))(Array.from(lite_0,
                                                                            BigInt)),
                                      Number),
                    at: now_0.head.height };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(8n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(hash_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(tmp_0),
                                                                                              alignment: _descriptor_14.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _forgetBlock_0(context, partialProofData, block_0) {
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(8n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the block is not known');
    let t_0;
    __compactRuntime.assert((t_0 = _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                              partialProofData,
                                                                                              [
                                                                                               { dup: { n: 0 } },
                                                                                               { idx: { cached: false,
                                                                                                        pushPath: false,
                                                                                                        path: [
                                                                                                               { tag: 'value',
                                                                                                                 value: { value: _descriptor_2.toValue(3n),
                                                                                                                          alignment: _descriptor_2.alignment() } }] } },
                                                                                               { popeq: { cached: false,
                                                                                                          result: undefined } }]).value).head.height,
                             t_0
                             >=
                             _descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                        partialProofData,
                                                                                        [
                                                                                         { dup: { n: 0 } },
                                                                                         { idx: { cached: false,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_2.toValue(8n),
                                                                                                                    alignment: _descriptor_2.alignment() } }] } },
                                                                                         { idx: { cached: false,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_0.toValue(block_0),
                                                                                                                    alignment: _descriptor_0.alignment() } }] } },
                                                                                         { popeq: { cached: false,
                                                                                                    result: undefined } }]).value).at
                             +
                             this._blockKeptFor_0()),
                            'the block was recorded too recently');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(8n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(block_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _forget_0(context, partialProofData, what_0, key_0, read_0) {
    const kind_0 = what_0;
    if (kind_0 === 0) {
      await this._forgetHeader_0(context, partialProofData, key_0);
    } else {
      if (kind_0 === 1) {
        await this._forgetRead_0(context, partialProofData, read_0);
      } else {
        await this._forgetBlock_0(context, partialProofData, key_0);
      }
    }
    return [];
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
               throw new __compactRuntime.CompactError('midnight-bridge.compact line 433 char 10: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
             }
             return t1;
           })(__compactRuntime.addField(__compactRuntime.addField(48n, value_0),
                                        __compactRuntime.mulField(39n, letter_0)));
  }
  async _hex_0(context, partialProofData, v_0) {
    const d_0 = await this._mapper_4(context,
                                     partialProofData,
                                     (async (context, partialProofData, byte_0) =>
                                      {
                                        const bits_0 = this._bitsOfByte_0(context,
                                                                          partialProofData,
                                                                          byte_0);
                                        const packed_0 = await this._folder_13(context,
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
  async _outcomeRest_0(context,
                       partialProofData,
                       count_0,
                       receipts_0,
                       gas_0,
                       tokens_0)
  {
    const zero_0 = [0n, 0n, 0n];
    const nameLength_0 = [26n, 0n, 0n, 0n];
    const empty_0 = [2n, 0n, 0n, 0n, 0n];
    const shared_0 = [...Array.from(gas_0, BigInt),
                      ...Array.from(tokens_0, BigInt),
                      ...nameLength_0,
                      ...Array.from(_descriptor_23.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                               partialProofData,
                                                                                               [
                                                                                                { dup: { n: 0 } },
                                                                                                { idx: { cached: false,
                                                                                                         pushPath: false,
                                                                                                         path: [
                                                                                                                { tag: 'value',
                                                                                                                  value: { value: _descriptor_2.toValue(2n),
                                                                                                                           alignment: _descriptor_2.alignment() } }] } },
                                                                                                { popeq: { cached: false,
                                                                                                           result: undefined } }]).value),
                                    BigInt),
                      ...empty_0];
    const first_0 = Array.from(receipts_0[0], BigInt);
    const second_0 = Array.from(receipts_0[1], BigInt);
    const none_0 = this._persistentHash_2(Uint8Array.from([count_0,
                                                           ...zero_0,
                                                           ...shared_0],
                                                          Number));
    const single_0 = this._persistentHash_5(Uint8Array.from([count_0,
                                                             ...zero_0,
                                                             ...first_0,
                                                             ...shared_0],
                                                            Number));
    const double_0 = this._persistentHash_3(Uint8Array.from([count_0,
                                                             ...zero_0,
                                                             ...first_0,
                                                             ...second_0,
                                                             ...shared_0],
                                                            Number));
    __compactRuntime.assert(count_0 === 0n || count_0 === 1n || count_0 === 2n,
                            'more than two new receipts');
    if (count_0 === 0n) {
      return none_0;
    } else {
      if (count_0 === 1n) { return single_0; } else { return double_0; }
    }
  }
  async _prove_lock_0(context,
                      partialProofData,
                      block_0,
                      receipt_0,
                      count_0,
                      receipts_0,
                      gas_0,
                      tokens_0,
                      lock_0,
                      amount_0,
                      recipient_0,
                      eventHash_0,
                      outcomePath_0,
                      shardPath_0)
  {
    const where_0 = block_0;
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(8n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(where_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the block is not known');
    const lockBytes_0 = Array.from(lock_0, BigInt);
    const amountBytes_0 = Array.from(amount_0, BigInt);
    const key_0 = Array.from(recipient_0, BigInt);
    const text_0 = Uint8Array.from([...Array.from(new Uint8Array([108, 105, 103, 104, 116, 115, 111, 117, 116, 58, 108, 111, 99, 107, 58]),
                                                  BigInt),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         lockBytes_0),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         amountBytes_0),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         ((e) => e.slice(0, 8))(key_0)),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         ((e) => e.slice(8, 16))(key_0)),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         ((e) => e.slice(16, 24))(key_0)),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         ((e) => e.slice(24, 32))(key_0))],
                                   Number);
    const four_0 = [4n, 0n, 0n, 0n];
    const rest_0 = await this._outcomeRest_0(context,
                                             partialProofData,
                                             count_0,
                                             receipts_0,
                                             gas_0,
                                             tokens_0);
    const leaf_0 = this._persistentHash_4(Uint8Array.from([...four_0,
                                                           ...Array.from(receipt_0,
                                                                         BigInt),
                                                           ...Array.from(rest_0,
                                                                         BigInt),
                                                           ...Array.from(this._persistentHash_1(text_0),
                                                                         BigInt),
                                                           ...Array.from(eventHash_0,
                                                                         BigInt)],
                                                          Number));
    const shard_0 = await this._folder_14(context,
                                          partialProofData,
                                          (async (context,
                                                  partialProofData,
                                                  node_0,
                                                  level_0) =>
                                           {
                                             return this._up_0(node_0, level_0);
                                           }),
                                          leaf_0,
                                          outcomePath_0);
    const root_0 = await this._folder_15(context,
                                         partialProofData,
                                         (async (context,
                                                 partialProofData,
                                                 node_1,
                                                 level_1) =>
                                          {
                                            return this._up_0(node_1, level_1);
                                          }),
                                         this._persistentHash_7(shard_0),
                                         shardPath_0);
    __compactRuntime.assert(this._equal_8(root_0,
                                          _descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_2.toValue(8n),
                                                                                                                                 alignment: _descriptor_2.alignment() } }] } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_0.toValue(where_0),
                                                                                                                                 alignment: _descriptor_0.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value).outcomes),
                            'the outcome is not in that block');
    const id_0 = ((t1) => {
                   if (t1 > 18446744073709551615n) {
                     throw new __compactRuntime.CompactError('midnight-bridge.compact line 486 char 14: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                   }
                   return t1;
                 })(this._bigEndian8_0(lockBytes_0));
    __compactRuntime.assert(!_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_2.toValue(9n),
                                                                                                                   alignment: _descriptor_2.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(id_0),
                                                                                                                                               alignment: _descriptor_10.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'this lock is already proven');
    __compactRuntime.assert(!_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_2.toValue(0n),
                                                                                                                   alignment: _descriptor_2.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(id_0),
                                                                                                                                               alignment: _descriptor_10.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'this lock is already minted');
    const tmp_0 = { amount:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('midnight-bridge.compact line 489 char 35: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(this._bigEndian8_0(amountBytes_0)),
                    recipient: recipient_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(9n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(id_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(tmp_0),
                                                                                              alignment: _descriptor_11.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _prove_register_0(context,
                          partialProofData,
                          block_0,
                          receipt_0,
                          count_0,
                          receipts_0,
                          gas_0,
                          tokens_0,
                          index_0,
                          commitment_0,
                          eventHash_0,
                          outcomePath_0,
                          shardPath_0)
  {
    const where_0 = block_0;
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(8n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(where_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the block is not known');
    const indexBytes_0 = Array.from(index_0, BigInt);
    const key_0 = Array.from(commitment_0, BigInt);
    const text_0 = Uint8Array.from([...Array.from(new Uint8Array([108, 105, 103, 104, 116, 115, 111, 117, 116, 58, 106, 111, 105, 110, 58]),
                                                  BigInt),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         indexBytes_0),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         ((e) => e.slice(0, 8))(key_0)),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         ((e) => e.slice(8, 16))(key_0)),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         ((e) => e.slice(16, 24))(key_0)),
                                    ...await this._hex_0(context,
                                                         partialProofData,
                                                         ((e) => e.slice(24, 32))(key_0))],
                                   Number);
    const four_0 = [4n, 0n, 0n, 0n];
    const rest_0 = await this._outcomeRest_0(context,
                                             partialProofData,
                                             count_0,
                                             receipts_0,
                                             gas_0,
                                             tokens_0);
    const leaf_0 = this._persistentHash_4(Uint8Array.from([...four_0,
                                                           ...Array.from(receipt_0,
                                                                         BigInt),
                                                           ...Array.from(rest_0,
                                                                         BigInt),
                                                           ...Array.from(this._persistentHash_5(text_0),
                                                                         BigInt),
                                                           ...Array.from(eventHash_0,
                                                                         BigInt)],
                                                          Number));
    const shard_0 = await this._folder_16(context,
                                          partialProofData,
                                          (async (context,
                                                  partialProofData,
                                                  node_0,
                                                  level_0) =>
                                           {
                                             return this._up_0(node_0, level_0);
                                           }),
                                          leaf_0,
                                          outcomePath_0);
    const root_0 = await this._folder_17(context,
                                         partialProofData,
                                         (async (context,
                                                 partialProofData,
                                                 node_1,
                                                 level_1) =>
                                          {
                                            return this._up_0(node_1, level_1);
                                          }),
                                         this._persistentHash_7(shard_0),
                                         shardPath_0);
    __compactRuntime.assert(this._equal_9(root_0,
                                          _descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_2.toValue(8n),
                                                                                                                                 alignment: _descriptor_2.alignment() } }] } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_0.toValue(where_0),
                                                                                                                                 alignment: _descriptor_0.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value).outcomes),
                            'the outcome is not in that block');
    const id_0 = ((t1) => {
                   if (t1 > 18446744073709551615n) {
                     throw new __compactRuntime.CompactError('midnight-bridge.compact line 512 char 14: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                   }
                   return t1;
                 })(this._bigEndian8_0(indexBytes_0));
    __compactRuntime.assert(!_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_2.toValue(11n),
                                                                                                                   alignment: _descriptor_2.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(id_0),
                                                                                                                                               alignment: _descriptor_10.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'this index is already registered');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(11n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(id_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(10n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(1n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.leafHash(
                                                                                              { value: _descriptor_0.toValue(commitment_0),
                                                                                                alignment: _descriptor_0.alignment() }
                                                                                            )).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(1n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { addi: { immediate: 1 } },
                                       { ins: { cached: true, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(2n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    if (indexBytes_0[7] === 0n) {
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_2.toValue(10n),
                                                                    alignment: _descriptor_2.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(2n),
                                                                                                alignment: _descriptor_2.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newMap(
                                                            new __compactRuntime.StateMap()
                                                          ).encode() } },
                                         { dup: { n: 2 } },
                                         { idx: { cached: false,
                                                  pushPath: false,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_2.toValue(0n),
                                                                    alignment: _descriptor_2.alignment() } }] } },
                                         'root',
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 3 } }]);
    }
    return [];
  }
  async _known_root_0(context, partialProofData, root_0) {
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(10n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(2n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(root_0),
                                                                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the root is not known');
    return [];
  }
  _wrappedDomain_0() {
    return new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 45, 98, 114, 105, 100, 103, 101, 58, 119, 110, 101, 97, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _coinKeyOf_0(secret_0) {
    const tag_0 = Array.from(new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 112, 107, 91, 118, 49, 93]),
                             BigInt);
    return this._persistentHash_8(Uint8Array.from([...tag_0,
                                                   ...Array.from(secret_0,
                                                                 BigInt)],
                                                  Number));
  }
  async _mint_0(context, partialProofData, lock_id_0) {
    const id_0 = lock_id_0;
    __compactRuntime.assert(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_2.toValue(9n),
                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(id_0),
                                                                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'the lock is not proven or already minted');
    const lock_0 = _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_2.toValue(9n),
                                                                                                          alignment: _descriptor_2.alignment() } }] } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_10.toValue(id_0),
                                                                                                          alignment: _descriptor_10.alignment() } }] } },
                                                                               { popeq: { cached: false,
                                                                                          result: undefined } }]).value);
    let t_0;
    __compactRuntime.assert((t_0 = lock_0.amount, t_0 > 0n), 'nothing to mint');
    __compactRuntime.assert(this._equal_10(this._coinKeyOf_0(this._coinSecretKey_0(context,
                                                                                   partialProofData)),
                                           lock_0.recipient),
                            'only the recipient mints');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(9n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(id_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(0n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(id_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    await this._mintShieldedToken_0(context,
                                    partialProofData,
                                    this._wrappedDomain_0(),
                                    lock_0.amount,
                                    this._evolveNonce_0(id_0,
                                                        this._wrappedDomain_0()),
                                    this._left_0({ bytes: lock_0.recipient }));
    return [];
  }
  _nameStep_0(s_0, b_0) {
    const zero_0 = b_0 === 0n;
    const separator_0 = b_0 === 45n || b_0 === 46n || b_0 === 95n;
    const plain_0 = b_0 >= 97n && b_0 <= 122n || b_0 >= 48n && b_0 <= 57n;
    __compactRuntime.assert(!s_0.ended || zero_0,
                            'the recipient goes on after its end');
    __compactRuntime.assert(s_0.ended || zero_0 || plain_0 || separator_0,
                            'the recipient has a character no NEAR account has');
    __compactRuntime.assert(s_0.ended || !s_0.separator || plain_0,
                            'the recipient has a separator at an end or two in a row');
    return { ended: s_0.ended || zero_0, separator: separator_0 };
  }
  _burnId_0(coin_0) { return this._persistentHash_9(coin_0); }
  async _burn_0(context, partialProofData, coin_0, near_recipient_0) {
    const name_0 = Array.from(near_recipient_0, BigInt);
    const checked_0 = await this._folder_18(context,
                                            partialProofData,
                                            (async (context,
                                                    partialProofData,
                                                    s_0,
                                                    b_0) =>
                                             {
                                               return this._nameStep_0(s_0, b_0);
                                             }),
                                            { ended: false, separator: true },
                                            name_0);
    __compactRuntime.assert(!checked_0.separator,
                            'the recipient has a separator at an end or two in a row');
    __compactRuntime.assert(name_0[1] !== 0n,
                            'the recipient has fewer than two characters');
    const c_0 = coin_0;
    __compactRuntime.assert(this._equal_11(c_0.color,
                                           this._tokenType_0(this._wrappedDomain_0(),
                                                             _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                                       partialProofData,
                                                                                                                       [
                                                                                                                        { dup: { n: 2 } },
                                                                                                                        { idx: { cached: true,
                                                                                                                                 pushPath: false,
                                                                                                                                 path: [
                                                                                                                                        { tag: 'value',
                                                                                                                                          value: { value: _descriptor_2.toValue(0n),
                                                                                                                                                   alignment: _descriptor_2.alignment() } }] } },
                                                                                                                        { popeq: { cached: true,
                                                                                                                                   result: undefined } }]).value))),
                            'the coin is not wrapped NEAR');
    let t_0;
    __compactRuntime.assert((t_0 = c_0.value, t_0 >= 100000n),
                            'a burn is at least 0.1 wNEAR');
    await this._receiveShielded_0(context, partialProofData, c_0);
    await this._sendImmediateShielded_0(context,
                                        partialProofData,
                                        c_0,
                                        this._shieldedBurnAddress_0(),
                                        c_0.value);
    const id_0 = this._burnId_0(c_0);
    const tmp_0 = Array.from(id_0, BigInt)[0];
    const tmp_1 = { id: id_0, near_recipient: near_recipient_0, value: c_0.value };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_2.toValue(1n),
                                                                  alignment: _descriptor_2.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(tmp_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_1),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const payload_0 = Uint8Array.from([...Array.from(id_0, BigInt),
                                       ...Array.from(__compactRuntime.convertBigintToBytes(16,
                                                                                           c_0.value,
                                                                                           'midnight-bridge.compact line 598 char 9'),
                                                     BigInt),
                                       ...Array.from(near_recipient_0, BigInt),
                                       ...Array.from(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                     BigInt)],
                                      Number);
    let t_1;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_35.toValue(1n),
                                                                                                           alignment: _descriptor_35.alignment() })).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(10n),
                                                                                                                                                                                                     alignment: _descriptor_2.alignment() })).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue((t_1 = { name:
                                                                                                                                                                                                                                                                                                                                      new Uint8Array([108, 105, 103, 104, 116, 115, 111, 117, 116, 47, 98, 117, 114, 110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                                                                                                                                                                                                                                                                                                    payload:
                                                                                                                                                                                                                                                                                                                                      payload_0 },
                                                                                                                                                                                                                                                                                                                            Uint8Array.from([...Array.from(t_1.name,
                                                                                                                                                                                                                                                                                                                                                           BigInt),
                                                                                                                                                                                                                                                                                                                                             ...Array.from(t_1.payload,
                                                                                                                                                                                                                                                                                                                                                           BigInt)],
                                                                                                                                                                                                                                                                                                                                            Number))),
                                                                                                                                                                                                                                                                                              alignment: _descriptor_6.alignment() }))
                                                          .encode() } },
                                       'log']);
    return [];
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
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (x0.x != y0.x || x0.y != y0.y) {
      return false;
    }
    return true;
  }
  async _folder_0(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 35; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _mapper_0(context, partialProofData, f, a0) {
    let a = [];
    for (let i = 0; i < 32; i++) { a[i] = await f(context, partialProofData, a0[i]); }
    return a;
  }
  _folder_1(f, x, a0, a1, a2) {
    for (let i = 0; i < 32; i++) { x = f(x, a0[i], a1[i], a2[i]); }
    return x;
  }
  _folder_2(f, x, a0, a1, a2) {
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
  async _folder_3(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 48; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _folder_4(context, partialProofData, f, x, a0, a1) {
    for (let i = 0; i < 16; i++) { x = await f(context, partialProofData, x, a0[i], a1[i]); }
    return x;
  }
  async _mapper_3(context, partialProofData, f, a0, a1) {
    let a = [];
    for (let i = 0; i < 8; i++) { a[i] = await f(context, partialProofData, a0[i], a1[i]); }
    return a;
  }
  _folder_5(f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(x, a0[i]); }
    return x;
  }
  _folder_6(f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(x, a0[i]); }
    return x;
  }
  _folder_7(f, x, a0) {
    for (let i = 0; i < 16; i++) { x = f(x, a0[i]); }
    return x;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  async _folder_8(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _folder_9(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 48; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _folder_10(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _folder_11(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_6(x0, y0) {
    for (let i0 = 0; i0 < 8; i0++) {
      let x1 = x0[i0];
      let y1 = y0[i0];
      if (x1 !== y1) { return false; }
    }
    return true;
  }
  async _folder_12(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 34; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  async _folder_13(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _mapper_4(context, partialProofData, f, a0) {
    let a = [];
    for (let i = 0; i < 8; i++) { a[i] = await f(context, partialProofData, a0[i]); }
    return a;
  }
  async _folder_14(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 16; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _folder_15(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 10; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_8(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  async _folder_16(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 16; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  async _folder_17(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 10; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_9(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_10(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  async _folder_18(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 64; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_11(x0, y0) {
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
    minted_locks: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(0n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(0n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(typeof(elem_0) === 'bigint' && elem_0 >= 0n && elem_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'midnight-bridge.compact line 44 char 1',
                                     'Uint<0..18446744073709551616>',
                                     elem_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(0n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map((elem) => _descriptor_10.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    burns: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(1n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(1n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 255n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'midnight-bridge.compact line 47 char 1',
                                     'Uint<0..256>',
                                     key_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(1n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(key_0),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 255n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'midnight-bridge.compact line 47 char 1',
                                     'Uint<0..256>',
                                     key_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(1n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(key_0),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_2.fromValue(key.value),      _descriptor_5.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get bridge() {
      return _descriptor_23.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_2.toValue(2n),
                                                                                                    alignment: _descriptor_2.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    get tip() {
      return _descriptor_27.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_2.toValue(3n),
                                                                                                    alignment: _descriptor_2.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    producers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(4n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(4n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0 && key_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'midnight-bridge.compact line 56 char 1',
                                     'Field',
                                     key_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(4n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(key_0),
                                                                                                                                 alignment: _descriptor_12.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0 && key_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'midnight-bridge.compact line 56 char 1',
                                     'Field',
                                     key_0)
        }
        if (state.asArray()[4].asMap().get({ value: _descriptor_12.toValue(key_0),
                                             alignment: _descriptor_12.alignment() }) === undefined) {
          throw new __compactRuntime.CompactError(`Map value undefined for ${key_0}`);
        }
        return {
          isEmpty(...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_1.length}`);
            }
            return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(4n),
                                                                                                         alignment: _descriptor_2.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_12.toValue(key_0),
                                                                                                         alignment: _descriptor_12.alignment() } }] } },
                                                                              'size',
                                                                              { push: { storage: false,
                                                                                        value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                     alignment: _descriptor_10.alignment() }).encode() } },
                                                                              'eq',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          size(...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_1.length}`);
            }
            return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_2.toValue(4n),
                                                                                                          alignment: _descriptor_2.alignment() } },
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_12.toValue(key_0),
                                                                                                          alignment: _descriptor_12.alignment() } }] } },
                                                                               'size',
                                                                               { popeq: { cached: true,
                                                                                          result: undefined } }]).value);
          },
          member(...args_1) {
            if (args_1.length !== 1) {
              throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_1.length}`);
            }
            const key_1 = args_1[0];
            if (!(typeof(key_1) === 'bigint' && key_1 >= 0n && key_1 <= 65535n)) {
              __compactRuntime.typeError('member',
                                         'argument 1',
                                         'midnight-bridge.compact line 56 char 37',
                                         'Uint<0..65536>',
                                         key_1)
            }
            return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(4n),
                                                                                                         alignment: _descriptor_2.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_12.toValue(key_0),
                                                                                                         alignment: _descriptor_12.alignment() } }] } },
                                                                              { push: { storage: false,
                                                                                        value: __compactRuntime.StateValue.newCell({ value: _descriptor_33.toValue(key_1),
                                                                                                                                     alignment: _descriptor_33.alignment() }).encode() } },
                                                                              'member',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          lookup(...args_1) {
            if (args_1.length !== 1) {
              throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_1.length}`);
            }
            const key_1 = args_1[0];
            if (!(typeof(key_1) === 'bigint' && key_1 >= 0n && key_1 <= 65535n)) {
              __compactRuntime.typeError('lookup',
                                         'argument 1',
                                         'midnight-bridge.compact line 56 char 37',
                                         'Uint<0..65536>',
                                         key_1)
            }
            return _descriptor_34.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_2.toValue(4n),
                                                                                                          alignment: _descriptor_2.alignment() } },
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_12.toValue(key_0),
                                                                                                          alignment: _descriptor_12.alignment() } }] } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_33.toValue(key_1),
                                                                                                          alignment: _descriptor_33.alignment() } }] } },
                                                                               { popeq: { cached: false,
                                                                                          result: undefined } }]).value);
          },
          [Symbol.iterator](...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_1.length}`);
            }
            const self_0 = state.asArray()[4].asMap().get({ value: _descriptor_12.toValue(key_0),
                                                            alignment: _descriptor_12.alignment() });
            return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_33.fromValue(key.value),      _descriptor_34.fromValue(value.value)    ];  })[Symbol.iterator]();
          }
        }
      }
    },
    candidates: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(5n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(5n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
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
                                     'midnight-bridge.compact line 58 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(5n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
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
                                     'midnight-bridge.compact line 58 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_37.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(5n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
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
        const self_0 = state.asArray()[5];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_37.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    signed: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(6n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(6n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
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
                                     'midnight-bridge.compact line 60 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(6n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
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
                                     'midnight-bridge.compact line 60 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        if (state.asArray()[6].asMap().get({ value: _descriptor_0.toValue(key_0),
                                             alignment: _descriptor_0.alignment() }) === undefined) {
          throw new __compactRuntime.CompactError(`Map value undefined for ${key_0}`);
        }
        return {
          isEmpty(...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_1.length}`);
            }
            return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(6n),
                                                                                                         alignment: _descriptor_2.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(key_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              'size',
                                                                              { push: { storage: false,
                                                                                        value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                     alignment: _descriptor_10.alignment() }).encode() } },
                                                                              'eq',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          size(...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_1.length}`);
            }
            return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_2.toValue(6n),
                                                                                                          alignment: _descriptor_2.alignment() } },
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
            const elem_0 = args_1[0];
            if (!(typeof(elem_0) === 'bigint' && elem_0 >= 0n && elem_0 <= 65535n)) {
              __compactRuntime.typeError('member',
                                         'argument 1',
                                         'midnight-bridge.compact line 60 char 38',
                                         'Uint<0..65536>',
                                         elem_0)
            }
            return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(6n),
                                                                                                         alignment: _descriptor_2.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(key_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { push: { storage: false,
                                                                                        value: __compactRuntime.StateValue.newCell({ value: _descriptor_33.toValue(elem_0),
                                                                                                                                     alignment: _descriptor_33.alignment() }).encode() } },
                                                                              'member',
                                                                              { popeq: { cached: true,
                                                                                         result: undefined } }]).value);
          },
          [Symbol.iterator](...args_1) {
            if (args_1.length !== 0) {
              throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_1.length}`);
            }
            const self_0 = state.asArray()[6].asMap().get({ value: _descriptor_0.toValue(key_0),
                                                            alignment: _descriptor_0.alignment() });
            return self_0.asMap().keys().map((elem) => _descriptor_33.fromValue(elem.value))[Symbol.iterator]();
          }
        }
      }
    },
    readers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(7n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(7n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0 && key_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'midnight-bridge.compact line 62 char 1',
                                     'Field',
                                     key_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(7n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(key_0),
                                                                                                                                 alignment: _descriptor_12.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0 && key_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'midnight-bridge.compact line 62 char 1',
                                     'Field',
                                     key_0)
        }
        return _descriptor_32.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(7n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_12.toValue(key_0),
                                                                                                      alignment: _descriptor_12.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[7];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_12.fromValue(key.value),      _descriptor_32.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    blocks: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(8n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(8n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
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
                                     'midnight-bridge.compact line 68 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(8n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
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
                                     'midnight-bridge.compact line 68 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(8n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
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
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_14.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    locks: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(9n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(9n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'midnight-bridge.compact line 70 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(9n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(key_0),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'midnight-bridge.compact line 70 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(9n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_10.toValue(key_0),
                                                                                                      alignment: _descriptor_10.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[9];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_10.fromValue(key.value),      _descriptor_11.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    members: {
      isFull(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isFull: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(10n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(1n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(65536n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'lt',
                                                                          'neg',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      checkRoot(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`checkRoot: expected 1 argument, received ${args_0.length}`);
        }
        const rt_0 = args_0[0];
        if (!(typeof(rt_0) === 'object' && typeof(rt_0.field) === 'bigint' && rt_0.field >= 0 && rt_0.field <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('checkRoot',
                                     'argument 1',
                                     'midnight-bridge.compact line 73 char 1',
                                     'struct MerkleTreeDigest<field: Field>',
                                     rt_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(10n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(2n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(rt_0),
                                                                                                                                 alignment: _descriptor_13.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      root(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`root: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[10];
        return ((result) => result             ? __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(result)             : undefined)(self_0.asArray()[0].asBoundedMerkleTree().rehash().root()?.value);
      },
      firstFree(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`first_free: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[10];
        return __compactRuntime.CompactTypeField.fromValue(self_0.asArray()[1].asCell().value);
      },
      pathForLeaf(...args_0) {
        if (args_0.length !== 2) {
          throw new __compactRuntime.CompactError(`path_for_leaf: expected 2 arguments, received ${args_0.length}`);
        }
        const index_0 = args_0[0];
        const leaf_0 = args_0[1];
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0 && index_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 1',
                                     'midnight-bridge.compact line 73 char 1',
                                     'Field',
                                     index_0)
        }
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 2',
                                     'midnight-bridge.compact line 73 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[10];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(16, _descriptor_0).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().pathForLeaf(    index_0,    {      value: _descriptor_0.toValue(leaf_0),      alignment: _descriptor_0.alignment()    }  )?.value);
      },
      findPathForLeaf(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`find_path_for_leaf: expected 1 argument, received ${args_0.length}`);
        }
        const leaf_0 = args_0[0];
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('find_path_for_leaf',
                                     'argument 1',
                                     'midnight-bridge.compact line 73 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[10];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(16, _descriptor_0).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().findPathForLeaf(    {      value: _descriptor_0.toValue(leaf_0),      alignment: _descriptor_0.alignment()    }  )?.value);
      },
      history(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`history: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[10];
        return self_0.asArray()[2].asMap().keys().map(  (elem) => __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    joined: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(11n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(0n),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(11n),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(typeof(elem_0) === 'bigint' && elem_0 >= 0n && elem_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'midnight-bridge.compact line 74 char 1',
                                     'Uint<0..18446744073709551616>',
                                     elem_0)
        }
        return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(11n),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[11];
        return self_0.asMap().keys().map((elem) => _descriptor_10.fromValue(elem.value))[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  callContext: { currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() }
};
const _dummyContract = new Contract({
  bitsOf: (...args) => undefined,
  bitsOfByte: (...args) => undefined,
  lowBit: (...args) => undefined,
  coinSecretKey: (...args) => undefined,
  readSecret: (...args) => undefined
});
export const pureCircuits = {
  wrappedDomain: (...args_0) => {
    if (args_0.length !== 0) {
      throw new __compactRuntime.CompactError(`wrappedDomain: expected 0 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    return _dummyContract._wrappedDomain_0();
  },
  burnId: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`burnId: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const coin_0 = args_0[0];
    if (!(typeof(coin_0) === 'object' && coin_0.nonce.buffer instanceof ArrayBuffer && coin_0.nonce.BYTES_PER_ELEMENT === 1 && coin_0.nonce.length === 32 && coin_0.color.buffer instanceof ArrayBuffer && coin_0.color.BYTES_PER_ELEMENT === 1 && coin_0.color.length === 32 && typeof(coin_0.value) === 'bigint' && coin_0.value >= 0n && coin_0.value <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.typeError('burnId',
                                 'argument 1',
                                 'midnight-bridge.compact line 575 char 1',
                                 'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                 coin_0)
    }
    return _dummyContract._burnId_0(coin_0);
  }
};
export const expectedVk = {
  'absorb': 'f405a3fc66bee6da8d37e3eac9cd3b48a8faab525ec5929970126a856b5995d9',
  'accept': '2e9f176e31a76fe3ae144c08915eb5dec6439179278bef83f58b9b0bcf4b1b99',
  'approve': '94f23659b31feb519f7bea317b56852f61b01604098da4a2ba8004eff97848a7',
  'begin': '1f459bcca16b77fea9908a643b1efd77d985920b9d7e54aea4156af5c48c3b39',
  'burn': '33e8a27305791f36eeb08375710a9136afca069cab6536dc96ab6ec621b54af8',
  'forget': '43d2b99861206e5dc8d6bcf80ac7ef60166d055ccd86ca21ffd4a77fa8cd15df',
  'know': '47f1a6e0667acde074715cbca41fd6a08c014c15b59c88a7d45e63a505a33ac9',
  'known_root': '1b3a1ec60894ddb8f86717659a855f33ae2b04d8403c2f50e7703f0641370914',
  'mint': 'eadf3cf7e234cb18ffb7e5192e0d1a177bd2f0c275eb647428c9dca1c5a1a1d2',
  'propose': '6d7a58d23509d2f7fab2f83b90429ef5d22bb468f723754f9996b8a9107756f7',
  'prove_lock': '91e63defa2f656bc3c98412ff35109ae8cea6a47574a8ba57c0a15ea1932dd81',
  'prove_register': 'ba507487fab84549d6806e3113528da5a6cb4630897f1e8f1f9263e703e0b510',
};

export const circuitSignatures = {
  'propose': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 208}, {tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 8}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'approve': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '65535'}, {tag: 'Struct', name: 'Ed25519Signature', elements: [{name: 'r', type: {tag: 'Curve25519Point'}}, {name: 's', type: {tag: 'Curve25519Scalar'}}]}, {tag: 'Curve25519Point'}], resultType: {tag: 'Tuple', types: []}},
  'accept': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'begin': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '4294967295'}], resultType: {tag: 'Tuple', types: []}},
  'absorb': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 64}], resultType: {tag: 'Tuple', types: []}},
  'know': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 208}, {tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Vector', length: 34, type: {tag: 'Struct', name: 'Level', elements: [{name: 'hash', type: {tag: 'Bytes', length: 32}}, {name: 'side', type: {tag: 'Uint', maxval: '255'}}]}}], resultType: {tag: 'Tuple', types: []}},
  'forget': {pure: false, provable: true, argumentTypes: [{tag: 'Enum', name: 'Stale', elements: ['header', 'read', 'block']}, {tag: 'Bytes', length: 32}, {tag: 'Field'}], resultType: {tag: 'Tuple', types: []}},
  'prove_lock': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '255'}, {tag: 'Vector', length: 2, type: {tag: 'Bytes', length: 32}}, {tag: 'Bytes', length: 8}, {tag: 'Bytes', length: 16}, {tag: 'Bytes', length: 8}, {tag: 'Bytes', length: 8}, {tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Vector', length: 16, type: {tag: 'Struct', name: 'Level', elements: [{name: 'hash', type: {tag: 'Bytes', length: 32}}, {name: 'side', type: {tag: 'Uint', maxval: '255'}}]}}, {tag: 'Vector', length: 10, type: {tag: 'Struct', name: 'Level', elements: [{name: 'hash', type: {tag: 'Bytes', length: 32}}, {name: 'side', type: {tag: 'Uint', maxval: '255'}}]}}], resultType: {tag: 'Tuple', types: []}},
  'prove_register': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '255'}, {tag: 'Vector', length: 2, type: {tag: 'Bytes', length: 32}}, {tag: 'Bytes', length: 8}, {tag: 'Bytes', length: 16}, {tag: 'Bytes', length: 8}, {tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Vector', length: 16, type: {tag: 'Struct', name: 'Level', elements: [{name: 'hash', type: {tag: 'Bytes', length: 32}}, {name: 'side', type: {tag: 'Uint', maxval: '255'}}]}}, {tag: 'Vector', length: 10, type: {tag: 'Struct', name: 'Level', elements: [{name: 'hash', type: {tag: 'Bytes', length: 32}}, {name: 'side', type: {tag: 'Uint', maxval: '255'}}]}}], resultType: {tag: 'Tuple', types: []}},
  'known_root': {pure: false, provable: true, argumentTypes: [{tag: 'Struct', name: 'MerkleTreeDigest', elements: [{name: 'field', type: {tag: 'Field'}}]}], resultType: {tag: 'Tuple', types: []}},
  'wrappedDomain': {pure: true, provable: false, argumentTypes: [], resultType: {tag: 'Bytes', length: 32}},
  'mint': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'burnId': {pure: true, provable: false, argumentTypes: [{tag: 'Struct', name: 'ShieldedCoinInfo', elements: [{name: 'nonce', type: {tag: 'Bytes', length: 32}}, {name: 'color', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}}]}], resultType: {tag: 'Bytes', length: 32}},
  'burn': {pure: false, provable: true, argumentTypes: [{tag: 'Struct', name: 'ShieldedCoinInfo', elements: [{name: 'nonce', type: {tag: 'Bytes', length: 32}}, {name: 'color', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}}]}, {tag: 'Bytes', length: 64}], resultType: {tag: 'Tuple', types: []}},
};

export const declaredInterfaces = {};

//# sourceMappingURL=index.js.map
