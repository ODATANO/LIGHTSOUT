use super::*;
use near_sdk::test_utils::{get_logs, VMContextBuilder};
use near_sdk::{testing_env, PublicKey};

#[path = "../tests/support/rewritten.rs"]
mod rewritten;

// A shielded address derived from a test seed, and the coin public key inside it.
const RECIPIENT: &str = "mn_shield-addr_preprod1e4d6dvswz9qe97j0c07m9n6w9jxyrf4p32qnksd5xj0edu5ckwtqsr977qa6vkc2lxm36vqfs54sprmacecq24u4l0rszy7w5a65juqwvv8qt";
const RECIPIENT_COIN_KEY: &str = "cd5ba6b20e114192fa4fc3fdb2cf4e2c8c41a6a18a813b41b4349f96f298b396";
const SIGNER: &str = "ed25519:DcA2MzgpJbrUATQLLceocVckhhAqrkingax4oJ9kZ847";
const BRIDGE: &str = "7878787878787878787878787878787878787878787878787878787878787878";
const FEE: NearToken = NearToken::from_near(1);

fn account(name: &str) -> AccountId {
    name.parse().unwrap()
}

fn pk(s: &str) -> PublicKey {
    s.parse().unwrap()
}

thread_local! {
    static HEIGHT: std::cell::Cell<u64> = const { std::cell::Cell::new(0) };
}

// Each context is a NEAR block of its own.
fn builder(predecessor: AccountId, signer_pk: &str, now_ms: u64) -> VMContextBuilder {
    let height = HEIGHT.with(|h| {
        h.set(h.get() + 1);
        h.get()
    });
    let mut b = VMContextBuilder::new();
    b.current_account_id(account("bridge.testnet"))
        .predecessor_account_id(predecessor)
        .signer_account_pk(pk(signer_pk))
        .block_timestamp(now_ms * 1_000_000)
        .block_height(height);
    b
}

fn as_user(name: &str, deposit: NearToken) {
    testing_env!(builder(account(name), SIGNER, 0).attached_deposit(deposit).build());
}

fn recording(file: &str) -> serde_json::Value {
    let path = format!("{}/../../crates/midnight-grandpa/tests/data/{file}", env!("CARGO_MANIFEST_DIR"));
    serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap()
}

fn grandpa_data(file: &str) -> serde_json::Value {
    recording(&format!("stagenet/{file}"))
}

fn unhex_json(v: &serde_json::Value) -> Vec<u8> {
    hex::decode(v.as_str().unwrap().trim_start_matches("0x")).unwrap()
}

/// SCALE-encodes an RPC header. The digest logs are already encoded digest items.
fn encode_header(h: &serde_json::Value) -> Vec<u8> {
    use codec::Encode;
    let mut out = unhex_json(&h["parentHash"]);
    let number = u32::from_str_radix(h["number"].as_str().unwrap().trim_start_matches("0x"), 16).unwrap();
    codec::Compact(number).encode_to(&mut out);
    out.extend(unhex_json(&h["stateRoot"]));
    out.extend(unhex_json(&h["extrinsicsRoot"]));
    let logs = h["digest"]["logs"].as_array().unwrap();
    codec::Compact(logs.len() as u32).encode_to(&mut out);
    for l in logs {
        out.extend(unhex_json(l));
    }
    out
}

/// The real stagenet genesis with its authorities read proof.
fn genesis() -> MidnightGenesis {
    genesis_in(&grandpa_data("genesis.json"))
}

fn genesis_in(g: &serde_json::Value) -> MidnightGenesis {
    MidnightGenesis {
        genesis_hash: g["hash"].as_str().unwrap().trim_start_matches("0x").to_string(),
        header: Base64VecU8(encode_header(&g["header"])),
        authorities_proof: g["proof"].as_array().unwrap().iter().map(|p| Base64VecU8(unhex_json(p))).collect(),
    }
}

/// The first stagenet set changes, each with its justification.
fn set_changes() -> Vec<FinalityProof> {
    set_changes_in(&grandpa_data("justified-blocks.json"))
}

/// The first five set changes of a recording.
fn set_changes_in(blocks: &serde_json::Value) -> Vec<FinalityProof> {
    blocks
        .as_array()
        .unwrap()
        .iter()
        .take(5)
        .map(|b| FinalityProof {
            header: Base64VecU8(encode_header(&b["header"])),
            justification: Base64VecU8(unhex_json(&b["justifications"][0][1])),
        })
        .collect()
}

/// A bridge that pays out the burns of the Midnight contract at `bridge`.
fn contract_for(bridge: &str) -> Contract {
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    let mut c = Contract::new(NearToken::from_near(10), bridge.into(), genesis(), None, vec![], FEE, account("fees.testnet"));
    open(&mut c);
    c
}

/// Lets the bridge take new funds, as after a finalized block of a runtime it knows, a check
/// that found no upgrade authorized and a proof that Midnight follows NEAR. The check never
/// ages in these tests, and their blocks stay close to the accepted head.
fn open(c: &mut Contract) {
    c.runtime_spec = 2001100;
    c.upgrade_check = Some(UpgradeCheck { block: 1, authorized: false, at: U64(u64::MAX) });
    c.accepted_head = Some(0);
}

fn contract() -> Contract {
    contract_for(BRIDGE)
}

const NOTHING: NearToken = NearToken::from_yoctonear(0);
const DAY_MS: u64 = 86_400_000;

// The id of a made-up burn: one byte, 32 times.
fn burn_id(burn: u8) -> String {
    hex::encode([burn; 32])
}

fn proven(near_recipient: &str, amount: NearToken) -> ProvenBurn {
    ProvenBurn { near_recipient: near_recipient.into(), amount, block: 1, paid: NOTHING }
}

/// Records a proven burn, as `prove_burn_tx` does after checking the Midnight proofs, then releases it.
fn release(c: &mut Contract, burn: u8, amount: NearToken) -> Promise {
    if c.proven_burns.get(&[burn; 32]).is_none() {
        c.proven_burns.insert([burn; 32], proven("bob.testnet", amount));
    }
    as_user("carol.testnet", NOTHING);
    c.release(burn_id(burn))
}

fn paid(c: &Contract, burn: u8) -> NearToken {
    c.get_proven_burn(burn_id(burn)).unwrap().paid
}

fn lock(c: &mut Contract, near: u128) -> U64 {
    as_user("alice.testnet", NearToken::from_near(near));
    let id = U64(c.next_lock_id);
    c.lock(RECIPIENT.to_string());
    id
}

#[test]
fn lock_records_amount_minus_storage_and_emits_event() {
    let mut c = contract();
    let id = lock(&mut c, 1);
    let l = c.get_lock(id).unwrap();
    assert_eq!(c.get_config().total_locked, l.amount);
    assert_eq!(l.block_height, U64(env::block_height()));
    assert!(l.amount < NearToken::from_near(1));
    assert!(l.amount > NearToken::from_millinear(990));
    assert_eq!(l.amount.as_yoctonear() % UNIT_YOCTO, 0);
    assert!(get_logs()[1].starts_with("EVENT_JSON:"));
    assert!(get_logs()[1].contains("\"event\":\"lock\""));
}

#[test]
fn lock_logs_one_line_of_fixed_length_before_the_event() {
    let mut c = contract();
    lock(&mut c, 1);
    let id = lock(&mut c, 2);
    let micro = c.get_lock(id).unwrap().amount.as_yoctonear() / UNIT_YOCTO;
    let line = get_logs()[0].clone();
    assert_eq!(line, format!("lightsout:lock:{:016x}{micro:016x}{RECIPIENT_COIN_KEY}", id.0));
    assert_eq!(line.len(), 111);
    assert_eq!(id.0, 1);
    assert_eq!(get_logs().len(), 2);
}

#[test]
fn the_coin_key_is_the_first_half_of_the_address_data() {
    assert_eq!(shielded_coin_key(RECIPIENT).map(hex::encode).as_deref(), Some(RECIPIENT_COIN_KEY));
    // One changed character breaks the checksum.
    assert_eq!(shielded_coin_key(&RECIPIENT.replace("e4d6", "e4d7")), None);
    // An unshielded address and a shielded key alone are not shielded addresses.
    assert_eq!(shielded_coin_key("mn_addr_preprod1e4d6dvswz9qe97j0c07m9n6w9jxyrf4p32qnksd5xj0edu5ckwtqj3m0f5"), None);
    assert_eq!(shielded_coin_key(&RECIPIENT.to_uppercase()), None);
    assert_eq!(shielded_coin_key(""), None);
}

#[test]
#[should_panic(expected = "Midnight shielded address")]
fn lock_rejects_other_addresses() {
    let mut c = contract();
    as_user("alice.testnet", NearToken::from_near(1));
    c.lock("mn_addr_preprod1abc".to_string());
}

#[test]
#[should_panic(expected = "daily lock limit reached")]
fn lock_enforces_daily_limit() {
    let mut c = contract();
    lock(&mut c, 6);
    lock(&mut c, 6);
}

#[test]
#[should_panic(expected = "one lock or registration per account and block")]
fn a_second_lock_in_the_same_transaction_fails() {
    let mut c = contract();
    as_user("alice.testnet", NearToken::from_near(1));
    c.lock(RECIPIENT.to_string());
    c.lock(RECIPIENT.to_string());
}

#[test]
#[should_panic(expected = "one lock or registration per account and block")]
fn a_lock_beside_a_registration_fails() {
    let mut c = contract();
    as_user("alice.testnet", FEE);
    c.register(COMMITMENT.into(), DUST.into(), message_key());
    c.lock(RECIPIENT.to_string());
}

#[test]
#[should_panic(expected = "the bridge takes no new funds now")]
fn no_lock_before_a_check_of_midnights_runtime() {
    let mut c = contract();
    c.upgrade_check = None;
    lock(&mut c, 1);
}

#[test]
fn a_closed_bridge_still_pays_out() {
    let mut c = contract();
    lock(&mut c, 2);
    c.upgrade_check = None;
    assert!(!c.get_config().locks_open);
    let _ = release(&mut c, 0, NearToken::from_near(1));
    assert_eq!(c.get_config().total_released, NearToken::from_near(1));
}

