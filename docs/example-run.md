# Example run

Real runs on Midnight Preview and NEAR testnet on 2026-11-14, with real proofs. Alice registers, brings NEAR to Midnight and pays Carol privately, and Carol takes it back to NEAR. On the board, Alice puts a reward on an AI answer and Bob earns it. A second reward finds no answer, and Alice takes it back.

| | |
|---|---|
| NEAR bridge | `oda_bridge.odatano.testnet` |
| Midnight bridge | `5c39479a5666072e78c7af78a15156ccf9584302a863a6a512e72a29294084ee` |
| Midnight board | `43ec11c09a17c848e751e6bd3a4347d4378610ac6ff1dbcdfbe270e38e98f44f` |

Amounts are in NEAR and wNEAR. NEAR hashes link to the explorer. Midnight hashes can be looked up on the Preview indexer.

Sections 1 to 3 are one `npm run warm -- --agents alice,carol,dave,erin,frank,grace,heidi --fund 1`. It readied seven agents at once; the tables show Alice's calls.

## 1. Register and lock on NEAR

| Block time (UTC) | Call | Transaction | What it does |
|---|---|---|---|
| 04:22:09 | `register` | [`ns11sDLhK89RENp4U2UtsRTB3DqoTVa6e3EXmYGtzed`](https://testnet.nearblocks.io/txns/ns11sDLhK89RENp4U2UtsRTB3DqoTVa6e3EXmYGtzed) | Alice pays the registration fee and names a commitment that only her Midnight seed opens. This is registration 1. |
| 04:22:18 | `lock` | [`HTSe2TMrxRquDFL2d4fMBbGd33PFpMjzMw5763YdFE6A`](https://testnet.nearblocks.io/txns/HTSe2TMrxRquDFL2d4fMBbGd33PFpMjzMw5763YdFE6A) | Alice locks 1 NEAR for her shielded Midnight address. This is lock 1. |

## 2. Midnight follows NEAR

Midnight takes a registration or a lock only when it can prove it from NEAR's finality, so its contract first has to reach that block. Anyone can send these calls, and a header counts only with enough valid producer signatures.

The bridge was deployed the evening before. A new bridge knows the block producers of the NEAR epoch after its start, so its first header had to wait until that epoch began, at 03:29 UTC. For the seven agents' calls one more header was enough: 1 `propose`, 5 `approve` and 1 `accept` in 5 minutes.

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 04:23:54 | `propose` | 102429 | `cf4c51e70c6554b22af217fb361428c7844c361a6de4d2f79c1b6f0998aa6b6b` | Proposes a newer NEAR block header. |
| 04:24:48 | `approve` | 102438 | `e700b52ed1a7424c14bc3793e3bb089c9201777ca6481c7824d65d16e338c475` | Checks one NEAR block producer's Ed25519 signature and counts its stake. |
| 04:29:12 | `accept` | 102482 | `d81a897e55d04a6811c71e8df2aef930184d5dbca05357960bf99dcb11a70a3b` | Makes the header the new head, once more than two thirds of the stake signed. |

<details>
<summary>The 4 further signatures</summary>

| Block time (UTC) | Call | Block | Transaction hash |
|---|---|---|---|
| 04:25:54 | `approve` | 102449 | `45fb69f6b81434a72eb02ee3c09c8c5ad80cca08e17182aabfbb08e3dc9134b5` |
| 04:26:48 | `approve` | 102458 | `ae3214d61e401663796aa89be0ab7f651f515c4b88a1ca3ba7e31388d2e07cf7` |
| 04:27:48 | `approve` | 102468 | `2ae65c961a5d8e62527fbeec2b8de80a68ca44b47d69b61f8c72b8f22d3cdbfa` |
| 04:28:42 | `approve` | 102477 | `d5ffc5d6bcc4c1392668d7e10e1371b9244445a8b31d162f3255d7987f362bb8` |

</details>

## 3. Prove the registration and the lock, and mint

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 04:30:36 | `know` | 102496 | `13cb947dfacf75414f9d349d46781864955adb7a3853ab1668eac8bb16e5cbe7` | Records the NEAR block that holds the registration. The head commits to this block. |
| 04:31:54 | `prove_register` | 102509 | `464bda73be22442e9d1000e5ce8352b9f48ac20231f416943f406d8f4c8ad8df` | Proves the registration from the outcome of the NEAR call and adds Alice's commitment to the member tree. |
| 04:45:42 | `know` | 102647 | `5d1b4a8be08bc938c94dd16430987ee1366a5a7edeedf203aca289b983e9b929` | Records the NEAR block that holds the lock. |
| 04:46:54 | `prove_lock` | 102659 | `ec89b3366ced73538279eb3b6f2eef990b614f3669a8c9cf73cc1bae516a9bdb` | Proves the lock from the outcome of the NEAR call. Amount and recipient come from this proof. |
| 04:47:30 | `mint` | 102665 | `ad1508688ab303c7c4fc30a1ec7c3c5765c9f26e1de68edf313fb0d2ee02d22d` | Mints the wNEAR to its recipient, once. Only the recipient can send this call. |

Between the two proofs the run proved the registrations of the six other agents.

## 4. Private transfer

`npm run agent -- send --as alice --to <Carol's shielded address> --amount 0.1`

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 05:23:36 | `transfer` | 103026 | `06b9a2e3dabbf5979fb9a5a336696faec538eebff6fc98f5a3d62178e4e730bd` | Alice sends 0.1 wNEAR to Carol as a plain shielded transfer. No contract is called. |

## 5. Burn on Midnight

`npm run agent -- withdraw --as carol --amount 0.1`

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 05:32:12 | `burn` | 103112 | `9aa8d710faf80052052fabeb28d4a6fcb81d8c92b808043d123e5b43547fdc0d` | Carol burns 0.1 wNEAR and names her NEAR account. The circuit checks that the name has the form of a NEAR account id. This is burn `1f3859c5…0193bf`. |

## 6. Proof and payout on NEAR

The relay sent these calls. It holds no key that either contract trusts, and anyone can send them. The payout came 59 seconds after the burn's block.

| Block time (UTC) | Call | Transaction | What it does |
|---|---|---|---|
| 05:32:57 | `submit_midnight_finality` | [`GZePEXpfXo3ZSzJAuoYhxYRdLn4fR46uQGMnNQhRX5Ce`](https://testnet.nearblocks.io/txns/GZePEXpfXo3ZSzJAuoYhxYRdLn4fR46uQGMnNQhRX5Ce) | The NEAR contract verifies Midnight finality past the burn in block 103112. |
| 05:33:08 | `prove_burn_tx` | [`12iznLr3UKRqHhMsJuJ33sDXhEJ9ScwKMnnK1mLhKTJk`](https://testnet.nearblocks.io/txns/12iznLr3UKRqHhMsJuJ33sDXhEJ9ScwKMnnK1mLhKTJk) | Proves the burn from its transaction in the finalized block. |
| 05:33:11 | `release` | [`7gAM7CYxyyy4JJzDaXZtomf5MHE3GA2HdTXALX2f8hro`](https://testnet.nearblocks.io/txns/7gAM7CYxyyy4JJzDaXZtomf5MHE3GA2HdTXALX2f8hro) | Pays out 0.1 NEAR to `carol.lightsout.odatano.testnet`. |

## 7. A reward for an AI answer

`npm run agent -- ask --as alice --prompt "..." --reward 0.02`, answered by `npm run solve -- --as bob`

Alice puts 0.02 wNEAR on the answer of `Qwen/Qwen3.8-27B` to "Name three risks of a token bridge, one short line each.". Before the call her agent attests the model's TEE: the Intel TDX quote, that it binds the ed25519 key `89154a43…cb2d93` and a fresh nonce, the compose manifest and the NVIDIA GPU. The bounty names that key.

Bob's solver first checks that the model still runs in a TEE with that key. Then it runs the request on NEAR AI. The TEE signs the model's name with the hashes of the request and the response. Bob seals the response as a drop of 11 blocks and answers the bounty with it.

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 05:24:42 | `post_bounty` | 103037 | `7ca005d78e4a6549194718e0c9747d43caad917b77a7edf6a1adc567d0f095fc` | Alice posts bounty `473aaad7…590461` with a member proof. The contract keeps the 0.02 wNEAR. |
| 05:33:18 | `seal_begin` | 103123 | `201f1b2597d651a8362dcd1e4dc92922ae0b53e72b2aa05a9e4bc6c09e39c5df` | Bob opens drop `8d8789a3…36f280` for the response, with a member proof: the hash of its key, the SHA-256 hash and length of its content, and the wallet a reward is paid to. |
| 05:41:12 | `seal_finish` | 103202 | `6175403da7a9f16993d71bca255f53d0bc8a630694ce82ea392513f635ffaf09` | Stores the rest of the content with its SHA-256 padding. The result must be the response's SHA-256 hash, which seals the drop. |
| 05:42:48 | `answer_16` | 103218 | `a0189152054fec8dea62b783fdca51c2905b9507df32a3c5b4067fdbe78d2b9a` | Verifies the TEE's ed25519 signature over the bounty's request hash and the drop's content hash, hands the drop's key to Alice's one-time key and pays the reward to the drop's payout wallet, in one call. |
| 05:54:48 | `collect` | 103338 | `f2de07fa8b0d5811aaf17041c5be92f08bd69ac262c910303a7a14d18b5d3aa8` | Moves a reward of 0.02 wNEAR from its payout wallet to Bob's own address. The solver collected three rewards in a row, one transaction each. |

<details>
<summary>The 10 full blocks before the last one</summary>

| Block time (UTC) | Call | Block | Transaction hash |
|---|---|---|---|
| 05:34:00 | `seal_block` | 103130 | `a8cc251c2e3bc5e590244071d132a2a93fde9323ee9d3d5ad7d9d1871a8163af` |
| 05:34:42 | `seal_block` | 103137 | `013ed9ca4b201596135f8c2369ef5a5ce561b00c68df4528f7cca09cf415912c` |
| 05:35:24 | `seal_block` | 103144 | `b7bd1c061ba470d3a0761b6578dc1cfad3e2b652dba700a43578391345975c8c` |
| 05:36:06 | `seal_block` | 103151 | `4864ed9f8819575dd1bd43c157f97916dfab9f6ad2591a7ecdac8350dbdc25bc` |
| 05:37:06 | `seal_block` | 103161 | `dccd6c73aaaf17d9a1fc5e18e68ef11b87247344aa591356e86d2600e735ae8d` |
| 05:37:48 | `seal_block` | 103168 | `0712148fc5abf205b4e4cd4114eba3927a6e96c3d2804acadbdd88823d70e7cf` |
| 05:38:30 | `seal_block` | 103175 | `16fe21ac1e73c5b405d23f67c9f69c98196087b020facd46862e04b0bf8b184c` |
| 05:39:06 | `seal_block` | 103181 | `0d539373622e543a7dd80f08c6b754683d433fd999e5771876a12265ef1546ef` |
| 05:39:42 | `seal_block` | 103187 | `71f7a223652e5cd5cc52499165da46dbe29861e32edc5f94ace004a31aed8a3d` |
| 05:40:24 | `seal_block` | 103194 | `bf8ab1db7d7c27790fdaf06d8c8d2b4404daae121d2b0705d0739b58fe3e93f4` |

</details>

Alice's `bounties` then opened the answer:

> Smart contract vulnerabilities enable malicious exploits and fund theft.
> Centralization risks arise when few validators control bridge operations.
> Fiduciary or custodial failures can lead to delayed withdrawals or loss of assets.

The board shows the question, the model, the reward and that the bounty was answered. It shows neither Alice nor Bob, and not the answer.

## 8. A reward that nobody answers

`npm run agent -- ask --as alice --prompt "..." --reward 0.005 --deadline 2`, then `refund` and `collect`

Alice puts 0.005 wNEAR on the answer to "What is a light client, in one sentence?" with a deadline two minutes ahead. Bob's solver works for 0.01 wNEAR or more and left it alone.

| Block time (UTC) | Call | Block | Transaction hash | What it does |
|---|---|---|---|---|
| 05:25:54 | `post_bounty` | 103049 | `4509ae95521266df148e822ac7d1827c45fee3cdf2c84e2aee602e935c2d4516` | Alice posts bounty `a5bb5907…baaa50` with a member proof. The contract keeps the 0.005 wNEAR. |
| 05:28:48 | `refund_bounty` | 103078 | `2b8355756e4fa96c46fcb7aff93bfe91cbe7ed5fabacd3c712b911f8b06fca3b` | The deadline has passed, so the contract pays the reward to the refund wallet the bounty names. |
| 05:29:54 | `collect` | 103089 | `ce707be834128e1fdb687d6a6d2e99597767273ccfcd4f7ab61c2309dc6bc558` | Moves the 0.005 wNEAR from the refund wallet to Alice's own address. |

## Not part of these runs

The deploys of the bridge and of the board on 2026-11-13, and the relay's first run that night, which followed Midnight from its genesis.
