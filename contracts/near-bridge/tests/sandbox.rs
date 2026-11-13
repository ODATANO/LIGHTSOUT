//! Runs the built contract on a local NEAR sandbox, where gas is metered as on chain.

use near_api::types::{AccountId, NearGas, NearToken};
use near_api::{Contract, NetworkConfig, Signer};
use near_bridge::{FinalityProof, MidnightGenesis, MidnightView, MithrilInit, MithrilView, ProvenBurn, TokenOutput};
use near_sandbox::Sandbox;
use near_sdk::base64::{Engine, engine::general_purpose::STANDARD as B64};
use near_sandbox::config::{DEFAULT_GENESIS_ACCOUNT, DEFAULT_GENESIS_ACCOUNT_PRIVATE_KEY};
use near_sdk::json_types::Base64VecU8;
use serde_json::{Value, json};
use testresult::TestResult;

#[path = "support/rewritten.rs"]
mod rewritten;

// The nearcore release NEAR testnet runs, so host functions and gas costs match it.
const NEARCORE: &str = "2.14.0-rc.5";

fn read(path: String) -> Value {
    serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap()
}

// A burn on preview with its block, 14 headers after it and the finality of the last. Its
// contract logs a burn in another layout than the bridge.
fn recording() -> Value {
    read(format!("{}/tests/fixtures/burn-tx.json", env!("CARGO_MANIFEST_DIR")))
}

// The recorded block around a transaction that the parser's tests rewrite from the recorded burn.
fn recorded_with(recording: &Value, tx: &str) -> Value {
    let path = format!("{}/../../crates/midnight-tx/tests/data/{tx}", env!("CARGO_MANIFEST_DIR"));
    rewritten::with_tx(recording, &std::fs::read(path).unwrap(), sha256)
}

// The recorded block with the burn as the bridge logs it: 0.1 wNEAR under the id 1d1d….
fn burn_in(recording: &Value) -> Value {
    recorded_with(recording, "burn-tx-id.bin")
}

const BURN_ID: &str = "1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d1d";

fn data(file: &str) -> Value {
    read(format!("{}/../../crates/midnight-grandpa/tests/data/stagenet/{file}", env!("CARGO_MANIFEST_DIR")))
}

fn unhex(v: &Value) -> Vec<u8> {
    hex::decode(v.as_str().unwrap().trim_start_matches("0x")).unwrap()
}

// SCALE-encodes an RPC header. The digest logs are already encoded digest items.
fn encode_header(h: &Value) -> Vec<u8> {
    use codec::Encode;
    let mut out = unhex(&h["parentHash"]);
    codec::Compact(u32::from_str_radix(h["number"].as_str().unwrap().trim_start_matches("0x"), 16).unwrap()).encode_to(&mut out);
    out.extend(unhex(&h["stateRoot"]));
    out.extend(unhex(&h["extrinsicsRoot"]));
    let logs = h["digest"]["logs"].as_array().unwrap();
    codec::Compact(logs.len() as u32).encode_to(&mut out);
    logs.iter().for_each(|l| out.extend(unhex(l)));
    out
}

fn init_args(owner: &AccountId, bridge: &str, mithril: Value) -> Value {
    let g = data("genesis.json");
    let genesis = MidnightGenesis {
        genesis_hash: g["hash"].as_str().unwrap().trim_start_matches("0x").into(),
        header: Base64VecU8(encode_header(&g["header"])),
        authorities_proof: g["proof"].as_array().unwrap().iter().map(|p| Base64VecU8(unhex(p))).collect(),
    };
    json!({
        "daily_limit": NearToken::from_near(10),
        "midnight_bridge": bridge,
        "midnight_genesis": genesis,
        "mithril": mithril,
        "denominations": [],
        "registration_fee": NearToken::from_near(1),
        "beneficiary": owner,
    })
}

struct Deployed {
    sandbox: Sandbox,
    network: NetworkConfig,
    account: AccountId,
    signer: std::sync::Arc<Signer>,
}

// Deploys a bridge that pays out the burns of the Midnight contract at `bridge`.
async fn deploy(bridge: &str) -> TestResult<Deployed> {
    deploy_with(bridge, Value::Null).await
}

