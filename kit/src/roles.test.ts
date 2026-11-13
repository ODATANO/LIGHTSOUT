import assert from 'node:assert/strict';
import { test } from 'node:test';
import { agentFromEnv, agentNamed, agentVariables, userRole, walletStateFile } from './roles.js';

test('userRole accepts alice and bob in any case and defaults to alice', () => {
  assert.equal(userRole(undefined), 'ALICE');
  assert.equal(userRole('bob'), 'BOB');
  assert.equal(userRole('Alice'), 'ALICE');
  assert.throws(() => userRole('owner'), /unknown role owner/);
});

test('an agent of any name comes from its three variables', () => {
  assert.deepEqual(agentVariables('carol'), { account: 'NEAR_CAROL_ACCOUNT_ID', key: 'NEAR_CAROL_PRIVATE_KEY', seed: 'MIDNIGHT_CAROL_SEED_HEX' });
  assert.throws(() => agentVariables('carol.near'), /letters, digits/);
  assert.throws(() => agentNamed('nobody'), /NEAR_NOBODY_ACCOUNT_ID/);
  Object.assign(process.env, { NEAR_CAROL_ACCOUNT_ID: 'carol.test', NEAR_CAROL_PRIVATE_KEY: 'ed25519:k', MIDNIGHT_CAROL_SEED_HEX: 'ab' });
  const carol = { name: 'carol', nearAccountId: 'carol.test', nearPrivateKey: 'ed25519:k', seedHex: 'ab' };
  assert.deepEqual(agentNamed('Carol'), { ...carol, stateDir: '.wallet' });
  process.env.LIGHTSOUT_AGENT = 'carol';
  assert.deepEqual(agentFromEnv('/state'), { ...carol, stateDir: '/state' });
  delete process.env.LIGHTSOUT_AGENT;
});

test('walletStateFile is per role and network', () => {
  assert.equal(walletStateFile('BOB', 'stagenet'), '.wallet/bob-stagenet.json');
  assert.equal(walletStateFile('ALICE', 'stagenet', 'swap'), '.wallet/alice-stagenet-swap.json');
});