#[test]
fn anyone_releases_a_proven_burn_to_the_account_it_names() {
    let mut c = contract();
    lock(&mut c, 2);
    let _ = release(&mut c, 7, NearToken::from_near(1));
    assert!(c.is_released(burn_id(7)));
    let event = get_logs().pop().unwrap();
    assert!(event.contains("\"event\":\"release\"") && event.contains("\"recipient\":\"bob.testnet\""), "{event}");
}

#[test]
#[should_panic(expected = "burn already released")]
fn release_rejects_replay() {
    let mut c = contract();
    lock(&mut c, 2);
    let amount = NearToken::from_millinear(500);
    let _ = release(&mut c, 1, amount);
    let _ = release(&mut c, 1, amount);
}

#[test]
#[should_panic(expected = "release exceeds the locked NEAR")]
fn release_is_bounded_by_the_locked_near() {
    let mut c = contract();
    // The lock record's storage comes off the deposit, so less than 1 NEAR is locked.
    lock(&mut c, 1);
    let _ = release(&mut c, 0, NearToken::from_near(1));
}

#[test]
#[should_panic(expected = "the burn names no NEAR account")]
fn a_burn_that_names_no_account_is_not_paid() {
    let mut c = contract();
    lock(&mut c, 2);
    c.proven_burns.insert([0; 32], proven("Not An Account", NearToken::from_near(1)));
    let _ = c.release(burn_id(0));
}

#[test]
fn failed_release_can_be_retried() {
    let mut c = contract();
    lock(&mut c, 2);
    let amount = NearToken::from_near(1);
    let _ = release(&mut c, 0, amount);
    assert!(c.is_released(burn_id(0)));
    testing_env!(builder(account("bridge.testnet"), SIGNER, 0).build());
    assert!(!c.on_release(burn_id(0), amount, U64(0), Err(PromiseError::Failed)));
    assert!(!c.is_released(burn_id(0)));
    assert!(c.get_config().total_released.is_zero());
    assert!(c.get_config().released_today.is_zero());
    let _ = release(&mut c, 0, amount);
    assert_eq!(paid(&c, 0), amount);
}

// The bridge of these tests pays out 10 NEAR a day.
#[test]
fn a_burn_above_the_daily_limit_is_paid_over_the_days() {
    let mut c = contract();
    c.total_locked = NearToken::from_near(100);
    let _ = release(&mut c, 0, NearToken::from_near(25));
    assert_eq!(paid(&c, 0), NearToken::from_near(10));
    assert!(!c.is_released(burn_id(0)));
    let event = get_logs().pop().unwrap();
    assert!(event.contains("\"event\":\"release\"") && event.contains(&format!("\"amount\":\"{}\"", NearToken::from_near(10).as_yoctonear())), "{event}");

    testing_env!(builder(account("carol.testnet"), SIGNER, DAY_MS).build());
    let _ = c.release(burn_id(0));
    assert_eq!(paid(&c, 0), NearToken::from_near(20));
    testing_env!(builder(account("carol.testnet"), SIGNER, 2 * DAY_MS).build());
    let _ = c.release(burn_id(0));
    assert_eq!(paid(&c, 0), NearToken::from_near(25));
    assert!(c.is_released(burn_id(0)));
    assert_eq!(c.get_config().released_today, NearToken::from_near(5));
    assert_eq!(c.get_config().total_released, NearToken::from_near(25));
}

#[test]
#[should_panic(expected = "daily release limit reached")]
fn a_day_pays_out_its_limit_and_no_more() {
    let mut c = contract();
    c.total_locked = NearToken::from_near(100);
    let _ = release(&mut c, 0, NearToken::from_near(25));
    let _ = release(&mut c, 1, NearToken::from_near(1));
}

#[test]
fn a_burn_takes_what_the_day_has_left() {
    let mut c = contract();
    c.total_locked = NearToken::from_near(100);
    let _ = release(&mut c, 0, NearToken::from_near(7));
    let _ = release(&mut c, 1, NearToken::from_near(7));
    assert_eq!((paid(&c, 0), paid(&c, 1)), (NearToken::from_near(7), NearToken::from_near(3)));
}

#[test]
fn a_part_that_fails_is_owed_again() {
    let mut c = contract();
    c.total_locked = NearToken::from_near(100);
    let _ = release(&mut c, 0, NearToken::from_near(25));
    testing_env!(builder(account("carol.testnet"), SIGNER, DAY_MS).build());
    let _ = c.release(burn_id(0));
    testing_env!(builder(account("bridge.testnet"), SIGNER, DAY_MS).build());
    assert!(!c.on_release(burn_id(0), NearToken::from_near(10), U64(1), Err(PromiseError::Failed)));
    assert_eq!(paid(&c, 0), NearToken::from_near(10));
    assert_eq!(c.get_config().total_released, NearToken::from_near(10));
    assert!(c.get_config().released_today.is_zero());
}

#[test]
fn a_payout_that_fails_a_day_later_leaves_that_days_limit() {
    let mut c = contract();
    c.total_locked = NearToken::from_near(100);
    let _ = release(&mut c, 0, NearToken::from_near(4));
    // The next day another burn is paid before the failure of the first arrives.
    c.proven_burns.insert([1; 32], proven("bob.testnet", NearToken::from_near(3)));
    testing_env!(builder(account("carol.testnet"), SIGNER, DAY_MS).build());
    let _ = c.release(burn_id(1));
    testing_env!(builder(account("bridge.testnet"), SIGNER, DAY_MS).build());
    assert!(!c.on_release(burn_id(0), NearToken::from_near(4), U64(0), Err(PromiseError::Failed)));
    assert_eq!(c.get_config().released_today, NearToken::from_near(3));
    assert_eq!(c.get_config().total_released, NearToken::from_near(3));
    assert!(paid(&c, 0).is_zero());
}

#[test]
#[should_panic(expected = "the bridge takes no new funds now")]
fn no_lock_before_midnight_is_shown_to_follow_near() {
    let mut c = contract();
    c.accepted_head = None;
    lock(&mut c, 1);
}

#[test]
fn the_bridge_closes_when_the_accepted_head_is_an_epoch_old() {
    let mut c = contract();
    c.accepted_head = Some(1000);
    testing_env!(builder(account("alice.testnet"), SIGNER, 0).block_height(1000 + 43_200).build());
    assert!(c.get_config().locks_open);
    testing_env!(builder(account("alice.testnet"), SIGNER, 0).block_height(1000 + 43_201).build());
    assert!(!c.get_config().locks_open);
    assert_eq!(c.get_runtime().accepted_head, Some(U64(1000)));
}

#[test]
fn the_light_client_starts_at_the_stagenet_genesis() {
    let c = contract();
    let m = c.get_midnight();
    assert_eq!((m.set_id, m.authorities, m.finalized_number), (0, 7, 0));
    assert_eq!(m.finalized_hash, genesis().genesis_hash);
}

#[test]
#[should_panic(expected = "genesis: GenesisHashMismatch")]
fn init_rejects_a_header_that_is_not_the_genesis() {
    let mut g = genesis();
    g.genesis_hash = "00".repeat(32);
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    Contract::new(NearToken::from_near(10), BRIDGE.into(), g, None, vec![], FEE, account("fees.testnet"));
}

#[test]
#[should_panic(expected = "midnight_bridge")]
fn init_rejects_a_bridge_address_that_is_not_32_bytes() {
    contract_for("7878");
}

#[test]
fn anyone_advances_the_light_client_and_pays_its_storage() {
    let mut c = contract();
    as_user("carol.testnet", NearToken::from_millinear(10));
    c.submit_midnight_finality(set_changes(), None);
    let m = c.get_midnight();
    assert_eq!((m.set_id, m.finalized_number), (5, 1243));
    assert!(c.get_finalized_hash(43).is_some() && c.get_finalized_hash(1243).is_some());
    assert!(c.get_finalized_hash(44).is_none());
}

/// The keys of the light client's authority set without the first `drop`, and the keys `more` on top.
fn committee_with(c: &Contract, drop: usize, more: &[u8]) -> Vec<u8> {
    let client = midnight::load(&c.midnight);
    let own = client.authorities.iter().skip(drop).map(|(id, _)| codec::Encode::encode(id));
    midnight::committee_of_keys(own.chain(more.iter().map(|byte| vec![*byte; 32])))
}

#[test]
#[should_panic(expected = "the new authority set has a key no announced committee names")]
fn a_set_change_to_a_key_outside_the_committee_is_refused() {
    let mut c = contract();
    // The committee lacks one key of the set the chain hands over to.
    c.midnight_committee = committee_with(&c, 1, &[7]);
    as_user("carol.testnet", NearToken::from_millinear(10));
    c.submit_midnight_finality(set_changes(), None);
}

#[test]
fn a_committee_may_name_a_key_that_holds_no_seat() {
    let mut c = contract();
    let committee = committee_with(&c, 0, &[7]);
    c.midnight_committee = committee.clone();
    as_user("carol.testnet", NearToken::from_millinear(10));
    c.submit_midnight_finality(set_changes(), None);
    assert_eq!(c.get_midnight().set_id, 5);
    assert_eq!(c.midnight_committee, committee);
}

// Puts committees in line as Cardano's announcements, oldest first.
fn announce(c: &mut Contract, committees: Vec<Vec<u8>>) {
    for committee in committees {
        c.announced.insert(c.announced_to, committee);
        c.announced_to += 1;
    }
}

#[test]
fn a_set_with_a_new_key_moves_the_bridge_to_the_committee_that_names_it() {
    let mut c = contract();
    let named = committee_with(&c, 0, &[9]);
    let later = committee_with(&c, 0, &[9, 10]);
    c.midnight_committee = committee_with(&c, 1, &[7]);
    // The first announced committee lacks the key as well, so the set skips it.
    let lacking = committee_with(&c, 1, &[8]);
    announce(&mut c, vec![lacking, named.clone(), later.clone()]);
    as_user("carol.testnet", NearToken::from_millinear(10));
    c.submit_midnight_finality(set_changes(), None);
    assert_eq!(c.midnight_committee, named);
    assert_eq!((c.announced_from, c.announced_to), (2, 3));
    assert_eq!([0, 1, 2].map(|place| c.announced.get(&place).cloned()), [None, None, Some(later)]);
}

