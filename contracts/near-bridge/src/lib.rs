mod midnight;
mod mithril;

pub use midnight::{FinalityProof, MidnightGenesis, MidnightView, RuntimeView, UpgradeCheck};
pub use mithril::{GovernanceBody, MithrilInit, MithrilView, TokenOutput};
use bech32::primitives::decode::CheckedHrpstring;
use bech32::Bech32m;
use mithril_light::{Certificate, CertifiedTransaction};
use near_sdk::json_types::{Base64VecU8, U64};
use near_sdk::store::LookupMap;
use near_sdk::{
    env, near, require, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise,
    PromiseError,
};

const NANOS_PER_DAY: u64 = 86_400_000_000_000;
const MAX_ADDRESS_LEN: usize = 256;
const MIDNIGHT_SHIELDED_PREFIX: &str = "mn_shield-addr_";
const MIDNIGHT_DUST_PREFIX: &str = "mn_dust";
// A dust address holds one SCALE-encoded number of at most 33 bytes.
const MAX_DUST_KEY_LEN: usize = 33;
// A callback loads and writes the whole contract state, which grows with Midnight's authority set.
const CALLBACK_GAS: Gas = Gas::from_tgas(30);
// A registration's record stays below this many bytes, and the fee must pay for them.
const MAX_REGISTRATION_BYTES: u64 = 1000;
const CLOSED: &str = "the bridge takes no new funds now: get_runtime tells why";
// Midnight amounts are Uint<64>, so locks count in micro-NEAR. The remainder stays in the contract.
const UNIT_YOCTO: u128 = 1_000_000_000_000_000_000;
// 16 blocks with set changes burn about 30 Tgas on testnet nearcore, far below the 300 Tgas limit.
const MAX_FINALITY_BLOCKS: usize = 16;
// How many headers one call links to a stored block. `keep_ancestor` stores one further back.
const MAX_BURN_HEADERS: usize = 300;
// The member tree of the Midnight bridge has 16 levels, so it holds this many registrations.
const MAX_REGISTRATIONS: u64 = 1 << 16;
// New funds enter only while a check this recent found no new Midnight runtime authorized.
const MAX_UPGRADE_CHECK_AGE_NS: u64 = 3_600_000_000_000;
// New funds enter only while the Midnight bridge made a NEAR block this recent its head: about one NEAR epoch.
const MAX_HEAD_AGE_BLOCKS: u64 = 43_200;
// The most parts one account stages. A part is as large as a NEAR transaction can carry.
const MAX_STAGED_PARTS: u32 = 16;

