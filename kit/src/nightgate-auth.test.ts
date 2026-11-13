import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authFromEnv } from './nightgate-auth.js';

test('the environment names one credential at most', () => {
  const saved = { a: process.env.ODATANO_ACCESS_KEY, t: process.env.NIGHTGATE_AGENT_TOKEN };
  try {
    process.env.ODATANO_ACCESS_KEY = '';
    process.env.NIGHTGATE_AGENT_TOKEN = 'agt_1';
    assert.deepEqual(authFromEnv(), { agentToken: 'agt_1' });
    process.env.ODATANO_ACCESS_KEY = 'oda_1';
    assert.throws(() => authFromEnv(), /not both/);
    delete process.env.NIGHTGATE_AGENT_TOKEN;
    assert.deepEqual(authFromEnv(), { accessKey: 'oda_1' });
    delete process.env.ODATANO_ACCESS_KEY;
    assert.equal(authFromEnv(), null);
  } finally {
    for (const [k, v] of [['ODATANO_ACCESS_KEY', saved.a], ['NIGHTGATE_AGENT_TOKEN', saved.t]] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
