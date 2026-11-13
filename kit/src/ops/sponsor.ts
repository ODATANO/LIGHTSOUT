// Brings registrations to Midnight: proves each one to the Midnight bridge and sets NIGHT aside
// that generates dust for its dust address. Anyone who holds NIGHT can run it.
// npm run sponsor -- [--night 100] [--interval 30]
import '../plain-errors.js';
import { randomBytes } from 'node:crypto';
import { keepFile, keptJson } from '../keep.js';
import { parseArgs } from 'node:util';
import type { DustAddress } from '@midnightntwrk/wallet-sdk-address-format';
import { closeFees, network, openBridgeBuilder, payFeesFrom, proofServer, readBridge, walletOptions } from '../bridge.js';
import { DustNotCovered, generateOwnDust, outputSeed, parseDustAddress, sponsorDust, stars } from '../dust.js';
import { env } from '../env.js';
import { FeeWallet, openWallet } from '../fees.js';
import { say } from '../log.js';
import { type BridgeConfig, bridgeId, configFor, registrationAt, viewBridge } from '../near.js';
import { proveRegistration, registrationReceipt } from '../steps.js';

/** What the sponsor keeps between runs. */
interface SponsorState {
  bridge: string; // the NEAR bridge the indexes belong to
  finished: string[]; // decimal; indexes of registrations that are proven and have their NIGHT
}

const { values } = parseArgs({ options: { night: { type: 'string', default: '100' }, interval: { type: 'string', default: '30' } } });
const amount = stars(values.night);
const bridge = env('MIDNIGHT_BRIDGE');
const seedHex = env('MIDNIGHT_SPONSOR_SEED_HEX');
const stateFile = `.wallet/sponsor-${network}.json`;
const reason = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e));

await configFor(bridge);

async function readState(): Promise<SponsorState> {
  const state = await keptJson<SponsorState>(stateFile);
  // Indexes count per NEAR bridge, so another bridge starts over.
  return state?.bridge === bridgeId ? state : { bridge: bridgeId, finished: [] };
}
const state = await readState();
const finished = new Set(state.finished.map(BigInt));
async function finish(index: bigint): Promise<void> {
  finished.add(index);
  await keepFile(stateFile, JSON.stringify({ bridge: bridgeId, finished: [...finished].map(String) } satisfies SponsorState));
}

const treasury = await openWallet(walletOptions(seedHex));
payFeesFrom(new FeeWallet(treasury));
await generateOwnDust(treasury, say);
// The calls move no coins, so any seed signs them.
const builder = await openBridgeBuilder(randomBytes(64).toString('hex'), { proofServerUrl: await proofServer() });
// When to look again at a registration whose NIGHT has not generated its fee yet.
const lookAgainAt = new Map<bigint, number>();
say(`sponsoring registrations of ${bridgeId} on Midnight bridge ${bridge} with ${values.night} NIGHT each`);

/** One registration, as far as it gets now. Logs the step that failed and leaves the rest to the next round. */
async function sponsor(index: bigint): Promise<void> {
  let step = 'reading the registration';
  try {
    const found = await registrationAt(index);
    if (!found) throw new Error(`${bridgeId} has no registration ${index}`);
    const { account, registration } = found;
    if (!(await readBridge(bridge)).joined.member(index)) {
      step = 'locating the receipt';
      const receipt = await registrationReceipt(account, registration);
      step = 'proving the registration';
      await proveRegistration(builder, bridge, registration, receipt, say);
      say(`registration ${index} of ${account} is proven on Midnight`);
    }
    let member: DustAddress;
    try {
      member = parseDustAddress(registration.dust_address, network);
    } catch (e) {
      say(`registration ${index} of ${account} gets no dust, its dust address is not one of ${network}: ${reason(e)}`);
      return await finish(index);
    }
    step = 'registering NIGHT for the dust address';
    const output = await openWallet(walletOptions(outputSeed(seedHex, bridgeId, index)));
    try {
      await sponsorDust(treasury, output, member, amount, (line) => say(`registration ${index}: ${line}`));
    } finally {
      await output.facade.stop();
    }
    say(`registration ${index} of ${account} is proven and generates dust for ${registration.dust_address}`);
    await finish(index);
  } catch (e) {
    if (e instanceof DustNotCovered) {
      lookAgainAt.set(index, Date.now() + Number(e.seconds) * 1000);
      say(`registration ${index}: not registered for dust yet, ${e.message}`);
    } else {
      say(`registration ${index}: ${step} failed: ${reason(e)}`);
    }
  }
}

async function round(): Promise<void> {
  const count = BigInt((await viewBridge<BridgeConfig>('get_config'))?.registered ?? '0');
  for (let index = 0n; index < count; index++) {
    if (finished.has(index) || (lookAgainAt.get(index) ?? 0) > Date.now()) continue;
    await sponsor(index);
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => void Promise.all([builder.close(), closeFees()]).finally(() => process.exit(0)));
}
for (;;) {
  await round().catch((e: unknown) => say(`round failed: ${reason(e)}`));
  await new Promise((r) => setTimeout(r, Number(values.interval) * 1000));
}
