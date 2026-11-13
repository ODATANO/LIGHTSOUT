// Writes the arguments of the NEAR contract's `new`. They can never change after the deploy.
// npm run make-init -- --daily-limit <NEAR> --registration-fee <NEAR> --denominations <NEAR,NEAR,...> --beneficiary <account> [--out out/init.json]
import '../plain-errors.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { nearToYocto } from 'near-api-js';
import { env } from '../env.js';
import { MAX_FINALITY_BLOCKS } from '../midnight-finality.js';
import { chainStart } from '../near-init.js';

const { values } = parseArgs({
  options: {
    'daily-limit': { type: 'string' },
    'registration-fee': { type: 'string' },
    denominations: { type: 'string' },
    beneficiary: { type: 'string' },
    out: { type: 'string', default: 'out/init.json' },
  },
});
const { 'daily-limit': dailyLimit, 'registration-fee': fee, denominations, beneficiary } = values;
if (!dailyLimit || !fee || !denominations || !beneficiary) {
  console.error('usage: npm run make-init -- --daily-limit <NEAR> --registration-fee <NEAR> --denominations <NEAR,NEAR,...> --beneficiary <account> [--out out/init.json]');
  process.exit(2);
}
const yocto = (near: string) => nearToYocto(near as `${number}`).toString();

const start = await chainStart(env('MIDNIGHT_NETWORK'));
const init = {
  daily_limit: yocto(dailyLimit),
  midnight_bridge: env('MIDNIGHT_BRIDGE'),
  midnight_genesis: start.midnight_genesis,
  mithril: start.mithril,
  denominations: denominations.split(',').map(yocto),
  registration_fee: yocto(fee),
  beneficiary,
};
mkdirSync(dirname(values.out), { recursive: true });
writeFileSync(values.out, `${JSON.stringify(init, null, 1)}\n`);

console.log(`  ok  ${values.out} for the Midnight bridge ${init.midnight_bridge}`);
console.log(`  ok  Midnight genesis ${init.midnight_genesis.genesis_hash}; its validators are the ones the committee token names now`);
console.log(`  ok  Mithril starts at epoch ${init.mithril.certificate.epoch}, committee token at ${init.mithril.token.tx_hash}#${init.mithril.token.index}`);
console.log(`The start certificate ages with the Cardano epoch, so deploy soon. The light client then has ${start.setChanges} set changes to follow, at ${MAX_FINALITY_BLOCKS} per call.`);
process.exit(0);
