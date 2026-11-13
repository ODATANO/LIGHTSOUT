import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RuntimeView } from './near.js';

// near.ts reads the bridge's account when it loads.
process.env.NEAR_BRIDGE_CONTRACT ??= 'bridge.test';
const { closedBecause, closedFor } = await import('./near.js');

test('the bridge names the first thing that keeps new locks out', () => {
  const now = 1_800_000_000_000;
  const at = (minutesAgo: number) => (BigInt(now - minutesAgo * 60_000) * 1_000_000n).toString();
  const checked = (minutesAgo: number, authorized = false) => ({ block: 9, authorized, at: at(minutesAgo) });
  const view = (over: Partial<RuntimeView>): RuntimeView => ({ block: 9, spec: 2001100, readable: true, upgrade: checked(5), accepted_head: '100', locks_open: false, ...over });

  assert.equal(closedFor(view({ locks_open: true }), now), undefined);
  assert.equal(closedFor(view({ readable: false, upgrade: null, accepted_head: null }), now), 'no table');
  assert.equal(closedFor(view({ upgrade: null, accepted_head: null }), now), 'no check');
  assert.equal(closedFor(view({ upgrade: checked(5, true), accepted_head: null }), now), 'upgrade');
  assert.equal(closedFor(view({ accepted_head: null }), now), 'no head');
  assert.equal(closedFor(view({ upgrade: checked(61) }), now), 'old check');
  assert.equal(closedFor(view({}), now), 'old head');

  assert.equal(closedBecause(view({ locks_open: true })), undefined);
  assert.match(closedBecause(view({ readable: false })) ?? '', /no table for Midnight runtime 2001100/);
  assert.match(closedBecause(view({ accepted_head: null })) ?? '', /a relay proves the Midnight bridge's head/);
});