#[near]
#[derive(BorshStorageKey)]
enum StorageKey {
    Locks,
    ProvenBurns,
    Registrations,
    Registered,
    FinalizedHashes,
    RuntimeTables,
    Announced,
    TableAt,
    TableCount,
    Staged,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Lock {
    pub sender: AccountId,
    pub amount: NearToken,
    pub midnight_recipient: String,
    /// The NEAR block the lock ran in. Its proof needs a later block as the light client's head.
    pub block_height: U64,
}

/// A burn read from its Midnight transaction in a finalized block.
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub struct ProvenBurn {
    pub near_recipient: String,
    pub amount: NearToken,
    /// The Midnight block that holds the burn's transaction.
    pub block: u32,
    /// How much of the amount is paid out or on its way.
    pub paid: NearToken,
}

/// An account that paid the fee, with the commitment the board on Midnight knows it by.
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub struct Registration {
    pub index: U64,
    /// 32 bytes, hex.
    pub commitment: String,
    /// Where the account collects dust on Midnight, for whoever sponsors its fees.
    pub dust_address: String,
    /// The point messages on the board are sealed for: x then y, 32 bytes each, hex.
    pub message_key: String,
    /// The NEAR block the registration ran in. Its proof needs a later block as the light client's head.
    pub block_height: U64,
}

#[near(serializers = [json])]
pub struct Config {
    pub daily_limit: NearToken,
    pub locked_today: NearToken,
    pub released_today: NearToken,
    pub total_locked: NearToken,
    pub total_released: NearToken,
    pub next_lock_id: U64,
    /// Whether `lock` and `register` take new funds now. `get_runtime` says why not.
    pub locks_open: bool,
    /// Address of the Midnight bridge contract, hex.
    pub midnight_bridge: String,
    /// The only amounts `lock` takes; empty = any whole micro-NEAR amount.
    pub denominations: Vec<NearToken>,
    pub registration_fee: NearToken,
    /// The account `pay_fees` pays to.
    pub beneficiary: AccountId,
    pub registered: U64,
    pub fees_unpaid: NearToken,
}

#[near(event_json(standard = "lightsout_bridge"))]
pub enum BridgeEvent {
    #[event_version("1.0.0")]
    Lock {
        lock_id: U64,
        sender: AccountId,
        amount: NearToken,
        midnight_recipient: String,
    },
    #[event_version("1.0.0")]
    Release {
        burn_id: String,
        recipient: AccountId,
        amount: NearToken,
    },
    #[event_version("1.0.0")]
    ReleaseFailed { burn_id: String, amount: NearToken },
    #[event_version("1.0.0")]
    MidnightFinalized { number: u32, hash: String, set_id: u64 },
    #[event_version("1.0.0")]
    AncestorKept { number: u32, hash: String },
    #[event_version("1.0.0")]
    CommitteeAnnounced { tx_hash: String, keys: u32, pending: bool },
    #[event_version("1.0.0")]
    BurnProven { burn_id: String, near_recipient: String, amount: NearToken },
    #[event_version("1.0.0")]
    HeadProven { height: U64 },
    #[event_version("1.0.0")]
    RuntimeTableAdded { spec: u32, table: u32, block: u32 },
    #[event_version("1.0.0")]
    Register { index: U64, account: AccountId, commitment: String, dust_address: String, message_key: String },
}

/// Locks NEAR for a shielded token on Midnight and releases NEAR when that token is burned.
/// No committee stands in between. The Midnight bridge mints for a lock it proved from NEAR's finality,
/// and a release needs the burn proven from Midnight's finality. Anyone can submit either proof.
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    daily_limit: NearToken,
    window_day: u64,
    locked_today: NearToken,
    released_today: NearToken,
    // Released NEAR never exceeds what was locked.
    total_locked: NearToken,
    total_released: NearToken,
    next_lock_id: u64,
    locks: LookupMap<u64, Lock>,
    /// Address of the Midnight bridge contract, hex. Its burns are the only ones paid out.
    midnight_bridge: String,
    /// SCALE-encoded GRANDPA light client of the Midnight chain.
    midnight: Vec<u8>,
    /// The keys that may hold a seat in Midnight's authority set, in canonical form: those of the
    /// genesis set, later those of an announced committee. No other key finalizes a block here.
    midnight_committee: Vec<u8>,
    /// The committees Cardano announced since, proven through Mithril, by their place in line. A
    /// set with a key that only one of them names moves the bridge to it and drops the older ones.
    announced: LookupMap<u64, Vec<u8>>,
    /// The place of the oldest announced committee, and the place the next one gets.
    announced_from: u64,
    announced_to: u64,
    /// The Mithril chain and the token output on Cardano that names the committee.
    /// None keeps the genesis committee for good.
    mithril: Option<mithril::MithrilState>,
    /// The spec version of the runtime that built the newest finalized block; 0 = its header logs none.
    runtime_spec: u32,
    /// The newest check for an authorized runtime upgrade on Midnight.
    upgrade_check: Option<UpgradeCheck>,
    /// The tables that read `System::Events`, by the SHA-256 of their bytes.
    runtime_tables: LookupMap<[u8; 32], Vec<u8>>,
    /// The hash of each table of a runtime version, by version and place. A version can have
    /// several, so a wrong table stands beside the right one and blocks nothing.
    table_at: LookupMap<(u32, u32), [u8; 32]>,
    /// How many tables a runtime version has.
    table_count: LookupMap<u32, u32>,
    /// Hashes of the Midnight blocks the light client finalized, by block number.
    finalized_hashes: LookupMap<u32, [u8; 32]>,
    /// Proven burns by burn id, the hash of the burned coin.
    proven_burns: LookupMap<[u8; 32], ProvenBurn>,
    /// The highest NEAR block the Midnight bridge is proven to have made its head; None = no proof yet.
    accepted_head: Option<u64>,
    registration_fee: NearToken,
    beneficiary: AccountId,
    registrations: LookupMap<AccountId, Registration>,
    /// The registered accounts by index.
    registered: LookupMap<u64, AccountId>,
    next_registration: u64,
    /// Fees taken and not yet paid to the beneficiary.
    fees_unpaid: NearToken,
    /// The only amounts `lock` takes, so mints and burns cannot be matched by amount. Empty = any.
    denominations: Vec<NearToken>,
    /// Who locked or registered last, and in which block.
    last_entry: Option<(AccountId, u64)>,
    /// Parts of a proof node too large for one call, by the account that staged them and their place.
    staged: LookupMap<(AccountId, u32), Vec<u8>>,
}

#[near]
impl Contract {
    /// Nothing here has a setter and no account has a special right. Deploy to an account
    /// without keys.
    #[init]
    pub fn new(
        daily_limit: NearToken,
        midnight_bridge: String,
        midnight_genesis: MidnightGenesis,
        mithril: Option<MithrilInit>,
        denominations: Vec<NearToken>,
        registration_fee: NearToken,
        beneficiary: AccountId,
    ) -> Self {
        require!(midnight_bridge == midnight_bridge.to_lowercase(), "midnight_bridge is lowercase hex");
        midnight::unhex32("midnight_bridge", &midnight_bridge).unwrap_or_else(|e| env::panic_str(&e));
        let midnight = midnight::start(midnight_genesis).unwrap_or_else(|e| env::panic_str(&e));
        let midnight_committee = midnight::committee(&midnight::load(&midnight));
        let mithril = mithril.map(|m| mithril::MithrilState::start(m).unwrap_or_else(|e| env::panic_str(&e)));
        require!(denominations.iter().all(|d| d.as_yoctonear() > 0 && d.as_yoctonear() % UNIT_YOCTO == 0), "denominations are whole micro-NEAR");
        require!(registration_fee >= env::storage_byte_cost().saturating_mul(MAX_REGISTRATION_BYTES.into()), "the registration fee does not cover a record's storage");
        let mut runtime_tables = LookupMap::new(StorageKey::RuntimeTables);
        let mut table_at = LookupMap::new(StorageKey::TableAt);
        let mut table_count = LookupMap::new(StorageKey::TableCount);
        for (spec, table) in substrate_events::TABLES {
            let hash = env::sha256_array(table);
            runtime_tables.insert(hash, table.to_vec());
            table_at.insert((*spec, 0), hash);
            table_count.insert(*spec, 1);
        }
        Self {
            daily_limit,
            window_day: current_day(),
            locked_today: NearToken::from_yoctonear(0),
            released_today: NearToken::from_yoctonear(0),
            total_locked: NearToken::from_yoctonear(0),
            total_released: NearToken::from_yoctonear(0),
            next_lock_id: 0,
            locks: LookupMap::new(StorageKey::Locks),
            midnight_bridge,
            midnight,
            midnight_committee,
            announced: LookupMap::new(StorageKey::Announced),
            announced_from: 0,
            announced_to: 0,
            mithril,
            runtime_spec: 0,
            upgrade_check: None,
            runtime_tables,
            table_at,
            table_count,
            finalized_hashes: LookupMap::new(StorageKey::FinalizedHashes),
            proven_burns: LookupMap::new(StorageKey::ProvenBurns),
            accepted_head: None,
            registration_fee,
            beneficiary,
            registrations: LookupMap::new(StorageKey::Registrations),
            registered: LookupMap::new(StorageKey::Registered),
            next_registration: 0,
            fees_unpaid: NearToken::from_yoctonear(0),
            denominations,
            last_entry: None,
            staged: LookupMap::new(StorageKey::Staged),
        }
    }