// The same with a Mithril chain that starts as `mithril` says.
async fn deploy_with(bridge: &str, mithril: Value) -> TestResult<Deployed> {
    let wasm = std::fs::read(cargo_near_build::build_with_cli(Default::default())?)?;
    let sandbox = Sandbox::start_sandbox_with_version(NEARCORE).await?;
    let network = NetworkConfig::from_rpc_url("sandbox", sandbox.rpc_addr.parse()?);
    let account: AccountId = DEFAULT_GENESIS_ACCOUNT.into();
    let signer = Signer::from_secret_key(DEFAULT_GENESIS_ACCOUNT_PRIVATE_KEY.parse()?)?;
    Contract::deploy(account.clone())
        .use_code(wasm)
        .with_init_call("new", init_args(&account, bridge, mithril))?
        .with_signer(signer.clone())
        .send_to(&network)
        .await?
        .assert_success();
    Ok(Deployed { sandbox, network, account, signer })
}

#[tokio::test]
async fn sixteen_set_changes_fit_in_one_call() -> TestResult {
    let Deployed { sandbox: _sandbox, network, account, signer } = deploy(&"78".repeat(32)).await?;

    let blocks: Vec<FinalityProof> = data("prove-finality.json")
        .as_array()
        .unwrap()
        .iter()
        .map(|b| FinalityProof { header: Base64VecU8(unhex(&b["header"])), justification: Base64VecU8(unhex(&b["justification"])) })
        .collect();
    let contract = Contract(account.clone());
    let outcome = contract
        .call_function("submit_midnight_finality", json!({ "blocks": blocks }))
        .transaction()
        .gas(NearGas::from_tgas(300))
        .deposit(NearToken::from_millinear(50))
        .with_signer(account.clone(), signer)
        .send_to(&network)
        .await?
        .assert_success();
    let tgas = outcome.total_gas_burnt.as_tgas();
    println!("16 set changes burnt {tgas} Tgas");

    let view: MidnightView = contract.call_function("get_midnight", ()).read_only().fetch_from(&network).await?.data;
    assert_eq!((view.set_id, view.finalized_number), (16, 4543));
    assert!(tgas < 250, "16 blocks need {tgas} Tgas");
    Ok(())
}

fn borsh_vec(bytes: &[u8]) -> Vec<u8> {
    [&(bytes.len() as u32).to_le_bytes()[..], bytes].concat()
}

fn replace_once(state: &mut Vec<u8>, from: &[u8], to: &[u8]) {
    let at: Vec<usize> = state.windows(from.len()).enumerate().filter(|(_, w)| *w == from).map(|(i, _)| i).collect();
    assert_eq!(at.len(), 1, "pattern found {} times in the contract state", at.len());
    state.splice(at[0]..at[0] + from.len(), to.iter().copied());
}

fn hexes(v: &Value) -> Vec<Vec<u8>> {
    v.as_array().unwrap().iter().map(unhex).collect()
}

fn b64(v: Vec<Vec<u8>>) -> Vec<Base64VecU8> {
    v.into_iter().map(Base64VecU8).collect()
}

// The committee as the contract stores it: each authority with its weight, sorted, SCALE-encoded.
fn committee(client: &midnight_grandpa::LightClient) -> Vec<u8> {
    let mut members: Vec<(Vec<u8>, u64)> = client.authorities.iter().map(|(id, w)| (codec::Encode::encode(id), *w)).collect();
    members.sort();
    codec::Encode::encode(&members)
}

// A bridge at the last header of the recording: the stored light client and committee are
// moved to the set that finalizes it, and its finality comes with the check for an authorized
// runtime upgrade. That block is old, so the bridge takes no new funds yet.
async fn at_the_recorded_block(f: &Value) -> TestResult<Deployed> {
    let Deployed { sandbox, network, account, signer } = deploy(f["bridge"].as_str().unwrap()).await?;

    let g = data("genesis.json");
    let proof = g["proof"].as_array().unwrap().iter().map(unhex).collect();
    let genesis_hash = codec::Decode::decode(&mut &unhex(&g["hash"])[..])?;
    let genesis = midnight_grandpa::LightClient::from_genesis(genesis_hash, &encode_header(&g["header"]), proof).unwrap();
    let headers = hexes(&f["headers"]);
    let last: midnight_grandpa::Header = codec::Decode::decode(&mut &headers.last().unwrap()[..])?;
    let j = &f["justified"];
    let recorded = midnight_grandpa::LightClient {
        set_id: j["set_id"].as_u64().unwrap(),
        authorities: codec::Decode::decode(&mut &unhex(&j["authorities"])[..])?,
        finalized_hash: last.parent_hash,
        finalized_number: last.number - 1,
    };
    let stored = Contract(account.clone()).view_storage().fetch_from(&network).await?.data;
    let mut state = stored.values.iter().find(|s| s.key.0 == B64.encode("STATE")).map(|s| B64.decode(&s.value.0)).unwrap()?;
    replace_once(&mut state, &borsh_vec(&codec::Encode::encode(&genesis)), &borsh_vec(&codec::Encode::encode(&recorded)));
    replace_once(&mut state, &borsh_vec(&committee(&genesis)), &borsh_vec(&committee(&recorded)));
    sandbox.patch_state(account.clone()).storage(B64.encode("STATE"), B64.encode(&state)).send().await?;

    let contract = Contract(account.clone());
    let finality = FinalityProof { header: Base64VecU8(headers.last().unwrap().clone()), justification: Base64VecU8(unhex(&j["justification"])) };
    contract
        .call_function("submit_midnight_finality", json!({ "blocks": [finality], "upgrade_proof": b64(hexes(&f["upgrade_proof"])) }))
        .transaction()
        .gas(NearGas::from_tgas(300))
        .deposit(NearToken::from_millinear(10))
        .with_signer(account.clone(), signer.clone())
        .send_to(&network)
        .await?
        .assert_success();
    Ok(Deployed { sandbox, network, account, signer })
}

