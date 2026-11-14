// Deploys the Midnight bridge. It starts at NEAR's newest final block and mints only for locks
// on the NEAR account named here, which must exist under that name before or after.
// npm run deploy -- --near-bridge <NEAR account of 26 characters>
import '../plain-errors.js';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import type { WalletState } from '@odatano/nightgate-tx/txbuilder';
import { base58 } from '@scure/base';
import { Contract } from 'lightsout-midnight-bridge';
import { reach } from '../board/calls.js';
import { zkConfigDirOf } from '../prover-keys.js';
import { feesViaGateway, network, submitFinalized, walletOptions, witnessesFor } from '../bridge.js';
import { env } from '../env.js';
import { openWallet, saveWallet } from '../fees.js';
import { keepFile, keptJson } from '../keep.js';
import { deployWithoutKey } from '../keyless-deploy.js';
import { rpcUrl } from '../near.js';
import { stateFileOf } from '../roles.js';

// The lock proof rebuilds NEAR's outcome bytes, which hold the account name at a fixed length.
const ACCOUNT_LENGTH = 26;
// Far enough back that the answer is the newest final block of the same epoch.
const LOOK_BACK = 20;

const { values } = parseArgs({ options: { 'near-bridge': { type: 'string' } } });
const account = values['near-bridge'];
if (account?.length !== ACCOUNT_LENGTH) {
  console.error(`usage: npm run deploy -- --near-bridge <NEAR account of ${ACCOUNT_LENGTH} characters>`);
  process.exit(2);
}

async function rpc<T>(method: string, params: unknown): Promise<T> {
  const res = await fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const body = (await res.json()) as { result?: T; error?: unknown };
  if (!body.result) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

// A gateway pays the deploy when one is set: it pays later only for calls on a contract whose
// deploy it paid. The deploy moves no coins, so any wallet builds it then. Without a gateway
// the wallet behind MIDNIGHT_FEE_SEED_HEX pays from its dust.
const viaGateway = feesViaGateway();
const stateFile = viaGateway ? undefined : stateFileOf({ name: 'fee', stateDir: '.wallet' }, network);
const saved = stateFile ? await keptJson<WalletState>(stateFile) : undefined;
console.log(saved ? 'Catching up from the saved wallet state...' : 'Syncing a wallet from genesis...');
const wallet = await openWallet(walletOptions(viaGateway ? randomBytes(64).toString('hex') : env('MIDNIGHT_FEE_SEED_HEX')), saved);
try {
  const zkDir = zkConfigDirOf('lightsout-midnight-bridge');
  const connection = await reach({ wallet, zkDir, ...(viaGateway ? { submit: submitFinalized } : {}) });
  try {
    // Read last, so that the bridge starts as close to NEAR's head as it can.
    const final = await rpc<{ header: { height: number } }>('block', { finality: 'final' });
    const earlier = await rpc<{ header: { hash: string } }>('block', { block_id: final.header.height - LOOK_BACK });
    const { inner_lite: head } = await rpc<{ inner_lite: { height: number; epoch_id: string; next_epoch_id: string; next_bp_hash: string; block_merkle_root: string } }>('next_light_client_block', { last_block_hash: earlier.header.hash });
    console.log(`The Midnight bridge starts at NEAR block ${head.height}, epoch ${head.epoch_id}. Check it on any NEAR node before you trust this deployment.`);

    const compiledContract = CompiledContract.make<Contract<undefined>>('midnight-bridge', Contract).pipe(CompiledContract.withWitnesses(witnessesFor()), CompiledContract.withCompiledFileAssets(zkDir));
    const address = await deployWithoutKey<Contract<undefined>>(connection, zkDir, {
      compiledContract,
      args: [BigInt(head.height), base58.decode(head.epoch_id), base58.decode(head.next_epoch_id), base58.decode(head.next_bp_hash), base58.decode(head.block_merkle_root), Buffer.from(account)],
    });
    console.log(`  ok  Midnight bridge ${address} on ${network}, for locks on ${account}. It has no maintenance key: nobody can replace its circuits.`);
    console.log(`Set MIDNIGHT_BRIDGE=${address} and give the same address to the NEAR bridge as midnight_bridge.`);
  } finally {
    await connection.data.dispose();
  }
} finally {
  if (stateFile) await keepFile(stateFile, JSON.stringify(await saveWallet(wallet)));
  await wallet.facade.stop();
}
// The Midnight libraries leave timers behind, which keep Node alive.
process.stdout.write('', () => process.exit(0));
