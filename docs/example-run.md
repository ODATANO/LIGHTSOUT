# Example run

Real runs on Midnight Preview and NEAR testnet on 2026-11-11, with real proofs. Alice registers, brings NEAR to Midnight and pays Bob privately, and Bob takes it back to NEAR. On the board, Alice puts a reward on an AI answer and Bob earns it. A second reward finds no answer, and Alice takes it back.

| | |
|---|---|
| NEAR bridge | `bridge2.lightsout.odatano.testnet` |
| Midnight bridge | `cf6651170c4cd25bd0c2596c4b5cb0abdfcfafa4235556bb971b868aec7bc235` |
| Midnight board | `2007e0f1c58dd8784a5370838f01d16d36cc68a3b55986b16bdfafab8d95c4a4` |

These are the contracts of that day's deployment. The live one is named in the [README](../README.md#status).

Amounts are in NEAR and wNEAR. NEAR hashes link to the explorer. Midnight hashes can be looked up on the Preview indexer.

Sections 1 to 3 are one `npm run warm -- --agents alice,carol,dave,erin,frank,grace,heidi --fund 1`. It readied seven agents at once; the tables show Alice's calls.

## 1. Register and lock on NEAR

| Block time (UTC) | Call | Transaction | What it does |
|---|---|---|---|
| 16:57:14 | `register` | [`74T9WTKEaEB3m1rK5B2qNF6429ekjBUDC4rrSJ3hP7Hc`](https://testnet.nearblocks.io/txns/74T9WTKEaEB3m1rK5B2qNF6429ekjBUDC4rrSJ3hP7Hc) | Alice pays the registration fee and names a commitment that only her Midnight seed opens. This is registration 0. |
| 16:57:17 | `lock` | [`CVqRLzuMEfwS1L43ZExsZoCoC61kDQV9U3oB4hZFvXwe`](https://testnet.nearblocks.io/txns/CVqRLzuMEfwS1L43ZExsZoCoC61kDQV9U3oB4hZFvXwe) | Alice locks 1 NEAR for her shielded Midnight address. This is lock 0. |

## 2. Midnight follows NEAR

Midnight takes a registration or a lock only when it can prove it from NEAR's finality, so its contract first has to reach that block. Anyone can send these calls, and a header counts only with enough valid producer signatures.

The bridge was deployed that afternoon. A new bridge knows the block producers of the NEAR epoch after its start, so its first header had to wait until that epoch began, at about 19:10 UTC. Then one header was enough: 1 `propose`, 5 `approve` and 1 `accept` in five minutes.

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 19:11:36 | `propose` | 68168 | `fd7b6be2f368614cbf3aca13a74068a8bb8f2ab379ba13683e55354533c47105` | Proposes a newer NEAR block header. |
| 19:12:42 | `approve` | 68179 | `8122e4a6e31a04c5cb09ae9d3a2600f5bfe1854a9ca3fa41dc8da8a14108080b` | Checks one NEAR block producer's Ed25519 signature and counts its stake. |
| 19:16:30 | `accept` | 68217 | `258aad672c0f51c9c2dbf3b661ce3ebeefb18b974f8dce12dd8ae66e2a62dadd` | Makes the header the new head, once more than two thirds of the stake signed. |

<details>
<summary>The four further signatures</summary>

| Block time (UTC) | Call | Block | Transaction hash |
|---|---|---|---|
| 19:13:36 | `approve` | 68188 | `0526b0f136cabd1905168b1a685a56c7a547660ef605b658feebb1382fb5eaaa` |
| 19:14:24 | `approve` | 68196 | `017f4ae9395759eb815282c854a89209ff78196ded79f4c5e2369b26b25413c4` |
| 19:15:12 | `approve` | 68204 | `7177f461c5559052fefc8496c6dc1ba547cc7cfe0a55ce4f523804870609aed9` |
| 19:16:06 | `approve` | 68213 | `555be7161d9c831e433ad817b5751db19a99b766fbaa85c70ba51268232e18ba` |

</details>

## 3. Prove the registration and the lock, and mint

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 19:17:48 | `know` | 68230 | `704867ef1a4b0eb207d8e078e40e41247940f3ae48d37a738d529b4710791fae` | Records the NEAR block that holds the registration. The head commits to this block. |
| 19:18:54 | `prove_register` | 68241 | `5658c6a119289eaa3a8daa23a859ae6d47201d9e257e9474aa6b97ec49798cc1` | Proves the registration from the outcome of the NEAR call and adds Alice's commitment to the member tree. |
| 19:31:54 | `know` | 68371 | `a9b4f1f0ee1bf524e6c146a122b616286257848a395a2b51e85b3c72ea000288` | Records the NEAR block that holds the lock. |
| 19:33:06 | `prove_lock` | 68383 | `2f2e1d2c5659f3dc289762b007277a194556c3e3727b0b92ca603ca11ee85fb9` | Proves the lock from the outcome of the NEAR call. Amount and recipient come from this proof. |
| 19:33:42 | `mint` | 68389 | `311412c6d64eace14affc66586f2a1df90c19f4afd3c90349a805d5b4cc6d0e6` | Mints the wNEAR to its recipient, once. Only the recipient can send this call. |

Between the two proofs the run proved the registrations of the six other agents.

## 4. Private transfer

`npm run agent -- send --as alice --to <Bob's shielded address> --amount 0.1`

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 19:54:42 | `transfer` | 68599 | `5b67a287cfcf72ef26f9b30b82f288c834060e3db31a20bed99d2b4dcae63cda` | Alice sends 0.1 wNEAR to Bob as a plain shielded transfer. No contract is called. |

## 5. Burn on Midnight

`npm run agent -- withdraw --as bob --amount 0.1`

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 19:55:54 | `burn` | 68611 | `e187d99737aee323b6a77f830fcd2e9972399ecaed4ea1bae5ac944af47ba885` | Bob burns 0.1 wNEAR and names his NEAR account. The circuit checks that the name has the form of a NEAR account id. This is burn 0. |

## 6. Proof and payout on NEAR

The relay sent these calls. It holds no key that either contract trusts, and anyone can send them. The payout came 53 seconds after the burn's block.

| Block time (UTC) | Call | Transaction | What it does |
|---|---|---|---|
| 19:56:32 | `submit_midnight_finality` | [`7epxmUFUYzNmnRG2SMUCdvpoMyWaQFi2zLEPs4QiPPUZ`](https://testnet.nearblocks.io/txns/7epxmUFUYzNmnRG2SMUCdvpoMyWaQFi2zLEPs4QiPPUZ) | The NEAR contract verifies Midnight finality up to block 68615, past the burn in block 68611. |
| 19:56:44 | `prove_burn_tx` | [`F1Veda8kV5AF9YeMXoixVJWhWnVK3jPFFMcE4jMFCpdm`](https://testnet.nearblocks.io/txns/F1Veda8kV5AF9YeMXoixVJWhWnVK3jPFFMcE4jMFCpdm) | Proves burn 0 from its transaction in the finalized block. |
| 19:56:47 | `release` | [`Ee1GQELDYbGXn8yCLqjUnC82yLYXjZocn884AcX3scWW`](https://testnet.nearblocks.io/txns/Ee1GQELDYbGXn8yCLqjUnC82yLYXjZocn884AcX3scWW) | Pays out 0.1 NEAR to `bob.lightsout.odatano.testnet`. |

`npm run status` after these steps: 8 locks, 8 minted, 8 members, 1 burn paid out, 7.5 NEAR locked, 0.1 NEAR released, supply 7.4 wNEAR.

## 7. A reward for an AI answer

`npm run agent -- ask --as alice --prompt "..." --reward 0.02`, then `npm run solve -- --as bob --once`

Alice puts 0.02 wNEAR on the answer of `Qwen/Qwen3.8-27B` to "Name three risks of a token bridge, one short line each.". Before the call her agent attests the model's TEE: the Intel TDX quote, that it binds the ed25519 key `89154a43…cb2d93` and a fresh nonce, the compose manifest and the NVIDIA GPU. The bounty names that key.

Bob's solver first checks that the model still runs in a TEE with that key. Then it runs the request on NEAR AI. The TEE signs the model's name with the hashes of the request and the response. Bob seals the response as a drop of 12 blocks and answers the bounty with it.

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 20:23:24 | `post_bounty` | 68886 | `b2eb2d8614dd97954a4d8743d37d5459e0049329af1b4542ddba339396ee7ff9` | Alice posts bounty `72422bba…5c321c` with a member proof. The contract keeps the 0.02 wNEAR. |
| 20:25:00 | `seal_begin` | 68902 | `b3cc876cf9ca9c35665bdbe766966d0583e99f7bd7b31d076bcfbd2d618c2df8` | Bob opens drop `02dfc609…2d636d` for the response, with a member proof: the hash of its key, the SHA-256 hash and length of its content, and the wallet a reward is paid to. |
| 20:31:30 | `seal_finish` | 68967 | `7613a8341f17d750f27bb73cb4c78946176726c47ecf27fe3b5d708c72c0cd5f` | Stores the rest of the content with its SHA-256 padding. The result must be the response's SHA-256 hash, which seals the drop. |
| 20:33:00 | `answer_16` | 68982 | `56bd40f222a5ffcd47315ff7a47c161056b232126b8e0b0f0916cbb42673a82d` | Verifies the TEE's ed25519 signature over the bounty's request hash and the drop's content hash, hands the drop's key to Alice's one-time key and pays the reward to the drop's payout wallet, in one call. |
| 20:33:24 | `collect` | 68986 | `c21c7a257829f1236d25aad1e2f432d381a67b5096339680ee8ccaf70a81b070` | Moves the 0.02 wNEAR from the payout wallet to Bob's own address. |

<details>
<summary>The 11 full blocks before the last one</summary>

| Block time (UTC) | Call | Block | Transaction hash |
|---|---|---|---|
| 20:25:36 | `seal_block` | 68908 | `bf5eb05c44861dfaa72a605f23b36e3fdcb6593ea1796efab539c4109d8a745f` |
| 20:26:06 | `seal_block` | 68913 | `b7281da2b284ee1cb583dd9bf1b5211f9899647a46382dbae0a5ae9978076b5e` |
| 20:26:36 | `seal_block` | 68918 | `4bfa374e91cda332a8d95990e46f9d57503404c93d0da5c9142938742f897f64` |
| 20:27:06 | `seal_block` | 68923 | `84486fddeeb72a78b9b326906b47c46aa45f6061c3a76798cbe120ce3cc4db8c` |
| 20:27:42 | `seal_block` | 68929 | `381d802441c7f6b62e3dfb34fef0fbd72747d7e74e8e0313dd8f00d6bf1f4a4d` |
| 20:28:18 | `seal_block` | 68935 | `c13554635c32244909f12745bfd7b8d45e26d54eae2302a0c3014546cf889164` |
| 20:28:48 | `seal_block` | 68940 | `2ae82f88509e609c63961941e1aab76d229804fa896b4af8ef8c76f4c02e7250` |
| 20:29:18 | `seal_block` | 68945 | `a62fedc19e5f0c04370a392c42e85e2f43a221f7163bdb093480bb5d8365a641` |
| 20:29:48 | `seal_block` | 68950 | `9a9f547be7deb38d0835d2187a2e41f1829a471b70ed0b332bb5e888c4b59d0b` |
| 20:30:18 | `seal_block` | 68955 | `8806a8640b325995f9206c412e6a1312c7a27a2381f26a090dbf0872841d0f92` |
| 20:30:48 | `seal_block` | 68960 | `54ae42a089695bb6312350c6bbfae82d4282464647f9cca524127ce50dab4fbe` |

</details>

Alice's `bounties` then opened the answer:

> Smart contract vulnerabilities allow attackers to exploit code bugs and drain funds.
> Centralization risks arise when trusted validators can censor transactions or double-spend tokens.
> Economic attacks occur if the incentive structure fails to deter malicious arbitrage or under-collateralization.

The board shows the question, the model, the reward and that the bounty was answered. It shows neither Alice nor Bob, and not the answer.

## 8. A reward that nobody answers

`npm run agent -- ask --as alice --prompt "..." --reward 0.005 --deadline 2`, then `refund` and `collect`

Alice puts 0.005 wNEAR on the answer to "What is a light client, in one sentence?" with a deadline two minutes ahead. Bob's solver works for 0.01 wNEAR or more and left it alone.

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 20:24:18 | `post_bounty` | 68895 | `5b50443927a68926ad41f86ac2d3b9eb9d4ab1082ad2dac7418c766f29e902e3` | Alice posts bounty `3d5bcef8…693b4b` with a member proof. The contract keeps the 0.005 wNEAR. |
| 20:27:42 | `refund_bounty` | 68929 | `163bcd0af26824c1602cc1bbf57b30a670e34836e02cb26e01e8a1881fe89356` | The deadline has passed, so the contract pays the reward to the refund wallet the bounty names. |
| 20:28:30 | `collect` | 68937 | `fc36bb46a88568c1ed7bdeb312a072959f4634dc0d922cc1541abd7420d639b2` | Moves the 0.005 wNEAR from the refund wallet to Alice's own address. |

## Not part of these runs

The deploys of the bridge and of the board and the relay's first run, which followed Midnight from its genesis, all earlier on 2026-11-11.
