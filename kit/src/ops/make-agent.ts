// Makes one more agent: a NEAR account under the owner's, paid from it, and a Midnight seed.
// Writes NEAR_<NAME>_ACCOUNT_ID, NEAR_<NAME>_PRIVATE_KEY and MIDNIGHT_<NAME>_SEED_HEX to ../.env.
// npm run make-agent -- <name> [--near 1]
import '../plain-errors.js';
import { randomBytes } from 'node:crypto';
import { appendFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { KeyPair, nearToYocto } from 'near-api-js';
import { nearAccount } from '../near.js';
import { agentVariables } from '../roles.js';

const { values, positionals } = parseArgs({ options: { near: { type: 'string', default: '1' } }, allowPositionals: true });
const [name] = positionals;
if (!name) throw new Error('usage: npm run make-agent -- <name> [--near 1]');
const names = agentVariables(name);
if (process.env[names.account]) throw new Error(`.env has an agent ${name} already (${names.account})`);

const owner = nearAccount('OWNER');
const accountId = `${name.toLowerCase()}.${owner.accountId}`;
const key = KeyPair.fromRandom('ed25519');
// Written before the account exists: the key is nowhere else.
await appendFile('../.env', `\n${names.account}=${accountId}\n${names.key}=${key.toString()}\n${names.seed}=${randomBytes(64).toString('hex')}\n`);
try {
  await owner.createSubAccount({ accountOrPrefix: accountId, publicKey: key.getPublicKey(), nearToTransfer: nearToYocto(values.near as `${number}`) });
} catch (e) {
  console.error(`${accountId} was not created. Remove the three ${name.toUpperCase()} lines from .env before the next try.`);
  throw e;
}
console.log(`  ok  ${accountId} holds ${values.near} NEAR, its keys are in .env`);
console.log(`Next: npm run warm -- --agents ${name.toLowerCase()}`);
