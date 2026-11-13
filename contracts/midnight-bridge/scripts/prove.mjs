// Proves one step of the light client on recorded NEAR testnet data, in the wasm prover.
// Usage: npm run prove [-- absorb]   (default: approve, a real block producer signature)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ed25519 } from '@noble/curves/ed25519.js';
import { Zkir, check, prove } from '@midnight-ntwrk/zkir-v3';
import { b58, deploy, fixture, fromView, headOf, listBytes, liteBytes, padded, READ, sha256, u64 } from '../test/helpers.mjs';

const circuit = process.argv[2] ?? 'approve';
if (!['approve', 'absorb'].includes(circuit)) throw new Error('prove approve or absorb');
const { checkpoint, blocks: [block] } = fixture;
const producers = fromView(checkpoint.next_bps);
const list = listBytes(producers);
const light = await deploy(headOf(checkpoint.inner_lite));

if (circuit === 'absorb') {
  await light.call('begin', READ, BigInt(list.length));
  await light.call('absorb', READ, padded(list).subarray(0, 64));
  console.log(`first 64 bytes of the producer list of ${list.length} bytes`);
} else {
  await light.readList(list);
  const lite = liteBytes(block.inner_lite);
  const hash = sha256(b58(block.next_block_inner_hash), sha256(sha256(sha256(lite), b58(block.inner_rest_hash)), b58(block.prev_block_hash)));
  await light.call('propose', lite, b58(block.inner_rest_hash), b58(block.prev_block_hash), b58(block.next_block_inner_hash), u64(block.inner_lite.height + 2));
  const index = block.approvals_after_next.findIndex((a) => a);
  const signature = b58(block.approvals_after_next[index]);
  // The circuit takes points in affine coordinates and the signature's scalar as a number.
  const affine = (bytes) => {
    const p = ed25519.Point.fromBytes(bytes).toAffine();
    return { x: p.x, y: p.y };
  };
  const scalar = signature.subarray(32).reduceRight((acc, v) => (acc << 8n) | BigInt(v), 0n);
  await light.call('approve', hash, BigInt(index), { r: affine(signature.subarray(0, 32)), s: scalar }, affine(producers[index].key));
  console.log(`approval of block ${block.inner_lite.height} by ${producers[index].name}`);
}

const managed = new URL('../managed/midnight-bridge/', import.meta.url);
const ir = readFileSync(new URL(`zkir/${circuit}.bzkir`, managed));
const params = new URL('../params/', import.meta.url);
mkdirSync(params, { recursive: true });
const provider = {
  async lookupKey(location) {
    if (location !== circuit) return undefined;
    return { proverKey: readFileSync(new URL(`keys/${circuit}.prover`, managed)), verifierKey: readFileSync(new URL(`keys/${circuit}.verifier`, managed)), ir };
  },
  // The public structured reference string of Midnight, cached after the first run.
  async getParams(k) {
    const file = new URL(`bls_midnight_2p${k}`, params);
    if (!existsSync(file)) {
      const res = await fetch(`https://midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com/bls_midnight_2p${k}`);
      if (!res.ok) throw new Error(`params ${k}: ${res.status}`);
      writeFileSync(file, new Uint8Array(await res.arrayBuffer()));
    }
    return readFileSync(file);
  },
};
await check(light.preimage, provider);
console.log(`  ok  constraints satisfied, circuit size k = ${Zkir.deserialize(ir).getK()}`);
const started = Date.now();
const proof = await prove(light.preimage, provider);
const out = new URL('../out/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL(`${circuit}.proof`, out), proof);
console.log(`  ok  proof of ${proof.length} bytes in ${((Date.now() - started) / 1000).toFixed(0)} s, written to out/${circuit}.proof`);
// The wasm prover keeps the process alive for minutes after it is done.
process.stdout.write('', () => process.exit(0));