// Moves the stored upgrade check from the time Midnight built the fixture's last block to now.
async fn renew_the_check(d: &Deployed, f: &Value) -> TestResult {
    let last: midnight_grandpa::Header = codec::Decode::decode(&mut &hexes(&f["headers"]).last().unwrap()[..])?;
    let check = |at: u64| [&[1u8][..], &last.number.to_le_bytes(), &[0u8], &at.to_le_bytes()].concat();
    let built = midnight_grandpa::slot(&last).unwrap() * 6_000_000_000;
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)?.as_nanos() as u64;
    let stored = Contract(d.account.clone()).view_storage().fetch_from(&d.network).await?.data;
    let mut state = stored.values.iter().find(|s| s.key.0 == B64.encode("STATE")).map(|s| B64.decode(&s.value.0)).unwrap()?;
    replace_once(&mut state, &check(built), &check(now));
    d.sandbox.patch_state(d.account.clone()).storage(B64.encode("STATE"), B64.encode(&state)).send().await?;
    Ok(())
}

// The arguments that prove the transaction of `f` through `headers`.
fn proof_args(f: &Value, headers: Vec<Vec<u8>>, table: Option<u32>) -> Value {
    let index = f["extrinsic_index"].as_u64().unwrap() as u32;
    let (_, extrinsic_proof) = substrate_read_proof::extrinsic_proof(&hexes(&f["extrinsics"]), index);
    json!({
        "headers": b64(headers),
        "extrinsic_index": index,
        "extrinsic_proof": b64(extrinsic_proof),
        "state_proof": b64(hexes(&f["state_proof"])),
        "table": table,
    })
}

async fn proven_burn(d: &Deployed) -> TestResult<Option<ProvenBurn>> {
    Ok(Contract(d.account.clone()).call_function("get_proven_burn", json!({ "burn_id": BURN_ID })).read_only().fetch_from(&d.network).await?.data)
}

// Proves the burn of `f` through `headers` and returns the gas the call burnt, in Tgas.
async fn prove_the_burn(d: &Deployed, f: &Value, headers: Vec<Vec<u8>>, table: Option<u32>) -> TestResult<u64> {
    let tgas = relay_call(d, "prove_burn_tx", proof_args(f, headers, table)).await?;
    let nothing = NearToken::from_yoctonear(0);
    assert_eq!(proven_burn(d).await?, Some(ProvenBurn { near_recipient: "bob.lightsout.odatano.testnet".into(), amount: NearToken::from_millinear(100), block: 61761, paid: nothing }));
    Ok(tgas)
}

// A burn proven from its transaction, 14 headers before a finalized block.
#[tokio::test]
async fn proves_a_burn_from_its_transaction() -> TestResult {
    let recorded = recording();
    let deployed = at_the_recorded_block(&recorded).await?;
    let f = burn_in(&recorded);
    let headers = hexes(&f["headers"]);
    finalize_in_place(&deployed, hexes(&recorded["headers"]).last().unwrap(), headers.last().unwrap()).await?;
    let count = headers.len();
    let tgas = prove_the_burn(&deployed, &f, headers, None).await?;
    println!("prove_burn_tx with {count} headers burnt {tgas} Tgas");
    assert!(tgas < 250, "prove_burn_tx needs {tgas} Tgas");
    Ok(())
}

// The most headers the bridge takes between a burn's block and a finalized one.
const MOST_HEADERS: usize = 300;