#[test]
fn an_announced_committee_stays_in_line_however_many_follow() {
    let mut c = contract();
    let named = committee_with(&c, 0, &[9]);
    c.midnight_committee = committee_with(&c, 1, &[7]);
    let mut line = vec![named.clone()];
    line.extend((0..20).map(|i| committee_with(&c, 1, &[100 + i])));
    announce(&mut c, line);
    as_user("carol.testnet", NearToken::from_millinear(10));
    c.submit_midnight_finality(set_changes(), None);
    assert_eq!(c.midnight_committee, named);
    assert_eq!((c.announced_from, c.announced_to), (1, 21));
}

#[test]
fn a_committee_whose_keys_hold_several_seats_is_followed() {
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    let mut c = Contract::new(NearToken::from_near(10), BRIDGE.into(), genesis_in(&recording("genesis.json")), None, vec![], FEE, account("fees.testnet"));
    assert_eq!(c.get_midnight().authorities, 13);
    let at_genesis = c.midnight_committee.clone();
    // From its first set change on, preprod gives each of its 13 keys ten seats.
    as_user("carol.testnet", NearToken::from_near(1));
    c.submit_midnight_finality(set_changes_in(&recording("justified-blocks.json")), None);
    let m = c.get_midnight();
    assert_eq!((m.set_id, m.authorities, m.finalized_number), (5, 130, 893));
    assert_eq!(c.midnight_committee, at_genesis);

    // The committee update recorded on Cardano preprod names the same 13 keys, once each.
    let tx = mithril_light::parse_transaction(&hex::decode(include_str!(concat!("../../../crates/mithril-light/tests/data/", "preprod-fedops-update-f984693d.hex")).trim()).unwrap()).unwrap();
    let policy: [u8; 28] = hex::decode("d962fc619efb2b904e5a8443838500ef2145452af117ab8f9cc3f97f").unwrap().try_into().unwrap();
    let spent = mithril_light::Outpoint { tx_hash: midnight::unhex32("tx", "2d14c502936d4b62fbc6d73a85aa220fc4f61c26e2d1b42645913d4540bce7d1").unwrap(), index: 0 };
    let mithril_light::TokenUpdate::Moved(_, candidates) = mithril_light::candidate_update(&tx, &spent, &policy).unwrap() else { panic!("the token moved") };
    assert_eq!(candidates.len(), 13);
    assert_eq!(mithril::committee_of(&candidates), c.midnight_committee);
}

#[test]
fn the_committee_is_the_genesis_set() {
    let c = contract();
    assert_eq!(c.midnight_committee, midnight::committee(&midnight::load(&c.midnight)));
}

#[test]
#[should_panic(expected = "finality: InvalidSignature")]
fn set_changes_must_come_in_order() {
    let mut c = contract();
    as_user("carol.testnet", NearToken::from_millinear(10));
    c.submit_midnight_finality(set_changes().into_iter().skip(1).collect(), None);
}

#[test]
#[should_panic(expected = "for storage")]
fn finality_without_a_storage_deposit_fails() {
    let mut c = contract();
    as_user("carol.testnet", NearToken::from_yoctonear(0));
    c.submit_midnight_finality(set_changes(), None);
}

#[test]
#[should_panic(expected = "burn is not proven")]
fn release_needs_a_proven_burn() {
    let mut c = contract();
    lock(&mut c, 2);
    let _ = c.release(burn_id(0));
}

const COMMITMENT: &str = "c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee11";

// Built by the Midnight address library for one dust key on three networks.
const DUST: &str = "mn_dust_preprod1wdhjufvhxdvzewava8r682vywdvuuwnfvdsl7aty73xfdwpzcumjcz5r0zs";

fn message_key() -> String {
    "5a".repeat(64)
}

fn register(c: &mut Contract, name: &str, commitment: &str) {
    as_user(name, FEE);
    c.register(commitment.into(), DUST.into(), message_key());
}

#[test]
fn register_refuses_a_message_key_that_is_not_64_bytes_of_lowercase_hex() {
    let mut c = contract();
    for bad in ["5a".repeat(63), "5A".repeat(64), "5a".repeat(65), String::new(), "zz".repeat(64)] {
        as_user("dave.testnet", FEE);
        let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| c.register(COMMITMENT.into(), DUST.into(), bad.clone())));
        assert!(r.is_err(), "{bad}");
    }
    register(&mut c, "dave.testnet", COMMITMENT);
    assert_eq!(c.get_registration(account("dave.testnet")).unwrap().message_key, message_key());
}

#[test]
fn register_takes_dust_addresses_of_any_network_and_nothing_else() {
    let mut c = contract();
    let good = [DUST, "mn_dust_undeployed1wdhjufvhxdvzewava8r682vywdvuuwnfvdsl7aty73xfdwpzcumjc5vv82s", "mn_dust1wdhjufvhxdvzewava8r682vywdvuuwnfvdsl7aty73xfdwpzcumjck6h8pk"];
    for (name, address) in ["alice.testnet", "bob.testnet", "carol.testnet"].into_iter().zip(good) {
        as_user(name, FEE);
        c.register(COMMITMENT.into(), address.into(), message_key());
        assert_eq!(c.get_registration(account(name)).unwrap().dust_address, address);
    }
    for bad in [RECIPIENT, "", "mn_dust_preprod1", &DUST.replace("mn_dust", "mn_dusty"), &DUST.replace("cz5r0zs", "cz5r0zz")] {
        as_user("dave.testnet", FEE);
        let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| c.register(COMMITMENT.into(), bad.into(), message_key())));
        assert!(r.is_err(), "{bad}");
    }
}

#[test]
fn register_takes_the_fee_and_logs_one_line_of_fixed_length_before_the_event() {
    let mut c = contract();
    register(&mut c, "alice.testnet", COMMITMENT);
    let logs = get_logs();
    assert_eq!(logs[0], format!("lightsout:join:{:016x}{COMMITMENT}", 0));
    assert_eq!(logs[0].len(), 95);
    assert_eq!(logs.len(), 2);
    assert!(logs[1].starts_with("EVENT_JSON:") && logs[1].contains("\"event\":\"register\""));
    let r = c.get_registration(account("alice.testnet")).unwrap();
    assert_eq!((r.index, r.commitment.as_str(), r.dust_address.as_str()), (U64(0), COMMITMENT, DUST));
    let config = c.get_config();
    assert_eq!(config.registered, U64(1));
    // The record's storage comes out of the fee.
    assert!(config.fees_unpaid < FEE && config.fees_unpaid > NearToken::from_millinear(990));
}

#[test]
fn every_registration_gets_the_next_index() {
    let mut c = contract();
    register(&mut c, "alice.testnet", COMMITMENT);
    let other = COMMITMENT.replace("11", "22");
    register(&mut c, "bob.testnet", &other);
    assert_eq!(get_logs()[0], format!("lightsout:join:{:016x}{other}", 1));
    assert_eq!(c.get_registration(account("bob.testnet")).unwrap().index, U64(1));
    assert_eq!(c.get_registration(account("carol.testnet")), None);
    assert_eq!([0, 1, 2].map(|i| c.get_registered(U64(i))), [Some(account("alice.testnet")), Some(account("bob.testnet")), None]);
}

#[test]
fn the_last_leaf_of_the_member_tree_can_be_registered() {
    let mut c = contract();
    c.next_registration = MAX_REGISTRATIONS - 1;
    register(&mut c, "alice.testnet", COMMITMENT);
    assert_eq!(c.get_registration(account("alice.testnet")).unwrap().index, U64(65535));
}

#[test]
#[should_panic(expected = "the member tree of the Midnight bridge is full")]
fn register_stops_when_the_member_tree_is_full() {
    let mut c = contract();
    c.next_registration = MAX_REGISTRATIONS;
    register(&mut c, "alice.testnet", COMMITMENT);
}

#[test]
#[should_panic(expected = "attach exactly")]
fn register_refuses_another_amount() {
    let mut c = contract();
    as_user("alice.testnet", FEE.saturating_add(NearToken::from_yoctonear(1)));
    c.register(COMMITMENT.into(), DUST.into(), message_key());
}

#[test]
#[should_panic(expected = "this account is registered")]
fn an_account_registers_once() {
    let mut c = contract();
    register(&mut c, "alice.testnet", COMMITMENT);
    register(&mut c, "alice.testnet", &COMMITMENT.replace("11", "22"));
}

#[test]
fn register_refuses_a_commitment_that_is_not_32_bytes_of_lowercase_hex() {
    for bad in [&COMMITMENT[2..], &COMMITMENT.to_uppercase(), &format!("{COMMITMENT}00"), "", &COMMITMENT.replace('c', "x")] {
        let mut c = contract();
        let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| register(&mut c, "alice.testnet", bad)));
        assert!(r.is_err(), "{bad}");
    }
}

#[test]
fn a_lock_needs_no_registration() {
    let mut c = contract();
    register(&mut c, "alice.testnet", COMMITMENT);
    as_user("bob.testnet", NearToken::from_near(1));
    c.lock(RECIPIENT.to_string());
    assert_eq!(c.get_config().next_lock_id, U64(1));
}

#[test]
fn anyone_pays_the_fees_to_the_beneficiary() {
    let mut c = contract();
    register(&mut c, "alice.testnet", COMMITMENT);
    assert_eq!(c.get_config().beneficiary, account("fees.testnet"));
    as_user("carol.testnet", NearToken::from_yoctonear(0));
    let _ = c.pay_fees();
    assert!(c.get_config().fees_unpaid.is_zero());
}

#[test]
#[should_panic(expected = "no fees to pay")]
fn paying_fees_needs_fees() {
    let mut c = contract();
    as_user("carol.testnet", NearToken::from_yoctonear(0));
    let _ = c.pay_fees();
}

#[test]
fn a_failed_fee_payout_can_be_retried() {
    let mut c = contract();
    register(&mut c, "alice.testnet", COMMITMENT);
    let amount = c.get_config().fees_unpaid;
    as_user("carol.testnet", NearToken::from_yoctonear(0));
    let _ = c.pay_fees();
    testing_env!(builder(account("bridge.testnet"), SIGNER, 0).build());
    assert!(!c.on_fees_paid(amount, Err(PromiseError::Failed)));
    assert_eq!(c.get_config().fees_unpaid, amount);
}

