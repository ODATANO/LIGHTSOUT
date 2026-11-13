//! Verifies Mithril certificates and the Cardano transactions they certify.
//! The BLS12-381 arithmetic runs on host functions, so the crate carries no curve code.

#[cfg(feature = "aggregator")]
pub mod aggregator;
pub mod bls;
pub mod cardano;
pub mod certificate;
pub mod hash_to_curve;
pub mod json;
pub mod lottery;
pub mod merkle;
pub mod mmr;
pub mod stm;

pub use bls::BlsHost;
pub use cardano::{Candidate, Multisig, Outpoint, TokenUpdate, Transaction, VkeyWitness, candidate_mint, candidate_update, decode_candidates, parse_transaction};
pub use certificate::{Certificate, ChainState, Metadata, ProtocolParameters, Signature, SignedEntity, Signer};
pub use mmr::{CertifiedTransaction, verify_transaction_proof};
pub use stm::{AggregateVerificationKey, BatchPath, MultiSignature, RegisteredParty, SignatureEntry};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    /// A host function rejected its input: a point off the curve or outside its subgroup.
    BadPoint,
    /// A lottery index is above `m`, or its lottery is lost.
    LotteryLost,
    /// Two signatures claim the same lottery index.
    IndexNotUnique,
    /// Fewer than `k` lottery indices.
    NotEnoughSignatures,
    /// The registered parties are not in the aggregate verification key.
    BadBatchPath,
    /// The aggregate BLS signature does not verify.
    BadSignature,
    /// The genesis signature does not verify.
    BadGenesisSignature,
    /// The signed message is not the hash of the protocol message.
    MessageMismatch,
    /// The epoch differs from the protocol message's `current_epoch`.
    EpochMismatch,
    /// The epoch is neither the current one nor the next.
    EpochNotChained,
    /// The aggregate verification key is not the one announced for this epoch.
    AvkNotChained,
    /// The protocol parameters are not the ones announced for this epoch.
    ParametersNotChained,
    /// A protocol message part has an unknown key.
    UnknownMessagePart,
    /// `phi_f` is not in (0, 1].
    BadParameters,
    /// The inclusion proof bytes do not decode.
    BadProofEncoding,
    /// A Merkle mountain range proof does not verify.
    BadInclusionProof,
    /// The proof does not contain the transaction.
    TransactionNotProven,
    /// The bytes are not the CBOR the ledger writes.
    BadCbor,
    /// The ledger marked the transaction's scripts as failed.
    NotValidTransaction,
    /// The transaction does not spend the tracked output.
    OutpointNotSpent,
    /// More than one output carries the token, or a mint puts it into none.
    TokenNotFound,
    /// The transaction does not mint the token.
    TokenNotMinted,
    /// The datum is not a permissioned-candidates datum the node would read.
    BadDatum,
}
