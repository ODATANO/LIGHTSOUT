import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { encodeContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Contract } from 'lightsout-board';
import type { Wallet } from '../fees.js';
import { deployWithoutKey } from '../keyless-deploy.js';
import { type Callee, reach, type Submit } from './calls.js';
import { boardWitnesses } from './witnesses.js';

type Say = (line: string) => void;
type BoardContract = Contract<undefined>;

const witnesses = boardWitnesses<undefined>(() => ({}));

/**
 * Deploys the board for a bridge and returns its address. It has no maintenance key, so nobody
 * can ever replace its circuits. `wallet` pays the fee, or `submit` gets it paid.
 */
export async function deployBoard(wallet: Wallet, bridge: Callee, token: Uint8Array, say: Say, submit?: Submit): Promise<string> {
  const connection = await reach({ wallet, bridge, ...(submit ? { submit } : {}) });
  const compiledContract = CompiledContract.make<BoardContract>('board', Contract).pipe(CompiledContract.withWitnesses(witnesses), CompiledContract.withCompiledFileAssets(connection.zkDir));
  try {
    const address = await deployWithoutKey<BoardContract>(connection, connection.zkDir, { compiledContract, args: [{ bytes: encodeContractAddress(bridge.address) }, token] });
    say(`board ${address} deployed with its ${Object.keys(new Contract<undefined>(witnesses).provableCircuits).length} circuits and no maintenance key`);
    return address;
  } finally {
    await connection.data.dispose();
  }
}