#[test]
fn fees_do_not_count_as_locked_near() {
    let mut c = contract();
    register(&mut c, "alice.testnet", COMMITMENT);
    assert!(c.get_config().total_locked.is_zero());
    let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| release(&mut c, 0, NearToken::from_millinear(1))));
    assert!(r.is_err(), "a release was paid from fees");
}

const FED_OPS_POLICY: &str = "924a6b4c0becbd9d4506a91ecc7992e50008ec5051c7ea2e9219ee49";

fn mithril_certificate(json: &str) -> Certificate {
    mithril_light::aggregator::certificate(json).unwrap().0
}

fn mithril_init() -> MithrilInit {
    MithrilInit {
        certificate: mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1469-mit.json"))),
        token: TokenOutput { policy: FED_OPS_POLICY.into(), tx_hash: "709dc6ad2f4ff43d1eac965cb2241f44fb9786615959fa308cd597b1fabd5e18".into(), index: 4 },
        governance: vec![],
        security_depth: 0,
        genesis_key: None,
    }
}

// The genesis verification key of the Mithril network the certificates come from.
const MITHRIL_GENESIS_KEY: &str = "7f497ca1068983d5cf75c655b0c7a2f1447b77910de8f331e502f9cdcd27eb2c";

fn mithril_genesis_certificate() -> Certificate {
    mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1129-genesis.json")))
}

// A bridge whose Mithril chain stands in the epoch of the network's genesis certificate on
// another key, as after a break, and takes such certificates.
fn contract_at_mithril_genesis(genesis_key: Option<&str>) -> Contract {
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    let mut start = mithril_genesis_certificate();
    start.aggregate_verification_key.total_stake += 1;
    let init = MithrilInit { certificate: start, genesis_key: genesis_key.map(str::to_string), ..mithril_init() };
    Contract::new(NearToken::from_near(10), BRIDGE.into(), genesis(), Some(init), vec![], FEE, account("fees.testnet"))
}

#[test]
fn a_certificate_of_the_genesis_key_starts_the_mithril_chain_anew() {
    let mut c = contract_at_mithril_genesis(Some(MITHRIL_GENESIS_KEY));
    as_user("anyone.testnet", NearToken::from_near(1));
    let v = c.submit_mithril_certificate(mithril_genesis_certificate());
    assert_eq!(v.epoch, 1129);
    assert_eq!(v.genesis_key.as_deref(), Some(MITHRIL_GENESIS_KEY));
}

#[test]
#[should_panic(expected = "the chain already stands at this genesis certificate")]
fn a_genesis_certificate_is_taken_once() {
    let mut c = contract_at_mithril_genesis(Some(MITHRIL_GENESIS_KEY));
    as_user("anyone.testnet", NearToken::from_near(1));
    c.submit_mithril_certificate(mithril_genesis_certificate());
    c.submit_mithril_certificate(mithril_genesis_certificate());
}

#[test]
#[should_panic(expected = "BadSignature")]
fn without_a_genesis_key_no_genesis_certificate_is_taken() {
    let mut c = contract_at_mithril_genesis(None);
    as_user("anyone.testnet", NearToken::from_near(1));
    c.submit_mithril_certificate(mithril_genesis_certificate());
}

#[test]
#[should_panic(expected = "BadGenesisSignature")]
fn a_genesis_certificate_needs_the_pinned_key() {
    let mut c = contract_at_mithril_genesis(Some(&"11".repeat(32)));
    as_user("anyone.testnet", NearToken::from_near(1));
    c.submit_mithril_certificate(mithril_genesis_certificate());
}

#[test]
#[should_panic(expected = "the genesis certificate is older than the chain")]
fn a_genesis_certificate_does_not_take_the_chain_back() {
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    let init = MithrilInit { genesis_key: Some(MITHRIL_GENESIS_KEY.into()), ..mithril_init() };
    let mut c = Contract::new(NearToken::from_near(10), BRIDGE.into(), genesis(), Some(init), vec![], FEE, account("fees.testnet"));
    as_user("anyone.testnet", NearToken::from_near(1));
    c.submit_mithril_certificate(mithril_genesis_certificate());
}

#[test]
#[should_panic(expected = "the genesis key is 32 bytes of hex")]
fn a_genesis_key_of_another_length_is_refused() {
    contract_at_mithril_genesis(Some("7f49"));
}

fn contract_with_mithril() -> Contract {
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    Contract::new(NearToken::from_near(10), BRIDGE.into(), genesis(), Some(mithril_init()), vec![], FEE, account("fees.testnet"))
}

