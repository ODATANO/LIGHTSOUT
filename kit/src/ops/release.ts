// Proves a burn to the NEAR bridge and pays it out to the account the burn names. Anyone can run this.
// --block is the burn's Midnight block, for a burn the Midnight bridge no longer keeps.
// npm run release -- --burn <id> [--block <number>] [--as alice|bob|relayer]
import '../plain-errors.js';
import { parseArgs } from 'node:util';
import { env } from '../env.js';
import { say } from '../log.js';
import { nearAccount } from '../near.js';
import type { Role } from '../roles.js';
import { releaseBurn } from '../steps.js';

const { values } = parseArgs({ options: { burn: { type: 'string' }, block: { type: 'string' }, as: { type: 'string', default: 'relayer' } } });
if (!values.burn || !/^[0-9a-f]{64}$/.test(values.burn) || (values.block !== undefined && !/^[0-9]+$/.test(values.block))) {
  console.error('usage: npm run release -- --burn <id, 64 hex> [--block <number>] [--as alice|bob|relayer]');
  process.exit(2);
}
const block = values.block === undefined ? undefined : Number(values.block);
const outcome = await releaseBurn(nearAccount(values.as.toUpperCase() as Role), env('MIDNIGHT_BRIDGE'), values.burn, say, block);
const lines = {
  released: `  ok  burn ${values.burn} is paid out`,
  'not final yet': `  burn ${values.burn} is not paid out yet: NEAR has not finalized a Midnight block in which the Midnight bridge keeps it`,
  'no account': `  burn ${values.burn} is not paid out: its recipient is no NEAR account that exists`,
  'day limit': `  burn ${values.burn} is not paid out in full: the bridge has reached its limit of the day`,
};
console.log(lines[outcome]);
process.exitCode = outcome === 'released' ? 0 : 1;