// `count` headers from the recorded block `first` on. The others copy the recorded header
// `like`, so they have its size and number, and each names the one before it as its parent.
fn long_chain(first: &[u8], like: &[u8], count: usize) -> Vec<Vec<u8>> {
    let copied: midnight_grandpa::Header = codec::Decode::decode(&mut &like[..]).unwrap();
    let mut chain = vec![first.to_vec()];
    while chain.len() < count {
        let mut next = copied.clone();
        next.parent_hash = midnight_grandpa::header_hash(chain.last().unwrap());
        chain.push(codec::Encode::encode(&next));
    }
    chain
}

// The storage key under which the contract keeps `value`.
async fn key_of(d: &Deployed, value: &[u8]) -> TestResult<String> {
    let stored = Contract(d.account.clone()).view_storage().fetch_from(&d.network).await?.data;
    let keys: Vec<String> = stored.values.iter().filter(|s| B64.decode(&s.value.0).map(|v| v == value).unwrap_or(false)).map(|s| s.key.0.to_string()).collect();
    assert_eq!(keys.len(), 1, "the value is stored {} times", keys.len());
    Ok(keys[0].clone())
}

// Makes the bridge take `header` as the finalized block of its number, in place of `recorded`.
async fn finalize_in_place(d: &Deployed, recorded: &[u8], header: &[u8]) -> TestResult {
    let key = key_of(d, &midnight_grandpa::header_hash(recorded).0).await?;
    d.sandbox.patch_state(d.account.clone()).storage(key, B64.encode(midnight_grandpa::header_hash(header).0)).send().await?;
    Ok(())
}

// A burn made while no relay ran can lie a whole authority set behind the next finalized block.
#[tokio::test]
async fn proves_a_burn_as_far_back_as_the_bridge_allows() -> TestResult {
    let recorded = recording();
    let deployed = at_the_recorded_block(&recorded).await?;
    let f = burn_in(&recorded);
    let recorded = hexes(&recorded["headers"]);
    let chain = long_chain(&hexes(&f["headers"])[0], recorded.last().unwrap(), MOST_HEADERS);
    finalize_in_place(&deployed, recorded.last().unwrap(), chain.last().unwrap()).await?;
    let tgas = prove_the_burn(&deployed, &f, chain, None).await?;
    println!("prove_burn_tx with {MOST_HEADERS} headers burnt {tgas} Tgas");
    assert!(tgas < 250, "prove_burn_tx needs {tgas} Tgas");
    Ok(())
}

// Moves the stored upgrade check one block back, so that the fixture's last block can be checked again.
async fn check_one_block_back(d: &Deployed, f: &Value) -> TestResult {
    let last: midnight_grandpa::Header = codec::Decode::decode(&mut &hexes(&f["headers"]).last().unwrap()[..])?;
    let built = midnight_grandpa::slot(&last).unwrap() * 6_000_000_000;
    let check = |block: u32| [&[1u8][..], &block.to_le_bytes(), &[0u8], &built.to_le_bytes()].concat();
    let stored = Contract(d.account.clone()).view_storage().fetch_from(&d.network).await?.data;
    let mut state = stored.values.iter().find(|s| s.key.0 == B64.encode("STATE")).map(|s| B64.decode(&s.value.0)).unwrap()?;
    replace_once(&mut state, &check(last.number), &check(last.number - 1));
    d.sandbox.patch_state(d.account.clone()).storage(B64.encode("STATE"), B64.encode(&state)).send().await?;
    Ok(())
}

// A check for an authorized upgrade, of a block as far behind a finalized one as the bridge allows.
#[tokio::test]
async fn checks_for_an_upgrade_as_far_back_as_the_bridge_allows() -> TestResult {
    let f = recording();
    let deployed = at_the_recorded_block(&f).await?;
    check_one_block_back(&deployed, &f).await?;
    let recorded = hexes(&f["headers"]);
    let last = recorded.last().unwrap();
    let chain = long_chain(last, last, MOST_HEADERS);
    finalize_in_place(&deployed, last, chain.last().unwrap()).await?;
    let contract = Contract(deployed.account.clone());
    let checked = contract
        .call_function("check_upgrade", json!({ "headers": b64(chain), "state_proof": b64(hexes(&f["upgrade_proof"])) }))
        .transaction()
        .gas(NearGas::from_tgas(300))
        .with_signer(deployed.account.clone(), deployed.signer.clone())
        .send_to(&deployed.network)
        .await?
        .assert_success();
    let tgas = checked.total_gas_burnt.as_tgas();
    println!("check_upgrade with {MOST_HEADERS} headers burnt {tgas} Tgas");

    let runtime: Value = contract.call_function("get_runtime", ()).read_only().fetch_from(&deployed.network).await?.data;
    assert_eq!(runtime["upgrade"]["block"], f["justified"]["number"]);
    assert!(tgas < 250, "check_upgrade needs {tgas} Tgas");
    Ok(())
}

