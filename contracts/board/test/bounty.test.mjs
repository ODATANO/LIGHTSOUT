// A bounty: a reward the contract pays only for a NEAR AI model's answer to one exact request.
// The answers and ed25519 signatures are recorded ones of the models' TEEs.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ed25519 } from '@noble/curves/ed25519.js';
import { addField } from '@midnight-ntwrk/compact-runtime';
import { answerCircuit, bountiesOf, bountyId, bountyTerms, signedText } from '../../../kit/src/board/bounty.ts';
import { randomField, sha256 } from '../../../kit/src/board/field.ts';
import { keyPair, openHandover } from '../../../kit/src/board/handover.ts';
import { memberCommitment } from '../../../kit/src/board/member.ts';
import { decrypt } from '../../../kit/src/board/sealing.ts';
import { pointOf, signatureOf } from '../../../kit/src/ed25519.ts';
import { DAY_SECONDS } from '../../../kit/src/board/member.ts';
import { EPOCH, NOON, TOKEN, coinKeyOf, coinOf, dropOf, hex, proven, world } from './helpers.mjs';

// One recorded answer per model: the exact request and response bytes, the TEE's key and signature.
const ANSWERS = JSON.parse(readFileSync(new URL('../../../kit/src/fixtures/nearai-answers.json', import.meta.url), 'utf8')).map((a) => ({
  model: a.model,
  request: Buffer.from(a.request, 'utf8'),
  response: Buffer.from(a.response, 'base64'),
  signature: Buffer.from(a.signature, 'hex'),
  key: Buffer.from(a.key, 'hex'),
}));
const [SHORT, , LONG] = ANSWERS;

const DEADLINE = BigInt(NOON + 600);
const AFTER = { time: NOON + 601 };
// How long past its deadline a bounty is kept and refunded to the holder of its refund key alone.
const KEPT = 30 * DAY_SECONDS;
const REWARD = 5000n;
const paid = ({ coins }) => coins.outputs.map((output) => [output.recipient.left, output.coinInfo.value]);
const changed = (bytes, at = 0) => Buffer.from(bytes).fill(bytes[at] ^ 1, at, at + 1);

/** A world where member 1 has put a reward on the answer of a recorded request. Member 0 answers. */
async function asked(recorded, { keys = [recorded.key], publish = true, request = recorded.request, model = recorded.model, checked = false } = {}) {
  const w = await world();
  const refundSecret = randomBytes(32);
  const buyer = { ...keyPair(), refundSecret, refundTo: coinKeyOf(refundSecret) };
  const terms = bountyTerms(model, request, keys, publish);
  const coin = coinOf(REWARD);
  const bounty = await w.as(w.secrets[1]).postBounty(terms, buyer, { coin, refundTo: buyer.refundTo, deadline: DEADLINE, checked });
  w.as(w.secrets[0]);
  return { w, buyer, terms, coin, bounty };
}

const answering = (w, recorded, bounty, drop, options) => w.answer(answerCircuit(recorded.model), bounty, drop, signatureOf(recorded.signature), pointOf(recorded.key), options);

proven('a member puts a reward on an answer and the contract keeps the coin', async () => {
  const { w, buyer, terms, coin, bounty } = await asked(LONG, { checked: true });

  const stored = w.state.bounties.lookup(bounty);
  assert.deepEqual(
    [hex(stored.request_hash), hex(stored.model), stored.model_length, stored.keys.map(hex), stored.buyer, hex(stored.refund_to), stored.deadline],
    [hex(sha256(LONG.request)), hex(terms.model), 36n, [hex(LONG.key), '00'.repeat(32), '00'.repeat(32), '00'.repeat(32)], buyer.point, hex(buyer.refundTo), DEADLINE],
  );
  const held = w.state.rewards.lookup(bounty);
  assert.deepEqual([hex(held.nonce), hex(held.color), held.value], [hex(coin.nonce), hex(TOKEN), REWARD]);
  // Anyone reads what is asked from the ledger.
  assert.deepEqual(bountiesOf(w.state), [{ id: hex(bounty), model: LONG.model, requestHash: hex(sha256(LONG.request)), request: LONG.request, keys: [hex(LONG.key)], deadline: DEADLINE, reward: REWARD, answer: undefined }]);
  await assert.rejects(w.refundBounty(bounty), /the deadline has not passed/);
  assert.ok(w.state.rewards.member(bounty));
});

