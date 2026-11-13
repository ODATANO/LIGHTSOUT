import assert from 'node:assert/strict';
import { test } from 'node:test';
import { caughtUp } from './fees.js';

type Synced = Parameters<typeof caughtUp>[0];
type State = Awaited<ReturnType<Synced['waitForSyncedState']>>;

test('a wallet that has caught up lets the fee go on', async () => {
  const facade: Synced = { waitForSyncedState: async () => ({}) as State };
  await caughtUp(facade, 50);
});

test('a wallet that stays behind ends the wait with a named error', async () => {
  const facade: Synced = { waitForSyncedState: () => new Promise<State>(() => undefined) };
  await assert.rejects(caughtUp(facade, 30), /the wallet did not catch up with the chain in 0 s/);
});