// SHA-256 as the contract's host computes it.
fn sha256(bytes: &[u8]) -> [u8; 32] {
    near_sdk::testing_env!(near_sdk::test_utils::VMContextBuilder::new().build());
    near_sdk::env::sha256_array(bytes)
}

// A runtime version whose first table is of no use gets the right one beside it, as
// `npm run table` sends it. The call reaches its test block through the most headers allowed.
#[tokio::test]
async fn adds_a_runtime_table_as_far_back_as_the_bridge_allows() -> TestResult {
    let f = recording();
    let deployed = at_the_recorded_block(&f).await?;
    let contract = Contract(deployed.account.clone());
    let recorded = hexes(&f["headers"]);
    let chain = long_chain(&recorded[0], recorded.last().unwrap(), MOST_HEADERS);
    finalize_in_place(&deployed, recorded.last().unwrap(), chain.last().unwrap()).await?;
    let table: Option<Base64VecU8> = contract.call_function("get_runtime_table", json!({ "spec": f["spec_version"] })).read_only().fetch_from(&deployed.network).await?.data;
    let table = table.unwrap();

    // The version's first place now names a table the bridge does not have.
    let key = key_of(&deployed, &sha256(&table.0)).await?;
    deployed.sandbox.patch_state(deployed.account.clone()).storage(key, B64.encode([0u8; 32])).send().await?;

    let index = f["extrinsic_index"].as_u64().unwrap() as u32;
    let (_, extrinsic_proof) = substrate_read_proof::extrinsic_proof(&hexes(&f["extrinsics"]), index);
    let args = json!({
        "table": table,
        "headers": b64(chain.clone()),
        "extrinsic_index": index,
        "extrinsic_proof": b64(extrinsic_proof),
        "state_proof": b64(hexes(&f["state_proof"])),
    });
    let added = contract
        .call_function("add_runtime_table", args)
        .transaction()
        .gas(NearGas::from_tgas(300))
        .deposit(NearToken::from_millinear(200))
        .with_signer(deployed.account.clone(), deployed.signer.clone())
        .send_to(&deployed.network)
        .await?
        .assert_success();
    println!("add_runtime_table with {MOST_HEADERS} headers burnt {} Tgas", added.total_gas_burnt.as_tgas());
    assert!(added.total_gas_burnt.as_tgas() < 250);

    // A burn is read with the second table. The first place still leads nowhere.
    let burn = burn_in(&f);
    let to_the_burn = long_chain(&hexes(&burn["headers"])[0], recorded.last().unwrap(), MOST_HEADERS);
    finalize_in_place(&deployed, chain.last().unwrap(), to_the_burn.last().unwrap()).await?;
    prove_the_burn(&deployed, &burn, to_the_burn, Some(1)).await?;
    Ok(())
}

// The recording with further `TxApplied` records of other transactions, up to `bytes` of events.
fn with_events(recording: &Value, bytes: usize) -> Value {
    let mut f = recording.clone();
    let events = unhex(&f["storage_values"][0]);
    let mut records = &events[..];
    let count = <codec::Compact<u32> as codec::Decode>::decode(&mut records).unwrap().0;
    let more = (bytes.saturating_sub(events.len()) / 40) as u32;
    let mut out = codec::Encode::encode(&codec::Compact(count + more));
    out.extend_from_slice(records);
    for n in 0..more {
        // Extrinsic 2 applied a transaction with a made-up hash, no topics: 40 bytes.
        out.extend([&[0u8][..], &2u32.to_le_bytes(), &[5, 2], &n.to_le_bytes().repeat(8), &[0]].concat());
    }
    f["storage_values"][0] = json!(format!("0x{}", hex::encode(out)));
    f
}

// A part of a staged node: what one NEAR transaction carries as base64 beside its other bytes.
const PART_BYTES: usize = 900_000;

