//! The parts of a proof the kit builds for the NEAR bridge, from the same code the bridge checks with.

use js_sys::{Array, Uint8Array};
use wasm_bindgen::prelude::*;

/// The root of a block's extrinsics and the nodes that prove one of them.
#[wasm_bindgen(getter_with_clone)]
pub struct ExtrinsicProof {
    pub root: Vec<u8>,
    /// Trie nodes, `Uint8Array`s.
    pub nodes: Array,
}

/// The proof of extrinsic `index` among `extrinsics`, each SCALE-encoded with its length prefix.
#[wasm_bindgen(js_name = extrinsicProof)]
pub fn extrinsic_proof(extrinsics: Array, index: u32) -> Result<ExtrinsicProof, JsError> {
    let extrinsics: Vec<Vec<u8>> = extrinsics.iter().map(|x| x.dyn_into::<Uint8Array>().map(|a| a.to_vec())).collect::<Result<_, _>>().map_err(|_| JsError::new("extrinsics must be Uint8Arrays"))?;
    if index as usize >= extrinsics.len() {
        return Err(JsError::new("the block has no such extrinsic"));
    }
    let (root, nodes) = substrate_read_proof::extrinsic_proof(&extrinsics, index);
    Ok(ExtrinsicProof { root: root.to_vec(), nodes: nodes.iter().map(|n| JsValue::from(Uint8Array::from(&n[..]))).collect() })
}

/// The log a burn of the bridge left in its transaction.
#[wasm_bindgen(getter_with_clone)]
pub struct BurnLog {
    /// The hash of the burned coin, 32 bytes.
    pub id: Vec<u8>,
    /// Micro-NEAR, decimal.
    pub value: String,
    /// The NEAR account, zero-padded to 64 bytes.
    #[wasm_bindgen(js_name = nearRecipient)]
    pub near_recipient: Vec<u8>,
}

/// Reads the burn logs of the bridge at `bridge` from a serialized Midnight transaction: one
/// `BurnLog` for each of its burns, in their order.
#[wasm_bindgen(js_name = burnLogs)]
pub fn burn_logs(tx: &[u8], bridge: &[u8]) -> Result<Array, JsError> {
    let bridge: [u8; 32] = bridge.try_into().map_err(|_| JsError::new("bridge must be 32 bytes"))?;
    let logs = midnight_tx::bridge_burn_logs(tx, bridge).map_err(|e| JsError::new(&format!("{e:?}")))?;
    Ok(logs.into_iter().map(|log| JsValue::from(BurnLog { id: log.id.to_vec(), value: log.value.to_string(), near_recipient: log.near_recipient.to_vec() })).collect())
}

/// Reads the NEAR heights that the bridge at `bridge` made its head in a serialized Midnight
/// transaction, in the order of its `accept` calls.
#[wasm_bindgen(js_name = headLogs)]
pub fn head_logs(tx: &[u8], bridge: &[u8]) -> Result<Vec<u64>, JsError> {
    let bridge: [u8; 32] = bridge.try_into().map_err(|_| JsError::new("bridge must be 32 bytes"))?;
    midnight_tx::bridge_head_logs(tx, bridge).map_err(|e| JsError::new(&format!("{e:?}")))
}