    /// Advances the Midnight light client. Each header needs a justification of the current
    /// authority set, so set changes must come in order. `upgrade_proof` is the check of
    /// `check_upgrade` for the last block. The deposit pays for the stored block hashes.
    #[payable]
    pub fn submit_midnight_finality(&mut self, blocks: Vec<FinalityProof>, upgrade_proof: Option<Vec<Base64VecU8>>) {
        require!(!blocks.is_empty() && blocks.len() <= MAX_FINALITY_BLOCKS, "submit 1 to 16 blocks");
        let storage_before = env::storage_usage();
        let mut client = midnight::load(&self.midnight);
        let mut newest = None;
        for b in blocks {
            let f = client
                .import(&b.header.0, &b.justification.0, &midnight::NearSig)
                .unwrap_or_else(|e| env::panic_str(&format!("finality: {e:?}")));
            if f.new_set_id.is_some() {
                let set = midnight::committee(&client);
                if !midnight::within(&set, &self.midnight_committee) {
                    let at = (self.announced_from..self.announced_to).find(|place| self.announced.get(place).is_some_and(|c| midnight::within(&set, c)));
                    let at = at.unwrap_or_else(|| env::panic_str("finality: the new authority set has a key no announced committee names"));
                    for place in self.announced_from..at {
                        self.announced.remove(&place);
                    }
                    self.midnight_committee = self.announced.remove(&at).unwrap();
                    self.announced_from = at + 1;
                }
            }
            self.finalized_hashes.insert(f.number, f.hash.0);
            BridgeEvent::MidnightFinalized { number: f.number, hash: hex::encode(f.hash.0), set_id: client.set_id }.emit();
            newest = Some(f);
        }
        self.midnight = codec::Encode::encode(&client);
        self.finalized_hashes.flush();
        self.charge_storage(storage_before);
        let newest = newest.unwrap();
        self.runtime_spec = newest.runtime.unwrap_or(0);
        if let Some(proof) = upgrade_proof {
            self.record_upgrade_check(newest.number, newest.state_root.0, newest.slot, proof);
        }
    }

    /// Stores the hash of a block that `headers` link to one stored here. It is final, being an
    /// ancestor of a final block. Burns in the 300 blocks before it are then within reach again.
    /// Anyone can call this; the deposit pays for the stored hash.
    #[payable]
    pub fn keep_ancestor(&mut self, headers: Vec<Base64VecU8>) {
        let storage_before = env::storage_usage();
        let block = self.finalized_ancestor(headers);
        let hash = midnight_grandpa::header_hash(&codec::Encode::encode(&block)).0;
        self.finalized_hashes.insert(block.number, hash);
        self.finalized_hashes.flush();
        BridgeEvent::AncestorKept { number: block.number, hash: hex::encode(hash) }.emit();
        self.charge_storage(storage_before);
    }

    /// Records whether Midnight had authorized a new runtime at a block finalized here: from the
    /// vote for it until it is applied, `System::AuthorizedUpgrade` is set. `headers` run from
    /// the block to one finalized here. Anyone can call this.
    pub fn check_upgrade(&mut self, headers: Vec<Base64VecU8>, state_proof: Vec<Base64VecU8>) -> UpgradeCheck {
        let block = self.finalized_ancestor(headers);
        self.record_upgrade_check(block.number, block.state_root.0, midnight_grandpa::slot(&block), state_proof)
    }

    /// Keeps one part of a proof node that is too large for one call: a full block's events.
    /// The caller's next proof takes its parts 0 to `staged` as one node of its state proof. The
    /// deposit pays the part's storage and comes back with that proof or with `drop_staged`.
    #[payable]
    pub fn stage(&mut self, part: u32, bytes: Base64VecU8) {
        let storage_before = env::storage_usage();
        let caller = env::predecessor_account_id();
        require!(part < MAX_STAGED_PARTS, "an account stages 16 parts at most");
        require!(part == 0 || self.staged.contains_key(&(caller.clone(), part - 1)), "stage the parts in order");
        require!(!self.staged.contains_key(&(caller.clone(), part)), "this part is staged: drop the parts first");
        self.staged.insert((caller, part), bytes.0);
        self.staged.flush();
        self.charge_storage(storage_before);
    }

    /// Removes the caller's staged parts unused and pays back what their storage cost.
    pub fn drop_staged(&mut self) {
        let caller = env::predecessor_account_id();
        let parts = (0..MAX_STAGED_PARTS).take_while(|part| self.staged.contains_key(&(caller.clone(), *part))).count();
        self.take_staged(parts as u32);
    }