// Stages the node of the state proof of `f` that holds the events, and returns the proof's
// arguments without that node.
async fn staged_args(d: &Deployed, f: &Value, headers: Vec<Vec<u8>>) -> TestResult<Value> {
    let events = unhex(&f["storage_values"][0]);
    let mut args = proof_args(f, headers, None);
    let others: Vec<Vec<u8>> = hexes(&f["state_proof"]).into_iter().filter(|node| *node != events).collect();
    args["state_proof"] = json!(b64(others));
    let parts: Vec<&[u8]> = events.chunks(PART_BYTES).collect();
    for (part, bytes) in parts.iter().enumerate() {
        let staged = Contract(d.account.clone())
            .call_function("stage", json!({ "part": part, "bytes": Base64VecU8(bytes.to_vec()) }))
            .transaction()
            .gas(NearGas::from_tgas(300))
            .deposit(NearToken::from_near(12))
            .with_signer(d.account.clone(), d.signer.clone())
            .send_to(&d.network)
            .await?
            .assert_success();
        println!("stage with {} kB burnt {} Tgas", bytes.len() / 1000, staged.total_gas_burnt.as_tgas());
    }
    args["staged"] = json!(parts.len());
    Ok(args)
}

// What the events of a full block cost. Up to 500 kB the proof carries them; larger ones are
// staged in parts first, since NEAR takes a transaction of 1.5 MB at most. Midnight's block
// length bounds a block's events near 1.4 MB; twice that is measured and not required.
#[tokio::test]
async fn proves_a_burn_in_a_block_with_many_events() -> TestResult {
    let recorded = recording();
    let deployed = at_the_recorded_block(&recorded).await?;
    let contract = Contract(deployed.account.clone());
    let mut finalized = hexes(&recorded["headers"]).pop().unwrap();
    const LARGEST: usize = 1500;
    let mut results = Vec::new();
    for kilobytes in [100, 250, 500, 1000, LARGEST, 2 * LARGEST] {
        let f = burn_in(&with_events(&recorded, kilobytes * 1000));
        let headers = hexes(&f["headers"]);
        finalize_in_place(&deployed, &finalized, headers.last().unwrap()).await?;
        finalized = headers.last().unwrap().clone();
        let staged = kilobytes > 500;
        let args = if staged { staged_args(&deployed, &f, headers).await? } else { proof_args(&f, headers, None) };
        let sent = contract
            .call_function("prove_burn_tx", args)
            .transaction()
            .gas(NearGas::from_tgas(300))
            .deposit(NearToken::from_millinear(10))
            .with_signer(deployed.account.clone(), deployed.signer.clone())
            .send_to(&deployed.network)
            .await?;
        // After the first size the burn is proven, so a later call fails once its work is done.
        let result = match sent.into_full().unwrap().into_result() {
            Ok(done) => (done.total_gas_burnt.as_tgas(), "proven".to_string()),
            Err(failed) => (failed.total_gas_burnt.as_tgas(), failed.to_string()),
        };
        println!("prove_burn_tx with {kilobytes} kB of events burnt {} Tgas: {}", result.0, result.1);
        results.push((kilobytes, result));
        if staged {
            // A proof that fails leaves its parts staged. They are dropped for the next size.
            let dropped = contract.call_function("drop_staged", ()).transaction().gas(NearGas::from_tgas(300)).with_signer(deployed.account.clone(), deployed.signer.clone()).send_to(&deployed.network).await?.assert_success();
            println!("drop_staged burnt {} Tgas", dropped.total_gas_burnt.as_tgas());
        }
    }
    assert_eq!(results[0].1.1, "proven");
    for (kilobytes, (tgas, result)) in &results[1..] {
        if *kilobytes <= LARGEST {
            assert!(result.contains("burn already proven"), "{kilobytes} kB of events: {result}");
            assert!(*tgas < 250, "prove_burn_tx with {kilobytes} kB of events needs {tgas} Tgas");
        }
    }
    Ok(())
}

fn mithril_file(file: &str) -> String {
    std::fs::read_to_string(format!("{}/../../crates/mithril-light/tests/data/{file}", env!("CARGO_MANIFEST_DIR"))).unwrap()
}

fn certificate(file: &str) -> mithril_light::Certificate {
    mithril_light::aggregator::certificate(&mithril_file(file)).unwrap().0
}

// The genesis verification key of the Mithril network the certificates come from.
const MITHRIL_GENESIS_KEY: &str = "7f497ca1068983d5cf75c655b0c7a2f1447b77910de8f331e502f9cdcd27eb2c";

// A Mithril chain that starts at a recorded certificate and follows the committee token of preview.
fn mithril_init(start: &str, genesis_key: Option<&str>) -> Value {
    let token = TokenOutput { policy: "924a6b4c0becbd9d4506a91ecc7992e50008ec5051c7ea2e9219ee49".into(), tx_hash: "709dc6ad2f4ff43d1eac965cb2241f44fb9786615959fa308cd597b1fabd5e18".into(), index: 4 };
    serde_json::to_value(MithrilInit { certificate: certificate(start), token, governance: vec![], security_depth: 0, genesis_key: genesis_key.map(str::to_string) }).unwrap()
}

