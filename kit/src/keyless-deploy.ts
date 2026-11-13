import type { Contract as CompactContract } from '@midnight-ntwrk/compact-js';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { createUnprovenDeployTxFromVerifierKeys, type Ledger9DeployTxOptionsBase, submitTx } from '@midnight-ntwrk/midnight-js-contracts';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { LedgerTransaction } from '@midnight-ntwrk/midnight-js-types';
import { ContractDeploy, ContractMaintenanceAuthority, ContractState, Intent, Transaction } from '@midnightntwrk/ledger-v9';
import type { Reach } from './board/calls.js';

/** The keys that can replace a contract's circuits, as the chain shows them. */
export interface Authority {
  keys: number; // 0 = nobody can ever replace a circuit
  threshold: number; // how many of the keys must sign
  circuits: string[];
}

/** The maintenance keys and the circuits of the contract at `address`; undefined when the chain has none there. */
export async function authorityOf(data: Reach['data'], address: string): Promise<Authority | undefined> {
  const found = await data.queryContractState(address);
  if (found?.contractState.era !== 'v9') return undefined;
  const state = found.contractState.deserialize({ v9: ContractState });
  const { committee, threshold } = state.maintenanceAuthority;
  return { keys: committee.length, threshold, circuits: state.operations().map(String) };
}

/**
 * Deploys a contract without a maintenance key and returns its address. Such keys can replace a
 * contract's circuits. With none, nobody ever can, and the chain shows that there is none.
 */
export async function deployWithoutKey<C extends CompactContract<undefined>>(reach: Pick<Reach, 'providers' | 'data'>, zkDir: string, contract: Omit<Ledger9DeployTxOptionsBase<C>, 'signingKey'>): Promise<string> {
  const { providers, data } = reach;
  const { walletProvider, config } = providers;
  // The library builds the contract's first state with a key of its own, which never leaves this call.
  const options = { ...contract, signingKey: sampleSigningKey() } as Ledger9DeployTxOptionsBase<C>;
  const made = await createUnprovenDeployTxFromVerifierKeys(new NodeZkConfigProvider(zkDir), walletProvider.getCoinPublicKey(), options, walletProvider.getEncryptionPublicKey(), config);
  if (made.private.unprovenTx.deserialize({ v9: Transaction }).guaranteedOffer) throw new Error('the constructor creates coins, which a deploy without a key does not carry');
  const state = made.public.initialContractState.deserialize({ v9: ContractState });
  // Threshold 1 over no keys: no signature can ever meet it.
  state.maintenanceAuthority = new ContractMaintenanceAuthority([], 1, 0n);
  const wanted = state.operations().map(String);
  const deploy = new ContractDeploy(state);
  const tx = Transaction.fromParts(config.networkId, undefined, undefined, Intent.new(new Date(Date.now() + config.ttlSeconds * 1000)).addDeploy(deploy));
  await submitTx(providers, { unprovenTx: LedgerTransaction.seal('v9', 'Unproven', tx) });

  const onChain = await authorityOf(data, deploy.address);
  if (!onChain) throw new Error(`the chain shows no contract at ${deploy.address} after the deploy`);
  if (onChain.keys !== 0) throw new Error(`contract ${deploy.address} has ${onChain.keys} maintenance key(s) on chain`);
  const missing = wanted.filter((circuit) => !onChain.circuits.includes(circuit));
  if (missing.length > 0) throw new Error(`contract ${deploy.address} lacks ${missing.join(', ')} on chain`);
  return deploy.address;
}