for (const recorded of ANSWERS) {
  proven(`the real answer of ${recorded.model} is paid and handed to the requester`, async () => {
    const { w, buyer, bounty } = await asked(recorded);
    const drop = await w.sealed(dropOf(recorded.response));
    const answered = await answering(w, recorded, bounty, drop, { checked: true });

    assert.deepEqual(paid(answered), [[hex(drop.payout), REWARD]]);
    assert.equal(answered.coins.inputs.length, 1);
    assert.equal(w.state.rewards.member(bounty), false);
    const [listed] = bountiesOf(w.state);
    assert.deepEqual([listed.reward, listed.answer], [undefined, hex(drop.id)]);

    // The requester reads the answer from the ledger alone.
    const answer = w.state.answers.lookup(bounty);
    const key = openHandover(answer.handover, buyer.secret);
    assert.equal(key, drop.key);
    const content = decrypt(w.cipherOf(answer.drop), key, Number(w.state.drops.lookup(answer.drop).length));
    assert.deepEqual(content, recorded.response);
    assert.equal(JSON.parse(content.toString('utf8')).choices[0].message.content, 'Paris');
    assert.notEqual(openHandover(answer.handover, keyPair().secret), drop.key);
  });
}

test('the signed text is the model, the hash of the request and the hash of the response', () => {
  for (const { model, request, response, signature, key } of ANSWERS) {
    assert.ok(ed25519.verify(signature, signedText(model, sha256(request), sha256(response)), key));
  }
});

test('a drop with another content than the signed answer is refused', async () => {
  const { w, bounty } = await asked(SHORT);
  for (const content of [changed(SHORT.response), changed(SHORT.response, SHORT.response.length - 1), Buffer.from('Paris')]) {
    const drop = await w.sealed(dropOf(content));
    await assert.rejects(answering(w, SHORT, bounty, drop), /the TEE did not sign this answer/);
  }
  assert.ok(w.state.rewards.member(bounty));
  assert.equal(w.state.answers.size(), 0n);
});

test('the answer to another request is refused', async () => {
  const { w, bounty } = await asked(SHORT, { request: changed(SHORT.request, 60) });
  const drop = await w.sealed(dropOf(SHORT.response));
  await assert.rejects(answering(w, SHORT, bounty, drop), /the TEE did not sign this answer/);
});

test('the answer of another model is refused', async () => {
  const other = 'Qwen/Qwen3.8-28B';
  const { w, bounty } = await asked(SHORT, { model: other });
  const drop = await w.sealed(dropOf(SHORT.response));
  await assert.rejects(w.answer('answer_16', bounty, drop, signatureOf(SHORT.signature), pointOf(SHORT.key)), /the TEE did not sign this answer/);
});

test('a changed signature is refused', async () => {
  const { w, bounty } = await asked(SHORT);
  const drop = await w.sealed(dropOf(SHORT.response));
  const { r, s } = signatureOf(SHORT.signature);
  const elsewhere = pointOf(ed25519.getPublicKey(ed25519.utils.randomSecretKey()));
  for (const signature of [{ r, s: s + 1n }, { r: elsewhere, s }]) {
    await assert.rejects(w.answer('answer_16', bounty, drop, signature, pointOf(SHORT.key)), /the TEE did not sign this answer/);
  }
});

test('a key the bounty does not name cannot sign an answer', async () => {
  const { w, bounty } = await asked(SHORT);
  const drop = await w.sealed(dropOf(SHORT.response));
  // Someone signs the right text with a key of their own.
  const secret = ed25519.utils.randomSecretKey();
  const own = ed25519.sign(signedText(SHORT.model, sha256(SHORT.request), sha256(SHORT.response)), secret);
  await assert.rejects(w.answer('answer_16', bounty, drop, signatureOf(own), pointOf(ed25519.getPublicKey(secret))), /the bounty does not name this key/);
  assert.ok(w.state.rewards.member(bounty));
});

test('the point behind a key of 32 zero bytes cannot sign', async () => {
  const { w, bounty } = await asked(SHORT);
  const drop = await w.sealed(dropOf(SHORT.response));
  // That point has order four, so signatures under it can be made up. The runtime refuses it as
  // a point, and in the contract an unused key place matches nothing.
  const zero = pointOf(new Uint8Array(32));
  assert.equal(zero.y, 0n);
  await assert.rejects(w.answer('answer_16', bounty, drop, signatureOf(SHORT.signature), zero));
  assert.ok(w.state.rewards.member(bounty));
});