// Sends a call with the gas and the deposit the relay sends, and returns the gas it burnt in Tgas.
async fn relay_call(d: &Deployed, method: &str, args: Value) -> TestResult<u64> {
    let outcome = Contract(d.account.clone())
        .call_function(method, args)
        .transaction()
        .gas(NearGas::from_tgas(300))
        .deposit(NearToken::from_millinear(10))
        .with_signer(d.account.clone(), d.signer.clone())
        .send_to(&d.network)
        .await?
        .assert_success();
    Ok(outcome.total_gas_burnt.as_tgas())
}

// The Mithril calls with recorded certificates of Cardano preview: two epochs, then the
// transaction that moved the committee token.
#[tokio::test]
async fn follows_mithril_and_the_committee_token() -> TestResult {
    let deployed = deploy_with(&"78".repeat(32), mithril_init("certificate-1469-mit.json", None)).await?;
    for file in ["certificate-1470-mit.json", "certificate-1471-mit.json"] {
        let tgas = relay_call(&deployed, "submit_mithril_certificate", json!({ "certificate": certificate(file) })).await?;
        println!("submit_mithril_certificate with {file} burnt {tgas} Tgas");
        assert!(tgas < 250, "submit_mithril_certificate needs {tgas} Tgas");
    }

    let proof: Value = serde_json::from_str(&mithril_file("proof-v2-3fad67d4.json"))?;
    let certified = &proof["certified_transactions"];
    let item = &certified["items"][0];
    let args = json!({
        "certificate": certificate("certificate-1471-car.json"),
        "transaction": { "transaction_hash": item["transaction_hash"], "block_number": item["block_number"], "slot_number": item["slot_number"], "block_hash": item["block_hash"] },
        "proof": Base64VecU8(hex::decode(certified["proof"].as_str().unwrap())?),
        "tx_cbor": Base64VecU8(hex::decode(mithril_file("fedops-tx-3fad67d4.hex").trim())?),
    });
    let tgas = relay_call(&deployed, "submit_committee_update", args).await?;
    println!("submit_committee_update burnt {tgas} Tgas");

    let view: Option<MithrilView> = Contract(deployed.account.clone()).call_function("get_mithril", ()).read_only().fetch_from(&deployed.network).await?.data;
    let view = view.unwrap();
    assert_eq!((view.epoch, view.token.index), (1471, 2));
    assert!(tgas < 250, "submit_committee_update needs {tgas} Tgas");
    Ok(())
}

// A genesis certificate starts the Mithril chain anew, which is how it recovers from a break.
#[tokio::test]
async fn takes_a_mithril_genesis_certificate() -> TestResult {
    let start = "certificate-1129-genesis.json";
    // The chain stands in that epoch on another key, as after a break.
    let mut init = mithril_init(start, Some(MITHRIL_GENESIS_KEY));
    init["certificate"]["aggregate_verification_key"]["total_stake"] = json!("1");
    let deployed = deploy_with(&"78".repeat(32), init).await?;
    let tgas = relay_call(&deployed, "submit_mithril_certificate", json!({ "certificate": certificate(start) })).await?;
    println!("submit_mithril_certificate with a genesis certificate burnt {tgas} Tgas");
    assert!(tgas < 250, "submit_mithril_certificate needs {tgas} Tgas");
    Ok(())
}

async fn locks_open(d: &Deployed) -> TestResult<bool> {
    let config: Value = Contract(d.account.clone()).call_function("get_config", ()).read_only().fetch_from(&d.network).await?.data;
    Ok(config["locks_open"].as_bool().unwrap())
}

// Lets the bridge take new funds: a check of a block built now, and a proof that the Midnight
// bridge made a NEAR block its head. That block lies far above the sandbox's, so it counts as recent.
async fn open(d: &Deployed, recorded: &Value) -> TestResult {
    // A check of a block built hours ago does not open the bridge.
    assert!(!locks_open(d).await?);
    renew_the_check(d, recorded).await?;
    // Nor does a fresh check while nothing shows that Midnight follows NEAR.
    assert!(!locks_open(d).await?);
    let f = recorded_with(recorded, "head-tx.bin");
    let headers = hexes(&f["headers"]);
    finalize_in_place(d, hexes(&recorded["headers"]).last().unwrap(), headers.last().unwrap()).await?;
    let count = headers.len();
    let proved = Contract(d.account.clone())
        .call_function("prove_head_tx", proof_args(&f, headers.clone(), None))
        .transaction()
        .gas(NearGas::from_tgas(300))
        .with_signer(d.account.clone(), d.signer.clone())
        .send_to(&d.network)
        .await?
        .assert_success();
    println!("prove_head_tx with {count} headers burnt {} Tgas", proved.total_gas_burnt.as_tgas());
    assert!(proved.total_gas_burnt.as_tgas() < 250);
    let runtime: Value = Contract(d.account.clone()).call_function("get_runtime", ()).read_only().fetch_from(&d.network).await?.data;
    assert_eq!(runtime["accepted_head"], "277000000");
    assert!(locks_open(d).await?);
    // The recorded header is the finalized one again.
    finalize_in_place(d, headers.last().unwrap(), hexes(&recorded["headers"]).last().unwrap()).await?;
    Ok(())
}

