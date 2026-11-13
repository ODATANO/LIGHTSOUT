import { chain, network, proofServer, readBridge } from './bridge.js';
import type { OwnAnswer } from './board/book.js';
import { KEY_PLACES, MAX_BOUNTY_SECONDS, bountiesOf, bountyId, bountyTerms } from './board/bounty.js';
import { sealOwnDrop } from './board/drops.js';
import { keyPair } from './board/handover.js';
import { DEFAULT_ANSWER_TOKENS, DEFAULT_MODEL, MAX_ANSWER_TOKENS, questionRequest } from './board/question.js';
import { openSession, type Session } from './board/session.js';
import { collectPayout } from './board/payout.js';
import { answerBounty, answeredKey, contentOf, newDrop, payoutSeed, postBounty, refundBounty, refundSeed } from './board/trade.js';
import { decodeNearRecipient, LEAST_BURN, nearOf, YOCTO_PER_UNIT } from './codec.js';
import { env } from './env.js';
import { coinSecretKey } from './keys.js';
import { attestedKeys, signedAnswer } from './inference/inference.js';
import { answerIn, promptIn } from './inference/nearai.js';
import { runtimeSigns } from './midnight-finality.js';
import { canReceive, nearBalance, type ProvenBurn, type Registration, viewBridge } from './near.js';
import { reasonOf } from './reason.js';
import { Purse } from './purse.js';
import { type AgentIdentity, stateFileOf } from './roles.js';
import { boardTidy } from './tidy.js';

type Say = (line: string) => void;
const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

export interface AgentOptions {
  proofServerUrl?: string; // default MIDNIGHT_PROOF_SERVER_URL; sees the coins of the wallet it proves for
  say?: Say; // default stderr; progress lines
}

export { DEFAULT_MODEL };
const DEFAULT_DEADLINE_MINUTES = 120;
// A payout wallet that was empty is looked at once more after this long, in case it was behind.
const EMPTY_AGAIN_MS = 10 * 60_000;

export interface AskOptions {
  model?: string; // a NEAR AI model that runs in a TEE; default DEFAULT_MODEL
  maxTokens?: number; // default 64; sealing the answer costs the solver a call per 64 bytes
  deadlineMinutes?: number; // default 120; the reward can be taken back after it
  publish?: boolean; // default true; false keeps the question off the board, to hand to a solver another way
}

export interface Bounty {
  id: string; // 64 hex
  model: string;
  prompt?: string; // the question, when the board or this agent's book has the request
  reward?: bigint; // units of wNEAR, while the board keeps it
  deadline: number; // Unix seconds; a refund is possible after it
  state: 'open' | 'overdue' | 'answered' | 'refunded'; // overdue = unanswered past the deadline
  mine: boolean; // posted by this agent
  answer?: string; // the model's text; with answered and mine
}

export interface Withdrawal {
  id: string; // 64 hex; the hash of the burned coin
  amount: bigint; // micro-NEAR
  to: string; // NEAR account
  paid: bigint; // micro-NEAR; paid out on NEAR or on its way; the bridge pays a large burn over days
}

// One agent with its wallets open. A call sends one Midnight transaction. `solve`, `refund`,
// `collect` and `tidy` send one per item. None waits for another party: `npm run warm` before
// and `npm run relay` beside do the slow steps.
export class Agent {
  private constructor(
    readonly identity: AgentIdentity,
    private readonly bridge: string,
    private readonly purse: Purse,
    private readonly session: Session,
    private readonly proofServerUrl: string | undefined,
    private readonly say: Say,
  ) {}

  /** Opens both wallets of the agent and catches them up from their saved state. */
  static async open(identity: AgentIdentity, opts: AgentOptions = {}): Promise<Agent> {
    const say = opts.say ?? ((line: string) => console.error(line));
    const proofServerUrl = opts.proofServerUrl ?? (await proofServer());
    const bridge = env('MIDNIGHT_BRIDGE');
    const purse = await Purse.open({ seedHex: identity.seedHex, bridge, stateFile: stateFileOf(identity, network, 'swap'), proofServerUrl });
    try {
      return new Agent(identity, bridge, purse, await openSession(identity), proofServerUrl, say);
    } catch (e) {
      await purse.close();
      throw e;
    }
  }

  /** The shielded address others pay to. */
  get address(): string {
    return this.purse.address;
  }

  /** The unshielded address of the agent's NIGHT, which generates the dust that pays its board calls. */
  get nightAddress(): string {
    return this.session.identity.addresses.night;
  }

