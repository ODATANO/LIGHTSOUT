//! The fed-ops transaction that minted the committee token on Cardano preview and holds the
//! stagenet committee, and the update of that token recorded on preprod.
mod common;

use common::data;
use mithril_light::cardano::Asset;
use mithril_light::{Error, Outpoint, TokenUpdate, candidate_mint, candidate_update, decode_candidates, parse_transaction};

const FED_OPS_POLICY: &str = "924a6b4c0becbd9d4506a91ecc7992e50008ec5051c7ea2e9219ee49";
const TX_HASH: &str = "3fad67d4cfd7edec4edbc069931137900b2b38d0c32dbedf54aa3ce30480ba4a";
const SPENT: &str = "709dc6ad2f4ff43d1eac965cb2241f44fb9786615959fa308cd597b1fabd5e18";

// The GRANDPA keys of the chain spec, in datum order.
const GRANDPA_KEYS: [&str; 7] = [
    "19269a50856b6bc25ea4d7ee9c31a914456866b096fc4f69ef146c52361dbd11",
    "833bda33e5f76b6914f31d8b4d6afca5396403e4ef43868a4ec3567827d4565f",
    "4a1d3b61c74779137169baf64e31981acdc4b5dde4c3debff541fda355a665ff",
    "a51b96dc086de0b7aee36512563999126513dc8c21844699f58cdd82624d5376",
    "f8184a9c2225c770bfe1b67ef8bf7c781af76382c07686f47a270e11cf3e82da",
    "af7cf6648dae873100919f899c385878bc58b4877aa05320bf36b73267f44f05",
    "0a159dacc54111bdd54cfcc4f196d5c613edf41ed894cbc8bbb0d8f78832b224",
];

fn hex32(h: &str) -> [u8; 32] {
    hex::decode(h).unwrap().try_into().unwrap()
}

fn tx_bytes() -> Vec<u8> {
    hex::decode(data("fedops-tx-3fad67d4.hex").trim()).unwrap()
}

#[test]
fn the_transaction_parses_as_the_ledger_hashes_it() {
    let tx = parse_transaction(&tx_bytes()).unwrap();
    assert_eq!(hex::encode(tx.hash), TX_HASH);
    assert!(tx.is_valid);
    assert_eq!(tx.inputs, vec![Outpoint { tx_hash: hex32(SPENT), index: 4 }]);
    assert_eq!(tx.outputs.len(), 4);
    let token = &tx.outputs[2];
    assert_eq!(token.lovelace, 5_995_210);
    assert_eq!(hex::encode(&token.address[1..]), FED_OPS_POLICY);
    assert_eq!(token.assets.len(), 1);
    assert_eq!((hex::encode(token.assets[0].policy), token.assets[0].name.as_slice(), token.assets[0].amount), (FED_OPS_POLICY.to_string(), &b""[..], 1));
    assert_eq!(token.inline_datum.as_ref().map(Vec::len), Some(1149));
    assert!(tx.outputs[3].inline_datum.is_none());
    assert_eq!(tx.outputs[3].lovelace, 8_575_336);
}

#[test]
fn the_datum_names_the_seven_candidates_of_the_chain_spec() {
    let tx = parse_transaction(&tx_bytes()).unwrap();
    let candidates = decode_candidates(tx.outputs[2].inline_datum.as_ref().unwrap()).unwrap();
    assert_eq!(candidates.len(), 7);
    let grandpa: Vec<String> = candidates.iter().map(|c| hex::encode(c.grandpa)).collect();
    assert_eq!(grandpa, GRANDPA_KEYS);
    assert_eq!(hex::encode(&candidates[0].partner_chain_key), "031184b25327575f91f710cff952eff589ae6651dff219896c2ed3c3c3409018a2");
}

// A versioned datum of two candidates with one "gran" entry each: 32 bytes of 7, then 31 bytes.
fn datum_with_a_short_key() -> Vec<u8> {
    let candidate = |name: u8, key: &[u8]| [&[0x82, 0x41, name, 0x81, 0x82, 0x44][..], b"gran", &[0x58, key.len() as u8], key].concat();
    [&[0x83, 0x80, 0x82][..], &candidate(1, &[7; 32])[..], &candidate(2, &[8; 31])[..], &[0x01]].concat()
}

#[test]
fn a_candidate_without_a_grandpa_key_of_32_bytes_is_left_out() {
    let candidates = decode_candidates(&datum_with_a_short_key()).unwrap();
    assert_eq!(candidates.len(), 1);
    assert_eq!((candidates[0].partner_chain_key.as_slice(), candidates[0].grandpa), (&[1u8][..], [7; 32]));
}