// A shielded address of a test seed.
const MIDNIGHT_RECIPIENT: &str = "mn_shield-addr_preprod1e4d6dvswz9qe97j0c07m9n6w9jxyrf4p32qnksd5xj0edu5ckwtqsr977qa6vkc2lxm36vqfs54sprmacecq24u4l0rszy7w5a65juqwvv8qt";

// The burn names an account the sandbox does not have, so its payout fails and is owed again.
#[tokio::test]
async fn a_payout_that_fails_is_owed_again() -> TestResult {
    let recorded = recording();
    let deployed = at_the_recorded_block(&recorded).await?;
    open(&deployed, &recorded).await?;
    let contract = Contract(deployed.account.clone());
    contract
        .call_function("lock", json!({ "midnight_recipient": MIDNIGHT_RECIPIENT }))
        .transaction()
        .deposit(NearToken::from_near(1))
        .with_signer(deployed.account.clone(), deployed.signer.clone())
        .send_to(&deployed.network)
        .await?
        .assert_success();

    let f = burn_in(&recorded);
    let headers = hexes(&f["headers"]);
    finalize_in_place(&deployed, hexes(&recorded["headers"]).last().unwrap(), headers.last().unwrap()).await?;
    prove_the_burn(&deployed, &f, headers, None).await?;
    let released = contract
        .call_function("release", json!({ "burn_id": BURN_ID }))
        .transaction()
        .gas(NearGas::from_tgas(300))
        .with_signer(deployed.account.clone(), deployed.signer.clone())
        .send_to(&deployed.network)
        .await?
        .assert_success();
    println!("release with a payout that fails burnt {} Tgas", released.total_gas_burnt.as_tgas());
    assert!(released.logs().iter().any(|l| l.contains("release_failed")), "{:?}", released.logs());
    assert_eq!(proven_burn(&deployed).await?.unwrap().paid, NearToken::from_yoctonear(0));
    let config: Value = contract.call_function("get_config", ()).read_only().fetch_from(&deployed.network).await?.data;
    assert_eq!((&config["total_released"], &config["released_today"]), (&json!("0"), &json!("0")));
    Ok(())
}

#[tokio::test]
async fn a_registration_logs_its_line_and_the_fees_are_paid() -> TestResult {
    let f = recording();
    let deployed = at_the_recorded_block(&f).await?;
    let contract = Contract(deployed.account.clone());
    open(&deployed, &f).await?;
    let Deployed { sandbox: _sandbox, network, account, signer } = deployed;
    let commitment = "c0ffee00".repeat(8);

    let registered = contract
        .call_function("register", json!({ "commitment": commitment, "dust_address": "mn_dust_undeployed1wdhjufvhxdvzewava8r682vywdvuuwnfvdsl7aty73xfdwpzcumjc5vv82s", "message_key": "5a".repeat(64) }))
        .transaction()
        .deposit(NearToken::from_near(1))
        .with_signer(account.clone(), signer.clone())
        .send_to(&network)
        .await?
        .assert_success();
    // The registration proof rebuilds this line and expects the event after it.
    let logs = registered.logs();
    assert_eq!(logs[0], format!("lightsout:join:{:016x}{commitment}", 0));
    assert!(logs[1].starts_with("EVENT_JSON:"));
    assert_eq!(logs.len(), 2);

    let config: Value = contract.call_function("get_config", ()).read_only().fetch_from(&network).await?.data;
    assert_eq!(config["registered"], "1");
    assert_ne!(config["fees_unpaid"], "0");

    contract
        .call_function("pay_fees", ())
        .transaction()
        .with_signer(account.clone(), signer)
        .send_to(&network)
        .await?
        .assert_success();
    let config: Value = contract.call_function("get_config", ()).read_only().fetch_from(&network).await?.data;
    assert_eq!(config["fees_unpaid"], "0");
    Ok(())
}
