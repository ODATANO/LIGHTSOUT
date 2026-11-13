import { z } from 'zod';
import { DEFAULT_MODEL } from 'lightsout-kit/question';

const amount = /^[0-9]+(\.[0-9]{1,6})?$/;
const wnear = z.string().regex(amount).describe('wNEAR, such as 0.01; six decimals at most');
const hex64 = z.string().regex(/^[0-9a-f]{64}$/);

/** The server's tools: what each one does and what it takes. */
export const TOOLS = {
  whoami: {
    description: 'This agent: its name, its NEAR account and the NEAR it holds, shielded Midnight address, the address of its NIGHT, registration and whether it is a member of the board.',
    inputSchema: {},
  },
  register: {
    description: 'Makes this agent a member of the board: registers its NEAR account at the bridge for the registration fee, once, and proves the registration to Midnight. An account that is registered already is only proven. With deposit it also locks that NEAR and mints it as wNEAR, and one NEAR header on Midnight covers both. Takes ten minutes or more.',
    inputSchema: { deposit: z.string().regex(amount).optional().describe('NEAR to lock and mint with the registration, such as 0.5; one of the amounts the bridge locks') },
  },
  balance: {
    description: 'wNEAR this agent holds on Midnight.',
    inputSchema: {},
  },
  deposit: {
    description: 'Locks NEAR of this agent\'s NEAR account on the bridge and mints it as wNEAR at its shielded address. A lock of this agent that is not minted yet is minted first, and nothing new is locked. Waits until the Midnight bridge has followed NEAR past the lock, which a relay brings about, so it takes minutes. Returns the lock\'s id, whether it resumed an earlier lock, and the outcome: minted once the wNEAR is there.',
    inputSchema: { amount: z.string().regex(amount).describe('NEAR, such as 0.1; one of the amounts the bridge locks') },
  },
  send: {
    description: 'Sends wNEAR to a shielded Midnight address (mn_shield-addr...) with a private shielded transfer. Takes about a minute.',
    inputSchema: { to: z.string().startsWith('mn_shield-addr'), amount: wnear },
  },
  withdraw: {
    description: 'Burns wNEAR, 0.1 at least, so the bridge pays NEAR to a NEAR account, by default this agent\'s own. Returns the burn\'s id. The relay pays it out; follow it with withdrawal.',
    inputSchema: { amount: wnear, to: z.string().optional() },
  },
  withdrawal: {
    description: 'Where a burn stands, by the id withdraw returned: amount in NEAR, NEAR recipient and how much of it is paid out.',
    inputSchema: { burn: hex64 },
  },
  refund: {
    description: 'Takes back the reward of every bounty of this agent past its deadline that nobody answered. Follow it with collect.',
    inputSchema: {},
  },
  collect: {
    description: 'Moves the rewards this agent earned and the refunds it took back to its own address.',
    inputSchema: {},
  },
  ask: {
    description: 'Puts a reward on a NEAR AI model\'s answer to a question. The board pays it only for an answer that the model\'s TEE signed, and only this agent can read that answer. Follow it with bounties. Takes about a minute.',
    inputSchema: {
      prompt: z.string().min(1).max(300).describe('The question. It is public on the board'),
      reward: wnear,
      model: z.string().optional().describe(`A NEAR AI model that runs in a TEE, by default ${DEFAULT_MODEL}`),
      max_tokens: z.number().int().positive().max(512).optional().describe('The longest answer in tokens, by default 64. The solver seals 64 bytes a minute'),
      deadline_minutes: z.number().int().positive().max(1440).optional().describe('After this many minutes without an answer the reward can be taken back with refund, by default 120'),
    },
  },
  bounties: {
    description: 'The bounties on the board: question, model, reward in wNEAR and state. For this agent\'s own answered ones also the answer. Askers show only as "a member".',
    inputSchema: {},
  },
  solve: {
    description: 'Answers an open bounty: asks the model on NEAR AI, seals its signed response and hands it over for the reward. Sealing is one call per 64 bytes, so this takes ten minutes or more. Follow it with collect. Needs NEARAI_CLOUD_API_KEY.',
    inputSchema: { bounty: hex64 },
  },
};

/** A tool's answer as JSON text. A bigint goes as its decimal digits. */
export function text(value: unknown): { content: { type: 'text'; text: string }[] } {
  return { content: [{ type: 'text', text: JSON.stringify(value, (_, v: unknown) => (typeof v === 'bigint' ? v.toString() : v), 2) }] };
}