    /// Adds a table that reads the events of a runtime version. The table must prove itself on
    /// a finalized block of that version: `extrinsic_index` is a Midnight transaction there, and
    /// the table reads the block's events and finds it applied. A version takes any number.
    #[payable]
    pub fn add_runtime_table(&mut self, table: Base64VecU8, headers: Vec<Base64VecU8>, extrinsic_index: u32, extrinsic_proof: Vec<Base64VecU8>, state_proof: Vec<Base64VecU8>, staged: Option<u32>) {
        let node = staged.map(|parts| self.take_staged(parts));
        let storage_before = env::storage_usage();
        let block = self.finalized_ancestor(headers);
        let (events, spec) = self.events_and_runtime(&block, state_proof, node);
        let hash = env::sha256_array(&table.0);
        let count = self.table_count.get(&spec).copied().unwrap_or(0);
        require!((0..count).all(|place| self.table_at.get(&(spec, place)) != Some(&hash)), "the bridge has this table for this runtime");
        let pallet = substrate_events::midnight_pallet_of(&table.0).unwrap_or_else(|e| env::panic_str(&format!("table: {e:?}")));
        let proof = extrinsic_proof.into_iter().map(|p| p.0).collect();
        let extrinsic = substrate_read_proof::read_value(block.extrinsics_root.0, proof, &substrate_read_proof::extrinsic_key(extrinsic_index))
            .unwrap_or_else(|e| env::panic_str(&format!("extrinsic proof: {e:?}")))
            .unwrap_or_else(|| env::panic_str("extrinsic proof: the block has no such extrinsic"));
        let tx = midnight::midnight_tx(&extrinsic, pallet).unwrap_or_else(|e| env::panic_str(&e));
        midnight_tx::calls(&tx).unwrap_or_else(|e| env::panic_str(&format!("transaction: {e:?}")));
        let applied = substrate_events::applied_with(&table.0, &events, extrinsic_index, env::sha256_array(&tx))
            .unwrap_or_else(|e| env::panic_str(&format!("events: {e:?}")));
        require!(applied, "events: the table does not find the transaction applied");
        self.runtime_tables.insert(hash, table.0);
        self.table_at.insert((spec, count), hash);
        self.table_count.insert(spec, count + 1);
        self.runtime_tables.flush();
        self.table_at.flush();
        self.table_count.flush();
        BridgeEvent::RuntimeTableAdded { spec, table: count, block: block.number }.emit();
        self.charge_storage(storage_before);
    }

    /// Advances the Mithril chain by one certificate: every epoch needs at least one, the first
    /// of an epoch carries the keys its predecessor announced. Anyone can call this.
    #[payable]
    pub fn submit_mithril_certificate(&mut self, certificate: Certificate) -> MithrilView {
        let storage_before = env::storage_usage();
        let mut mithril = self.mithril.clone().unwrap_or_else(|| env::panic_str("this bridge does not follow Mithril"));
        mithril.accept(&certificate).unwrap_or_else(|e| env::panic_str(&e));
        self.mithril = Some(mithril);
        self.charge_storage(storage_before);
        self.mithril.as_ref().unwrap().view(self.committee_change_pending())
    }

    /// Follows the committee token on Cardano: `certificate` certifies `transaction`, whose
    /// `tx_cbor` moves the token to its next output, burns it, or mints it anew after a burn. The
    /// GRANDPA keys in the new output's datum become the committee Midnight may switch to.
    #[payable]
    pub fn submit_committee_update(&mut self, certificate: Certificate, transaction: CertifiedTransaction, proof: Base64VecU8, tx_cbor: Base64VecU8) -> MithrilView {
        let storage_before = env::storage_usage();
        let mut mithril = self.mithril.clone().unwrap_or_else(|| env::panic_str("this bridge does not follow Mithril"));
        mithril.accept(&certificate).unwrap_or_else(|e| env::panic_str(&e));
        let candidates = mithril.follow_token(&certificate, &transaction, &proof.0, &tx_cbor.0).unwrap_or_else(|e| env::panic_str(&e));
        let committee = mithril::committee_of(&candidates);
        // Midnight switches some time after Cardano, and Cardano can change again before it does.
        // A datum the bridge cannot read names no keys; then only the token is followed.
        if !candidates.is_empty() && self.newest_announced().unwrap_or(&self.midnight_committee) != &committee {
            self.announced.insert(self.announced_to, committee);
            self.announced_to += 1;
            self.announced.flush();
        }
        let pending = self.committee_change_pending();
        BridgeEvent::CommitteeAnnounced {
            tx_hash: transaction.transaction_hash.clone(),
            // The keys are in the transaction. All of them could exceed what a call may log.
            keys: candidates.len() as u32,
            pending,
        }
        .emit();
        self.mithril = Some(mithril);
        self.charge_storage(storage_before);
        self.mithril.as_ref().unwrap().view(pending)
    }

    /// Records every burn of a Midnight transaction. `headers` link its block to one finalized
    /// here, and the proofs show the transaction in it and the block's events and runtime version.
    /// `table` is the place of the table to read the events with; without it the version's first.
    #[payable]
    pub fn prove_burn_tx(&mut self, headers: Vec<Base64VecU8>, extrinsic_index: u32, extrinsic_proof: Vec<Base64VecU8>, state_proof: Vec<Base64VecU8>, table: Option<u32>, staged: Option<u32>) -> Vec<ProvenBurn> {
        let node = staged.map(|parts| self.take_staged(parts));
        let storage_before = env::storage_usage();
        let (tx, block) = self.applied_tx(headers, extrinsic_index, extrinsic_proof, state_proof, node, table);
        let logs = midnight_tx::bridge_burn_logs(&tx, self.bridge_address()).unwrap_or_else(|e| env::panic_str(&format!("burn transaction: {e:?}")));
        let mut proven = Vec::new();
        for log in logs {
            let near_recipient = midnight::recipient(&log.near_recipient).unwrap_or_else(|e| env::panic_str(&e));
            proven.push(self.record_burn(log.id, near_recipient, log.value, block));
        }
        self.proven_burns.flush();
        self.charge_storage(storage_before);
        proven
    }