test('any of the keys a bounty names can sign', async () => {
  const others = [1, 2, 3].map(() => ed25519.getPublicKey(ed25519.utils.randomSecretKey()));
  const { w, bounty } = await asked(SHORT, { keys: [...others, SHORT.key] });
  const drop = await w.sealed(dropOf(SHORT.response));
  await answering(w, SHORT, bounty, drop);
  assert.equal(w.state.rewards.member(bounty), false);
});

test('an answer needs a sealed drop and its key', async () => {
  const { w, bounty } = await asked(SHORT);
  const drop = dropOf(SHORT.response);
  await assert.rejects(answering(w, SHORT, bounty, drop), /no such drop/);
  await w.begin(drop);
  await assert.rejects(answering(w, SHORT, bounty, drop), /the drop is not sealed/);
  for (const [i, block] of drop.blocks.entries()) await (i < Math.floor(drop.content.length / 64) ? w.sealBlock(drop, block) : w.sealFinish(drop, block));
  for (const key of [addField(drop.key, 1n), randomField(), 0n]) await assert.rejects(answering(w, SHORT, bounty, drop, { key }), /not the key behind the hash/);
  assert.ok(w.state.rewards.member(bounty));
});

test('an answer goes through the circuit of its model name length', async () => {
  const { w, bounty } = await asked(SHORT);
  const drop = await w.sealed(dropOf(SHORT.response));
  for (const circuit of ['answer_24', 'answer_36']) {
    await assert.rejects(w.answer(circuit, bounty, drop, signatureOf(SHORT.signature), pointOf(SHORT.key)), /the model's name has another length/);
  }
});

test('an answer shows nothing of the key', async () => {
  const { w, bounty } = await asked(SHORT);
  const drop = await w.sealed(dropOf(SHORT.response));
  const { calls } = await answering(w, SHORT, bounty, drop);
  const said = JSON.stringify(calls.map((call) => call.publicTranscript), (_, v) => (typeof v === 'bigint' ? v.toString(16) : v instanceof Uint8Array ? hex(v) : v));
  const key = Buffer.from(drop.key.toString(16).padStart(64, '0'), 'hex');
  for (const bytes of [key, Buffer.from(key).reverse()]) {
    for (let at = 0; at + 8 <= bytes.length; at++) assert.equal(said.includes(hex(bytes.subarray(at, at + 8))), false);
  }
});

test('a bounty is paid once', async () => {
  const { w, bounty } = await asked(SHORT);
  const drop = await w.sealed(dropOf(SHORT.response));
  await answering(w, SHORT, bounty, drop);
  await assert.rejects(answering(w, SHORT, bounty, drop), /the bounty is not open/);
  await assert.rejects(w.refundBounty(bounty, AFTER), /the bounty is not open/);
  await assert.rejects(answering(w, SHORT, randomBytes(32), drop), /the bounty is not open/);
});

proven('a refund pays the reward back only after the deadline', async () => {
  const { w, buyer, bounty } = await asked(SHORT);
  await assert.rejects(w.refundBounty(bounty), /the deadline has not passed/);
  await assert.rejects(w.refundBounty(bounty, { time: Number(DEADLINE) }), /the deadline has not passed/);
  const refunded = await w.refundBounty(bounty, { ...AFTER, checked: true, secret: buyer.refundSecret });
  assert.deepEqual(paid(refunded), [[hex(buyer.refundTo), REWARD]]);
  assert.equal(w.state.rewards.member(bounty), false);
  assert.deepEqual([bountiesOf(w.state)[0].reward, bountiesOf(w.state)[0].answer], [undefined, undefined]);

  const drop = await w.sealed(dropOf(SHORT.response));
  await assert.rejects(answering(w, SHORT, bounty, drop), /the bounty is not open/);
});

test('only the holder of the refund key refunds, and anyone 30 days after the deadline', async () => {
  const { w, buyer, bounty } = await asked(SHORT);
  const late = Number(DEADLINE) + KEPT;
  for (const secret of [undefined, randomBytes(32)]) {
    await assert.rejects(w.refundBounty(bounty, { ...AFTER, secret }), /only the holder of the refund key refunds in the first 30 days/);
    await assert.rejects(w.refundBounty(bounty, { time: late, secret }), /only the holder of the refund key refunds in the first 30 days/);
  }
  assert.ok(w.state.rewards.member(bounty));
  // Someone else sends it, and the reward still goes to the refund key.
  const refunded = await w.refundBounty(bounty, { time: late + 1 });
  assert.deepEqual(paid(refunded), [[hex(buyer.refundTo), REWARD]]);
  assert.equal(w.state.rewards.member(bounty), false);
});

test('an answer counts only before the deadline', async () => {
  const { w, bounty } = await asked(SHORT);
  const drop = await w.sealed(dropOf(SHORT.response));
  await assert.rejects(answering(w, SHORT, bounty, drop, AFTER), /the deadline has passed/);
  await assert.rejects(answering(w, SHORT, bounty, drop, { time: Number(DEADLINE) }), /the deadline has passed/);
  assert.ok(w.state.rewards.member(bounty));
  await answering(w, SHORT, bounty, drop, { time: Number(DEADLINE) - 1 });
  assert.equal(w.state.rewards.member(bounty), false);
});

test('a drop answers for 7 days from the day it was opened', async () => {
  const w = await world();
  const drop = await w.sealed(dropOf(SHORT.response));
  // The bounty is posted on the last day the drop answers and runs into the next.
  const lastDay = Number(EPOCH) + 6;
  const nextDay = (lastDay + 1) * DAY_SECONDS;
  const buyer = keyPair();
  const bounty = await w.as(w.secrets[1]).postBounty(bountyTerms(SHORT.model, SHORT.request, [SHORT.key]), buyer, { deadline: BigInt(nextDay + 600), time: nextDay - 600 });
  w.as(w.secrets[0]);
  await assert.rejects(answering(w, SHORT, bounty, drop, { time: nextDay }), /the drop is too old to answer with/);
  await answering(w, SHORT, bounty, drop, { time: nextDay - 1 });
  assert.equal(w.state.rewards.member(bounty), false);
});

test('the records of a bounty are removed 30 days after its deadline, once the reward is gone', async () => {
  const { w, bounty } = await asked(SHORT);
  const late = { time: Number(DEADLINE) + KEPT + 1 };
  await assert.rejects(w.call('forget_bounty', [bounty], late), /the reward is still on the board/);
  await assert.rejects(w.call('forget_bounty', [randomBytes(32)], late), /no such bounty/);
  const drop = await w.sealed(dropOf(SHORT.response));
  await answering(w, SHORT, bounty, drop);
  await assert.rejects(w.call('forget_bounty', [bounty], AFTER), /the bounty is still kept/);
  await assert.rejects(w.call('forget_bounty', [bounty], { time: Number(DEADLINE) + KEPT }), /the bounty is still kept/);
  assert.ok(w.state.answers.member(bounty));
  await w.call('forget_bounty', [bounty], late);
  assert.deepEqual([w.state.bounties.member(bounty), w.state.requests.member(bounty), w.state.answers.member(bounty)], [false, false, false]);
  assert.deepEqual(bountiesOf(w.state), []);
});

test('a refunded bounty is removed as an answered one is', async () => {
  const { w, buyer, bounty } = await asked(SHORT);
  await w.refundBounty(bounty, { ...AFTER, secret: buyer.refundSecret });
  await w.call('forget_bounty', [bounty], { time: Number(DEADLINE) + KEPT + 1 });
  assert.equal(w.state.bounties.size(), 0n);
});

test('a request can stay off the board', async () => {
  const { w, bounty } = await asked(SHORT, { publish: false });
  assert.equal(w.state.requests.lookup(bounty).length, 0n);
  assert.equal(bountiesOf(w.state)[0].request, undefined);
  const drop = await w.sealed(dropOf(SHORT.response));
  await answering(w, SHORT, bounty, drop);
  assert.equal(w.state.rewards.member(bounty), false);
});

test('a published text that is not the request is not shown as it', async () => {
  const w = await world();
  const terms = { ...bountyTerms(SHORT.model, SHORT.request, [SHORT.key]), requestHash: sha256(changed(SHORT.request)) };
  await w.postBounty(terms, keyPair());
  assert.equal(bountiesOf(w.state)[0].request, undefined);
});

test('a bounty needs the payment token, a reward, a deadline ahead and a model with an answer circuit', async () => {
  const w = await world();
  const terms = bountyTerms(SHORT.model, SHORT.request, [SHORT.key]);
  await assert.rejects(w.postBounty(terms, keyPair(), { coin: coinOf(REWARD, randomBytes(32)) }), /the coin is not the payment token/);
  await assert.rejects(w.postBounty(terms, keyPair(), { coin: coinOf(0n) }), /a bounty needs a reward/);
  await assert.rejects(w.postBounty(terms, keyPair(), { deadline: BigInt(NOON) }), /the deadline has passed/);
  await assert.rejects(w.postBounty(terms, keyPair(), { deadline: BigInt(NOON + KEPT + 1) }), /the deadline lies more than 30 days ahead/);
  for (const modelLength of [0n, 15n, 17n, 35n, 48n]) {
    await assert.rejects(w.postBounty({ ...terms, modelLength }, keyPair()), /no answer circuit takes a model name of this length/);
  }
  await assert.rejects(w.postBounty({ ...terms, textLength: 513n }, keyPair()), /the request is longer than 512 bytes/);
  assert.equal(w.state.bounties.size(), 0n);
  assert.throws(() => bountyTerms('Qwen/Qwen3.8-27B-abliterated', SHORT.request, [SHORT.key]), /16, 24, 36 bytes/);
  assert.throws(() => bountyTerms(SHORT.model, SHORT.request, []), /1 to 4 TEE keys/);
  assert.throws(() => bountyTerms(SHORT.model, SHORT.request, [new Uint8Array(32)]), /not zero/);
  assert.throws(() => bountyTerms(SHORT.model, randomBytes(513), [SHORT.key]), /the board takes 512/);
});

test('a deadline 30 days ahead is taken', async () => {
  const w = await world();
  const bounty = await w.postBounty(bountyTerms(SHORT.model, SHORT.request, [SHORT.key]), keyPair(), { deadline: BigInt(NOON + KEPT) });
  assert.equal(w.state.bounties.lookup(bounty).deadline, BigInt(NOON + KEPT));
});

test('the same request can be asked again, the same bounty not', async () => {
  const w = await world();
  const terms = bountyTerms(SHORT.model, SHORT.request, [SHORT.key]);
  const posting = { buyer: keyPair(), refundTo: randomBytes(32), deadline: DEADLINE };
  const post = (change = {}) => {
    const { buyer, terms: asked = terms, reward = REWARD, ...rest } = { ...posting, ...change };
    return w.postBounty(asked, buyer, { ...rest, coin: coinOf(reward) });
  };
  const first = await post();
  // The board keeps it under the id the kit computes.
  assert.ok(w.state.bounties.member(first));
  assert.equal(hex(first), hex(bountyId({ terms, buyer: posting.buyer.point, refundTo: posting.refundTo, deadline: DEADLINE, reward: REWARD })));
  await assert.rejects(post(), /this bounty exists/);

  // Any other term gives another bounty, so nobody takes the place of this one with other terms.
  const others = [
    { buyer: keyPair() },
    { refundTo: randomBytes(32) },
    { deadline: DEADLINE + 1n },
    { reward: REWARD + 1n },
    { terms: bountyTerms(SHORT.model, SHORT.request, [randomBytes(32)]) },
    { terms: bountyTerms(SHORT.model, SHORT.request, [SHORT.key, randomBytes(32)]) },
    { terms: bountyTerms('Qwen/Qwen3.8-28B', SHORT.request, [SHORT.key]) },
  ];
  const ids = new Set([hex(first)]);
  for (const change of others) ids.add(hex(await post(change)));
  assert.equal(ids.size, others.length + 1);
  assert.equal(w.state.bounties.size(), BigInt(others.length + 1));
});

test('someone outside the member tree cannot post a bounty', async () => {
  const w = await world();
  const outsider = randomBytes(32);
  assert.equal(w.tree.findPathForLeaf(memberCommitment(outsider)), undefined);
  await assert.rejects(w.as(outsider).postBounty(bountyTerms(SHORT.model, SHORT.request, [SHORT.key]), keyPair()));
  assert.equal(w.state.bounties.size(), 0n);
});
