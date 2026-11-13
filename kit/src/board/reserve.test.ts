import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AFTER_A_BOUNTY, AFTER_ANY_CALL, reserved } from './reserve.js';

const gas = (bytesWritten: bigint, bytesDeleted: bigint) => ({ readTime: 5n, computeTime: 7n, bytesWritten, bytesDeleted });

test('a call that waits for bounties names more written bytes and the rest as measured', () => {
  assert.deepEqual(reserved(gas(2578n, 2325n), AFTER_A_BOUNTY), gas(3346n, 2325n));
});

test('a call that waits for any call names fewer deleted bytes as well', () => {
  assert.deepEqual(reserved(gas(2578n, 2325n), AFTER_ANY_CALL), gas(3346n, 1557n));
});

test('the deleted bytes stop at zero', () => {
  assert.deepEqual(reserved(gas(900n, 100n), AFTER_ANY_CALL), gas(1668n, 0n));
});

test('a call that writes nothing stays as it was built', () => {
  const built = gas(0n, 0n);
  assert.equal(reserved(built, AFTER_ANY_CALL), built);
});