    /// Records the highest NEAR block that the Midnight bridge made its head in a Midnight
    /// transaction, proven as a burn is. `lock` and `register` take funds only while that block
    /// is recent, so they stop when Midnight no longer follows NEAR. Anyone can call this.
    pub fn prove_head_tx(&mut self, headers: Vec<Base64VecU8>, extrinsic_index: u32, extrinsic_proof: Vec<Base64VecU8>, state_proof: Vec<Base64VecU8>, table: Option<u32>, staged: Option<u32>) -> U64 {
        let node = staged.map(|parts| self.take_staged(parts));
        let (tx, _) = self.applied_tx(headers, extrinsic_index, extrinsic_proof, state_proof, node, table);
        let heights = midnight_tx::bridge_head_logs(&tx, self.bridge_address()).unwrap_or_else(|e| env::panic_str(&format!("head transaction: {e:?}")));
        let height = heights.into_iter().max().unwrap();
        require!(self.accepted_head.is_none_or(|known| height > known), "the bridge knows a head this high");
        self.accepted_head = Some(height);
        BridgeEvent::HeadProven { height: U64(height) }.emit();
        U64(height)
    }

    /// Registers the caller for the board on Midnight. Takes exactly the fee and logs the
    /// commitment in one line of fixed length, which the Midnight bridge proves. The call returns
    /// nothing, so its outcome has a fixed shape.
    #[payable]
    pub fn register(&mut self, commitment: String, dust_address: String, message_key: String) {
        let account = env::predecessor_account_id();
        require!(self.locks_open(), CLOSED);
        self.alone_in_its_transaction();
        require!(self.next_registration < MAX_REGISTRATIONS, "the member tree of the Midnight bridge is full");
        require!(env::attached_deposit() == self.registration_fee, format!("attach exactly {}", self.registration_fee));
        require!(!self.registrations.contains_key(&account), "this account is registered");
        require!(commitment == commitment.to_lowercase(), "commitment is lowercase hex");
        let bytes = midnight::unhex32("commitment", &commitment).unwrap_or_else(|e| env::panic_str(&e));
        require!(is_dust_address(&dust_address), "dust_address must be a Midnight dust address");
        require!(
            message_key.len() == 128 && message_key == message_key.to_lowercase() && hex::decode(&message_key).is_ok(),
            "message_key must be 64 bytes of lowercase hex"
        );

        let storage_before = env::storage_usage();
        let index = self.next_registration;
        self.next_registration += 1;
        self.registrations.insert(
            account.clone(),
            Registration {
                index: U64(index),
                commitment: commitment.clone(),
                dust_address: dust_address.clone(),
                message_key: message_key.clone(),
                block_height: U64(env::block_height()),
            },
        );
        self.registrations.flush();
        self.registered.insert(index, account.clone());
        self.registered.flush();
        // The record's storage is paid from the fee; the rest goes to the beneficiary.
        let storage_cost = env::storage_byte_cost().saturating_mul((env::storage_usage() - storage_before).into());
        let net = self.registration_fee.checked_sub(storage_cost).unwrap_or_else(|| env::panic_str("the fee does not cover the record's storage"));
        self.fees_unpaid = self.fees_unpaid.saturating_add(net);

        // First the line a registration proof rebuilds, then the event for everyone else.
        env::log_str(&join_line(index, &bytes));
        BridgeEvent::Register { index: U64(index), account, commitment, dust_address, message_key }.emit();
    }

    /// Pays the fees taken so far to the beneficiary. Anyone can call this.
    pub fn pay_fees(&mut self) -> Promise {
        let amount = self.fees_unpaid;
        require!(!amount.is_zero(), "no fees to pay");
        self.fees_unpaid = NearToken::from_yoctonear(0);
        Promise::new(self.beneficiary.clone())
            .transfer(amount)
            .then(Self::ext(env::current_account_id()).with_static_gas(CALLBACK_GAS).on_fees_paid(amount))
    }

    /// Puts the fees back when their payout failed, so it can be retried.
    #[private]
    pub fn on_fees_paid(&mut self, amount: NearToken, #[callback_result] result: Result<(), PromiseError>) -> bool {
        if result.is_ok() {
            return true;
        }
        self.fees_unpaid = self.fees_unpaid.saturating_add(amount);
        false
    }

    /// Locks the attached deposit minus the storage cost of the lock record. The lock id is in
    /// the logs. The call returns nothing, so its outcome has a fixed shape that a proof can rebuild.
    #[payable]
    pub fn lock(&mut self, midnight_recipient: String) {
        require!(self.locks_open(), CLOSED);
        self.alone_in_its_transaction();
        let coin_key = shielded_coin_key(&midnight_recipient)
            .unwrap_or_else(|| env::panic_str("midnight_recipient must be a Midnight shielded address"));

        let storage_before = env::storage_usage();
        let lock_id = self.next_lock_id;
        self.next_lock_id += 1;
        self.locks.insert(
            lock_id,
            Lock {
                sender: env::predecessor_account_id(),
                amount: NearToken::from_yoctonear(0),
                midnight_recipient: midnight_recipient.clone(),
                block_height: U64(env::block_height()),
            },
        );
        self.locks.flush();
        let storage_cost = env::storage_byte_cost()
            .saturating_mul((env::storage_usage() - storage_before).into());

        let net = env::attached_deposit()
            .checked_sub(storage_cost)
            .unwrap_or_else(|| env::panic_str("deposit does not cover the lock record storage"));
        // With denominations, the largest one the deposit covers is locked and the change goes back.
        let amount = match self.denominations.iter().filter(|d| **d <= net).max() {
            Some(d) => *d,
            None if self.denominations.is_empty() => NearToken::from_yoctonear(net.as_yoctonear() / UNIT_YOCTO * UNIT_YOCTO),
            None => env::panic_str("deposit after storage is below the smallest denomination"),
        };
        require!(!amount.is_zero(), "deposit after storage is below one micro-NEAR");
        let change = net.saturating_sub(amount);
        if !self.denominations.is_empty() && !change.is_zero() {
            Promise::new(env::predecessor_account_id()).transfer(change).detach();
        }

        self.roll_window();
        self.locked_today = self.locked_today.saturating_add(amount);
        require!(self.locked_today <= self.daily_limit, "daily lock limit reached");
        self.total_locked = self.total_locked.saturating_add(amount);

        self.locks.get_mut(&lock_id).unwrap().amount = amount;
        let micro = u64::try_from(amount.as_yoctonear() / UNIT_YOCTO)
            .unwrap_or_else(|_| env::panic_str("the amount exceeds 64 bits of micro-NEAR"));
        // First the line a lock proof rebuilds, then the event for everyone else.
        env::log_str(&lock_line(lock_id, micro, &coin_key));
        BridgeEvent::Lock {
            lock_id: U64(lock_id),
            sender: env::predecessor_account_id(),
            amount,
            midnight_recipient,
        }
        .emit();
    }