  /** Who this agent is: its accounts and addresses, the NEAR its account holds, and its membership. */
  async whoami(): Promise<{ name: string; nearAccount: string; near: string; address: string; nightAddress: string; registration?: Registration; member: boolean }> {
    const near = nearOf((await nearBalance(this.identity.nearAccountId)) / YOCTO_PER_UNIT);
    return { name: this.identity.name, nearAccount: this.identity.nearAccountId, near, address: this.address, nightAddress: this.nightAddress, ...(await this.membership()) };
  }

  /** The agent's registration on NEAR, and whether the Midnight bridge has it in its member tree. */
  async membership(): Promise<{ registration?: Registration; member: boolean }> {
    const registration = await viewBridge<Registration>('get_registration', { account: this.identity.nearAccountId });
    if (!registration) return { member: false };
    return { registration, member: (await readBridge(this.bridge)).joined.member(BigInt(registration.index)) };
  }

  /** wNEAR in micro-NEAR. */
  balance(): Promise<bigint> {
    return this.purse.balance();
  }

  /** Sends wNEAR to a shielded address. Returns the Midnight transaction. */
  send(to: string, amount: bigint): Promise<string> {
    return this.purse.send(to, amount);
  }

  /** Burns wNEAR for a NEAR account, by default the agent's own. The relay pays it out on NEAR. Returns the Midnight transaction and the burn's id. */
  async withdraw(amount: bigint, to = this.identity.nearAccountId): Promise<{ tx: string; id: string }> {
    if (amount < LEAST_BURN) throw new Error(`a burn is at least ${nearOf(LEAST_BURN)} wNEAR`);
    // A burn cannot be taken back, and NEAR pays it only to an account that exists.
    if (!(await canReceive(to))) throw new Error(`NEAR has no account ${to}`);
    // NEAR pays a burn once it can read the burn's block, which needs a table for that block's runtime.
    const signs = await runtimeSigns();
    if (signs.authorized) throw new Error('Midnight has authorized a runtime upgrade. A burn made now can land after it; burn again once the bridge reads the new runtime');
    if (!(await viewBridge<number>('get_runtime_table_count', { spec: signs.spec }))) throw new Error(`the bridge has no table for Midnight runtime ${signs.spec} yet, so it could not pay a burn made now`);
    return this.purse.withdraw(amount, to);
  }

  /** Where the burn with this id stands, 64 hex. The Midnight bridge keeps a burn until a later one takes its place; NEAR keeps it once it is proven there. */
  async withdrawal(id: string): Promise<Withdrawal> {
    if (!/^[0-9a-f]{64}$/.test(id)) throw new Error('a burn is named by its id of 64 hex digits');
    const proven = await viewBridge<ProvenBurn>('get_proven_burn', { burn_id: id });
    if (proven) return { id, amount: BigInt(proven.amount) / YOCTO_PER_UNIT, to: proven.near_recipient, paid: BigInt(proven.paid) / YOCTO_PER_UNIT };
    const burns = (await readBridge(this.bridge)).burns;
    const place = BigInt(Number.parseInt(id.slice(0, 2), 16));
    const kept = burns.member(place) ? burns.lookup(place) : undefined;
    if (!kept || hex(kept.id) !== id) throw new Error(`neither bridge shows burn ${id}`);
    return { id, amount: kept.value, to: decodeNearRecipient(kept.near_recipient), paid: 0n };
  }

  /**
   * Puts a reward on a NEAR AI model's answer to a question. The board pays it only for an answer
   * that one of the model's attested TEE keys signed, and hands that answer to this agent alone.
   */
  async ask(prompt: string, reward: bigint, opts: AskOptions = {}): Promise<{ bounty: string; tx: string }> {
    const { board, book } = this.session;
    const model = opts.model ?? DEFAULT_MODEL;
    const maxTokens = opts.maxTokens ?? DEFAULT_ANSWER_TOKENS;
    const minutes = opts.deadlineMinutes ?? DEFAULT_DEADLINE_MINUTES;
    // Refused before anything is attested, kept or paid.
    const request = questionRequest(prompt, model, maxTokens);
    if (reward <= 0n) throw new Error('a bounty needs a reward');
    if (!Number.isInteger(minutes) || minutes < 1) throw new Error(`a deadline is a whole number of minutes, not ${minutes}`);
    if (minutes * 60 > MAX_BOUNTY_SECONDS) throw new Error('the board takes a deadline of 30 days at most');
    const keys = await attestedKeys(model, this.say);
    const terms = bountyTerms(model, Buffer.from(request, 'utf8'), keys.slice(0, KEY_PLACES), opts.publish ?? true);
    const buyer = keyPair();
    const deadline = (await board.time()) + minutes * 60;
    const refundTo = (await this.session.refund(buyer.secret.toString())).identity.shieldedKeys.coinPublicKey;
    const bounty = hex(bountyId({ terms, buyer: buyer.point, refundTo: Buffer.from(refundTo, 'hex'), deadline: BigInt(deadline), reward }));
    // Kept before the coin leaves the wallet: only this secret opens the answer and finds the refund.
    book.bounties.push({ board: board.address, bounty, secret: buyer.secret.toString(), deadline: deadline.toString(), request });
    await this.session.keep();
    const posted = await postBounty(board, this.session.secret, terms, reward, buyer, refundTo, BigInt(deadline));
    return { bounty: posted.bounty, tx: posted.landed.tx };
  }

