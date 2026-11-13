//! Follows Cardano through Mithril certificates and reads the Midnight committee from the
//! permissioned-candidates token on Cardano.
use crate::midnight;
use mithril_light::{BlsHost, Candidate, Certificate, CertifiedTransaction, ChainState, Multisig, Outpoint, Signature, TokenUpdate};
use near_sdk::{env, near, serde_json};

/// The host functions of NEAR behind the verifier.
pub struct NearBls;

impl BlsHost for NearBls {
    fn sha256(&self, data: &[u8]) -> [u8; 32] {
        env::sha256_array(data)
    }
    fn bls12381_map_fp_to_g1(&self, elements: &[u8]) -> Option<Vec<u8>> {
        env::bls12381_map_fp_to_g1(elements)
    }
    fn bls12381_p1_sum(&self, signed_points: &[u8]) -> Option<Vec<u8>> {
        env::bls12381_p1_sum(signed_points)
    }
    fn bls12381_g1_multiexp(&self, pairs: &[u8]) -> Option<Vec<u8>> {
        env::bls12381_g1_multiexp(pairs)
    }
    fn bls12381_g2_multiexp(&self, pairs: &[u8]) -> Option<Vec<u8>> {
        env::bls12381_g2_multiexp(pairs)
    }
    fn bls12381_p1_decompress(&self, compressed: &[u8]) -> Option<Vec<u8>> {
        env::bls12381_p1_decompress(compressed)
    }
    fn bls12381_p2_decompress(&self, compressed: &[u8]) -> Option<Vec<u8>> {
        env::bls12381_p2_decompress(compressed)
    }
    fn bls12381_pairing_check(&self, pairs: &[u8]) -> Option<bool> {
        env::bls12381_pairing_check(pairs)
    }
    fn ed25519_verify(&self, signature: &[u8; 64], message: &[u8], public_key: &[u8; 32]) -> bool {
        env::ed25519_verify(signature, message, public_key)
    }
}

/// The token output that carries the committee on Cardano.
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub struct TokenOutput {
    /// Minting policy of the token, hex.
    pub policy: String,
    /// Transaction hash of the output, hex.
    pub tx_hash: String,
    pub index: u64,
}

/// A governance body whose signatures a token update must carry: key hashes (hex) and the quorum.
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub struct GovernanceBody {
    pub keys: Vec<String>,
    pub threshold: u8,
}

/// Where the Mithril chain starts and which token output it follows. Fixed at init.
#[near(serializers = [json])]
#[derive(Clone, Debug, PartialEq)]
pub struct MithrilInit {
    /// A certificate checked out of band; the chain continues from its epoch.
    pub certificate: Certificate,
    pub token: TokenOutput,
    /// Every body must reach its quorum on an update. Empty trusts Mithril alone.
    pub governance: Vec<GovernanceBody>,
    /// Blocks an update must lie under the certified block, the chain's security parameter.
    pub security_depth: u64,
    /// The genesis verification key of the Mithril network, 32 bytes of hex. A certificate it
    /// signed starts the chain anew, which is how Mithril recovers from a break. None refuses those.
    pub genesis_key: Option<String>,
}

#[near(serializers = [borsh])]
#[derive(Clone, Debug, PartialEq)]
pub struct MithrilState {
    /// JSON of the verifier's `ChainState`.
    chain: Vec<u8>,
    policy: [u8; 28],
    tx_hash: [u8; 32],
    index: u64,
    governance: Vec<GovernanceBody>,
    security_depth: u64,
    genesis_key: Option<[u8; 32]>,
    /// The Cardano block in which the token was burned; None while an output carries it.
    burned_at: Option<u64>,
}

#[near(serializers = [json])]
#[derive(Clone, Debug, PartialEq)]
pub struct MithrilView {
    pub epoch: u64,
    pub token: TokenOutput,
    pub governance: Vec<GovernanceBody>,
    pub security_depth: u64,
    /// The Mithril genesis key whose certificates restart the chain, hex; None when it takes none.
    pub genesis_key: Option<String>,
    /// The Cardano block in which the token was burned. The bridge then waits for a
    /// transaction that mints it anew, and `token` names the last output that carried it.
    pub token_burned_at: Option<u64>,
    /// Set while Cardano has announced a committee that the bridge has not moved to.
    pub committee_change_pending: bool,
}

impl MithrilState {
    pub fn start(init: MithrilInit) -> Result<Self, String> {
        let chain = ChainState::from_certificate(&init.certificate).map_err(|e| format!("mithril: {e:?}"))?;
        let policy = hex::decode(&init.token.policy).ok().and_then(|p| p.try_into().ok()).ok_or("mithril: the policy is 28 bytes of hex")?;
        let tx_hash = hex::decode(&init.token.tx_hash).ok().and_then(|h| h.try_into().ok()).ok_or("mithril: the tx hash is 32 bytes of hex")?;
        for body in &init.governance {
            if body.threshold == 0 || body.threshold as usize > body.keys.len() {
                return Err("mithril: a governance body needs 1 <= threshold <= keys".into());
            }
            body.keys.iter().try_for_each(|k| key_hash(k).map(|_| ()))?;
        }
        let genesis_key = match &init.genesis_key {
            Some(key) => Some(hex::decode(key).ok().and_then(|k| k.try_into().ok()).ok_or("mithril: the genesis key is 32 bytes of hex")?),
            None => None,
        };
        Ok(Self {
            chain: serde_json::to_vec(&chain).map_err(|e| e.to_string())?,
            policy,
            tx_hash,
            index: init.token.index,
            governance: init.governance,
            security_depth: init.security_depth,
            genesis_key,
            burned_at: None,
        })
    }

