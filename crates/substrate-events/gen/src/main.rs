//! Fetches the metadata of a live runtime and writes `tables/<spec>.scale`: the type id of
//! `System::Events` and the types reachable from it, without docs.
//! cargo run --release -- <rpc url> <out dir>

use codec::{Decode, Encode};
use frame_metadata::v14::StorageEntryType;
use frame_metadata::{RuntimeMetadata, RuntimeMetadataPrefixed};
use serde_json::{Value, json};

fn rpc(url: &str, method: &str, params: Value) -> Value {
    let body = json!({ "id": 1, "jsonrpc": "2.0", "method": method, "params": params });
    let mut reply: Value = ureq::post(url).send_json(&body).unwrap().body_mut().read_json().unwrap();
    match reply.get_mut("result") {
        Some(r) => r.take(),
        None => panic!("{method}: {reply}"),
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let (url, out) = (&args[1], &args[2]);
    let head = rpc(url, "chain_getFinalizedHead", json!([]));
    let spec = rpc(url, "state_getRuntimeVersion", json!([head]))["specVersion"].as_u64().unwrap() as u32;
    let raw = hex::decode(rpc(url, "state_getMetadata", json!([head])).as_str().unwrap().trim_start_matches("0x")).unwrap();
    let RuntimeMetadata::V14(meta) = RuntimeMetadataPrefixed::decode(&mut &raw[..]).unwrap().1 else {
        panic!("metadata is not V14")
    };
    let system = meta.pallets.iter().find(|p| p.name == "System").unwrap();
    let events = system.storage.as_ref().unwrap().entries.iter().find(|e| e.name == "Events").unwrap();
    let StorageEntryType::Plain(root) = events.ty else { panic!("System::Events is a map") };

    check_pallet_indices(&meta.pallets, &meta.types, root.id);
    let mut types = meta.types;
    let ids = types.retain(|id| id == root.id);
    for t in types.types.iter_mut() {
        t.ty.docs.clear();
        visit_docs(&mut t.ty.type_def);
    }
    let table = (ids[&root.id], types).encode();
    let path = format!("{out}/{spec}.scale");
    std::fs::write(&path, &table).unwrap();
    println!("spec {spec} at {head}: {} bytes to {path}", table.len());
}

fn visit_docs(def: &mut scale_info::TypeDef<scale_info::form::PortableForm>) {
    use scale_info::TypeDef;
    match def {
        TypeDef::Composite(c) => c.fields.iter_mut().for_each(|f| { f.docs.clear(); f.type_name = None }),
        TypeDef::Variant(v) => v.variants.iter_mut().for_each(|v| {
            v.docs.clear();
            v.fields.iter_mut().for_each(|f| { f.docs.clear(); f.type_name = None });
        }),
        _ => {}
    }
}

// Each pallet's events must sit at its pallet index, which also prefixes its calls.
fn check_pallet_indices(pallets: &[frame_metadata::v14::PalletMetadata<scale_info::form::PortableForm>], types: &scale_info::PortableRegistry, root: u32) {
    use scale_info::TypeDef;
    let TypeDef::Sequence(s) = &types.resolve(root).unwrap().type_def else { panic!("events not a Vec") };
    let TypeDef::Composite(r) = &types.resolve(s.type_param.id).unwrap().type_def else { panic!("record") };
    let TypeDef::Variant(e) = &types.resolve(r.fields[1].ty.id).unwrap().type_def else { panic!("event") };
    for p in pallets.iter().filter(|p| p.event.is_some()) {
        let v = e.variants.iter().find(|v| v.name == p.name).unwrap();
        assert_eq!(v.index, p.index, "{}", p.name);
    }
}