  /** The bounties on the board, with the answer of each one of this agent's that was answered. */
  async bounties(): Promise<Bounty[]> {
    const { board, book } = this.session;
    const [state, now] = [await board.state(), await board.time()];
    const own = new Map(book.bounties.filter((b) => b.board === board.address).map((b) => [b.bounty, b]));
    return bountiesOf(state).map((b) => {
      const mine = own.get(b.id);
      const deadline = Number(b.deadline);
      const handed = mine ? answeredKey(state, b.id, BigInt(mine.secret)) : undefined;
      const answer = handed ? answerIn(contentOf(state, handed.drop, handed.key)) : undefined;
      const stands = b.answer ? ('answered' as const) : b.reward === undefined ? ('refunded' as const) : now > deadline ? ('overdue' as const) : ('open' as const);
      return { id: b.id, model: b.model, prompt: promptIn(b.request ?? mine?.request ?? ''), reward: b.reward, deadline, state: stands, mine: mine !== undefined, answer };
    });
  }

  /**
   * Answers an open bounty: runs its request on NEAR AI, seals the response as a drop and hands
   * it over for the reward. A run that stopped goes on from the drop it left. `signal` stops it
   * between two calls.
   */
  async solve(bounty: string, signal?: AbortSignal): Promise<{ bounty: string; drop: string; tx: string }> {
    const { board, book } = this.session;
    const open = async () => {
      const wanted = bountiesOf(await board.state()).find((b) => b.id === bounty);
      if (!wanted) throw new Error(`the board has no bounty ${bounty}`);
      if (wanted.reward === undefined) throw new Error(`bounty ${bounty} is not open`);
      return { ...wanted, reward: wanted.reward };
    };
    let own = book.answers.find((a) => a.board === board.address && a.bounty === bounty);
    if (!own) own = await this.answerFor(await open());
    if (own.paid) throw new Error(`this agent has answered bounty ${bounty}`);
    const drop = book.drops.find((d) => d.board === board.address && d.id === own.drop);
    if (!drop) throw new Error(`the book lacks drop ${own.drop} of the answer`);
    await sealOwnDrop(this.session, drop, this.say, signal);
    signal?.throwIfAborted();
    // Sealing takes minutes, in which another answer can land.
    await open();
    const landed = await answerBounty(board, drop, bounty, own.model, Buffer.from(own.signature, 'hex'), Buffer.from(own.key, 'hex'), (await this.session.payout(drop)).shieldedKeys);
    own.paid = true;
    await this.session.keep();
    return { bounty, drop: own.drop, tx: landed.tx };
  }

  // Asks the model and keeps its signed response as a drop of this agent, not on the board yet.
  private async answerFor(wanted: { id: string; model: string; request?: Buffer; keys: string[] }): Promise<OwnAnswer> {
    const { board, book } = this.session;
    if (!wanted.request) throw new Error(`bounty ${wanted.id} does not publish its request`);
    const request = wanted.request.toString('utf8');
    const asked = JSON.parse(request) as { model?: unknown; max_tokens?: unknown; stream?: unknown };
    if (asked.model !== wanted.model) throw new Error(`the request of bounty ${wanted.id} asks another model than it names`);
    if (asked.stream === true || typeof asked.max_tokens !== 'number' || asked.max_tokens > MAX_ANSWER_TOKENS) {
      throw new Error(`the request of bounty ${wanted.id} must not stream and must ask for at most ${MAX_ANSWER_TOKENS} tokens`);
    }
    // The completion costs money, and the board pays only for a key the bounty names.
    const running = new Set((await attestedKeys(wanted.model)).map(hex));
    if (!wanted.keys.some((key) => running.has(key))) throw new Error(`no TEE of ${wanted.model} signs with a key that bounty ${wanted.id} names`);
    const signed = await signedAnswer(wanted.model, request);
    if (!wanted.keys.includes(hex(signed.key))) throw new Error(`the TEE signed with key ${hex(signed.key)}, which bounty ${wanted.id} does not name`);
    const drop = newDrop(board.address, signed.response);
    const own: OwnAnswer = { board: board.address, bounty: wanted.id, drop: drop.id, model: wanted.model, signature: hex(signed.signature), key: hex(signed.key), paid: false };
    book.drops.push(drop);
    book.answers.push(own);
    await this.session.keep();
    return own;
  }

