// Proves a lock to the Midnight bridge from its NEAR transaction. Anyone can do that for any lock.
// The wallet the lock names also mints it; nobody else can.
// npm run mint -- --tx <NEAR transaction hash> [--as <agent>] [--sender <NEAR account>]
import '../plain-errors.js';
import { parseArgs } from 'node:util';
import { deriveIdentity } from '@odatano/nightgate-tx/txbuilder';
import { closeFees, network, openBridgeBuilder, proofServer } from '../bridge.js';
import { lockIdIn, parseShieldedAddress } from '../codec.js';
import { env } from '../env.js';
import { say } from '../log.js';
import { nearSource } from '../near.js';
import { agentNamed } from '../roles.js';
import { lockReceipt, proveLock } from '../steps.js';

const { values } = parseArgs({ options: { tx: { type: 'string' }, sender: { type: 'string' }, as: { type: 'string', default: 'alice' } } });
if (!values.tx) {
  console.error('usage: npm run mint -- --tx <NEAR transaction hash> [--as <agent>] [--sender <NEAR account>]');
  process.exit(2);
}
// The agent whose wallet mints. The lock's sender is that agent unless --sender names another account.
const agent = agentNamed(values.as);
const seed = agent.seedHex;
const own = (await deriveIdentity({ seedHex: seed, networkId: network })).addresses.shielded;
const receipts = await nearSource.receiptsOf(values.tx, values.sender ?? agent.nearAccountId);
const lockId = BigInt(lockIdIn(receipts.flatMap((r) => r.logs)));
const builder = await openBridgeBuilder(seed, { proofServerUrl: await proofServer() });
try {
  const outcome = await proveLock(builder, env('MIDNIGHT_BRIDGE'), lockId, lockReceipt(receipts), say, { seedHex: seed, keys: parseShieldedAddress(own, network) });
  console.log(outcome === 'minted' ? `  ok  lock ${lockId} minted on Midnight` : `  ok  lock ${lockId} is proven on Midnight; it names another wallet, which mints it`);
} finally {
  await builder.close();
  await closeFees();
}
// The wasm prover leaves a ten-minute timer behind each proof, which keeps Node alive.
process.stdout.write('', () => process.exit(0));
