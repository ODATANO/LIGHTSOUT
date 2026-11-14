// Deploys the board for the Midnight bridge in MIDNIGHT_BRIDGE. Its members are the bridge's
// registered accounts, and its bounties are paid in the bridge's wrapped NEAR.
// npm run deploy-board
import '../plain-errors.js';
import { randomBytes } from 'node:crypto';
import { keepFile, keptJson } from '../keep.js';
import type { WalletState } from '@odatano/nightgate-tx/txbuilder';
import * as bridgeModule from 'lightsout-midnight-bridge';
import { deployBoard } from '../board/deploy.js';
import { boardFeesViaGateway, network, submitFinalized, walletOptions, wrappedTokenType } from '../bridge.js';
import { env } from '../env.js';
import { openWallet, saveWallet } from '../fees.js';
import { zkConfigDirOf } from '../prover-keys.js';
import { say } from '../log.js';
import { stateFileOf } from '../roles.js';

const bridge = env('MIDNIGHT_BRIDGE');
// With NIGHTGATE_BOARD_FEES the gateway pays the deploy: it pays later only for calls on a
// contract whose deploy it paid. The deploy moves no coins, so any wallet builds it then.
// Otherwise the wallet behind MIDNIGHT_FEE_SEED_HEX pays from its dust.
const viaGateway = boardFeesViaGateway();
const stateFile = viaGateway ? undefined : stateFileOf({ name: 'fee', stateDir: '.wallet' }, network);
const saved = stateFile ? await keptJson<WalletState>(stateFile) : undefined;
console.log(saved ? 'Catching up from the saved wallet state...' : 'Syncing a wallet from genesis...');
const wallet = await openWallet(walletOptions(viaGateway ? randomBytes(64).toString('hex') : env('MIDNIGHT_FEE_SEED_HEX')), saved);
try {
  const callee = { address: bridge, module: bridgeModule, zkConfigDir: zkConfigDirOf('lightsout-midnight-bridge') };
  const address = await deployBoard(wallet, callee, Buffer.from(wrappedTokenType(bridge), 'hex'), say, viaGateway ? submitFinalized : undefined);
  console.log(`  ok  board ${address} on ${network}, for bridge ${bridge}`);
  console.log(`Set MIDNIGHT_BOARD=${address}.`);
} finally {
  if (stateFile) await keepFile(stateFile, JSON.stringify(await saveWallet(wallet)));
  await wallet.facade.stop();
}
// The Midnight libraries leave timers behind, which keep Node alive.
process.stdout.write('', () => process.exit(0));