    fn multisigs(&self) -> Vec<Multisig> {
        self.governance
            .iter()
            .map(|b| Multisig { keys: b.keys.iter().map(|k| key_hash(k).unwrap_or_else(|e| env::panic_str(&e))).collect(), threshold: b.threshold })
            .collect()
    }

    fn chain(&self) -> ChainState {
        serde_json::from_slice(&self.chain).unwrap_or_else(|_| env::panic_str("stored mithril chain is corrupt"))
    }

    pub fn view(&self, committee_change_pending: bool) -> MithrilView {
        let chain = self.chain();
        MithrilView {
            epoch: chain.epoch,
            token: TokenOutput { policy: hex::encode(self.policy), tx_hash: hex::encode(self.tx_hash), index: self.index },
            governance: self.governance.clone(),
            security_depth: self.security_depth,
            genesis_key: self.genesis_key.map(hex::encode),
            token_burned_at: self.burned_at,
            committee_change_pending,
        }
    }

    /// Advances the chain by one certificate. One that the network's genesis key signed starts
    /// the chain anew at its epoch, never at an earlier one than the chain has reached.
    pub fn accept(&mut self, certificate: &Certificate) -> Result<(), String> {
        let chain = self.chain();
        let next = match (&certificate.signature, &self.genesis_key) {
            (Signature::Genesis(_), Some(key)) => {
                if certificate.epoch < chain.epoch {
                    return Err("mithril: the genesis certificate is older than the chain".into());
                }
                let restarted = ChainState::from_genesis(&NearBls, certificate, key);
                // Taken again, it would undo what later certificates of its epoch announced.
                if restarted.is_ok() && certificate.epoch == chain.epoch && certificate.aggregate_verification_key == chain.aggregate_verification_key {
                    return Err("mithril: the chain already stands at this genesis certificate".into());
                }
                restarted
            }
            _ => chain.verify(&NearBls, certificate),
        }
        .map_err(|e| format!("mithril: {e:?}"))?;
        self.chain = serde_json::to_vec(&next).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Checks that `certificate` certifies `transaction` and follows the token through it, as
    /// `step` says. Returns the candidates the token's new output names.
    pub fn follow_token(&mut self, certificate: &Certificate, transaction: &CertifiedTransaction, proof: &[u8], tx_cbor: &[u8]) -> Result<Vec<Candidate>, String> {
        // The block number comes from the signed message. The entity beside it is not signed.
        let certified_block: u64 = certificate
            .message_part("latest_block_number")
            .and_then(|block| block.parse().ok())
            .ok_or("mithril: the certificate does not certify Cardano blocks")?;
        if transaction.block_number.saturating_add(self.security_depth) > certified_block {
            return Err("mithril: the transaction is not deep enough under the certified block".into());
        }
        let root = mithril_light::verify_transaction_proof(proof, transaction).map_err(|e| format!("mithril: {e:?}"))?;
        if certificate.message_part("cardano_blocks_transactions_merkle_root") != Some(hex::encode(root).as_str()) {
            return Err("mithril: the proof root is not the certified root".into());
        }
        let tx = mithril_light::parse_transaction(tx_cbor).map_err(|e| format!("cardano: {e:?}"))?;
        if hex::encode(tx.hash) != transaction.transaction_hash {
            return Err("cardano: the transaction is not the certified one".into());
        }
        // The ledger already ran the governance scripts; checking their signers again needs no trust in Mithril.
        let signers = tx.signers(&NearBls);
        if !self.multisigs().iter().all(|body| body.approved(&signers)) {
            return Err("cardano: the update lacks the governance signatures".into());
        }
        self.step(&tx, transaction.block_number)
    }

    /// Follows the token through a transaction of Cardano block `block`: one that spends the
    /// tracked output moves the token to its next output or burns it. After a burn, one that
    /// mints the token anew in that block or a later one starts at the output it puts it into.
    pub(crate) fn step(&mut self, tx: &mithril_light::Transaction, block: u64) -> Result<Vec<Candidate>, String> {
        let (next, candidates) = match self.burned_at {
            None => {
                let tracked = Outpoint { tx_hash: self.tx_hash, index: self.index };
                match mithril_light::candidate_update(tx, &tracked, &self.policy).map_err(|e| format!("cardano: {e:?}"))? {
                    TokenUpdate::Moved(next, candidates) => (next, candidates),
                    TokenUpdate::Burned => {
                        self.burned_at = Some(block);
                        return Ok(Vec::new());
                    }
                }
            }
            // An older mint is one of the token's past, which would be followed a second time.
            Some(burned) if block < burned => return Err("cardano: the mint is older than the burn of the token".into()),
            Some(_) => mithril_light::candidate_mint(tx, &self.policy).map_err(|e| format!("cardano: {e:?}"))?,
        };
        (self.tx_hash, self.index, self.burned_at) = (next.tx_hash, next.index, None);
        Ok(candidates)
    }
}

fn key_hash(hex: &str) -> Result<[u8; 28], String> {
    hex::decode(hex).ok().and_then(|k| k.try_into().ok()).ok_or_else(|| "mithril: a governance key is 28 bytes of hex".into())
}

/// The GRANDPA keys of the candidates, in the form `midnight::committee` writes the light client's set.
pub fn committee_of(candidates: &[Candidate]) -> Vec<u8> {
    midnight::committee_of_keys(candidates.iter().map(|c| c.grandpa.to_vec()))
}
