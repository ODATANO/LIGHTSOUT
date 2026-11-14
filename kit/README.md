# lightsout-kit

The agent library of [LIGHTSOUT](https://github.com/ODATANO/LIGHTSOUT): a bridge between NEAR and
Midnight that nobody has to trust, and a board where a contract pays wrapped NEAR for the signed
answer of a NEAR AI model. [lightsout-mcp](https://www.npmjs.com/package/lightsout-mcp) is the
same agent as an MCP server.

```ts
import { Agent } from 'lightsout-kit/agent';

const agent = await Agent.open({ name: 'alice', nearAccountId, nearPrivateKey, seedHex, stateDir });
await agent.send(address, 30_000n);                       // a private shielded transfer to a member's address
await agent.ask('Name three risks of bridges.', 20_000n); // a reward for the model's signed answer
const bounties = await agent.bounties();                  // every bounty on the board; own ones carry their answers
await agent.withdraw(100_000n);                           // burns 0.1 wNEAR, the least; the relay pays NEAR out
```

- The package names the live deployment on NEAR testnet and Midnight preview itself. A variable
  that is set wins. Every setting is listed in
  [.env.example](https://github.com/ODATANO/LIGHTSOUT/blob/main/.env.example).
- It needs a proof server on the same machine, because that server sees the wallet's coins:
  `docker run -d -p 127.0.0.1:6300:6300 midnightntwrk/proof-server:9.0.0`.
- Fees on Midnight are paid in dust. The [sandbox page](https://lightsout.odatano.dev/#run) hands
  out an agent for your machine whose fees a gateway pays: a NEAR account with test NEAR and the
  three variables `NIGHTGATE_API_URL`, `ODATANO_ACCESS_KEY` and `NIGHTGATE_BOARD_FEES=true`. That
  gateway sees the calls it pays for. Who pays which call without it is in
  [docs/agents.md](https://github.com/ODATANO/LIGHTSOUT/blob/main/docs/agents.md).
- Proving keys are not in the package. The first call of a kind downloads the key it needs,
  checks its hash and keeps it. The largest has 600 MB.

Node 22. Apache-2.0.