#[test]
fn a_datum_that_cannot_be_read_still_moves_the_tracked_output() {
    let tx = parse_transaction(&tx_bytes()).unwrap();
    let policy: [u8; 28] = hex::decode(FED_OPS_POLICY).unwrap().try_into().unwrap();
    let tracked = Outpoint { tx_hash: hex32(SPENT), index: 4 };
    let next = Outpoint { tx_hash: hex32(TX_HASH), index: 2 };
    for datum in [None, Some(vec![0x83, 0x80, 0x80, 0x02])] {
        let mut unreadable = tx.clone();
        unreadable.outputs[2].inline_datum = datum;
        assert_eq!(candidate_update(&unreadable, &tracked, &policy), Ok(TokenUpdate::Moved(next.clone(), vec![])));
    }
}

#[test]
fn only_the_asset_with_the_empty_name_is_the_token() {
    let mut tx = parse_transaction(&tx_bytes()).unwrap();
    let policy: [u8; 28] = hex::decode(FED_OPS_POLICY).unwrap().try_into().unwrap();
    tx.outputs[3].assets.push(Asset { policy, name: b"other".to_vec(), amount: 1 });
    let tracked = Outpoint { tx_hash: hex32(SPENT), index: 4 };
    let TokenUpdate::Moved(next, candidates) = candidate_update(&tx, &tracked, &policy).unwrap() else { panic!("the token moved") };
    assert_eq!((next.index, candidates.len()), (2, 7));
}

#[test]
fn the_update_moves_the_tracked_output() {
    let tx = parse_transaction(&tx_bytes()).unwrap();
    let policy: [u8; 28] = hex::decode(FED_OPS_POLICY).unwrap().try_into().unwrap();
    let tracked = Outpoint { tx_hash: hex32(SPENT), index: 4 };
    let TokenUpdate::Moved(next, candidates) = candidate_update(&tx, &tracked, &policy).unwrap() else { panic!("the token moved") };
    assert_eq!(next, Outpoint { tx_hash: hex32(TX_HASH), index: 2 });
    assert_eq!(candidates.len(), 7);

    let elsewhere = Outpoint { tx_hash: hex32(SPENT), index: 5 };
    assert_eq!(candidate_update(&tx, &elsewhere, &policy), Err(Error::OutpointNotSpent));
    let mut failed = tx.clone();
    failed.is_valid = false;
    assert_eq!(candidate_update(&failed, &tracked, &policy), Err(Error::NotValidTransaction));
    let mut twice = tx.clone();
    twice.outputs[3].assets.push(Asset { policy, name: Vec::new(), amount: 1 });
    assert_eq!(candidate_update(&twice, &tracked, &policy), Err(Error::TokenNotFound));
}

#[test]
fn a_spend_that_leaves_no_output_with_the_token_burned_it() {
    let mut tx = parse_transaction(&tx_bytes()).unwrap();
    let policy: [u8; 28] = hex::decode(FED_OPS_POLICY).unwrap().try_into().unwrap();
    let tracked = Outpoint { tx_hash: hex32(SPENT), index: 4 };
    tx.outputs[2].assets.clear();
    assert_eq!(candidate_update(&tx, &tracked, &policy), Ok(TokenUpdate::Burned));
}

// The policy of the two other tokens the recorded transaction mints.
const SIDE_POLICY: &str = "5de10c37c0f9d9c60e037d413dbde849ad8b768d347b3995a2f0e9d7";

#[test]
fn the_recorded_mint_starts_the_token_at_its_output() {
    let tx = parse_transaction(&tx_bytes()).unwrap();
    let policy: [u8; 28] = hex::decode(FED_OPS_POLICY).unwrap().try_into().unwrap();
    let minted: Vec<(String, &[u8], u64)> = tx.minted.iter().map(|a| (hex::encode(a.policy), a.name.as_slice(), a.amount)).collect();
    assert_eq!(minted, vec![(SIDE_POLICY.to_string(), &b"main"[..], 1), (SIDE_POLICY.to_string(), &b"staging"[..], 1), (FED_OPS_POLICY.to_string(), &b""[..], 1)]);
    let (first, candidates) = candidate_mint(&tx, &policy).unwrap();
    assert_eq!(first, Outpoint { tx_hash: hex32(TX_HASH), index: 2 });
    assert_eq!(candidates.len(), 7);
}

// The update recorded on preprod mints tokens of two other policies and only moves the token.
#[test]
fn an_update_that_moves_the_token_mints_none() {
    let tx = parse_transaction(&hex::decode(data("preprod-fedops-update-f984693d.hex").trim()).unwrap()).unwrap();
    let policy: [u8; 28] = hex::decode("d962fc619efb2b904e5a8443838500ef2145452af117ab8f9cc3f97f").unwrap().try_into().unwrap();
    assert_eq!(tx.minted.len(), 2);
    assert!(tx.minted.iter().all(|a| a.policy != policy && a.name.is_empty() && a.amount == 1));
    assert_eq!(candidate_mint(&tx, &policy), Err(Error::TokenNotMinted));
}

const POLICY: [u8; 28] = [0x9a; 28];

