// Keeps the two bridge contracts fed: NEAR headers to Midnight, Midnight finality to NEAR, and
// burns paid out. Anyone can run it. It holds no key that either contract trusts.
// npm run relay -- [--interval 30]
import '../plain-errors.js';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { closeFees, openBridgeBuilder, proofServer, readBridge, send } from '../bridge.js';
import { env } from '../env.js';
import { say } from '../log.js';
import { newestIsDue, runtimeSigns } from '../midnight-finality.js';
import { type MithrilView, syncMithril } from '../mithril.js';
import { type BridgeConfig, bridgeId, callBridge, closedBecause, configFor, nearAccount, type NearLock, nearSource, PROVE_DEPOSIT, PROVE_GAS, registrationAt, type RuntimeView, viewBridge } from '../near.js';
import { highestOf, openEntries } from '../open-entries.js';
import { reasonOf } from '../reason.js';
import { followMidnight, followNear, HEAD_REFRESH_BLOCKS, proveHead, releaseBurn } from '../steps.js';
import { bridgeTidy } from '../tidy.js';

const { values } = parseArgs({ options: { interval: { type: 'string', default: '30' } } });
const interval = Number(values.interval);
if (!(interval > 0)) throw new Error(`--interval is a number of seconds, not ${values.interval}`);
// Certificates come every few minutes and matter once per epoch, so Mithril is checked rarely.
const MITHRIL_INTERVAL_MS = 10 * 60_000;
let mithrilCheckedAt = 0;

const bridge = env('MIDNIGHT_BRIDGE');
const account = nearAccount('RELAYER');
await configFor(bridge);
// The calls move no coins, so any seed signs them.
const builder = await openBridgeBuilder(randomBytes(64).toString('hex'), { proofServerUrl: await proofServer() });
// The first lock this process has not seen minted, and the first registration not seen on Midnight.
let fromLock = 0n;
let fromRegistration = 0n;
const reason = (e: unknown) => (e instanceof Error ? `${e.name}: ${reasonOf(e)}` : String(e));
say(`relaying between ${bridgeId} and Midnight bridge ${bridge} as ${account.accountId}`);

/**
 * The NEAR height the Midnight bridge's head must pass: the highest block of a lock Midnight
 * has not minted or of a registration it has not got, or the head itself once it is old. The
 * NEAR bridge takes new funds only while that head is recent, so an old head gets a newer header.
 */
async function wantedHeight(): Promise<bigint | undefined> {
  const state = await readBridge(bridge);
  const config = (await viewBridge<BridgeConfig>('get_config'))!;
  const head = state.tip.head.height;
  const locks = await openEntries(fromLock, BigInt(config.next_lock_id), (id) => state.minted_locks.member(id), async (id) => {
    const lock = await viewBridge<NearLock>('get_lock', { lock_id: id.toString() });
    return lock ? BigInt(lock.block_height) : undefined;
  });
  const registrations = await openEntries(fromRegistration, BigInt(config.registered), (index) => state.joined.member(index), async (index) => {
    const found = await registrationAt(index);
    return found ? BigInt(found.registration.block_height) : undefined;
  });
  fromLock = locks.from;
  fromRegistration = registrations.from;
  const old = (await nearSource.finalHeight()) - head >= HEAD_REFRESH_BLOCKS ? head : undefined;
  return highestOf(old, locks.highest, registrations.highest);
}

// Headers this process saw proposed. Once one is no longer proposed, its signature marks can go.
const proposed = new Map<string, Uint8Array>();
// A removal is a transaction with a proof, so a round sends a few and leaves the rest for later.
const TIDY_PER_ROUND = 3;

// Removes from the Midnight bridge what is of no use any more, so its state stays small.
async function tidy(): Promise<void> {
  const state = await readBridge(bridge);
  for (const [hash] of state.candidates) proposed.set(Buffer.from(hash).toString('hex'), hash);
  const gone = [...proposed.values()].filter((hash) => !state.candidates.member(hash));
  for (const call of bridgeTidy(state, gone).slice(0, TIDY_PER_ROUND)) say(`${call.circuit} on Midnight, tx ${await send(builder, bridge, call)}`);
  for (const [name, hash] of proposed) {
    if (!state.candidates.member(hash) && !state.signed.member(hash)) proposed.delete(name);
  }
}

async function followMithril(): Promise<void> {
  if (Date.now() - mithrilCheckedAt < MITHRIL_INTERVAL_MS) return;
  mithrilCheckedAt = Date.now();
  const m = await viewBridge<MithrilView>('get_mithril');
  if (m) await syncMithril(m, (method, args) => callBridge(account, method, args, PROVE_DEPOSIT, PROVE_GAS), say);
}

// A burn that could not be paid is tried again later and does not hold up the others.
const BURN_RETRY_MS = 2 * 60_000;
const LATER_RETRY_MS = 60 * 60_000;
const burnWaits = new Map<string, number>();
const paid = new Set<string>();

// Pays the burns the Midnight bridge keeps: the newest ones, one per first byte of their id.
async function payBurns(): Promise<void> {
  const kept = [...(await readBridge(bridge)).burns].map(([, burn]) => Buffer.from(burn.id).toString('hex'));
  for (const id of kept) {
    if (paid.has(id) || Date.now() < (burnWaits.get(id) ?? 0)) continue;
    try {
      const outcome = await releaseBurn(account, bridge, id, say);
      if (outcome === 'released') paid.add(id);
      // A missing account can be made, and the day's limit frees up the next day.
      else if (outcome !== 'not final yet') burnWaits.set(id, Date.now() + LATER_RETRY_MS);
    } catch (e) {
      burnWaits.set(id, Date.now() + BURN_RETRY_MS);
      say(`burn ${id.slice(0, 12)}: ${reason(e)}`);
    }
  }
  for (const id of [...paid, ...burnWaits.keys()]) {
    if (!kept.includes(id)) (paid.delete(id), burnWaits.delete(id));
  }
}

// Says once when the bridge stops or starts taking new locks, and why.
let closed: string | undefined;
async function watchRuntime(): Promise<void> {
  const runtime = await viewBridge<RuntimeView>('get_runtime');
  const now = runtime ? closedBecause(runtime) : undefined;
  if (now !== closed) say(now ? `the bridge takes no new locks: ${now}` : 'the bridge takes new locks again');
  closed = now;
}

// One direction of the relay, in rounds. A failing step does not hold up the others. After a
// failed round the pause doubles, up to five minutes, so a busy service is not hammered.
async function rounds(steps: (() => Promise<unknown>)[]): Promise<never> {
  for (let failed = 0; ; ) {
    let failures = 0;
    for (const run of steps) {
      await run().catch((e: unknown) => {
        failures++;
        say(`step failed: ${reason(e)}`);
      });
    }
    failed = failures > 0 ? failed + 1 : 0;
    await new Promise((r) => setTimeout(r, Math.min(interval * 2 ** failed, 300) * 1000));
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => void Promise.all([builder.close(), closeFees()]).finally(() => process.exit(0)));
}
// The two directions share nothing. Reading a producer list into Midnight takes a quarter of an
// hour, and a payout on NEAR does not wait for it.
await Promise.all([
  rounds([async () => followNear(builder, bridge, say, await wantedHeight()), tidy]),
  rounds([
    // Each stored block costs NEAR, so between two authority sets the newest one goes in only when it is needed.
    async () => followMidnight(account, say, { newest: newestIsDue(await viewBridge<RuntimeView>('get_runtime'), await runtimeSigns()) }),
    async () => proveHead(account, bridge, say),
    watchRuntime,
    followMithril,
    payBurns,
  ]),
]);
