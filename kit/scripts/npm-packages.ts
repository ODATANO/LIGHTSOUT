// Builds the folders the kit and the MCP server are published from, in out/npm: compiled
// JavaScript with its types and a package.json that names it. The workspace runs the sources.
// In kit: npm run packages
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../../..');
const out = join(root, 'out', 'npm');

// The settings of the live deployment that hold no key. The kit reads them where none is set.
const PUBLIC = ['NEAR_BRIDGE_CONTRACT', 'MIDNIGHT_NETWORK', 'MIDNIGHT_NODE_URL', 'MIDNIGHT_INDEXER_HTTP_URL', 'MIDNIGHT_INDEXER_WS_URL', 'MIDNIGHT_PROOF_SERVER_URL', 'MIDNIGHT_BRIDGE', 'MIDNIGHT_BOARD'];

interface Target {
  folder: string;
  bin?: Record<string, string>;
  files: string[];
  unpublished: string[]; // dependencies of sources that the build leaves out
}
const TARGETS: Target[] = [
  { folder: 'kit', files: ['dist', 'live-deployment.env'], unpublished: [] },
  { folder: 'mcp', bin: { 'lightsout-mcp': 'dist/server.js' }, files: ['dist'], unpublished: ['@anthropic-ai/sdk'] },
];

interface Manifest {
  name: string;
  version: string;
  exports?: Record<string, string>;
  dependencies: Record<string, string>;
  [field: string]: unknown;
}

function liveDeployment(): string {
  const example = readFileSync(join(root, '.env.example'), 'utf8').split(/\r?\n/);
  const lines = PUBLIC.map((name) => {
    const line = example.find((l) => l.startsWith(`${name}=`));
    if (!line || line.length === name.length + 1) throw new Error(`.env.example sets no ${name}`);
    return line;
  });
  return `${lines.join('\n')}\n`;
}

// ./src/agent.ts is published as ./dist/agent.js beside ./dist/agent.d.ts.
const compiled = (source: string): string => source.replace(/^\.\/src\//, './dist/').replace(/\.ts$/, '');

for (const { folder, bin, files, unpublished } of TARGETS) {
  const from = join(root, folder);
  const source = JSON.parse(readFileSync(join(from, 'package.json'), 'utf8')) as Manifest;
  const to = join(out, source.name);
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  execSync(`npx tsc -p tsconfig.build.json --outDir "${join(to, 'dist')}"`, { cwd: from, stdio: 'inherit' });

  const { name, version, description, license, repository, homepage, keywords, type, engines } = source;
  const exports = source.exports && Object.fromEntries(Object.entries(source.exports).map(([path, file]) => [path, { types: `${compiled(file)}.d.ts`, default: `${compiled(file)}.js` }]));
  const dependencies = Object.fromEntries(Object.entries(source.dependencies).filter(([dependency]) => !unpublished.includes(dependency)));
  const manifest = { name, version, description, license, repository, homepage, keywords, type, ...(exports ? { exports } : {}), ...(bin ? { bin } : {}), files, engines, dependencies, publishConfig: { access: 'public' } };
  writeFileSync(join(to, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  copyFileSync(join(root, 'LICENSE'), join(to, 'LICENSE'));
  copyFileSync(join(from, 'README.md'), join(to, 'README.md'));
  if (files.includes('live-deployment.env')) writeFileSync(join(to, 'live-deployment.env'), liveDeployment());
  console.log(`${name}@${version}: out/npm/${name}`);
}
