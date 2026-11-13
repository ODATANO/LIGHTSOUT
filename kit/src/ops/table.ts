// Adds an event table of a Midnight runtime version to the NEAR bridge. Anyone can run it, and a
// version takes any number of tables.
// npm run table -- add --spec <version> --file <table.scale> [--as relayer]   the file: crates/substrate-events/gen
import '../plain-errors.js';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { say } from '../log.js';
import { tableTestBlock } from '../midnight-burn-tx.js';
import { type MidnightView, nextJustified } from '../midnight-finality.js';
import { callBridge, nearAccount, PROVE_GAS, viewBridge } from '../near.js';
import type { Role } from '../roles.js';
import { sendable } from '../steps.js';

// Covers the storage of a table of about 10 kB; the bridge refunds the rest.
const TABLE_DEPOSIT = 2n * 10n ** 23n;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { spec: { type: 'string' }, file: { type: 'string' }, as: { type: 'string', default: 'relayer' } },
});
const [command] = positionals;
const usage = (): never => {
  console.error('usage: npm run table -- add --spec <version> --file <table.scale> [--as relayer]');
  process.exit(2);
};

// A refusal by the bridge is an answer: one line, exit code 1.
const refused = (e: unknown): never => {
  if (!(e instanceof Error) || e.name !== 'ContractExecutionError') throw e;
  console.error(`the bridge refused: ${e.message.replace(/^Smart contract panicked: /, '')}`);
  process.exit(1);
};

const account = nearAccount(values.as.toUpperCase() as Role);
const m = await viewBridge<MidnightView>('get_midnight');
if (!m) throw new Error('get_midnight returned nothing');
const here = { head: m.finalized_number, hasHash: async (block: number) => (await viewBridge<string>('get_finalized_hash', { block })) != null };
const justifiedAfter = async (after: number) => (await nextJustified(after))?.number ?? null;

if (command === 'add' && values.spec && values.file) {
  const spec = Number(values.spec);
  // The table proves itself on a block NEAR finalized: it must find a Midnight transaction there applied.
  const test = await tableTestBlock(spec, here.head, here, justifiedAfter);
  if (!test) throw new Error(`the last blocks NEAR finalized hold no Midnight transaction of runtime ${spec}; send one and run this again`);
  const table = (await readFile(values.file)).toString('base64');
  const { proof, drop } = await sendable(account, test.proof);
  await callBridge(account, 'add_runtime_table', { table, ...proof }, TABLE_DEPOSIT, PROVE_GAS).catch(async (e: unknown) => {
    await drop().catch(() => undefined);
    return refused(e);
  });
  say(`the bridge has this table for Midnight runtime ${spec} now; it proved itself on block ${test.block}`);
} else {
  usage();
}