// A transaction that mints `minted` under `POLICY`, each a name and a count, and whose outputs
// each carry one asset of that policy with the given name and the datum with the short key.
fn mint_tx(minted: &[(&str, i8)], outputs: &[&str]) -> Vec<u8> {
    let bytes = |b: &[u8]| [&[0x58, b.len() as u8][..], b].concat();
    // A count from -24 to 23 fits the first byte of its item.
    let count = |n: i8| if n < 0 { 0x20 + (-1 - n) as u8 } else { n as u8 };
    let assets = |entries: &[(&str, i8)]| {
        let names: Vec<u8> = entries.iter().flat_map(|(name, n)| [&[0x40 + name.len() as u8][..], name.as_bytes(), &[count(*n)]].concat()).collect();
        [&[0xa1][..], &bytes(&POLICY), &[0xa0 + entries.len() as u8], &names].concat()
    };
    let output = |name: &str| {
        let datum = [&[0x82, 0x01, 0xd8, 0x18][..], &bytes(&datum_with_a_short_key())].concat();
        [&[0xa3, 0x00][..], &bytes(&[0x70; 29]), &[0x01, 0x82, 0x1a, 0, 0x1e, 0x84, 0x80], &assets(&[(name, 1)]), &[0x02], &datum].concat()
    };
    let input = [&[0x81, 0x82][..], &bytes(&[0x11; 32]), &[0x04]].concat();
    let outputs: Vec<u8> = [vec![0x80 + outputs.len() as u8], outputs.iter().flat_map(|name| output(*name)).collect()].concat();
    let body = [&[0xa4, 0x00][..], &input, &[0x01], &outputs, &[0x02, 0x1a, 0, 3, 0x0d, 0x40, 0x09], &assets(minted)].concat();
    // No witnesses, valid scripts, no auxiliary data.
    [&[0x84][..], &body, &[0xa0, 0xf5, 0xf6]].concat()
}

#[test]
fn a_token_minted_anew_starts_at_its_output() {
    // The mint also burns an asset of another name.
    let tx = parse_transaction(&mint_tx(&[("", 1), ("old", -1)], &[""])).unwrap();
    assert_eq!(tx.minted, vec![Asset { policy: POLICY, name: Vec::new(), amount: 1 }]);
    let (first, candidates) = candidate_mint(&tx, &POLICY).unwrap();
    assert_eq!(first, Outpoint { tx_hash: tx.hash, index: 0 });
    assert_eq!(candidates.iter().map(|c| c.grandpa).collect::<Vec<_>>(), vec![[7; 32]]);
    let mut failed = tx.clone();
    failed.is_valid = false;
    assert_eq!(candidate_mint(&failed, &POLICY), Err(Error::NotValidTransaction));
}

#[test]
fn a_mint_of_something_else_starts_no_token() {
    // Another name minted, the token only burned, another policy.
    let other_name = parse_transaction(&mint_tx(&[("other", 1)], &[""])).unwrap();
    assert_eq!(candidate_mint(&other_name, &POLICY), Err(Error::TokenNotMinted));
    let burned = parse_transaction(&mint_tx(&[("", -1)], &[""])).unwrap();
    assert!(burned.minted.is_empty());
    assert_eq!(candidate_mint(&burned, &POLICY), Err(Error::TokenNotMinted));
    let minted = parse_transaction(&mint_tx(&[("", 1)], &[""])).unwrap();
    assert_eq!(candidate_mint(&minted, &[0x9b; 28]), Err(Error::TokenNotMinted));
}

#[test]
fn a_minted_token_must_sit_in_one_output() {
    let nowhere = parse_transaction(&mint_tx(&[("", 1)], &["other"])).unwrap();
    assert_eq!(candidate_mint(&nowhere, &POLICY), Err(Error::TokenNotFound));
    let twice = parse_transaction(&mint_tx(&[("", 2)], &["", ""])).unwrap();
    assert_eq!(candidate_mint(&twice, &POLICY), Err(Error::TokenNotFound));
}

#[test]
fn an_output_cannot_hold_a_negative_amount() {
    let mut bytes = mint_tx(&[("", 1)], &[""]);
    // The amount of the output's asset: the 0x01 after the empty name that follows the policy.
    let at = bytes.windows(31).position(|w| w[..28] == POLICY && w[28..] == [0xa1, 0x40, 0x01]).unwrap() + 30;
    bytes[at] = 0x20;
    assert_eq!(parse_transaction(&bytes), Err(Error::BadCbor));
}

#[test]
fn damaged_bytes_are_refused() {
    let mut bytes = tx_bytes();
    bytes.truncate(bytes.len() - 1);
    assert_eq!(parse_transaction(&bytes), Err(Error::BadCbor));
    assert_eq!(decode_candidates(&[0x83, 0x01, 0x02]), Err(Error::BadCbor));
    // A versioned datum with an unknown version.
    assert_eq!(decode_candidates(&[0x83, 0x80, 0x80, 0x02]), Err(Error::BadDatum));
}
