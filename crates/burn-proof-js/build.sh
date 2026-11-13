#!/bin/bash
# Builds pkg/ for Node. Needs the wasm32 target and wasm-bindgen-cli 0.2.130.
set -e
cd "$(dirname "$0")"
cargo build --release --target wasm32-unknown-unknown
target=${CARGO_TARGET_DIR:-target}
wasm-bindgen --target nodejs --out-dir pkg "$target/wasm32-unknown-unknown/release/burn_proof_js.wasm"
