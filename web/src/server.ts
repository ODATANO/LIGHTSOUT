// The hosted sandbox. A visitor gets one agent, ready or fresh, and uses it through the MCP
// tools, beside the public view of the same contracts.
// npm start (in web/)
import 'lightsout-kit/websocket';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { serve } from '@hono/node-server';
import { getConnInfo } from '@hono/node-server/conninfo';
import { type Context, Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { secureHeaders } from 'hono/secure-headers';
import { network } from 'lightsout-kit/bridge';
import { nearOf, unitsOf, YOCTO_PER_UNIT } from 'lightsout-kit/codec';
import { registrationOf } from 'lightsout-kit/join';
import { nearBalance } from 'lightsout-kit/near';
import { AgentProcess, type Outcome, TOOLS, type Tool } from './agents.js';
import { checked, Refused } from './calls.js';
import { Feed } from './feed.js';
import { Guests, STATE_DIR } from './guests.js';
import { CHECK_ORIGIN, type Human, turnstile } from './human.js';
import { originOf, withOrigin } from './origin.js';
import { Budget, Rate } from './limits.js';
import { OwnAgents, type Redeemed } from './own.js';
import { agentsOf, Pool, type PoolAgent } from './pool.js';
import { pageFiles } from './static.js';

const PORT = Number(process.env.DEMO_PORT ?? 8787);
const HOST = process.env.DEMO_HOST ?? '127.0.0.1';
const COOKIE = 'lightsout_session';
// A session ends when its page stopped asking, when its visitor made no call for a while, and
// at the latest after an hour.
const GONE_MS = 3 * 60_000;
const IDLE_MS = 30 * 60_000;
const SESSION_MS = 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
const PROCESS_IDLE_MS = 10 * 60_000;
const FEED_EVERY_MS = 20_000;
const JOBS_KEPT = 40;
const LINES_KEPT = 40;
// A registration or a deposit leaves this much NEAR on the agent's account for gas.
const NEAR_KEPT = 5n * 10n ** 22n;
// Calls of one session that wait or run at a time.
const CALLS_AT_ONCE = 6;
const SESSIONS_PER_ADDRESS = 2;
const STARTS_PER_HOUR = 6;
const BODY_BYTES = 4096;
const ERROR_CHARACTERS = 300;

// The wNEAR a session may move. A visitor address gets three sessions' worth a day, and all visitors DEMO_DAY_BUDGET.
const sessionBudget = unitsOf(process.env.DEMO_SESSION_BUDGET || '0.5');
const budget = new Budget(sessionBudget, 3n * sessionBudget, unitsOf(process.env.DEMO_DAY_BUDGET || '2'));
// The smallest reward the solver beside this page works for.
const leastReward = unitsOf(process.env.LIGHTSOUT_MIN_REWARD || '0.01');
const sessionStarts = new Rate(STARTS_PER_HOUR, 60 * 60_000);

interface Job {
  id: number;
  tool: Tool | 'fund'; // fund: the faucet's transfer, which the server sends itself
  args: Record<string, unknown>;
  state: 'queued' | 'running' | 'done' | 'failed';
  queuedAt: number; // Unix ms
  startedAt?: number; // Unix ms
  endedAt?: number; // Unix ms
  lines: string[]; // the agent's progress lines, the oldest first
  result?: unknown;
}

interface Session {
  agent: PoolAgent;
  process: AgentProcess;
  address: string; // the visitor's network address
  jobs: Job[];
  nextJob: number;
  startedAt: number; // Unix ms
  polledAt: number; // Unix ms; the page's last request
  actedAt: number; // Unix ms; the visitor's last call
  spent: bigint; // micro-NEAR this session's calls moved
  asked: string[]; // the bounties this session posted
  fresh: boolean; // the agent was not registered when the session began
  ended: boolean;
}

const pool = new Pool(agentsOf(), async (account) => Boolean(await registrationOf(account)));
// The faucet gives an agent from zero DEMO_FAUCET_NEAR, and makes at most DEMO_FAUCET_PER_DAY new ones a day.
const guests = new Guests(process.env.DEMO_FAUCET || undefined, unitsOf(process.env.DEMO_FAUCET_NEAR || '2') * YOCTO_PER_UNIT, Number(process.env.DEMO_FAUCET_PER_DAY || '10'));
for (const guest of await guests.load()) pool.add(guest);
// An agent for a visitor's own machine gets NEAR from the same faucet and its fee key from one
// of DEMO_FEE_CODES. At most DEMO_OWN_PER_DAY a day, and one per visitor address.
const gateway = process.env.NIGHTGATE_API_URL?.replace(/\/+$/, '');
const feeCodes = (process.env.DEMO_FEE_CODES ?? '').split(',').map((code) => code.trim()).filter(Boolean);
const own = new OwnAgents(feeCodes, Number(process.env.DEMO_OWN_PER_DAY || '5'), redeemCode, resolve(STATE_DIR, `own-agents-${network}.json`));
await own.load();
const ownOf = new Map<string, { account: string; at: number }>(); // visitor address -> the agent it got
// The bot check in front of what the faucet pays. Without its two keys nothing is checked.
const humanSite = process.env.DEMO_TURNSTILE_SITE_KEY;
const humanSecret = process.env.DEMO_TURNSTILE_SECRET_KEY;
if (Boolean(humanSite) !== Boolean(humanSecret)) throw new Error('DEMO_TURNSTILE_SITE_KEY and DEMO_TURNSTILE_SECRET_KEY are set together or not at all');
const human: Human | undefined = humanSecret ? turnstile(humanSecret) : undefined;
const seeAgents = (): void => void pool.refresh().catch((e: unknown) => console.error('reading the agents\' registrations:', e));
seeAgents();
// The agents that act by themselves beside the visitors. Each has a process of its own already.
const crowd = (process.env.LIGHTSOUT_CROWD ?? '').split(',').map((name) => name.trim()).filter(Boolean);
const shared = crowd.filter((name) => pool.has(name));
if (shared.length > 0) throw new Error(`${shared.join(', ')} acts in the crowd and cannot be lent to a visitor as well`);
const sessions = new Map<string, Session>();
const feed = new Feed();
feed.follow(FEED_EVERY_MS);

// The page's fonts come from their packages and are served here, so a visitor's browser asks no third party.
const fontFile = createRequire(import.meta.url).resolve;
const FONTS = new Map(
  Object.entries({
    'inter.woff2': '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
    'space-grotesk.woff2': '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
    'jetbrains-mono.woff2': '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  }).map(([name, file]) => [name, new Uint8Array(readFileSync(fontFile(file)))]),
);

const JSON_TYPE = { 'content-type': 'application/json' };
/** Whether one more agent for a visitor's own machine can be made now. */
const ownOpen = (): boolean => gateway !== undefined && guests.pays && own.open;
const json = (value: unknown): string => JSON.stringify(value, (_, v: unknown) => (typeof v === 'bigint' ? v.toString() : v));
const active = (job: Job): boolean => job.state === 'queued' || job.state === 'running';

/** Turns a fee code into a gateway key. Sent without a key of ours: with one the code would top that key up. */
async function redeemCode(code: string): Promise<Redeemed> {
  const res = await fetch(`${gateway}/codes/redeem`, { method: 'POST', headers: JSON_TYPE, body: JSON.stringify({ code }), signal: AbortSignal.timeout(30_000) });
  const body = (await res.json().catch(() => ({}))) as { token?: unknown; validUntil?: unknown; error?: unknown };
  if (res.ok && typeof body.token === 'string') return { key: body.token, ...(typeof body.validUntil === 'string' ? { validUntil: body.validUntil } : {}) };
  // Unknown, redeemed before, expired or not a code: it never gives a key. Anything else may pass.
  if ([404, 409, 410].includes(res.status) || (res.status === 400 && String(body.error).includes('not a giveaway code'))) return 'spent';
  throw new Error(`the gateway did not redeem a fee code: HTTP ${res.status}`);
}

/** The visitor's address: the one the proxy in front names, else the socket's. */
function addressOf(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',').at(-1)?.trim() || getConnInfo(c).remote.address || 'unknown';
}

/** The answer to a request whose bot check did not pass; undefined when it passed or none is set. */
async function refusedAsBot(c: Context, token: unknown): Promise<Response | undefined> {
  if (!human) return undefined;
  try {
    if (await human(token, addressOf(c))) return undefined;
  } catch (e) {
    console.error('the bot check could not be asked:', e);
    return c.json({ error: 'The check that you are no bot could not be made. Try again in a moment.' }, 502);
  }
  return c.json({ error: 'The check that you are no bot did not pass. Try again.' }, 403);
}

// Keeps every job that waits or runs and each tool's newest and newest finished one, and drops the oldest of the rest.
function forget(session: Session): void {
  while (session.jobs.length > JOBS_KEPT) {
    const kept = new Set<number>();
    for (const tool of TOOLS) {
      for (const newest of [session.jobs.findLast((job) => job.tool === tool), session.jobs.findLast((job) => job.tool === tool && job.state === 'done')]) {
        if (newest) kept.add(newest.id);
      }
    }
    const oldest = session.jobs.findIndex((job) => !active(job) && !kept.has(job.id));
    if (oldest === -1) return;
    session.jobs.splice(oldest, 1);
  }
}

// A lent agent has the bounties of earlier visitors. A session is shown its own as its own.
function shown(session: Session, tool: Tool, value: unknown): unknown {
  const posted = tool === 'ask' ? (value as { bounty?: unknown } | null)?.bounty : undefined;
  if (typeof posted === 'string') session.asked.push(posted);
  if (tool !== 'bounties' || !Array.isArray(value)) return value;
  return (value as { id: string; mine: boolean; answer?: string }[]).map((bounty) => (session.asked.includes(bounty.id) ? bounty : { ...bounty, mine: false, answer: undefined }));
}

// The first line of a tool's error, which the kit writes for a reader.
function failure(value: unknown): { error: string } {
  const error = (value as { error?: unknown } | null)?.error;
  const line = String(typeof error === 'string' ? error : typeof value === 'string' ? value : 'The call failed.').split('\n')[0] ?? '';
  return { error: line.slice(0, ERROR_CHARACTERS) };
}

function start(session: Session, tool: Tool, args: Record<string, unknown>, spends = 0n): Job {
  const job: Job = { id: session.nextJob++, tool, args, state: 'queued', queuedAt: Date.now(), lines: [] };
  session.jobs.push(job);
  forget(session);
  session.spent += spends;
  budget.count(session.address, spends);
  const finish = (outcome: Outcome): void => {
    job.state = outcome.ok ? 'done' : 'failed';
    job.result = outcome.ok ? shown(session, tool, outcome.value) : failure(outcome.value);
    job.endedAt = Date.now();
    if (outcome.ok) return;
    // A failed call gives its amount back.
    session.spent -= spends;
    budget.count(session.address, -spends);
  };
  const wanted = (): boolean => {
    if (session.ended) return false;
    job.state = 'running';
    job.startedAt = Date.now();
    return true;
  };
  session.process
    .call(tool, args, wanted, (line) => {
      job.lines.push(line.slice(0, ERROR_CHARACTERS));
      if (job.lines.length > LINES_KEPT) job.lines.shift();
    })
    .then(finish, (e: unknown) => {
      console.error(`${session.agent.id}: ${tool} did not return:`, e);
      finish({ ok: false, value: { error: 'The agent did not answer. It starts again with the next call.' } });
    });
  return job;
}

// The faucet's transfer to an agent from zero, as the first call of its session. The wallets open after it.
function fund(session: Session): void {
  const job: Job = { id: session.nextJob++, tool: 'fund', args: {}, state: 'running', queuedAt: Date.now(), startedAt: Date.now(), lines: [] };
  session.jobs.push(job);
  guests
    .fund(session.agent)
    .then(
      (paid) => {
        if (paid) job.lines.push(`transfer on NEAR, tx ${paid.tx}`);
        job.state = 'done';
        job.result = { ...paid, account: session.agent.account };
      },
      (e: unknown) => {
        console.error(`${session.agent.id}: the faucet did not pay:`, e);
        job.state = 'failed';
        job.result = { error: 'The faucet could not send test NEAR right now.' };
      },
    )
    .finally(() => {
      job.endedAt = Date.now();
      if (session.ended) return;
      start(session, 'whoami', {});
      start(session, 'balance', {});
    });
}

// The calls that wait are dropped, and the agent is free once the running one is over.
function end(id: string, session: Session): void {
  session.ended = true;
  sessions.delete(id);
  void session.process.close().finally(() => pool.release(session.agent));
}

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.jobs.some(active)) continue;
    if (now - session.polledAt > GONE_MS || now - session.actedAt > IDLE_MS || now - session.startedAt > SESSION_MS) end(id, session);
    else if (session.process.running && now - session.process.usedAt > PROCESS_IDLE_MS) void session.process.close();
  }
  sessionStarts.tidy();
  seeAgents();
}, 30_000).unref();

