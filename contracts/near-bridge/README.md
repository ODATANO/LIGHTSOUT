# near-bridge

The NEAR side of the LIGHTSOUT bridge: locks, registrations with their fee, a light client of
Midnight's finality, burns proven from the Midnight blocks that hold them, and releases. Anyone may
send every call, and no account has a special right. Design: [docs/architecture.md](../../docs/architecture.md).

## Build

Requires Rust (see `rust-toolchain.toml`) and [`cargo-near`](https://github.com/near/cargo-near), on Linux or WSL.

```bash
cargo near build reproducible-wasm
```

## Deploy

Deploy the Midnight bridge first, with the name of this NEAR account, because this contract takes
its address at init and cannot change it. `npm run make-init` in `kit/` writes `init.json` from the
live chains. Then deploy, and delete every access key of the account so nobody can change the code.

```bash
near contract deploy <bridge account> use-file target/near/near_bridge.wasm \
  with-init-call new file-args init.json \
  prepaid-gas '100 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-keychain send
```