    /// Pays the NEAR of a proven burn to the account the burn names: what is still owed, or as
    /// much of it as the day's limit leaves. Anyone can call this, again until the burn is paid
    /// in full. A payout never depends on whether the bridge takes new funds.
    pub fn release(&mut self, burn_id: String) -> Promise {
        let id = midnight::unhex32("burn_id", &burn_id).unwrap_or_else(|e| env::panic_str(&e));
        self.roll_window();
        let room = self.daily_limit.saturating_sub(self.released_today);
        let proven = self.proven_burns.get_mut(&id).unwrap_or_else(|| env::panic_str("burn is not proven"));
        let recipient: AccountId = proven.near_recipient.parse().unwrap_or_else(|_| env::panic_str("the burn names no NEAR account"));
        let owed = proven.amount.saturating_sub(proven.paid);
        require!(!owed.is_zero(), "burn already released");
        let amount = owed.min(room);
        require!(!amount.is_zero(), "daily release limit reached");
        // The mark lives in the burn's record, whose storage its prover paid.
        proven.paid = proven.paid.saturating_add(amount);

        let total_released = self.total_released.saturating_add(amount);
        require!(total_released <= self.total_locked, "release exceeds the locked NEAR");
        self.released_today = self.released_today.saturating_add(amount);
        self.total_released = total_released;

        BridgeEvent::Release { burn_id: burn_id.clone(), recipient: recipient.clone(), amount }.emit();
        Promise::new(recipient).transfer(amount).then(
            Self::ext(env::current_account_id())
                .with_static_gas(CALLBACK_GAS)
                .on_release(burn_id, amount, U64(self.window_day)),
        )
    }

    /// Undoes the bookkeeping of a failed payout so it can be retried. `day` is the day it was sent on.
    #[private]
    pub fn on_release(
        &mut self,
        burn_id: String,
        amount: NearToken,
        day: U64,
        #[callback_result] result: Result<(), PromiseError>,
    ) -> bool {
        if result.is_ok() {
            return true;
        }
        let id = midnight::unhex32("burn_id", &burn_id).unwrap_or_else(|e| env::panic_str(&e));
        if let Some(proven) = self.proven_burns.get_mut(&id) {
            proven.paid = proven.paid.saturating_sub(amount);
        }
        self.total_released = self.total_released.saturating_sub(amount);
        // The limit of a later day never held this payout.
        self.roll_window();
        if day.0 == self.window_day {
            self.released_today = self.released_today.saturating_sub(amount);
        }
        BridgeEvent::ReleaseFailed { burn_id, amount }.emit();
        false
    }

    pub fn get_config(&self) -> Config {
        let today = self.window_day == current_day();
        let zero = NearToken::from_yoctonear(0);
        Config {
            daily_limit: self.daily_limit,
            locked_today: if today { self.locked_today } else { zero },
            released_today: if today { self.released_today } else { zero },
            total_locked: self.total_locked,
            total_released: self.total_released,
            next_lock_id: U64(self.next_lock_id),
            locks_open: self.locks_open(),
            midnight_bridge: self.midnight_bridge.clone(),
            denominations: self.denominations.clone(),
            registration_fee: self.registration_fee,
            beneficiary: self.beneficiary.clone(),
            registered: U64(self.next_registration),
            fees_unpaid: self.fees_unpaid,
        }
    }

    pub fn get_lock(&self, lock_id: U64) -> Option<Lock> {
        self.locks.get(&lock_id.0).cloned()
    }

    pub fn get_midnight(&self) -> MidnightView {
        midnight::view(&midnight::load(&self.midnight))
    }

    /// What the bridge knows of Midnight's runtime, and whether it takes new funds.
    pub fn get_runtime(&self) -> RuntimeView {
        RuntimeView {
            block: midnight::load(&self.midnight).finalized_number,
            spec: self.runtime_spec,
            readable: self.table_count.contains_key(&self.runtime_spec),
            upgrade: self.upgrade_check.clone(),
            accepted_head: self.accepted_head.map(U64),
            locks_open: self.locks_open(),
        }
    }

    /// A table of a runtime version by its place, without a place the first; None if there is none.
    pub fn get_runtime_table(&self, spec: u32, table: Option<u32>) -> Option<Base64VecU8> {
        self.table_of(spec, table.unwrap_or(0)).cloned().map(Base64VecU8)
    }

    /// How many tables the bridge has for a runtime version.
    pub fn get_runtime_table_count(&self, spec: u32) -> u32 {
        self.table_count.get(&spec).copied().unwrap_or(0)
    }

    pub fn get_mithril(&self) -> Option<MithrilView> {
        self.mithril.as_ref().map(|m| m.view(self.committee_change_pending()))
    }

    /// The burn with this id, 32 bytes of hex; None while it is not proven here.
    pub fn get_proven_burn(&self, burn_id: String) -> Option<ProvenBurn> {
        self.proven_burns.get(&midnight::unhex32("burn_id", &burn_id).unwrap_or_else(|e| env::panic_str(&e))).cloned()
    }