const app = new Hono<{ Variables: { id: string; session: Session } }>();

app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      // The bot check runs a script and a frame of its own origin.
      ...(human ? { scriptSrc: ["'self'", CHECK_ORIGIN], frameSrc: [CHECK_ORIGIN] } : {}),
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
    referrerPolicy: 'no-referrer',
  }),
);
app.get('/healthz', (c) => c.text('ok'));
app.use('/api/*', bodyLimit({ maxSize: BODY_BYTES }));
app.use('/api/*', async (c, next) => {
  await next();
  c.header('cache-control', 'no-store');
});

app.get('/api/public', (c) =>
  c.body(
    json({
      bridge: feed.bridge,
      board: feed.board,
      timeline: feed.timeline,
      readAt: feed.readAt,
      network,
      error: feed.error,
      readyAgents: pool.free(false),
      freshAgents: pool.free(true) + (guests.open ? 1 : 0),
      ownAgents: ownOpen(),
      humanCheck: human ? humanSite : undefined,
      crowd: crowd.length,
      crowdMind: process.env.CROWD_MIND === 'claude' ? 'model' : 'rules',
      leastReward: nearOf(leastReward),
    }),
    200,
    JSON_TYPE,
  ),
);

app.post('/api/session', async (c) => {
  const known = sessions.get(getCookie(c, COOKIE) ?? '');
  if (known) return c.json({ agent: known.agent.id, fresh: known.fresh });
  const body = (await c.req.json().catch(() => undefined)) as { fresh?: unknown; human?: unknown } | undefined;
  const fresh = body?.fresh === true;
  // An agent from zero costs the faucet NEAR, so it goes to a visitor who passed the bot check.
  const refused = fresh ? await refusedAsBot(c, body?.human) : undefined;
  if (refused) return refused;
  const address = addressOf(c);
  const held = [...sessions.values()].filter((session) => session.address === address).length;
  if (held >= SESSIONS_PER_ADDRESS || !sessionStarts.allows(address)) return c.json({ error: 'Your address has started enough agents for now. End a session, or try again later.' }, 429);
  const id = randomBytes(24).toString('hex');
  await pool.refresh().catch(() => undefined);
  let agent = pool.take(id, fresh);
  // No agent from zero is waiting: a new one is made.
  if (!agent && fresh && guests.open) {
    pool.add(await guests.make());
    agent = pool.take(id, true);
  }
  if (!agent) return c.json({ error: fresh ? 'No fresh agent is free right now. Take a ready one.' : 'Every ready agent is in use right now. Try again in a few minutes.' }, 503);
  const now = Date.now();
  const session: Session = { agent, process: new AgentProcess(agent), address, jobs: [], nextJob: 1, startedAt: now, polledAt: now, actedAt: now, spent: 0n, asked: [], fresh, ended: false };
  sessions.set(id, session);
  // Behind a TLS proxy the request arrives as http, and the proxy names the scheme the visitor used.
  const secure = (c.req.header('x-forwarded-proto') ?? new URL(c.req.url).protocol).startsWith('https');
  setCookie(c, COOKIE, id, { httpOnly: true, sameSite: 'Lax', path: '/', secure });
  // Opens the wallets right away, after the faucet's transfer for an agent from zero. This takes the longest.
  if (fresh && guests.pays) {
    fund(session);
  } else {
    start(session, 'whoami', {});
    start(session, 'balance', {});
  }
  return c.json({ agent: agent.id, fresh });
});

