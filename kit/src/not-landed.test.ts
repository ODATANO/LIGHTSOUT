import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FailedInBlock, feeMayBeSpent, mayStillLand, NotLanded, outdated, overTime } from './not-landed.js';

test('a transaction that was sent and not seen yet can still land, also under other errors', () => {
  const sent = new NotLanded('ab12');
  assert.equal(sent.message, 'transaction ab12 was sent and no block took it in time');
  assert.equal(mayStillLand(sent), true);
  // A library that wraps the failure keeps it as the cause.
  assert.equal(mayStillLand(new Error('the provider failed', { cause: new Error('submit', { cause: sent }) })), true);
  assert.equal(mayStillLand(new Error('the gateway refused the call')), false);
  assert.equal(mayStillLand(new Error('outer', { cause: 'a text, not an error' })), false);
  assert.equal(mayStillLand(undefined), false);
  assert.equal(mayStillLand('NotLanded'), false);
});

test('dust goes back only for a transaction that no block took or will take', () => {
  const failed = new FailedInBlock('FAILURE');
  assert.equal(failed.message, 'the chain refused the transaction: FAILURE');
  // A block took it: the fee is spent, and the coins of its call are free again.
  assert.equal(feeMayBeSpent(failed), true);
  assert.equal(mayStillLand(failed), false);
  assert.equal(feeMayBeSpent(new NotLanded('ab12')), true);
  assert.equal(feeMayBeSpent(new Error('submit', { cause: failed })), true);
  assert.equal(feeMayBeSpent(new Error('the node refused the transaction: 1010')), false);
  assert.equal(feeMayBeSpent(undefined), false);
});

test('a call is outdated when the chain refused it with code 104, from the node or through the gateway', () => {
  const fromNode = Object.assign(new Error('node rejected: 1010 Invalid Transaction | "Custom error: 104"'), { code: 1010, data: 'Custom error: 104' });
  assert.equal(outdated(fromNode), true);
  assert.equal(outdated(new Error('submitTx rejected the transaction', { cause: fromNode })), true);
  assert.equal(outdated(Object.assign(new Error('the job failed'), { job: { errorCode: '1010/104' } })), true);
  // Another code of the same reject, and the same text without the node's fields.
  assert.equal(outdated(Object.assign(new Error('node rejected'), { code: 1010, data: 'Custom error: 1041' })), false);
  assert.equal(outdated(Object.assign(new Error('node rejected'), { code: 1010, data: 'Custom error: 231' })), false);
  assert.equal(outdated(Object.assign(new Error('the job failed'), { job: { errorCode: '1010/231' } })), false);
  // As midnight-js passes it on: only the text is left, behind its own error.
  const redacted = new Error('Error: node rejected: 1010 Invalid Transaction | "Custom error: 104"');
  assert.equal(outdated(new Error("submitTx rejected the transaction (circuit 'post_bounty').", { cause: redacted })), true);
  assert.equal(outdated(new Error('Error: node rejected: 1010 Invalid Transaction | "Custom error: 231"')), false);
  assert.equal(outdated(new Error('Error: node rejected: 1014 Priority is too low | "Custom error: 104"')), false);
  assert.equal(outdated(new NotLanded('ab12')), false);
  assert.equal(outdated(undefined), false);
});

test('a call is over time when the node says so or the gateway refuses to send it for that', () => {
  assert.equal(overTime(Object.assign(new Error('the job failed'), { job: { errorCode: '1010/231' } })), true);
  const refused = 'job c826 failed: SponsorPolicyRefused: refusing to sponsor: the node would refuse this transaction for its cost: exceeded the maximum time to dismiss for transaction size; this transaction would take 17.320ms to dismiss';
  assert.equal(overTime(Object.assign(new Error(refused), { job: { errorCode: 'SponsorPolicyRefused' } })), true);
  assert.equal(overTime(new Error('step', { cause: new Error('Error: node rejected: 1010 Invalid Transaction | "Custom error: 231"') })), true);
  // Another refusal of the gateway, and the node's code for an outdated call.
  assert.equal(overTime(Object.assign(new Error('job 1 failed: SponsorPolicyRefused: the contract is not in the allow-list'), { job: { errorCode: 'SponsorPolicyRefused' } })), false);
  assert.equal(overTime(Object.assign(new Error('the job failed'), { job: { errorCode: '1010/104' } })), false);
  assert.equal(overTime(undefined), false);
});