fn committee_update() -> (Certificate, CertifiedTransaction, Base64VecU8, Base64VecU8) {
    let proof: serde_json::Value = serde_json::from_str(include_str!(concat!("../../../crates/mithril-light/tests/data/", "proof-v2-3fad67d4.json"))).unwrap();
    let certified = &proof["certified_transactions"];
    let item = &certified["items"][0];
    let transaction = CertifiedTransaction {
        transaction_hash: item["transaction_hash"].as_str().unwrap().into(),
        block_number: item["block_number"].as_u64().unwrap(),
        slot_number: item["slot_number"].as_u64().unwrap(),
        block_hash: item["block_hash"].as_str().unwrap().into(),
    };
    let proof = Base64VecU8(hex::decode(certified["proof"].as_str().unwrap()).unwrap());
    let cbor = Base64VecU8(hex::decode(include_str!(concat!("../../../crates/mithril-light/tests/data/", "fedops-tx-3fad67d4.hex")).trim()).unwrap());
    (mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1471-car.json"))), transaction, proof, cbor)
}

#[test]
fn mithril_follows_the_committee_token() {
    let mut c = contract_with_mithril();
    assert_eq!(c.get_mithril().unwrap().epoch, 1469);
    as_user("anyone.testnet", NearToken::from_near(1));
    let v = c.submit_mithril_certificate(mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1470-mit.json"))));
    assert_eq!(v.epoch, 1470);
    let v = c.submit_mithril_certificate(mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1471-mit.json"))));
    assert_eq!(v.epoch, 1471);

    let (certificate, transaction, proof, cbor) = committee_update();
    let v = c.submit_committee_update(certificate, transaction, proof, cbor);
    assert_eq!((v.token.tx_hash.as_str(), v.token.index), ("3fad67d4cfd7edec4edbc069931137900b2b38d0c32dbedf54aa3ce30480ba4a", 2));
    // The datum on Cardano names exactly the genesis GRANDPA set Midnight runs with.
    assert!(!v.committee_change_pending);
    assert_eq!(c.get_mithril(), Some(v));
    assert!(get_logs().iter().any(|l| l.contains("committee_announced") && l.contains("\"pending\":false")));
}

// The recorded transaction of the committee token, parsed. It spends the output the bridge
// tracks and mints the token into its output 2.
fn token_mint() -> mithril_light::Transaction {
    mithril_light::parse_transaction(&committee_update().3 .0).unwrap()
}

// What it would be had it only moved the token: it mints nothing.
fn token_move() -> mithril_light::Transaction {
    let mut tx = token_mint();
    tx.minted.clear();
    tx
}

// What it would be had it burned the token: no output carries it.
fn token_burn() -> mithril_light::Transaction {
    let mut tx = token_move();
    tx.outputs[2].assets.clear();
    tx
}

#[test]
fn a_burned_token_is_followed_again_once_it_is_minted_anew() {
    let mut c = contract_with_mithril();
    let state = c.mithril.as_mut().unwrap();
    let start = state.view(false).token;
    assert_eq!(state.step(&token_burn(), 500), Ok(vec![]));
    let burned = state.view(false);
    assert_eq!((burned.token_burned_at, burned.token), (Some(500), start));

    // A spend of the burned output no longer counts, only a mint in that block or after it.
    assert_eq!(state.step(&token_move(), 600), Err("cardano: TokenNotMinted".to_string()));
    assert_eq!(state.step(&token_mint(), 499), Err("cardano: the mint is older than the burn of the token".to_string()));
    let candidates = state.step(&token_mint(), 500).unwrap();
    assert_eq!(candidates.len(), 7);
    let minted = state.view(false);
    assert_eq!((minted.token_burned_at, minted.token.tx_hash.as_str(), minted.token.index), (None, "3fad67d4cfd7edec4edbc069931137900b2b38d0c32dbedf54aa3ce30480ba4a", 2));
}

#[test]
fn a_mint_does_not_move_a_token_that_was_not_burned() {
    let mut c = contract_with_mithril();
    let state = c.mithril.as_mut().unwrap();
    // The mint spends the tracked output too, so it is followed as a move of the token.
    assert_eq!(state.step(&token_mint(), 500).unwrap().len(), 7);
    assert_eq!(state.view(false).token.index, 2);
    // Now the tracked output is another one, and a mint beside it is no update.
    assert_eq!(state.step(&token_mint(), 600), Err("cardano: OutpointNotSpent".to_string()));
}

#[test]
#[should_panic(expected = "EpochNotChained")]
fn mithril_refuses_a_certificate_that_skips_an_epoch() {
    let mut c = contract_with_mithril();
    as_user("anyone.testnet", NearToken::from_near(1));
    c.submit_mithril_certificate(mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1471-mit.json"))));
}

#[test]
#[should_panic(expected = "TransactionNotProven")]
fn mithril_refuses_a_proof_for_another_transaction() {
    let mut c = contract_with_mithril();
    as_user("anyone.testnet", NearToken::from_near(1));
    c.submit_mithril_certificate(mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1470-mit.json"))));
    c.submit_mithril_certificate(mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1471-mit.json"))));
    let (certificate, mut transaction, proof, cbor) = committee_update();
    transaction.block_number += 1;
    c.submit_committee_update(certificate, transaction, proof, cbor);
}

#[test]
#[should_panic(expected = "does not certify Cardano blocks")]
fn mithril_needs_a_block_certificate_for_an_update() {
    let mut c = contract_with_mithril();
    as_user("anyone.testnet", NearToken::from_near(1));
    let (_, transaction, proof, cbor) = committee_update();
    c.submit_committee_update(mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1470-mit.json"))), transaction, proof, cbor);
}

// ---- Governance on Cardano, depth and denominations

const PREVIEW_COUNCIL: [&str; 3] = [
    "84bd625dd66a0279ebee41cfbc5308e8b11864feb2a5c1b50ad6865d",
    "039366ac2f89dd182969c263f9a873d894803c80567196fa888be944",
    "b23e85fb7357c726c27574220963abf6e0eb5786a9cba2b423315fcb",
];

fn mithril_init_with(governance: Vec<GovernanceBody>, security_depth: u64) -> MithrilInit {
    MithrilInit { governance, security_depth, ..mithril_init() }
}

fn synced(mithril: MithrilInit) -> Contract {
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    let mut c = Contract::new(NearToken::from_near(10), BRIDGE.into(), genesis(), Some(mithril), vec![], FEE, account("fees.testnet"));
    as_user("anyone.testnet", NearToken::from_near(1));
    c.submit_mithril_certificate(mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1470-mit.json"))));
    c.submit_mithril_certificate(mithril_certificate(include_str!(concat!("../../../crates/mithril-light/tests/data/", "certificate-1471-mit.json"))));
    c
}

#[test]
#[should_panic(expected = "lacks the governance signatures")]
fn a_token_update_without_the_pinned_quorum_is_refused() {
    let council = GovernanceBody { keys: PREVIEW_COUNCIL.iter().map(|k| k.to_string()).collect(), threshold: 2 };
    let mut c = synced(mithril_init_with(vec![council], 0));
    // The genesis output was written by the deployer alone.
    let (certificate, transaction, proof, cbor) = committee_update();
    c.submit_committee_update(certificate, transaction, proof, cbor);
}

#[test]
fn a_deep_enough_update_passes_the_security_depth() {
    let mut c = synced(mithril_init_with(vec![], 432));
    let (certificate, transaction, proof, cbor) = committee_update();
    assert_eq!(c.submit_committee_update(certificate, transaction, proof, cbor).security_depth, 432);
}

#[test]
#[should_panic(expected = "not deep enough under the certified block")]
fn a_shallow_update_is_refused() {
    let mut c = synced(mithril_init_with(vec![], 1_000_000));
    let (certificate, transaction, proof, cbor) = committee_update();
    c.submit_committee_update(certificate, transaction, proof, cbor);
}

#[test]
#[should_panic(expected = "1 <= threshold <= keys")]
fn a_governance_body_needs_a_sound_quorum() {
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    let body = GovernanceBody { keys: PREVIEW_COUNCIL.iter().map(|k| k.to_string()).collect(), threshold: 4 };
    Contract::new(NearToken::from_near(10), BRIDGE.into(), genesis(), Some(mithril_init_with(vec![body], 0)), vec![], FEE, account("fees.testnet"));
}

#[test]
fn lock_takes_the_largest_denomination_the_deposit_covers() {
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    let denominations = vec![NearToken::from_millinear(100), NearToken::from_millinear(500), NearToken::from_near(1)];
    let mut c = Contract::new(NearToken::from_near(10), BRIDGE.into(), genesis(), None, denominations.clone(), FEE, account("fees.testnet"));
    open(&mut c);
    assert_eq!(c.get_config().denominations, denominations);
    as_user("alice.testnet", NearToken::from_millinear(510));
    c.lock(RECIPIENT.to_string());
    assert_eq!(c.get_lock(U64(0)).unwrap().amount, NearToken::from_millinear(500));
}

#[test]
#[should_panic(expected = "below the smallest denomination")]
fn lock_refuses_a_deposit_under_the_smallest_denomination() {
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    let mut c = Contract::new(NearToken::from_near(10), BRIDGE.into(), genesis(), None, vec![NearToken::from_millinear(500)], FEE, account("fees.testnet"));
    open(&mut c);
    as_user("alice.testnet", NearToken::from_millinear(300));
    c.lock(RECIPIENT.to_string());
}

// A burn on preview: block 61761, the last extrinsic. Its contract logs a burn in another
// layout than the bridge, so the burn tests put a rewritten transaction into that block.
const RECORDED_BRIDGE: &str = "18402a8adb36cc13b665022aabd0f4b77f1ab13d5a9aff78accad8104ba2ebe6";

fn recorded() -> serde_json::Value {
    let path = format!("{}/tests/fixtures/burn-tx.json", env!("CARGO_MANIFEST_DIR"));
    serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap()
}

// The recorded block around a transaction that the parser's tests rewrite from the recorded burn.
fn recorded_with(tx: &str) -> serde_json::Value {
    let path = format!("{}/../../crates/midnight-tx/tests/data/{tx}", env!("CARGO_MANIFEST_DIR"));
    rewritten::with_tx(&recorded(), &std::fs::read(path).unwrap(), |bytes| env::sha256_array(bytes))
}

/// The recorded block with the burn as the bridge logs it now: 0.1 wNEAR under the id 1d1d….
fn burn_tx() -> serde_json::Value {
    recorded_with("burn-tx-id.bin")
}

/// The recorded block with a call that made NEAR block 277,000,000 the Midnight bridge's head.
fn head_tx() -> serde_json::Value {
    recorded_with("head-tx.bin")
}

fn hexes(v: &serde_json::Value) -> Vec<Vec<u8>> {
    v.as_array().unwrap().iter().map(unhex_json).collect()
}

fn b64(v: Vec<Vec<u8>>) -> Vec<Base64VecU8> {
    v.into_iter().map(Base64VecU8).collect()
}

fn decode_header(bytes: &[u8]) -> midnight_grandpa::Header {
    codec::Decode::decode(&mut &bytes[..]).unwrap()
}

/// A bridge for the Midnight contract at `bridge` that can reach the burn of `burn_tx`.
fn at_the_recorded_burn_for(bridge: &str) -> (Contract, serde_json::Value) {
    at_the_recorded_burn_with(bridge, None)
}

/// As `at_the_recorded_burn_for`; the last header's finality comes with `upgrade_proof`.
fn at_the_recorded_burn_with(bridge: &str, upgrade_proof: Option<Vec<Base64VecU8>>) -> (Contract, serde_json::Value) {
    at_the_recorded_block(bridge, upgrade_proof, burn_tx())
}

/// A bridge for the Midnight contract at `bridge`, its light client in the set that finalizes
/// the last recorded header, and that header imported. Then the headers of `f` reach a
/// finalized block: its last header takes the place of the recorded one.
fn at_the_recorded_block(bridge: &str, upgrade_proof: Option<Vec<Base64VecU8>>, f: serde_json::Value) -> (Contract, serde_json::Value) {
    let recorded = recorded();
    let mut c = contract_for(bridge);
    let headers = hexes(&recorded["headers"]);
    let last = headers.last().unwrap();
    let j = &recorded["justified"];
    c.midnight = codec::Encode::encode(&midnight_grandpa::LightClient {
        set_id: j["set_id"].as_u64().unwrap(),
        authorities: codec::Decode::decode(&mut &unhex_json(&j["authorities"])[..]).unwrap(),
        finalized_hash: decode_header(last).parent_hash,
        finalized_number: decode_header(last).number - 1,
    });
    // The recording hands over to the same keys at that header, so they are the committee.
    c.midnight_committee = midnight::committee(&midnight::load(&c.midnight));
    as_user("carol.testnet", NearToken::from_millinear(10));
    c.submit_midnight_finality(vec![FinalityProof { header: Base64VecU8(last.clone()), justification: Base64VecU8(unhex_json(&j["justification"])) }], upgrade_proof);
    finalize(&mut c, &f);
    (c, f)
}

// Makes the last header of `f` the finalized block of its number.
fn finalize(c: &mut Contract, f: &serde_json::Value) {
    let last = hexes(&f["headers"]).pop().unwrap();
    c.finalized_hashes.insert(decode_header(&last).number, midnight_grandpa::header_hash(&last).0);
}

// A bridge at the recording as it is.
fn at_the_recording() -> (Contract, serde_json::Value) {
    at_the_recorded_block(RECORDED_BRIDGE, None, recorded())
}

fn at_the_recorded_burn() -> (Contract, serde_json::Value) {
    at_the_recorded_burn_for(RECORDED_BRIDGE)
}

/// The burn's place among the extrinsics of its block. The one before it is no Midnight transaction.
fn burn_at(f: &serde_json::Value) -> u32 {
    f["extrinsic_index"].as_u64().unwrap() as u32
}

fn extrinsic_proof(f: &serde_json::Value, index: u32) -> Vec<Base64VecU8> {
    b64(substrate_read_proof::extrinsic_proof(&hexes(&f["extrinsics"]), index).1)
}

fn prove_tx(c: &mut Contract, headers: Vec<Vec<u8>>, index: u32, extrinsic_proof: Vec<Base64VecU8>, state_proof: Vec<Base64VecU8>) -> ProvenBurn {
    as_user("carol.testnet", NearToken::from_millinear(10));
    let mut proven = c.prove_burn_tx(b64(headers), index, extrinsic_proof, state_proof, None, None);
    assert_eq!(proven.len(), 1);
    proven.remove(0)
}

fn prove_recorded_burn(c: &mut Contract, f: &serde_json::Value) -> ProvenBurn {
    prove_tx(c, hexes(&f["headers"]), burn_at(f), extrinsic_proof(f, burn_at(f)), b64(hexes(&f["state_proof"])))
}

// The id of the burn in `burn_tx`.
const RECORDED_BURN: u8 = 0x1d;

fn recorded_proven() -> ProvenBurn {
    ProvenBurn { near_recipient: "bob.lightsout.odatano.testnet".into(), amount: NearToken::from_millinear(100), block: 61761, paid: NOTHING }
}

// A state trie holding only these entries, and the nodes that prove all of them.
fn state_trie(entries: &[(&[u8], Vec<u8>)]) -> ([u8; 32], Vec<Base64VecU8>) {
    state_trie_reading(entries, &[])
}

// As `state_trie`; the proof also shows that the trie holds none of `absent`.
fn state_trie_reading(entries: &[(&[u8], Vec<u8>)], absent: &[&[u8]]) -> ([u8; 32], Vec<Base64VecU8>) {
    let (root, nodes) = rewritten::state_trie_reading(entries, absent);
    (root, b64(nodes))
}

/// The burn's block with `events` and `upgrade` as its state, finalized here as it is.
fn recorded_block_with_state(c: &mut Contract, f: &serde_json::Value, events: Vec<u8>, upgrade: Vec<u8>) -> (Vec<Vec<u8>>, Vec<Base64VecU8>) {
    let mut h = decode_header(&hexes(&f["headers"])[0]);
    let (root, proof) = state_trie(&[(&midnight::EVENTS_KEY, events), (&midnight::LAST_RUNTIME_UPGRADE_KEY, upgrade)]);
    h.state_root = root.into();
    let encoded = codec::Encode::encode(&h);
    c.finalized_hashes.insert(h.number, midnight_grandpa::header_hash(&encoded).0);
    (vec![encoded], proof)
}

fn recorded_events(f: &serde_json::Value) -> Vec<u8> {
    unhex_json(&f["storage_values"][0])
}

fn recorded_upgrade(f: &serde_json::Value) -> Vec<u8> {
    unhex_json(&f["storage_values"][1])
}

// Where the recorded events hold `TxApplied` of the burn: phase, pallet, variant, hash.
fn tx_applied_at(f: &serde_json::Value) -> usize {
    let mut record = vec![0, burn_at(f) as u8, 0, 0, 0, 5, 2];
    record.extend(unhex_json(&f["tx_sha256"]));
    recorded_events(f).windows(record.len()).position(|w| w == record).unwrap()
}

#[test]
fn the_fixture_reads_events_and_upgrade_under_their_keys() {
    let f = recorded();
    assert_eq!(hexes(&f["storage_keys"]), vec![midnight::EVENTS_KEY.to_vec(), midnight::LAST_RUNTIME_UPGRADE_KEY.to_vec()]);
    assert_eq!(midnight::runtime_spec(&recorded_upgrade(&f)), Ok(2001100));
}

#[test]
fn finality_stores_the_block_hash() {
    let (c, f) = at_the_recording();
    let j = &f["justified"];
    assert_eq!(c.get_finalized_hash(j["number"].as_u64().unwrap() as u32), Some(j["hash"].as_str().unwrap()[2..].to_string()));
}

#[test]
fn proves_and_releases_a_recorded_burn_from_its_transaction() {
    let (mut c, f) = at_the_recorded_burn();
    assert_eq!(hexes(&f["headers"]).len(), 15);
    let proven = prove_recorded_burn(&mut c, &f);
    assert_eq!(proven, recorded_proven());
    assert_eq!(c.get_proven_burn(burn_id(RECORDED_BURN)), Some(proven));
    let event = get_logs().pop().unwrap();
    assert!(event.contains("\"event\":\"burn_proven\"") && event.contains(&burn_id(RECORDED_BURN)), "{event}");
    lock(&mut c, 5);
    as_user("carol.testnet", NOTHING);
    let _ = c.release(burn_id(RECORDED_BURN));
    assert_eq!(c.get_config().total_released, NearToken::from_millinear(100));
    assert!(c.is_released(burn_id(RECORDED_BURN)));
}

// ---- A proof node too large for one call, staged in parts

// The state proof of `f` without the node that holds the events, and that node.
fn without_the_events(f: &serde_json::Value) -> (Vec<Base64VecU8>, Vec<u8>) {
    let events = recorded_events(f);
    let nodes = hexes(&f["state_proof"]);
    assert!(nodes.contains(&events));
    (b64(nodes.into_iter().filter(|node| *node != events).collect()), events)
}

fn stage(c: &mut Contract, who: &str, part: u32, bytes: &[u8]) {
    as_user(who, NearToken::from_near(1));
    c.stage(part, Base64VecU8(bytes.to_vec()));
}

fn is_staged(c: &Contract, who: &str, part: u32) -> bool {
    c.staged.contains_key(&(account(who), part))
}

// Proves the burn of `f` as `who`, with the events node taken from that account's staged parts.
fn prove_staged(c: &mut Contract, f: &serde_json::Value, who: &str, parts: u32) -> Vec<ProvenBurn> {
    let (state_proof, _) = without_the_events(f);
    as_user(who, NearToken::from_millinear(10));
    c.prove_burn_tx(b64(hexes(&f["headers"])), burn_at(f), extrinsic_proof(f, burn_at(f)), state_proof, None, Some(parts))
}

#[test]
fn a_burn_is_proven_with_its_events_staged_in_parts() {
    let (mut c, f) = at_the_recorded_burn();
    let (_, events) = without_the_events(&f);
    let (first, second) = events.split_at(events.len() / 2);
    stage(&mut c, "carol.testnet", 0, first);
    stage(&mut c, "carol.testnet", 1, second);
    assert!(is_staged(&c, "carol.testnet", 0) && is_staged(&c, "carol.testnet", 1));
    assert_eq!(prove_staged(&mut c, &f, "carol.testnet", 2), vec![recorded_proven()]);
    assert!(!is_staged(&c, "carol.testnet", 0) && !is_staged(&c, "carol.testnet", 1));
}

#[test]
#[should_panic(expected = "state proof: ")]
fn a_proof_without_its_events_node_is_refused() {
    let (mut c, f) = at_the_recorded_burn();
    prove_staged(&mut c, &f, "carol.testnet", 0);
}

#[test]
#[should_panic(expected = "part 1 is not staged")]
fn a_proof_takes_only_parts_that_are_staged() {
    let (mut c, f) = at_the_recorded_burn();
    let (_, events) = without_the_events(&f);
    stage(&mut c, "carol.testnet", 0, &events);
    prove_staged(&mut c, &f, "carol.testnet", 2);
}

#[test]
#[should_panic(expected = "part 0 is not staged")]
fn the_parts_of_another_account_are_not_taken() {
    let (mut c, f) = at_the_recorded_burn();
    let (_, events) = without_the_events(&f);
    stage(&mut c, "carol.testnet", 0, &events);
    prove_staged(&mut c, &f, "dave.testnet", 1);
}

#[test]
#[should_panic(expected = "stage the parts in order")]
fn a_part_needs_the_one_before_it() {
    let mut c = contract();
    stage(&mut c, "carol.testnet", 1, &[1, 2, 3]);
}

#[test]
#[should_panic(expected = "this part is staged")]
fn a_part_is_staged_once() {
    let mut c = contract();
    stage(&mut c, "carol.testnet", 0, &[1, 2, 3]);
    stage(&mut c, "carol.testnet", 0, &[4, 5, 6]);
}

#[test]
#[should_panic(expected = "an account stages 16 parts at most")]
fn an_account_stages_sixteen_parts_at_most() {
    let mut c = contract();
    for part in 0..17 {
        stage(&mut c, "carol.testnet", part, &[part as u8]);
    }
}

#[test]
#[should_panic(expected = "attach at least")]
fn a_part_needs_a_deposit_for_its_storage() {
    let mut c = contract();
    as_user("carol.testnet", NOTHING);
    c.stage(0, Base64VecU8(vec![7; 1000]));
}

#[test]
fn staged_parts_are_dropped_whole_and_only_the_callers() {
    let mut c = contract();
    stage(&mut c, "carol.testnet", 0, &[1; 100]);
    stage(&mut c, "carol.testnet", 1, &[2; 100]);
    stage(&mut c, "dave.testnet", 0, &[3; 100]);
    as_user("carol.testnet", NOTHING);
    c.drop_staged();
    assert!(!is_staged(&c, "carol.testnet", 0) && !is_staged(&c, "carol.testnet", 1));
    assert!(is_staged(&c, "dave.testnet", 0));
    // With nothing staged there is nothing to drop.
    c.drop_staged();
}

// ---- The NEAR head the Midnight bridge accepted, proven from the transaction that accepted it

fn prove_head(c: &mut Contract, f: &serde_json::Value) -> U64 {
    as_user("carol.testnet", NOTHING);
    c.prove_head_tx(b64(hexes(&f["headers"])), burn_at(f), extrinsic_proof(f, burn_at(f)), b64(hexes(&f["state_proof"])), None, None)
}

fn at_the_recorded_head() -> (Contract, serde_json::Value) {
    let (mut c, f) = at_the_recorded_block(RECORDED_BRIDGE, None, head_tx());
    c.accepted_head = None;
    (c, f)
}

#[test]
fn an_accepted_head_is_proven_from_its_transaction_and_opens_the_bridge() {
    let (mut c, f) = at_the_recorded_head();
    assert!(!c.get_runtime().locks_open);
    assert_eq!(prove_head(&mut c, &f), U64(277_000_000));
    assert!(get_logs().last().unwrap().contains("\"event\":\"head_proven\""));
    assert_eq!(c.get_runtime().accepted_head, Some(U64(277_000_000)));
    assert!(c.get_runtime().locks_open);
}

#[test]
#[should_panic(expected = "the bridge knows a head this high")]
fn a_head_no_higher_than_the_known_one_is_refused() {
    let (mut c, f) = at_the_recorded_head();
    prove_head(&mut c, &f);
    prove_head(&mut c, &f);
}

#[test]
#[should_panic(expected = "head transaction: NoHeadCall")]
fn a_burn_proves_no_head() {
    let (mut c, f) = at_the_recorded_burn();
    prove_head(&mut c, &f);
}

#[test]
#[should_panic(expected = "head transaction: NoHeadCall")]
fn a_head_of_another_midnight_contract_is_refused() {
    let (mut c, f) = at_the_recorded_block(BRIDGE, None, head_tx());
    prove_head(&mut c, &f);
}

#[test]
#[should_panic(expected = "burn transaction: NoBurnCall")]
fn an_accepted_head_proves_no_burn() {
    let (mut c, f) = at_the_recorded_head();
    prove_recorded_burn(&mut c, &f);
}

#[test]
#[should_panic(expected = "events: the transaction was not applied")]
fn a_head_of_a_transaction_that_was_not_applied_is_refused() {
    let (mut c, f) = at_the_recorded_head();
    let mut events = recorded_events(&f);
    events[tx_applied_at(&f) + 6] = 7;
    let (headers, state_proof) = recorded_block_with_state(&mut c, &f, events, recorded_upgrade(&f));
    as_user("carol.testnet", NOTHING);
    c.prove_head_tx(b64(headers), burn_at(&f), extrinsic_proof(&f, burn_at(&f)), state_proof, None, None);
}

#[test]
fn a_burn_in_a_finalized_block_needs_one_header() {
    let (mut c, f) = at_the_recorded_burn();
    let (headers, state_proof) = recorded_block_with_state(&mut c, &f, recorded_events(&f), recorded_upgrade(&f));
    assert_eq!(prove_tx(&mut c, headers, burn_at(&f), extrinsic_proof(&f, burn_at(&f)), state_proof), recorded_proven());
}

#[test]
fn a_kept_ancestor_brings_a_block_within_reach() {
    let (mut c, f) = at_the_recorded_burn();
    let headers = hexes(&f["headers"]);
    let first = decode_header(&headers[0]);
    assert_eq!(c.get_finalized_hash(first.number), None);
    as_user("carol.testnet", NearToken::from_millinear(10));
    c.keep_ancestor(b64(headers.clone()));
    assert_eq!(c.get_finalized_hash(first.number), Some(hex::encode(midnight_grandpa::header_hash(&headers[0]).0)));
    // The burn's block now needs no header but its own.
    let proven = prove_tx(&mut c, vec![headers[0].clone()], burn_at(&f), extrinsic_proof(&f, burn_at(&f)), b64(hexes(&f["state_proof"])));
    assert_eq!(proven, recorded_proven());
}

#[test]
#[should_panic(expected = "headers: a header is not the parent of the next")]
fn a_broken_header_link_is_refused() {
    let (mut c, f) = at_the_recorded_burn();
    let mut headers = hexes(&f["headers"]);
    let mut h = decode_header(&headers[10]);
    h.state_root.0[0] ^= 1;
    headers[10] = codec::Encode::encode(&h);
    prove_tx(&mut c, headers, burn_at(&f), extrinsic_proof(&f, burn_at(&f)), b64(hexes(&f["state_proof"])));
}

#[test]
#[should_panic(expected = "headers: the last header is not finalized here")]
fn headers_that_stop_short_of_a_finalized_block_are_refused() {
    let (mut c, f) = at_the_recorded_burn();
    let mut headers = hexes(&f["headers"]);
    headers.pop();
    prove_tx(&mut c, headers, burn_at(&f), extrinsic_proof(&f, burn_at(&f)), b64(hexes(&f["state_proof"])));
}

#[test]
#[should_panic(expected = "extrinsic proof: InvalidProof")]
fn a_proof_of_one_extrinsic_does_not_show_another() {
    let (mut c, f) = at_the_recorded_burn();
    prove_tx(&mut c, hexes(&f["headers"]), burn_at(&f) - 1, extrinsic_proof(&f, burn_at(&f)), b64(hexes(&f["state_proof"])));
}

#[test]
#[should_panic(expected = "extrinsic is not an unsigned Midnight.send_mn_transaction")]
fn another_extrinsic_of_the_block_is_not_a_burn() {
    let (mut c, f) = at_the_recorded_burn();
    prove_tx(&mut c, hexes(&f["headers"]), burn_at(&f) - 1, extrinsic_proof(&f, burn_at(&f) - 1), b64(hexes(&f["state_proof"])));
}

#[test]
#[should_panic(expected = "burn transaction: NoBurnCall")]
fn a_burn_of_another_midnight_contract_is_refused() {
    let (mut c, f) = at_the_recorded_burn_for(BRIDGE);
    prove_recorded_burn(&mut c, &f);
}

#[test]
#[should_panic(expected = "events: the transaction was not applied")]
fn tx_applied_of_another_extrinsic_is_refused() {
    let (mut c, f) = at_the_recorded_burn();
    let mut events = recorded_events(&f);
    events[tx_applied_at(&f) + 1] -= 1;
    let (headers, state_proof) = recorded_block_with_state(&mut c, &f, events, recorded_upgrade(&f));
    prove_tx(&mut c, headers, burn_at(&f), extrinsic_proof(&f, burn_at(&f)), state_proof);
}

#[test]
#[should_panic(expected = "events: the transaction was not applied")]
fn partial_success_is_refused() {
    let (mut c, f) = at_the_recorded_burn();
    let mut events = recorded_events(&f);
    events[tx_applied_at(&f) + 6] = 7;
    let (headers, state_proof) = recorded_block_with_state(&mut c, &f, events, recorded_upgrade(&f));
    prove_tx(&mut c, headers, burn_at(&f), extrinsic_proof(&f, burn_at(&f)), state_proof);
}

#[test]
#[should_panic(expected = "runtime 2001101: the bridge has no table for it")]
fn a_runtime_without_an_event_table_is_refused() {
    let (mut c, f) = at_the_recorded_burn();
    let upgrade = codec::Encode::encode(&(codec::Compact(2001101u32), "midnight".to_string()));
    let (headers, state_proof) = recorded_block_with_state(&mut c, &f, recorded_events(&f), upgrade);
    prove_tx(&mut c, headers, burn_at(&f), extrinsic_proof(&f, burn_at(&f)), state_proof);
}

#[test]
#[should_panic(expected = "events: TrailingBytes")]
fn events_with_leftover_bytes_are_refused() {
    let (mut c, f) = at_the_recorded_burn();
    let mut events = recorded_events(&f);
    events.push(0);
    let (headers, state_proof) = recorded_block_with_state(&mut c, &f, events, recorded_upgrade(&f));
    prove_tx(&mut c, headers, burn_at(&f), extrinsic_proof(&f, burn_at(&f)), state_proof);
}

#[test]
#[should_panic(expected = "state proof: InvalidProof")]
fn a_state_proof_of_another_block_is_refused() {
    let (mut c, f) = at_the_recorded_burn();
    // The same two values in a trie with one more entry.
    let (_, state_proof) = state_trie(&[(&midnight::EVENTS_KEY, recorded_events(&f)), (&midnight::LAST_RUNTIME_UPGRADE_KEY, recorded_upgrade(&f)), (&[1], vec![1])]);
    prove_tx(&mut c, hexes(&f["headers"]), burn_at(&f), extrinsic_proof(&f, burn_at(&f)), state_proof);
}

#[test]
#[should_panic(expected = "burn already proven")]
fn the_same_burn_is_proven_once() {
    let (mut c, f) = at_the_recorded_burn();
    prove_recorded_burn(&mut c, &f);
    prove_recorded_burn(&mut c, &f);
}

#[test]
fn the_midnight_transaction_is_read_from_a_bare_extrinsic_only() {
    let f = burn_tx();
    let x = &hexes(&f["extrinsics"])[burn_at(&f) as usize];
    let tx = midnight::midnight_tx(x, 5).unwrap();
    assert_eq!(tx, unhex_json(&f["tx"]));
    assert!(midnight::midnight_tx(x, 6).is_err());
    let mut longer = x.clone();
    longer.push(0);
    assert!(midnight::midnight_tx(&longer, 5).is_err());
    // The same call, signed: version 0x84.
    let mut body: Vec<u8> = codec::Decode::decode(&mut &x[..]).unwrap();
    body[0] = 0x84;
    assert!(midnight::midnight_tx(&codec::Encode::encode(&body), 5).is_err());
}

#[test]
fn the_recipient_drops_its_zero_padding() {
    let mut b = [0u8; 64];
    b[..11].copy_from_slice(b"bob.testnet");
    assert_eq!(midnight::recipient(&b), Ok("bob.testnet".to_string()));
    b[20] = 0xff;
    assert!(midnight::recipient(&b).is_err());
}

// Checks a file from `npm run make-init` before a deploy. It can never change after that:
// LIGHTSOUT_INIT=<path> cargo test --lib -- --ignored init_file
#[test]
#[ignore = "needs LIGHTSOUT_INIT"]
fn init_file_starts_a_contract() {
    let path = std::env::var("LIGHTSOUT_INIT").expect("LIGHTSOUT_INIT");
    let init: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
    let field = |name: &str| init[name].clone();
    let mithril: MithrilInit = serde_json::from_value(field("mithril")).unwrap();
    let epoch = mithril.certificate.epoch;
    as_user("owner.testnet", NearToken::from_yoctonear(0));
    let c = Contract::new(
        serde_json::from_value(field("daily_limit")).unwrap(),
        serde_json::from_value(field("midnight_bridge")).unwrap(),
        serde_json::from_value(field("midnight_genesis")).unwrap(),
        Some(mithril),
        serde_json::from_value(field("denominations")).unwrap(),
        serde_json::from_value(field("registration_fee")).unwrap(),
        serde_json::from_value(field("beneficiary")).unwrap(),
    );
    assert_eq!(c.get_mithril().unwrap().epoch, epoch);
    assert_eq!(c.get_midnight().finalized_number, 0);
}

// ---- Midnight's runtime: when the bridge takes new funds, and how it gets the table of a new version

/// The burn's block with this state, finalized here as it is, and a proof that reads the
/// entries and shows the `absent` keys missing.
fn block_with_state(c: &mut Contract, f: &serde_json::Value, entries: &[(&[u8], Vec<u8>)], absent: &[&[u8]]) -> (Vec<Vec<u8>>, Vec<Base64VecU8>) {
    let mut h = decode_header(&hexes(&f["headers"])[0]);
    let (root, proof) = state_trie_reading(entries, absent);
    h.state_root = root.into();
    let encoded = codec::Encode::encode(&h);
    c.finalized_hashes.insert(h.number, midnight_grandpa::header_hash(&encoded).0);
    (vec![encoded], proof)
}

// What `System::AuthorizedUpgrade` holds between the vote and the new runtime: a code hash and a flag.
fn authorized_upgrade() -> Vec<u8> {
    [vec![7u8; 32], vec![1]].concat()
}

fn check(c: &mut Contract, f: &serde_json::Value, authorized: bool) -> UpgradeCheck {
    let upgrade = (&midnight::LAST_RUNTIME_UPGRADE_KEY[..], recorded_upgrade(f));
    let (headers, proof) = if authorized {
        block_with_state(c, f, &[upgrade, (&midnight::AUTHORIZED_UPGRADE_KEY[..], authorized_upgrade())], &[])
    } else {
        block_with_state(c, f, &[upgrade], &[&midnight::AUTHORIZED_UPGRADE_KEY[..]])
    };
    as_user("anyone.testnet", NearToken::from_yoctonear(0));
    c.check_upgrade(b64(headers), proof)
}

#[test]
fn finality_takes_the_upgrade_check_of_its_newest_block() {
    let proof = b64(hexes(&recorded()["upgrade_proof"]));
    let (c, f) = at_the_recorded_burn_with(RECORDED_BRIDGE, Some(proof));
    let seen = c.get_runtime().upgrade.unwrap();
    assert_eq!((seen.block, seen.authorized), (f["justified"]["number"].as_u64().unwrap() as u32, false));
    assert!(c.get_runtime().locks_open);
}

#[test]
#[should_panic(expected = "upgrade proof: InvalidProof")]
fn an_upgrade_proof_of_another_block_is_refused() {
    let f = burn_tx();
    // The state proof of the burn's block does not open under the root of the last header.
    at_the_recorded_burn_with(RECORDED_BRIDGE, Some(b64(hexes(&f["state_proof"]))));
}

#[test]
fn the_recorded_headers_name_their_runtime() {
    let (c, _) = at_the_recorded_burn();
    assert_eq!(c.get_runtime().spec, 2001100);
    assert!(c.get_runtime().readable);
}

#[test]
fn a_check_that_finds_no_upgrade_opens_the_bridge() {
    let (mut c, f) = at_the_recorded_burn();
    c.upgrade_check = None;
    assert!(!c.get_runtime().locks_open);
    let seen = check(&mut c, &f, false);
    assert_eq!((seen.block, seen.authorized), (61761, false));
    assert!(c.get_runtime().locks_open);
    assert_eq!(c.get_runtime().upgrade, Some(seen));
    lock(&mut c, 1);
}

#[test]
#[should_panic(expected = "the bridge takes no new funds now")]
fn an_authorized_upgrade_closes_the_bridge() {
    let (mut c, f) = at_the_recorded_burn();
    assert!(check(&mut c, &f, true).authorized);
    assert!(!c.get_runtime().locks_open);
    lock(&mut c, 1);
}

#[test]
#[should_panic(expected = "the bridge takes no new funds now")]
fn an_authorized_upgrade_closes_registration_too() {
    let (mut c, f) = at_the_recorded_burn();
    check(&mut c, &f, true);
    register(&mut c, "alice.testnet", COMMITMENT);
}

// When Midnight built the burn's block, Unix milliseconds, from the slot its header logs.
fn built_ms(f: &serde_json::Value) -> u64 {
    midnight_grandpa::slot(&decode_header(&hexes(&f["headers"])[0])).unwrap() * 6000
}

#[test]
fn a_check_is_as_old_as_the_block_it_read() {
    let (mut c, f) = at_the_recorded_burn();
    c.upgrade_check = None;
    // The recorded burn's block was built on 2026-11-11 at 08:30:54 UTC.
    assert_eq!(built_ms(&f), 1_794_385_854_000);
    assert_eq!(check(&mut c, &f, false).at, U64(built_ms(&f) * 1_000_000));
    testing_env!(builder(account("alice.testnet"), SIGNER, built_ms(&f) + 59 * 60 * 1000).build());
    assert!(c.get_runtime().locks_open);
    testing_env!(builder(account("alice.testnet"), SIGNER, built_ms(&f) + 61 * 60 * 1000).build());
    assert!(!c.get_runtime().locks_open);
}

#[test]
fn a_check_of_an_old_block_does_not_open_the_bridge() {
    let (mut c, f) = at_the_recorded_burn();
    c.upgrade_check = None;
    let (headers, proof) = block_with_state(&mut c, &f, &[(&midnight::LAST_RUNTIME_UPGRADE_KEY[..], recorded_upgrade(&f))], &[&midnight::AUTHORIZED_UPGRADE_KEY[..]]);
    testing_env!(builder(account("anyone.testnet"), SIGNER, built_ms(&f) + 2 * 60 * 60 * 1000).build());
    assert!(!c.check_upgrade(b64(headers), proof).authorized);
    assert!(!c.get_runtime().locks_open);
}

#[test]
#[should_panic(expected = "the block logs no slot")]
fn a_block_without_a_slot_gives_no_check() {
    let (mut c, f) = at_the_recorded_burn();
    c.upgrade_check = None;
    let mut h = decode_header(&hexes(&f["headers"])[0]);
    let (root, proof) = state_trie_reading(&[(&midnight::LAST_RUNTIME_UPGRADE_KEY[..], recorded_upgrade(&f))], &[&midnight::AUTHORIZED_UPGRADE_KEY[..]]);
    h.state_root = root.into();
    h.digest.logs.clear();
    let encoded = codec::Encode::encode(&h);
    c.finalized_hashes.insert(h.number, midnight_grandpa::header_hash(&encoded).0);
    as_user("anyone.testnet", NearToken::from_yoctonear(0));
    c.check_upgrade(b64(vec![encoded]), proof);
}

#[test]
#[should_panic(expected = "a check of this block or a later one is recorded")]
fn a_check_of_the_same_block_is_not_taken_twice() {
    let (mut c, f) = at_the_recorded_burn();
    c.upgrade_check = None;
    check(&mut c, &f, true);
    check(&mut c, &f, false);
}

#[test]
fn a_runtime_without_a_table_closes_the_bridge() {
    let mut c = contract();
    c.runtime_spec = 2001101;
    assert!(!c.get_runtime().readable);
    assert!(!c.get_config().locks_open);
}

// The recorded burn block as the test block of a table: its headers, the burn's place and both proofs.
fn table_test(f: &serde_json::Value) -> (Vec<Base64VecU8>, u32, Vec<Base64VecU8>, Vec<Base64VecU8>) {
    (b64(hexes(&f["headers"])), burn_at(f), extrinsic_proof(f, burn_at(f)), b64(hexes(&f["state_proof"])))
}

fn shipped_table() -> Base64VecU8 {
    Base64VecU8(substrate_events::table(2001100).unwrap().to_vec())
}

// A bridge at the recording that has no table for the runtime of that block yet.
fn before_the_table() -> (Contract, serde_json::Value) {
    let (mut c, f) = at_the_recording();
    c.table_at.remove(&(2001100, 0));
    c.table_count.remove(&2001100);
    (c, f)
}

fn add_table(c: &mut Contract, table: Base64VecU8, test: (Vec<Base64VecU8>, u32, Vec<Base64VecU8>, Vec<Base64VecU8>)) {
    as_user("anyone.testnet", NearToken::from_near(1));
    c.add_runtime_table(table, test.0, test.1, test.2, test.3, None);
}

#[test]
fn a_table_that_reads_a_real_block_of_a_new_runtime_is_added() {
    let (mut c, f) = before_the_table();
    assert!(!c.get_runtime().readable);
    add_table(&mut c, shipped_table(), table_test(&f));
    assert_eq!(c.get_runtime_table(2001100, None), Some(shipped_table()));
    assert_eq!(c.get_runtime_table_count(2001100), 1);
    assert!(c.get_runtime().readable);
    assert!(get_logs().iter().any(|l| l.contains("runtime_table_added")));
    // With the table the bridge reads a burn of that runtime.
    let burn = burn_tx();
    finalize(&mut c, &burn);
    assert_eq!(prove_recorded_burn(&mut c, &burn), recorded_proven());
}

#[test]
#[should_panic(expected = "runtime 2001100: the bridge has no table for it")]
fn no_burn_is_proven_in_a_runtime_without_a_table() {
    let (mut c, f) = before_the_table();
    prove_recorded_burn(&mut c, &f);
}

#[test]
#[should_panic(expected = "the bridge has this table for this runtime")]
fn the_same_table_is_not_added_twice() {
    let (mut c, f) = at_the_recorded_burn();
    add_table(&mut c, shipped_table(), table_test(&f));
}

#[test]
fn a_version_gets_its_table_after_a_newer_one_has_one() {
    let (mut c, f) = before_the_table();
    c.table_count.insert(2001200, 1);
    add_table(&mut c, shipped_table(), table_test(&f));
    assert_eq!(c.get_runtime_table_count(2001100), 1);
}

#[test]
fn a_wrong_table_stands_beside_the_right_one() {
    let (mut c, f) = at_the_recorded_burn();
    // The first table of the version cannot read its blocks; the shipped one comes second.
    let shipped = c.table_at.get(&(2001100, 0)).copied().unwrap();
    let wrong = env::sha256_array(&[1, 2, 3]);
    c.runtime_tables.insert(wrong, vec![1, 2, 3]);
    c.table_at.insert((2001100, 0), wrong);
    c.table_at.insert((2001100, 1), shipped);
    c.table_count.insert(2001100, 2);
    as_user("carol.testnet", NearToken::from_millinear(10));
    let headers = || b64(hexes(&f["headers"]));
    let proofs = || (extrinsic_proof(&f, burn_at(&f)), b64(hexes(&f["state_proof"])));
    let (extrinsic, state) = proofs();
    let first = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| c.prove_burn_tx(headers(), burn_at(&f), extrinsic, state, None, None)));
    assert!(first.is_err());
    let (extrinsic, state) = proofs();
    assert_eq!(c.prove_burn_tx(headers(), burn_at(&f), extrinsic, state, Some(1), None), vec![recorded_proven()]);
}

#[test]
#[should_panic(expected = "extrinsic is not an unsigned Midnight.send_mn_transaction")]
fn a_table_must_prove_itself_on_a_midnight_transaction() {
    let (mut c, f) = before_the_table();
    let (headers, at, _, state_proof) = table_test(&f);
    add_table(&mut c, shipped_table(), (headers, at - 1, extrinsic_proof(&f, at - 1), state_proof));
}

#[test]
#[should_panic(expected = "the table does not find the transaction applied")]
fn a_table_must_find_its_test_transaction_applied() {
    let (mut c, f) = before_the_table();
    // The same record as partial success: the next variant with the same content.
    let mut events = recorded_events(&f);
    events[tx_applied_at(&f) + 6] = 7;
    let (headers, state_proof) = recorded_block_with_state(&mut c, &f, events, recorded_upgrade(&f));
    add_table(&mut c, shipped_table(), (b64(headers), burn_at(&f), extrinsic_proof(&f, burn_at(&f)), state_proof));
}

#[test]
#[should_panic(expected = "table: BadTable")]
fn bytes_that_are_no_table_are_refused() {
    let (mut c, f) = before_the_table();
    add_table(&mut c, Base64VecU8(vec![1, 2, 3]), table_test(&f));
}