    pub fn get_finalized_hash(&self, block: u32) -> Option<String> {
        self.finalized_hashes.get(&block).map(hex::encode)
    }

    /// Whether the burn is paid in full, a payout on its way counted.
    pub fn is_released(&self, burn_id: String) -> bool {
        self.get_proven_burn(burn_id).is_some_and(|proven| proven.paid == proven.amount)
    }

    pub fn get_registration(&self, account: AccountId) -> Option<Registration> {
        self.registrations.get(&account).cloned()
    }

    /// The account with registration `index`; indexes run from 0 to `registered` in the config.
    pub fn get_registered(&self, index: U64) -> Option<AccountId> {
        self.registered.get(&index.0).cloned()
    }
}

impl Contract {
    fn newest_announced(&self) -> Option<&Vec<u8>> {
        let newest = self.announced_to.checked_sub(1).filter(|place| *place >= self.announced_from)?;
        self.announced.get(&newest)
    }

    // Whether the committee Cardano named last differs from the one Midnight finalizes with.
    fn committee_change_pending(&self) -> bool {
        self.newest_announced().is_some_and(|c| *c != self.midnight_committee)
    }

    // New funds enter while the newest finalized block has a runtime the bridge can read, a
    // check of a Midnight block built within the last hour found no new runtime authorized, and
    // the Midnight bridge made a recent NEAR block its head.
    fn locks_open(&self) -> bool {
        let fresh = |c: &UpgradeCheck| !c.authorized && env::block_timestamp().saturating_sub(c.at.0) <= MAX_UPGRADE_CHECK_AGE_NS;
        let followed = self.accepted_head.is_some_and(|head| env::block_height().saturating_sub(head) <= MAX_HEAD_AGE_BLOCKS);
        self.table_count.contains_key(&self.runtime_spec) && self.upgrade_check.as_ref().is_some_and(fresh) && followed
    }

    fn bridge_address(&self) -> [u8; 32] {
        midnight::unhex32("midnight_bridge", &self.midnight_bridge).unwrap_or_else(|e| env::panic_str(&e))
    }

    // The Midnight transaction at `extrinsic_index` of the block that `headers` link to one
    // finalized here, and that block's number. The block's events must show it applied.
    fn applied_tx(&self, headers: Vec<Base64VecU8>, extrinsic_index: u32, extrinsic_proof: Vec<Base64VecU8>, state_proof: Vec<Base64VecU8>, staged: Option<Vec<u8>>, table: Option<u32>) -> (Vec<u8>, u32) {
        let block = self.finalized_ancestor(headers);
        let proof = extrinsic_proof.into_iter().map(|p| p.0).collect();
        let extrinsic = substrate_read_proof::read_value(block.extrinsics_root.0, proof, &substrate_read_proof::extrinsic_key(extrinsic_index))
            .unwrap_or_else(|e| env::panic_str(&format!("extrinsic proof: {e:?}")))
            .unwrap_or_else(|| env::panic_str("extrinsic proof: the block has no such extrinsic"));
        let (events, spec) = self.events_and_runtime(&block, state_proof, staged);
        let place = table.unwrap_or(0);
        let table = self.table_of(spec, place).unwrap_or_else(|| {
            let which = if place == 0 { String::new() } else { format!(" {place}") };
            env::panic_str(&format!("runtime {spec}: the bridge has no table{which} for it"))
        });
        let pallet = substrate_events::midnight_pallet_of(table).unwrap_or_else(|e| env::panic_str(&format!("runtime {spec}: {e:?}")));
        let tx = midnight::midnight_tx(&extrinsic, pallet).unwrap_or_else(|e| env::panic_str(&e));
        let applied = substrate_events::applied_with(table, &events, extrinsic_index, env::sha256_array(&tx))
            .unwrap_or_else(|e| env::panic_str(&format!("events: {e:?}")));
        require!(applied, "events: the transaction was not applied");
        (tx, block.number)
    }

    fn table_of(&self, spec: u32, place: u32) -> Option<&Vec<u8>> {
        self.runtime_tables.get(self.table_at.get(&(spec, place))?)
    }

    fn record_upgrade_check(&mut self, block: u32, state_root: [u8; 32], slot: Option<u64>, proof: Vec<Base64VecU8>) -> UpgradeCheck {
        require!(self.upgrade_check.as_ref().is_none_or(|c| block > c.block), "a check of this block or a later one is recorded");
        let slot = slot.unwrap_or_else(|| env::panic_str("the block logs no slot"));
        let proof = proof.into_iter().map(|p| p.0).collect();
        let authorized = substrate_read_proof::read_value(state_root, proof, &midnight::AUTHORIZED_UPGRADE_KEY)
            .unwrap_or_else(|e| env::panic_str(&format!("upgrade proof: {e:?}")))
            .is_some();
        let check = UpgradeCheck { block, authorized, at: U64(slot.saturating_mul(midnight::SLOT_NS)) };
        self.upgrade_check = Some(check.clone());
        check
    }

    // The caller's staged parts 0 to `parts` as one node, removed. What their storage cost
    // goes back to the caller, who paid it when staging them.
    fn take_staged(&mut self, parts: u32) -> Vec<u8> {
        let caller = env::predecessor_account_id();
        let storage_before = env::storage_usage();
        let mut node = Vec::new();
        for part in 0..parts {
            let bytes = self.staged.remove(&(caller.clone(), part)).unwrap_or_else(|| env::panic_str(&format!("part {part} is not staged")));
            node.extend(bytes);
        }
        self.staged.flush();
        let freed = storage_before.saturating_sub(env::storage_usage());
        let refund = env::storage_byte_cost().saturating_mul(freed.into());
        if !refund.is_zero() {
            Promise::new(caller).transfer(refund).detach();
        }
        node
    }