  /** Takes back the reward of every bounty of this agent that is past its deadline and unanswered. */
  async refund(): Promise<{ bounty: string; tx: string }[]> {
    const { board, book } = this.session;
    const own = new Map(book.bounties.filter((b) => b.board === board.address).map((b) => [b.bounty, b]));
    const done: { bounty: string; tx: string }[] = [];
    let failed: unknown;
    for (const b of await this.bounties()) {
      const mine = own.get(b.id);
      if (!mine || b.state !== 'overdue') continue;
      try {
        // The board refunds only to a call that knows the coin secret key of the refund wallet.
        const { identity, seedHex } = await this.session.refund(mine.secret);
        done.push({ bounty: b.id, tx: (await refundBounty(board, b.id, identity.shieldedKeys, coinSecretKey(seedHex))).tx });
      } catch (e) {
        failed ??= e;
        this.say(`the reward of bounty ${b.id} did not come back: ${reasonOf(e)}`);
      }
    }
    // What came back is returned also when another one failed. With nothing back the failure is the answer.
    if (failed !== undefined && done.length === 0) throw failed;
    return done;
  }

  /** Removes from the board what is of no use any more, at most `most` calls. Anyone can; it keeps the board's state small. Returns the transactions. */
  async tidy(most = 3): Promise<string[]> {
    const { board } = this.session;
    const txs: string[] = [];
    for (const call of boardTidy(await board.state(), BigInt(await board.time())).slice(0, most)) txs.push((await board.call(call)).tx);
    return txs;
  }

  /**
   * Moves the rewards and refunds the board paid this agent to its own address. Each one sits in
   * a wallet of its own, which is left alone once it is emptied. `all` opens every one again.
   */
  async collect(opts: { all?: boolean } = {}): Promise<{ total: bigint; txs: string[] }> {
    const { board, book, seed, identity } = this.session;
    const state = await board.state();
    const token = hex(state.token);
    const onBoard = new Map(bountiesOf(state).map((b) => [b.id, b]));
    const refunded = (id: string): boolean => onBoard.has(id) && !onBoard.get(id)?.answer && onBoard.get(id)?.reward === undefined;
    const due = [
      ...book.answers.filter((a) => a.board === board.address && onBoard.get(a.bounty)?.answer === a.drop).map((own) => ({ own, from: payoutSeed(seed, board.address, own.drop) })),
      ...book.bounties.filter((b) => b.board === board.address && refunded(b.bounty)).map((own) => ({ own, from: refundSeed(seed, board.address, own.secret) })),
    ].filter(({ own }) => opts.all || !(own.collected || Date.now() - (own.emptySince ?? 0) < EMPTY_AGAIN_MS));
    const reach = { ...(this.proofServerUrl ? { provingMode: 'server' as const, proofServerUrl: this.proofServerUrl } : {}), networkId: network, ...chain() };
    let total = 0n;
    const txs: string[] = [];
    let failed: unknown;
    for (const { own, from } of due) {
      let collected: Awaited<ReturnType<typeof collectPayout>>;
      try {
        collected = await collectPayout(from, token, identity.addresses.shielded, reach, this.session.pay);
      } catch (e) {
        // The wallet keeps what it holds, and the next collect looks at it again.
        failed ??= e;
        this.say(`one payout was not collected: ${reasonOf(e)}`);
        continue;
      }
      // The board paid this wallet. Found empty a second time, it was collected before.
      if (collected || own.emptySince !== undefined) own.collected = true;
      else own.emptySince = Date.now();
      await this.session.keep();
      if (!collected) continue;
      total += collected.amount;
      txs.push(collected.tx);
    }
    if (failed !== undefined && txs.length === 0) throw failed;
    return { total, txs };
  }

  /** Saves both wallets and stops them. */
  async close(): Promise<void> {
    await this.session.close();
    await this.purse.close();
  }
}
