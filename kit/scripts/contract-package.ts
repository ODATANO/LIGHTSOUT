// Writes keys/manifest.json (the hash of every key) and contract.json (the package digest and
// the address its proving keys are downloaded from) for both contracts. --check only compares.
// In kit: npm run contract-package [-- --check]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKeyManifest, checkKeyManifest, computeArtifactGenerationDigest, missingProverKeys, renderKeyManifest, verifierCircuits } from '@odatano/contract-kit/node';

// The proving keys are the assets of one release for each contract and version.
const RELEASES = 'https://github.com/ODATANO/LIGHTSOUT/releases/download';
const CONTRACTS = [
  { folder: 'midnight-bridge', role: 'bridge', privateStateId: 'midnightBridgePrivateState' },
  { folder: 'board', role: 'board', privateStateId: 'boardPrivateState' },
];
const check = process.argv.includes('--check');
const root = resolve(fileURLToPath(import.meta.url), '../../..');
const json = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;

let stale = 0;
for (const { folder, role, privateStateId } of CONTRACTS) {
  const dir = join(root, 'contracts', folder);
  const zkConfigPath = `managed/${folder}`;
  const artifactPath = `${zkConfigPath}/contract/index.js`;
  const zkDir = join(dir, zkConfigPath);
  const manifestFile = join(zkDir, 'keys', 'manifest.json');
  const contractFile = join(dir, 'contract.json');
  const { version } = json<{ version: string }>(join(dir, 'package.json'));
  const info = json<{ 'compiler-version': string; 'runtime-version': string; 'language-version': string; circuits: { name: string; pure: boolean }[] }>(join(zkDir, 'compiler', 'contract-info.json'));

  if (!check) {
    const missing = missingProverKeys(zkDir);
    if (missing.length) throw new Error(`${folder}: the proving keys of ${missing.join(', ')} are not on disk, so their hashes cannot be written. Run npm run compile first.`);
    writeFileSync(manifestFile, renderKeyManifest(buildKeyManifest(zkDir)));
  }
  const contract = {
    name: folder,
    role,
    privateStateId,
    artifactPath,
    zkConfigPath,
    circuits: verifierCircuits(zkDir),
    pureCircuits: info.circuits.filter((circuit) => circuit.pure).map((circuit) => circuit.name).sort(),
    compactCompiler: info['compiler-version'],
    compactRuntime: info['runtime-version'],
    languageVersion: info['language-version'],
    digest: computeArtifactGenerationDigest({ artifactPath: join(dir, artifactPath), privateStateId, zkConfigPath: zkDir }),
    zkAssetUrl: `${RELEASES}/${folder}-v${version}`,
    zkAssetLayout: 'flat',
  };
  const text = `${JSON.stringify(contract, null, 2)}\n`;
  if (!check) {
    writeFileSync(contractFile, text);
    console.log(`${folder}: keys/manifest.json and contract.json written, digest ${contract.digest.slice(0, 16)}…, proving keys at ${contract.zkAssetUrl}`);
    continue;
  }
  const problems = checkKeyManifest(zkDir);
  const written = (() => {
    try {
      return readFileSync(contractFile, 'utf8').replace(/\r\n/g, '\n');
    } catch {
      return '';
    }
  })();
  if (written !== text) problems.push('contract.json does not match the files on disk');
  for (const problem of problems) console.log(`${folder}: ${problem}`);
  stale += problems.length;
  if (problems.length === 0) console.log(`${folder}: keys/manifest.json and contract.json match the files on disk`);
}
if (stale) process.exit(1);