    // The raw `System::Events` of a block and the spec version of the runtime that built it.
    // `staged` is one more node of the proof.
    fn events_and_runtime(&self, block: &midnight_grandpa::Header, state_proof: Vec<Base64VecU8>, staged: Option<Vec<u8>>) -> (Vec<u8>, u32) {
        let proof = state_proof.into_iter().map(|p| p.0).chain(staged.filter(|node| !node.is_empty())).collect();
        let values = substrate_read_proof::read_values(block.state_root.0, proof, &[&midnight::EVENTS_KEY, &midnight::LAST_RUNTIME_UPGRADE_KEY])
            .unwrap_or_else(|e| env::panic_str(&format!("state proof: {e:?}")));
        let [Some(events), Some(upgrade)] = values.as_slice() else { env::panic_str("state proof: Events or LastRuntimeUpgrade is absent") };
        (events.clone(), midnight::runtime_spec(upgrade).unwrap_or_else(|e| env::panic_str(&e)))
    }

    // The first header, once the headers link by parent hash to a block finalized here.
    fn finalized_ancestor(&self, headers: Vec<Base64VecU8>) -> midnight_grandpa::Header {
        require!(!headers.is_empty() && headers.len() <= MAX_BURN_HEADERS, "submit 1 to 300 headers");
        let headers: Vec<midnight_grandpa::Header> = headers
            .iter()
            .map(|h| codec::DecodeAll::decode_all(&mut &h.0[..]).unwrap_or_else(|_| env::panic_str("headers: a header does not decode")))
            .collect();
        let hash = |h: &midnight_grandpa::Header| midnight_grandpa::header_hash(&codec::Encode::encode(h)).0;
        for pair in headers.windows(2) {
            require!(pair[1].parent_hash.0 == hash(&pair[0]), "headers: a header is not the parent of the next");
        }
        let last = headers.last().unwrap();
        require!(self.finalized_hashes.get(&last.number) == Some(&hash(last)), "headers: the last header is not finalized here");
        headers.into_iter().next().unwrap()
    }

    // Stores a burn once.
    fn record_burn(&mut self, id: [u8; 32], near_recipient: String, micro: u128, block: u32) -> ProvenBurn {
        require!(!self.proven_burns.contains_key(&id), "burn already proven");
        let amount = NearToken::from_yoctonear(micro.checked_mul(UNIT_YOCTO).unwrap_or_else(|| env::panic_str("burn amount overflows")));
        let proven = ProvenBurn { near_recipient: near_recipient.clone(), amount, block, paid: NearToken::from_yoctonear(0) };
        self.proven_burns.insert(id, proven.clone());
        BridgeEvent::BurnProven { burn_id: hex::encode(id), near_recipient, amount }.emit();
        proven
    }

    // The caller pays for the storage a call added and gets the rest of the deposit back.
    fn charge_storage(&self, storage_before: u64) {
        let added = env::storage_usage().saturating_sub(storage_before);
        let cost = env::storage_byte_cost().saturating_mul(added.into());
        let deposit = env::attached_deposit();
        require!(deposit >= cost, format!("attach at least {cost} for storage"));
        let refund = deposit.saturating_sub(cost);
        if !refund.is_zero() {
            let _ = Promise::new(env::predecessor_account_id()).transfer(refund);
        }
    }

    // Two locks or registrations in one transaction share an outcome that no proof on Midnight
    // fits. The second fails here, which undoes the first and returns both deposits.
    fn alone_in_its_transaction(&mut self) {
        let entry = (env::predecessor_account_id(), env::block_height());
        require!(self.last_entry.as_ref() != Some(&entry), "one lock or registration per account and block: send each in its own transaction");
        self.last_entry = Some(entry);
    }

    fn roll_window(&mut self) {
        let day = current_day();
        if day != self.window_day {
            self.window_day = day;
            self.locked_today = NearToken::from_yoctonear(0);
            self.released_today = NearToken::from_yoctonear(0);
        }
    }
}

fn current_day() -> u64 {
    env::block_timestamp() / NANOS_PER_DAY
}

// The coin public key of a `mn_shield-addr_<network>1...` address: the first 32 of its 64 bytes.
fn shielded_coin_key(address: &str) -> Option<[u8; 32]> {
    if address.len() > MAX_ADDRESS_LEN {
        return None;
    }
    let checked = CheckedHrpstring::new::<Bech32m>(address).ok()?;
    if !checked.hrp().as_str().starts_with(MIDNIGHT_SHIELDED_PREFIX) {
        return None;
    }
    let keys: Vec<u8> = checked.byte_iter().collect();
    if keys.len() != 64 {
        return None;
    }
    keys[..32].try_into().ok()
}

// Whether `address` is `mn_dust1...` or `mn_dust_<network>1...` with a key of plausible length.
fn is_dust_address(address: &str) -> bool {
    if address.len() > MAX_ADDRESS_LEN {
        return false;
    }
    let Ok(checked) = CheckedHrpstring::new::<Bech32m>(address) else {
        return false;
    };
    let hrp = checked.hrp();
    let kind = hrp.as_str().strip_prefix(MIDNIGHT_DUST_PREFIX);
    kind.is_some_and(|rest| rest.is_empty() || rest.starts_with('_')) && (1..=MAX_DUST_KEY_LEN).contains(&checked.byte_iter().count())
}

// A lock in 111 characters: the lock id and the micro-NEAR amount as 16 hex digits each, then the key.
fn lock_line(lock_id: u64, micro: u64, coin_key: &[u8; 32]) -> String {
    format!("lightsout:lock:{lock_id:016x}{micro:016x}{}", hex::encode(coin_key))
}

// A registration in 95 characters: its index as 16 hex digits, then the commitment.
fn join_line(index: u64, commitment: &[u8; 32]) -> String {
    format!("lightsout:join:{index:016x}{}", hex::encode(commitment))
}

#[cfg(test)]
mod tests;
