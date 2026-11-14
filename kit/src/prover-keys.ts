// The proving keys of the two contract packages. They are too large to ship in a package, so a
// key that is not on disk is downloaded from the address in the package's contract.json and
// checked against the hash in its keys/manifest.json.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import type { ProverKey } from '@midnight-ntwrk/midnight-js-types';
import { missingProverKeys, readProverKeyManifest, verifierCircuits } from '@odatano/contract-kit/node';
import { ensureZkAssets } from '@odatano/nightgate-tx/txbuilder';

const PACKAGES = ['lightsout-midnight-bridge', 'lightsout-board'] as const;
export type ContractPackage = (typeof PACKAGES)[number];

// The directory contract packages are resolved from: this package's own.
const HERE = dirname(fileURLToPath(import.meta.url));

/** The directory with keys/ and zkir/ of an installed contract package. */
export function zkConfigDirOf(packageName: string): string {
  return resolve(dirname(fileURLToPath(import.meta.resolve(packageName))), '..');
}

/** The circuits of a contract package whose proving key is on disk. */
export function provable(packageName: ContractPackage): string[] {
  const dir = zkConfigDirOf(packageName);
  const missing = new Set(missingProverKeys(dir));
  return verifierCircuits(dir).filter((circuit) => !missing.has(circuit));
}

// Downloads on their way, so two calls that need one key wait for one download.
const running = new Map<string, Promise<void>>();

/** Makes sure the proving keys of `circuits` are on disk, downloading the ones that are not. */
export async function proverKeys(packageName: ContractPackage, circuits: readonly string[]): Promise<void> {
  const dir = zkConfigDirOf(packageName);
  const missing = missingProverKeys(dir).filter((circuit) => circuits.includes(circuit));
  for (const circuit of missing) {
    const key = `${packageName}/${circuit}`;
    let download = running.get(key);
    if (!download) {
      const bytes = readProverKeyManifest(dir)?.prover[circuit]?.bytes;
      const size = bytes === undefined ? '' : ` (${Math.ceil(bytes / 1e6)} MB)`;
      // On stderr: an MCP server speaks its protocol on stdout.
      console.error(`downloading the proving key of ${circuit}${size}, which is kept for later calls`);
      download = ensureZkAssets({ package: packageName, from: HERE, circuits: [circuit] })
        .then(() => undefined)
        .finally(() => running.delete(key));
      running.set(key, download);
    }
    await download;
  }
}

// The keys of a contract package, with a proving key downloaded before it is first read.
class PackageZkConfig<K extends string> extends NodeZkConfigProvider<K> {
  constructor(private readonly packageName: ContractPackage) {
    super(zkConfigDirOf(packageName));
  }

  override async getProverKey(circuitId: K): Promise<ProverKey> {
    await proverKeys(this.packageName, [circuitId]);
    return super.getProverKey(circuitId);
  }
}

/** The key provider of a directory. For a contract package's directory it downloads missing proving keys. */
export function zkConfigOf<K extends string>(dir: string): NodeZkConfigProvider<K> {
  const known = PACKAGES.find((name) => zkConfigDirOf(name) === dir);
  return known ? new PackageZkConfig<K>(known) : new NodeZkConfigProvider<K>(dir);
}