app.use('/api/agent/*', async (c, next) => {
  const id = getCookie(c, COOKIE) ?? '';
  const session = sessions.get(id);
  if (!session) return c.json({ error: 'no agent' }, 401);
  session.polledAt = Date.now();
  c.set('id', id);
  c.set('session', session);
  await next();
});

app.get('/api/agent/jobs', (c) => {
  const session = c.get('session');
  return c.body(
    json({ agent: session.agent.id, fresh: session.fresh, jobs: session.jobs, asked: session.asked, budgetLeft: nearOf(budget.left(session.spent, session.address)), endsAt: session.startedAt + SESSION_MS }),
    200,
    JSON_TYPE,
  );
});

app.post('/api/agent/call', async (c) => {
  const session = c.get('session');
  const body = (await c.req.json().catch(() => undefined)) as { tool?: unknown; args?: unknown } | undefined;
  const tool = TOOLS.find((name) => name === body?.tool);
  if (!tool) return c.json({ error: 'unknown tool' }, 400);
  const given = body?.args ?? {};
  if (typeof given !== 'object' || given === null || Array.isArray(given)) return c.json({ error: 'args must be an object' }, 400);
  if (Date.now() - session.startedAt > SESSION_MS) return c.json({ error: 'This session has had its hour. End it and start a new agent.' }, 403);
  let call;
  try {
    call = checked(tool, given as Record<string, unknown>, leastReward, feed.bridge?.near.denominations.map((yocto) => yocto / YOCTO_PER_UNIT));
  } catch (e) {
    if (e instanceof Refused) return c.json({ error: e.message }, 400);
    throw e;
  }
  // A read that already waits is not put in line twice.
  const waiting = Object.keys(call.args).length === 0 ? session.jobs.find((job) => job.tool === tool && job.state === 'queued') : undefined;
  if (waiting) return c.json({ job: waiting.id }, 202);
  if (session.jobs.filter(active).length >= CALLS_AT_ONCE) return c.json({ error: 'Wait until the calls before this one are done.' }, 429);
  const left = budget.left(session.spent, session.address);
  if (call.spends > left) {
    return c.json({ error: left > 0n ? `This session can still move ${nearOf(left)} wNEAR.` : 'The sandbox lends no more wNEAR to this session today. Reading still works.' }, 403);
  }
  // What the call takes from the agent's NEAR account: a lock, or the fee of a first registration.
  // A lock of the agent that is not minted yet is finished first, and nothing new is locked.
  const resumes = feed.bridge?.near.recent.some((lock) => !lock.minted && lock.sender === session.agent.account) ?? false;
  const locked = resumes ? 0n : unitsOf(String(call.args.amount ?? call.args.deposit ?? '0')) * YOCTO_PER_UNIT;
  const takes = tool === 'deposit' ? locked : tool === 'register' ? locked + (pool.knowsRegistered(session.agent) ? 0n : (feed.bridge?.near.registrationFee ?? 0n)) : 0n;
  if (takes > 0n) {
    const holds = await nearBalance(session.agent.account);
    const near = (yocto: bigint): string => nearOf(yocto / YOCTO_PER_UNIT);
    if (holds < takes + NEAR_KEPT) return c.json({ error: `The agent's NEAR account holds ${near(holds)} NEAR. This call takes ${near(takes)} and leaves ${near(NEAR_KEPT)} for gas.` }, 400);
  }
  session.actedAt = Date.now();
  return c.json({ job: start(session, tool, call.args, call.spends).id }, 202);
});

// An agent for the visitor's own machine: NEAR for the account of the key their browser made,
// and a gateway key for its fees. A second try for the same account pays nothing twice.
app.post('/api/own-agent', async (c) => {
  const address = addressOf(c);
  const body = (await c.req.json().catch(() => undefined)) as { account?: unknown; human?: unknown } | undefined;
  const account = body?.account;
  if (typeof account !== 'string' || !/^[0-9a-f]{64}$/.test(account)) return c.json({ error: 'account must be the 64 hex digits of a NEAR public key' }, 400);
  if (own.has(account)) return c.json({ error: 'This account has its agent already.' }, 409);
  const refused = await refusedAsBot(c, body?.human);
  if (refused) return refused;
  if (!own.waits(account)) {
    if (!ownOpen()) return c.json({ error: 'No more agents are handed out today. Try again tomorrow.' }, 429);
    const before = ownOf.get(address);
    if (before && before.account !== account && Date.now() - before.at < DAY_MS) return c.json({ error: 'Your address got an agent today already.' }, 429);
    ownOf.set(address, { account, at: Date.now() });
  }
  try {
    const funding = await guests.fund({ id: 'own', account, env: {} });
    await own.paid(account);
    const fee = await own.key(account);
    return c.json({ account, near: funding?.near, tx: funding?.tx, gateway, key: fee.key, validUntil: fee.validUntil });
  } catch (e) {
    console.error(`the agent of ${account} was not finished:`, e);
    return c.json({ error: 'The agent could not be finished. Press the button again; nothing is paid twice.' }, 502);
  }
});

app.post('/api/agent/end', (c) => {
  end(c.get('id'), c.get('session'));
  deleteCookie(c, COOKIE, { path: '/' });
  return c.json({ ended: true });
});

app.get('/fonts/:file', (c) => {
  const font = FONTS.get(c.req.param('file'));
  return font ? c.body(font, 200, { 'content-type': 'font/woff2', 'cache-control': 'public, max-age=31536000, immutable' }) : c.notFound();
});

// The page itself is sent with the address it was asked under, for its preview image.
const PAGE = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const page = (c: Context) => c.html(withOrigin(PAGE, originOf(c.req.header('host'), c.req.header('x-forwarded-proto'))));
app.get('/', page);
app.get('/index.html', page);

app.use('/*', ...pageFiles('./public'));

const server = serve({ fetch: app.fetch, port: PORT, hostname: HOST }, () => console.log(`lightsout-web: http://${HOST}:${PORT}`));

// Lets each agent finish its running call and save its wallet state before the service stops.
const stop = (): void => {
  server.close();
  for (const session of sessions.values()) session.ended = true;
  void Promise.allSettled([...sessions.values()].map((session) => session.process.close())).finally(() => process.exit(0));
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
