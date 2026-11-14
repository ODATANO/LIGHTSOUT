// The sandbox page. It shows the agent's own calls beside what the contracts show to everyone.
import { humanCheck } from './human.js';
import { newNearKey, newSeed } from './near-key.js';

const $ = (id) => document.getElementById(id);

/** An element with properties and children. `text` sets its text, `on…` adds a listener. */
function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  node.append(...children.filter((child) => child !== undefined && child !== null));
  return node;
}

const SVG = 'http://www.w3.org/2000/svg';
function icon(name, size = 14) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  const use = document.createElementNS(SVG, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

const UNITS_PER_NEAR = 1_000_000;
const group = (n) => Number(n).toLocaleString('en-US');
// The public view counts in micro-NEAR and yoctoNEAR. The agent's tools take and return wNEAR.
const nearOfUnits = (units) => String(Number(units) / UNITS_PER_NEAR);
const nearOfYocto = (yocto) => String(Number(BigInt(yocto) / 10n ** 21n) / 1000);
const short = (text, head = 10, tail = 6) => (text.length > head + tail + 1 ? `${text.slice(0, head)}…${text.slice(-tail)}` : text);
const clock = (ms) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
// The time of a block: hour and minute today, the day before that.
function when(seconds) {
  const then = new Date(seconds * 1000);
  const today = then.toDateString() === new Date().toDateString();
  return today ? then.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : then.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
function took(ms) {
  const seconds = Math.round(ms / 1000);
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}
const lastOf = (items, fits) => items.filter(fits).pop();

let agent = null; // the name of this session's agent
let fresh = false; // the agent was not registered when the session began
let jobs = [];
let seen = null; // the last public view
let myBounties = new Set(); // the bounties this session posted
let starting = false;
const followedUp = new Set();
// Bounties of this agent whose answer was asked for once it showed on the board.
const fetched = new Set();
const modelName = (id) => id.split('/').pop();

// `done` marks a message that something worked. Without it the message is a refusal.
function toast(text, done = false) {
  const box = $('toast');
  box.textContent = text;
  box.classList.toggle('done', done);
  box.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (box.hidden = true), 5000);
}

const API_TIMEOUT_MS = 15_000;

async function api(path, body, timeoutMs = API_TIMEOUT_MS) {
  let answer;
  try {
    const res = await fetch(path, { signal: AbortSignal.timeout(timeoutMs), ...(body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) });
    answer = { status: res.status, data: await res.json().catch(() => ({})) };
  } catch {
    answer = { status: 0, data: { error: 'The sandbox server does not answer.' } };
  }
  // Without the server the page keeps showing the last state it got, and says so.
  $('server-note').hidden = answer.status !== 0 && answer.status < 502;
  return answer;
}

/** Sends one call of the agent. Returns whether the server took it. */
async function call(tool, args = {}) {
  const { status, data } = await api('/api/agent/call', { tool, args });
  if (status === 401) {
    leave('This session ended. Start a new agent.');
    return false;
  }
  if (status !== 202) toast(data.error ?? 'The call was refused.');
  await pollJobs();
  return status === 202;
}

function copyButton(text, label = 'Copy') {
  const button = h('button', { class: 'icon-btn', type: 'button', title: label, 'aria-label': label }, icon('copy', 15));
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(typeof text === 'function' ? text() : text);
    } catch {
      return toast('The browser did not allow copying.');
    }
    button.classList.add('done');
    button.replaceChildren(icon('check', 15));
    setTimeout(() => {
      button.classList.remove('done');
      button.replaceChildren(icon('copy', 15));
    }, 1400);
  });
  return button;
}

// The explorers of the Midnight networks that have one this page knows.
const EXPLORERS = { preview: 'https://preview.midnightexplorer.com' };
let explorer = null;
/** Where the explorer shows a transaction or a contract, or undefined on a network without one. */
const onExplorer = (kind, id) => (explorer ? `${explorer}/${kind}/${id.startsWith('0x') ? id : `0x${id}`}` : undefined);

/**
 * Labelled values. Long ones, such as hashes, are shortened and can be copied. A transaction
 * links to the explorer, and so does a label that `links` gives an address for.
 */
function kv(entries, links = {}) {
  const list = h('dl', { class: 'kv' });
  for (const [label, value] of Object.entries(entries)) {
    if (value === undefined || value === null) continue;
    const text = String(value);
    const long = text.length > 32;
    const href = links[label] ?? (label === 'Transaction' ? onExplorer('transactions', text) : undefined);
    const shown = { text: long ? short(text) : text, title: text };
    const name = href ? h('a', { ...shown, href, target: '_blank', rel: 'noopener' }) : h('span', shown);
    list.append(h('dt', { text: label }), h('dd', {}, name, long ? copyButton(text, `Copy ${label.toLowerCase()}`) : null));
  }
  return list;
}

const line = (text) => h('p', { text });
const list = (items, none, each) => (items.length ? items.map(each) : [line(none)]);
const item = (head, ...body) => h('div', { class: 'item' }, h('div', { class: 'item-head' }, ...head), ...body);

// Per tool: its name on the page, whether it sends a transaction, and how its answer is shown.
const TOOLS = {
  whoami: {
    title: 'Open the wallets',
    busy: 'opening both wallets and catching up',
    view: (r) => [line(r.member ? 'Both wallets are open. This agent is a member.' : r.registration ? 'Both wallets are open. The agent is registered, but not in the member tree yet.' : 'Both wallets are open. The agent is not registered yet.')],
  },
  balance: { title: 'Read the balance', view: (r) => [line(`${r.balance} wNEAR.`)] },
  fund: {
    title: 'Get test NEAR',
    sends: true,
    busy: 'the sandbox sends test NEAR to the new NEAR account',
    view: (r) => [line(r.near ? `${r.near} test NEAR from ${r.from} arrived on the agent's NEAR account.` : "The agent's NEAR account holds enough test NEAR already.")],
  },
  register: {
    title: 'Become a member',
    sends: true,
    about: (a) => (a.deposit ? `and pay ${a.deposit} NEAR in` : ''),
    busy: 'registering on NEAR, then proving it to Midnight under a new NEAR header',
    view: (r) => [line(`The agent is member #${r.index} now.${r.deposit ? ` Lock ${r.deposit.lock} is ${r.deposit.outcome === 'minted' ? 'minted, and the wNEAR is in its wallet' : 'proven, and its mint follows'}.` : ''}`)],
  },
  deposit: {
    title: 'Pay NEAR in',
    sends: true,
    about: (a) => `${a.amount} NEAR`,
    busy: 'locking on NEAR, then proving the lock and minting on Midnight',
    view: (r) => [line(r.outcome === 'minted' ? `Lock ${r.lock} is minted. The wNEAR is in the agent's wallet.` : `Lock ${r.lock} is proven on Midnight. Its mint follows.`)],
  },
  send: { title: 'Send wNEAR', sends: true, about: (a) => `${a.amount} wNEAR to ${short(a.to, 22, 8)}`, view: (r) => [kv({ Transaction: r.tx })] },
  withdraw: {
    title: 'Withdraw to NEAR',
    sends: true,
    about: (a) => `${a.amount} wNEAR to ${a.to ?? "the agent's own NEAR account"}`,
    view: (r) => [
      kv({ Transaction: r.tx, Withdrawal: r.id }),
      h('p', { class: 'note', text: 'A relay proves this withdrawal to the NEAR contract, which then pays out.' }),
      h('button', { class: 'btn small', type: 'button', text: 'Check the payout', onclick: () => void call('withdrawal', { burn: r.id }) }),
    ],
  },
  withdrawal: { title: 'Check a payout', about: (a) => `withdrawal ${short(a.burn, 8, 4)}`, view: (r) => [line(`Withdrawal ${short(r.id, 8, 4)}: ${r.paid} of ${r.amount} NEAR paid out to ${r.to}.`)] },
  ask: {
    title: 'Ask a model',
    sends: true,
    about: (a) => `${a.reward} wNEAR for ${modelName(a.model)} on "${a.prompt.length > 60 ? `${a.prompt.slice(0, 60)}…` : a.prompt}"`,
    busy: 'attesting the TEE of the model, then proving and posting the question',
    view: (r) => [kv({ Question: r.bounty, Transaction: r.tx }), h('p', { class: 'note', text: 'Posted. A solver now asks the model in its TEE, seals the answer and hands it over. The answer then shows under "My questions".' })],
  },
  bounties: {
    title: 'Read my answers',
    view: (r) => {
      const mine = r.filter((b) => b.mine);
      const others = r.length - mine.length;
      return [
        ...list(mine, 'This agent has asked nothing yet.', (b) =>
          item(
            [h('span', { class: `chip ${{ answered: 'ok', open: 'wait', overdue: 'bad' }[b.state] ?? ''}`, text: b.state }), h('span', { text: modelName(b.model) })],
            b.prompt === undefined ? null : h('p', { text: b.prompt }),
            b.answer === undefined ? null : h('blockquote', { text: b.answer }),
          ),
        ),
        others > 0 ? h('p', { class: 'note', text: `${others} question${others > 1 ? 's' : ''} of other members ${others > 1 ? 'are' : 'is'} on the board.` }) : null,
      ];
    },
  },
  refund: { title: 'Take back overdue rewards', sends: true, view: (r) => list(r, 'No question of this agent is overdue.', (c) => item([h('span', { class: 'chip ok', text: 'taken back' })], kv({ Question: c.bounty, Transaction: c.tx }))) },
  collect: { title: 'Collect what came back', sends: true, view: (r) => [line(r.txs.length ? `${r.total} wNEAR collected in ${r.txs.length} transfer${r.txs.length > 1 ? 's' : ''}.` : 'Nothing to collect.'), ...r.txs.map((tx) => kv({ Transaction: tx }))] },
};

const fact = (kind, glyph, lead, text) => h('span', { class: `fact ${kind}` }, icon(glyph, 13), h('span', { text: `${lead} ${text}.` }));

// What a call of the visitor showed to everyone, and what it kept.
const SAW = {
  register: { sees: 'that this NEAR account registered and paid the fee', hides: 'what its member does on Midnight' },
  deposit: { sees: "the NEAR sender, the amount and the recipient's coin key", hides: 'what the wNEAR is used for' },
  ask: { sees: 'the question, the model and the reward', hides: 'who asked' },
  send: { sees: 'that a shielded transfer happened', hides: 'the sender, the recipient or the amount on the chain' },
  withdraw: { sees: 'the amount and the NEAR recipient', hides: 'where the wNEAR came from' },
  refund: { sees: 'that the reward of a question was taken back', hides: 'who took it' },
};

function resultOf(job) {
  const box = h('div', { class: 'result' });
  if (job.state === 'failed') {
    box.append(h('p', { class: 'error', text: job.result?.error ?? String(job.result ?? 'The call failed.') }));
    return box;
  }
  try {
    box.append(...TOOLS[job.tool].view(job.result).filter(Boolean));
  } catch {
    box.append(h('p', { class: 'note', text: JSON.stringify(job.result) }));
  }
  const saw = SAW[job.tool];
  if (saw) box.append(h('p', { class: 'tour-facts saw' }, fact('sees', 'eye', 'Everyone saw', saw.sees), fact('hides', 'eye-off', 'Nobody saw', saw.hides)));
  return box;
}

const summaryOf = (job) => TOOLS[job.tool].about?.(job.args) ?? '';

// A progress line of the agent. A transaction in it links to the explorer of its chain.
function stepLine(text) {
  const found = /\btx ([0-9a-f]{64}|[1-9A-HJ-NP-Za-km-z]{43,44})\b/.exec(text);
  if (!found) return h('li', { text });
  const hash = found[1];
  const href = /^[0-9a-f]{64}$/.test(hash) ? onExplorer('transactions', hash) : `https://testnet.nearblocks.io/txns/${hash}`;
  const shown = { text: short(hash, 8, 6), title: hash };
  const before = text.slice(0, found.index);
  const after = text.slice(found.index + found[0].length);
  return h('li', {}, document.createTextNode(`${before}tx `), href ? h('a', { ...shown, href, target: '_blank', rel: 'noopener' }) : h('span', shown), document.createTextNode(after));
}

const jobNodes = new Map(); // job id -> { node, state, time, steps, shown }

function fillJob(entry, job) {
  const tool = TOOLS[job.tool];
  const state = h('span', { class: 'job-state' }, job.state === 'done' ? icon('check', 13) : job.state === 'failed' ? icon('x', 13) : null);
  entry.time = h('span', { class: 'job-time' });
  entry.steps = h('ol', { class: 'job-lines' });
  entry.shown = '';
  const children = [h('div', { class: 'job-head' }, state, h('span', { class: 'job-title', text: tool.title }), entry.time)];
  const summary = summaryOf(job);
  if (summary) children.push(h('div', { class: 'job-sub', text: summary }));
  if (job.state === 'running') children.push(h('div', { class: 'bar' }), h('div', { class: 'job-sub', text: tool.busy ?? (tool.sends ? 'building the proof and sending the transaction' : 'reading') }));
  if (job.state === 'queued') children.push(h('div', { class: 'job-sub', text: 'waiting for the call before it' }));
  children.push(entry.steps);
  if (job.state === 'done' || job.state === 'failed') children.push(resultOf(job));
  entry.node.className = `job ${job.state}`;
  entry.node.replaceChildren(...children);
}

// The agent's card already shows what these two calls return, so they are listed only when they fail.
const QUIET = new Set(['whoami', 'balance']);

function renderJobs() {
  const listed = jobs.filter((job) => !QUIET.has(job.tool) || job.state === 'failed');
  $('jobs-empty').hidden = listed.length > 0;
  const now = Date.now();
  for (const job of listed) {
    let entry = jobNodes.get(job.id);
    if (!entry) {
      entry = { node: h('li'), state: '' };
      jobNodes.set(job.id, entry);
      $('jobs').prepend(entry.node);
    }
    if (entry.state !== job.state) {
      entry.state = job.state;
      fillJob(entry, job);
    }
    entry.time.textContent = `${clock(job.queuedAt)} · ${took((job.endedAt ?? now) - (job.startedAt ?? job.queuedAt))}`;
    const lines = `${job.lines.length}|${job.lines.at(-1) ?? ''}`;
    if (entry.shown !== lines) {
      entry.shown = lines;
      entry.steps.replaceChildren(...job.lines.map(stepLine));
    }
  }
}

const latest = (tool) => lastOf(jobs, (job) => job.tool === tool);
const latestDone = (tool) => lastOf(jobs, (job) => job.tool === tool && job.state === 'done')?.result;
const did = (tool) => jobs.some((job) => job.tool === tool && job.state === 'done');

function showTab(name) {
  for (const tab of document.querySelectorAll('#tabs button')) {
    tab.classList.toggle('on', tab.dataset.tab === name);
    tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
  }
  for (const pane of document.querySelectorAll('.tab')) pane.hidden = pane.id !== `tab-${name}`;
}

/** Opens a form of the agent panel and puts the cursor into one of its fields. */
function goTo(tab, tool, field) {
  showTab(tab);
  const input = document.querySelector(`form[data-tool="${tool}"]`).elements[field];
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  input.focus({ preventScroll: true });
}

// What to try, with what each step shows to everyone and what it hides.
const STEP = {
  start: { title: 'Start an agent', note: 'A ready agent opens its two wallets in about 20 seconds. One from zero gets test NEAR first and takes a few minutes.', done: () => did('whoami'), go: () => $('start').scrollIntoView({ behavior: 'smooth', block: 'center' }) },
  member: {
    title: 'Become a member',
    ...SAW.register,
    done: () => latestDone('whoami')?.member === true || did('register'),
    go: () => {
      showTab('payin');
      $('member-note').scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  },
  payIn: { title: 'Pay NEAR in', ...SAW.deposit, done: () => did('deposit') || Number(latestDone('balance')?.balance ?? 0) > 0, go: () => goTo('payin', 'deposit', 'amount') },
  ask: { title: 'Ask a model a question', sees: 'the question, the reward and that an answer came', hides: 'who asked, and the answer is sealed for you', done: () => did('ask'), go: () => goTo('ask', 'ask', 'prompt') },
  read: {
    title: 'Read the answer',
    sees: 'that the question was answered and the reward paid',
    hides: 'the answer and who fetched it',
    done: () => (latestDone('bounties') ?? []).some((bounty) => bounty.mine && bounty.answer !== undefined),
    go: () => {
      showTab('ask');
      $('asks').scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  },
  withdraw: { title: 'Withdraw to any NEAR account', ...SAW.withdraw, done: () => did('withdraw'), go: () => goTo('withdraw', 'withdraw', 'amount') },
};
// An agent from zero is made a member and paid in by its visitor. A ready agent has both behind it.
const tour = () => (fresh ? [STEP.start, STEP.member, STEP.payIn, STEP.ask, STEP.read, STEP.withdraw] : [STEP.start, STEP.ask, STEP.read, STEP.withdraw]);

let tourShown = '';
function renderTour() {
  const steps = tour();
  const states = steps.map((step) => step.done());
  const next = states.indexOf(false);
  const key = `${states.join()}|${agent}`;
  if (key === tourShown) return;
  tourShown = key;
  $('tour-steps').replaceChildren(
    ...steps.map((step, i) =>
      h(
        'li',
        {},
        h(
          'button',
          { class: `tour-step ${states[i] ? 'done' : i === next ? 'next' : ''}`, type: 'button', onclick: () => (agent ? step.go() : STEP.start.go()) },
          h('span', { class: 'num' }, states[i] ? icon('check', 13) : document.createTextNode(String(i + 1))),
          h('b', { text: step.title }),
        ),
      ),
    ),
  );
  const upcoming = steps[next];
  const facts = !upcoming
    ? [h('span', { class: 'fact', text: 'All done.' })]
    : upcoming.note
      ? [h('span', { class: 'fact', text: upcoming.note })]
      : [fact('sees', 'eye', 'Everyone sees', upcoming.sees), fact('hides', 'eye-off', 'Nobody sees', upcoming.hides)];
  $('tour-facts').replaceChildren(...facts);
}

function renderIdentity() {
  if (!agent) return;
  const chip = $('id-member');
  const opening = latest('whoami');
  const who = latestDone('whoami');
  if (who) {
    chip.textContent = who.member ? `member #${who.registration?.index}` : who.registration ? 'registered, not a member yet' : 'not registered';
    chip.className = `chip ${who.member ? 'ok' : 'wait'}`;
    $('id-near-balance').textContent = `${Number(who.near).toFixed(2)} test NEAR on its NEAR account`;
    const fee = seen?.bridge ? nearOfYocto(seen.bridge.near.registrationFee) : undefined;
    $('member-form').hidden = who.member;
    $('member-note').textContent = who.member
      ? `This agent is member #${who.registration?.index}. Its NEAR account is registered at the bridge, and Midnight has proven that.`
      : `The agent registers its NEAR account at the bridge${fee && !who.registration ? `, which costs ${fee} NEAR once,` : ''} and proves that to Midnight. With an amount it pays that NEAR in as well, and one NEAR header on Midnight covers both. That header takes about a quarter of an hour.`;
    const link = $('id-near');
    link.textContent = who.nearAccount;
    link.href = `https://testnet.nearblocks.io/address/${encodeURIComponent(who.nearAccount)}`;
    $('id-address').textContent = who.address;
    $('id-address-row').hidden = false;
    $('id-copy').onclick = () => navigator.clipboard.writeText(who.address).then(() => toast('Shielded address copied.', true), () => toast('The browser did not allow copying.'));
  } else if (opening?.state === 'failed') {
    chip.textContent = 'did not open';
    chip.className = 'chip bad';
  } else {
    chip.textContent = 'opening';
    chip.className = 'chip wait';
  }
  const balance = latestDone('balance');
  const amount = $('id-balance');
  amount.classList.toggle('loading', !balance && opening?.state !== 'failed');
  amount.textContent = balance ? balance.balance : '0.00';
  if (balance) $('id-balance-near').textContent = 'shielded on Midnight, backed by NEAR locked on NEAR';
  else if (opening?.state === 'failed') $('id-balance-near').textContent = `The wallets did not open: ${opening.result?.error ?? 'unknown error'}. Press Refresh to try again.`;
  else $('id-balance-near').textContent = `Opening the wallets… ${took(Date.now() - (opening?.queuedAt ?? Date.now()))}`;
}

async function pollJobs() {
  if (!agent) return;
  const { status, data } = await api('/api/agent/jobs');
  if (status === 401) return leave('This session ended. Start a new agent.');
  if (status !== 200) return;
  jobs = data.jobs;
  fresh = data.fresh === true;
  myBounties = new Set(data.asked);
  $('id-budget').textContent = `This session can still move ${data.budgetLeft} wNEAR. It ends at ${new Date(data.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
  for (const job of jobs) {
    if (job.state !== 'done') continue;
    // Calls that move wNEAR are followed by a fresh balance.
    if (followedUp.has(job.id)) continue;
    followedUp.add(job.id);
    if (['send', 'collect', 'withdraw', 'ask', 'deposit', 'register'].includes(job.tool)) void call('balance');
    // A registration and a deposit change the membership and the NEAR on the account.
    if (['register', 'deposit'].includes(job.tool)) void call('whoami');
  }
  renderIdentity();
  renderJobs();
  renderTour();
  renderBounties();
}

function enter(name, fromZero) {
  agent = name;
  fresh = fromZero === true;
  showTab(fresh ? 'payin' : 'ask');
  $('start').hidden = true;
  $('console').hidden = false;
  $('mine').hidden = false;
  $('id-name').textContent = name;
  const turn = [...name].reduce((sum, char) => sum + char.charCodeAt(0) * 37, 0) % 360;
  $('id-avatar').style.setProperty('--turn', `${turn}deg`);
  $('hero-start').querySelector('span').textContent = 'Go to your agent';
}

function leave(note = '') {
  agent = null;
  fresh = false;
  jobs = [];
  jobNodes.clear();
  myBounties = new Set();
  fetched.clear();
  $('jobs').replaceChildren();
  $('jobs-empty').hidden = false;
  $('console').hidden = true;
  $('mine').hidden = true;
  $('start').hidden = false;
  $('start-note').textContent = note;
  $('id-address-row').hidden = true;
  $('id-near').textContent = '';
  $('id-near-balance').textContent = '';
  $('hero-start').querySelector('span').textContent = 'Start an agent';
  renderBounties();
  renderTour();
}

/** Gets an agent for this visitor: a ready one, or one from zero. */
async function startAgent(fromZero = false) {
  if (agent || starting) return;
  starting = true;
  for (const id of ['start-button', 'fresh-button']) $(id).disabled = true;
  // An agent from zero is paid by the faucet, which a deployment can put behind a bot check.
  let check;
  if (fromZero && seen?.humanCheck) {
    $('start-note').textContent = 'Checking that you are no bot…';
    try {
      check = await humanCheck(seen.humanCheck, $('start-human'));
    } catch (e) {
      starting = false;
      $('start-note').textContent = e.message;
      if (seen) renderStart(seen);
      return;
    }
  }
  $('start-note').textContent = 'Getting an agent…';
  const { status, data } = await api('/api/session', { fresh: fromZero, human: check?.token });
  check?.remove();
  starting = false;
  if (status !== 200) {
    $('start-note').textContent = data.error ?? 'No agent right now.';
    if (seen) renderStart(seen);
    return;
  }
  enter(data.agent, data.fresh);
  await pollJobs();
}

// An agent for the visitor's own machine. Its NEAR key and its seed are made here and shown once.
const OWN_TIMEOUT_MS = 90_000;
const ownNote = $('own-note').textContent;
let own = null; // key and seed, kept until the server answered, so that a second try pays nothing twice
let ownState = 'idle'; // idle, busy or done

async function makeOwnAgent() {
  const stop = (text) => {
    ownState = 'idle';
    $('own-button').disabled = false;
    $('own-note').textContent = ownNote;
    toast(text);
  };
  ownState = 'busy';
  $('own-button').disabled = true;
  try {
    own ??= { ...(await newNearKey()), seed: newSeed() };
  } catch {
    return stop('This browser cannot make an Ed25519 key. A current Chrome, Edge, Firefox or Safari can.');
  }
  let check;
  if (seen?.humanCheck) {
    $('own-note').textContent = 'Checking that you are no bot…';
    try {
      check = await humanCheck(seen.humanCheck, $('own-human'));
    } catch (e) {
      return stop(e.message);
    }
  }
  $('own-note').textContent = 'Paying the account and getting its fee key. This takes up to a minute.';
  const { status, data } = await api('/api/own-agent', { account: own.account, human: check?.token }, OWN_TIMEOUT_MS);
  check?.remove();
  if (status !== 200) return stop(data.error ?? 'The agent could not be made.');
  ownState = 'done';
  const env = {
    LIGHTSOUT_NAME: `guest-${own.account.slice(0, 6)}`,
    LIGHTSOUT_NEAR_ACCOUNT_ID: own.account,
    LIGHTSOUT_NEAR_PRIVATE_KEY: own.privateKey,
    LIGHTSOUT_SEED_HEX: own.seed,
    NIGHTGATE_API_URL: data.gateway,
    ODATANO_ACCESS_KEY: data.key,
    NIGHTGATE_BOARD_FEES: 'true',
  };
  $('own-config').textContent = JSON.stringify({ mcpServers: { lightsout: { command: 'npx', args: ['-y', 'lightsout-mcp'], env } } }, null, 2);
  const paid = data.near ? `The faucet sent the account ${data.near} NEAR. ` : '';
  const until = data.validUntil ? ` until ${new Date(data.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}` : '';
  $('own-note').textContent = `Copy the block now. It is shown once, and the NEAR key and the seed exist only in this tab. ${paid}The gateway pays its Midnight fees${until}.`;
  toast('Your agent is made. Copy its block.', true);
}

// Which of the two ways to start is open right now.
function renderStart(data) {
  if (agent || starting) return;
  $('start-button').disabled = data.readyAgents === 0;
  $('fresh-button').disabled = data.freshAgents === 0;
  if ($('start-note').textContent.startsWith('Getting')) return;
  const none = data.readyAgents === 0 && data.freshAgents === 0;
  if (none) $('start-note').textContent = 'Every sandbox agent is in use right now. A session ends after an hour, once its calls are through, and the buttons come back by themselves.';
  else if ($('start-note').textContent.startsWith('Every')) $('start-note').textContent = '';
}

const answered = (p) => p.board.bounties.filter((bounty) => bounty.answer).length;
const STATS = [
  ['Answers the contract paid', (p) => [group(answered(p))]],
  ['Locks minted on Midnight', (p) => [group(p.bridge.midnight.minted)]],
  ['Paid out on NEAR', (p) => [nearOfYocto(p.bridge.near.released), 'NEAR']],
  ['Held by the NEAR contract', (p) => [nearOfYocto(BigInt(p.bridge.near.locked) - BigInt(p.bridge.near.released)), 'NEAR']],
  ['wNEAR on Midnight', (p) => (p.bridge.midnight.wnear === undefined ? ['…'] : [nearOfUnits(p.bridge.midnight.wnear), 'wNEAR'])],
  ['Members', (p) => [group(p.bridge.midnight.members)]],
  ['Open questions', (p) => [group(p.board.bounties.filter((bounty) => standing(bounty)[0] === 'open').length)]],
];
const statNodes = STATS.map(([label]) => {
  const value = h('dd', { class: 'skeleton', text: '0' });
  const tile = h('dl', { class: 'stat' }, h('dt', { text: label }), value);
  tile.style.margin = '0';
  $('stats').append(tile);
  return { tile, value, shown: null };
});

function renderStats(view) {
  STATS.forEach(([, read], i) => {
    const [number, unit] = read(view);
    const node = statNodes[i];
    const text = `${number}|${unit ?? ''}`;
    if (node.shown === text) return;
    node.value.className = '';
    node.value.replaceChildren(document.createTextNode(number), unit ? h('small', { text: ` ${unit}` }) : '');
    if (node.shown !== null) {
      node.tile.classList.remove('flash');
      void node.tile.offsetWidth;
      node.tile.classList.add('flash');
    }
    node.shown = text;
  });
}

// How a bounty stands, from what the board shows and this browser's clock.
function standing(bounty) {
  if (bounty.answer) return ['answered', 'near'];
  if (bounty.reward === undefined) return ['taken back', 'midnight'];
  return Number(bounty.deadline) * 1000 < Date.now() ? ['overdue', 'midnight'] : ['open', 'board'];
}

// What an open question of this visitor waits for, from what the board shows to everyone.
function waitingFor(bounty) {
  const asked = lastOf(jobs, (job) => job.tool === 'ask' && job.state === 'done' && job.result?.bounty === bounty.id)?.endedAt;
  const since = asked ? `Posted ${Math.max(1, Math.round((Date.now() - asked) / 60_000))} min ago. ` : '';
  const seal = seen.board.sealing?.[0];
  if (!seal) return `${since}A solver asks the model and seals its answer on the board. Here that takes about ten minutes.`;
  const parts = Number(seal.blocks) + Math.ceil(Number(seal.left) / 64);
  return `${since}An answer is being sealed on the board: part ${seal.blocks} of about ${parts}. The board names its question only when the contract pays.`;
}

const TITLE = document.title;
// Own questions whose answer this page has said out loud.
const announced = new Set();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) document.title = TITLE;
});

// Said on a public row that this session made. The chain does not know whose it is.
const YOURS = 'Only this page knows that this one is yours.';

let bountiesShown = '';
function renderBounties() {
  if (!seen?.board) return;
  const answers = new Map((latestDone('bounties') ?? []).filter((b) => b.mine && b.answer !== undefined).map((b) => [b.id, b.answer]));
  // The waiting line of an open question counts minutes, so it is drawn again twice a minute.
  const key = JSON.stringify([seen.board.bounties, seen.board.sealing, [...myBounties], [...answers], myBounties.size ? Math.floor(Date.now() / 30_000) : 0]);
  if (key === bountiesShown) return;
  bountiesShown = key;
  // The board keeps no time of asking. A visitor's own questions stand first, then a later deadline.
  const all = [...seen.board.bounties].sort((a, b) => Number(myBounties.has(b.id)) - Number(myBounties.has(a.id)) || Number(b.deadline) - Number(a.deadline));
  const rows = all.map((bounty) => {
    const [state, colour] = standing(bounty);
    const mine = myBounties.has(bounty.id);
    return h(
      'li',
      mine ? { class: 'mine', title: YOURS } : {},
      h('span', { class: `where ${colour}`, text: state }),
      h('div', { class: 'main' }, h('p', { text: bounty.prompt ?? 'A question kept off the board' }), h('span', { text: `${modelName(bounty.model)}${mine ? ' · yours' : ''}` })),
      bounty.reward === undefined ? null : h('div', { class: 'price' }, document.createTextNode(nearOfUnits(bounty.reward)), h('small', { text: 'wNEAR' })),
    );
  });
  $('bounties').replaceChildren(...(rows.length ? rows : [h('li', { class: 'note', text: 'No question on the board yet. Ask the first one.' })]));

  const mine = all.filter((bounty) => myBounties.has(bounty.id));
  $('asks-empty').hidden = mine.length > 0;
  $('asks').replaceChildren(
    ...mine.map((bounty) => {
      const [state] = standing(bounty);
      const answer = answers.get(bounty.id);
      return h(
        'li',
        {},
        h('div', { class: 'ask-head' }, h('span', { class: `chip ${{ answered: 'ok', open: 'wait', overdue: 'bad' }[state] ?? ''}`, text: state }), h('span', { text: modelName(bounty.model) }), bounty.reward === undefined ? null : h('span', { class: 'reward', text: `${nearOfUnits(bounty.reward)} wNEAR` })),
        h('p', { text: bounty.prompt ?? '' }),
        state === 'open' ? h('p', { class: 'waiting', text: waitingFor(bounty) }) : null,
        answer === undefined ? null : h('blockquote', { text: answer }),
        answer === undefined ? null : h('div', { class: 'seal' }, icon('shield', 13), h('span', { text: 'signed in the TEE of the model, checked by the contract' })),
      );
    }),
  );
  // A visitor who went to another tab while waiting sees there that the answer came.
  for (const bounty of mine) {
    if (!bounty.answer || announced.has(bounty.id)) continue;
    announced.add(bounty.id);
    if (document.hidden) document.title = `Answer arrived · ${TITLE}`;
  }
  // An answer that landed is read once, through the agent, which alone can open it.
  for (const bounty of mine) {
    if (!bounty.answer || answers.has(bounty.id) || fetched.has(bounty.id)) continue;
    fetched.add(bounty.id);
    void call('bounties');
  }
}

// Why the NEAR contract takes no new NEAR, by what it lacks. Burns are paid out all the same.
const CLOSED = {
  'no check': 'The bridge takes no new NEAR yet: the NEAR contract has not looked at a recent Midnight block. A relay brings one. Payouts go on.',
  'no head': 'The bridge takes no new NEAR yet: nothing has shown the NEAR contract that the Midnight side follows NEAR. A relay proves it with the next NEAR header Midnight accepts. Payouts go on.',
  'old check': 'The bridge takes no new NEAR right now: the Midnight block it last looked at is older than an hour. Payouts go on.',
  'old head': 'The bridge takes no new NEAR right now: the Midnight side has not followed NEAR for about half a day. A relay brings a newer NEAR header. Payouts go on.',
};

// What a visitor should know about Midnight's runtime before paying in or out. Empty when nothing is up.
function runtimeNote(bridge) {
  const [seen, signs] = [bridge.near.runtime, bridge.midnight.runtime];
  if (signs.authorized || bridge.near.closed === 'upgrade') return 'Midnight has voted in a new runtime. Until the bridge reads it, no new NEAR enters. A withdrawal made now would wait for its payout, so the agent refuses to make one.';
  if (seen && !seen.readable) return `Midnight runs runtime ${seen.spec}, and the bridge has no table for it yet. No new NEAR enters. A withdrawal made now would wait for its payout until someone adds the table, so the agent refuses to make one.`;
  if (!bridge.near.locksOpen) return CLOSED[bridge.near.closed] ?? 'The bridge takes no new NEAR right now. Payouts go on.';
  if (signs.proposals > 0) return 'Midnight\'s governing bodies have a vote open, and a runtime upgrade starts as one. Whoever wants NEAR back before it is decided withdraws now.';
  return '';
}

// One contract: how many keys could replace it, in the words of its chain, and where it lives.
let contractsShown = '';
// The three contracts by what names them on their chain, each with a link to it there.
function renderContracts(bridge, board) {
  const key = JSON.stringify([bridge.near.bridge, bridge.near.codeHash, bridge.midnight.bridge, board.board, explorer]);
  if (key === contractsShown) return;
  contractsShown = key;
  const onNear = `https://testnet.nearblocks.io/address/${encodeURIComponent(bridge.near.bridge)}`;
  const onMidnight = onExplorer('contracts', bridge.midnight.bridge);
  const names = { 'NEAR contract': bridge.near.bridge, 'NEAR code hash': bridge.near.codeHash, 'Midnight contract': bridge.midnight.bridge, Board: board.board };
  $('contracts').replaceChildren(kv(names, { 'NEAR contract': onNear, 'Midnight contract': onMidnight, Board: onExplorer('contracts', board.board) }));
}

// What the deployment's own agents are for: something to see, and a crowd a member hides in.
function renderCrowd(count, model) {
  $('crowd-note').hidden = count === 0;
  $('crowd-part').hidden = count === 0;
  if (count === 0) return;
  const agents = 'Agents of this deployment';
  $('crowd-note').textContent = `${agents} act here in turns, ${model ? 'steered by a language model' : 'by fixed rules'}. What they do is real, and it is a crowd to hide in: your question or withdrawal is one among theirs.`;
  const steered = model
    ? 'A language model calls the tools of each one, the same MCP tools your own agent has, and code checks every call. It writes each question new, so no list tells their questions from a member\'s. Once its budget for the day is spent, fixed rules take the turn and ask from a list.'
    : 'Fixed rules decide what each one does, and they ask from a list. A question that is not on the list is not theirs.';
  const card = (kind, title, ...body) => h('article', { class: kind }, h('h3', { text: title }), h('p', {}, ...body));
  $('crowd-cards').replaceChildren(
    card('card', model ? 'Agents with a mind of their own' : 'Agents that never rest', document.createTextNode(`${agents} ask, pay and withdraw through the day. ${steered}`)),
    card('card', 'A member among them', document.createTextNode('Whoever acts beside them is one more in that stream. With the usual amounts, a question or a withdrawal is much harder to tie to one member by its time or its amount.')),
    card('card limit', 'The limit', document.createTextNode('Whoever runs a crowd knows which actions were its own. It covers a member against everyone else, not against its operator.')),
  );
}

// The mark of a row of the bridge: the chain its step ran on, as that chain's logo, and the step.
const onChain = (chain, step) => h('span', { class: `where ${chain}`, title: chain === 'near' ? 'on NEAR' : 'on Midnight' }, icon(chain, 11), document.createTextNode(step));

// What a call on the Midnight bridge does, by its circuit.
const CALLS = {
  propose: 'a newer NEAR header is proposed',
  approve: "a NEAR producer's signature is counted",
  accept: 'the NEAR header becomes the head',
  begin: 'a read of the next NEAR producers begins',
  absorb: 'a part of the NEAR producer list is read',
  know: 'a NEAR block is recorded',
  prove_lock: 'a lock on NEAR is proven',
  prove_register: 'a registration on NEAR is proven',
  known_root: 'the board checks a member root',
  mint: 'wNEAR is minted',
  burn: 'wNEAR is burned',
  forget: 'an old record is removed',
};
// The same for a call on the NEAR contract, by its method.
const NEAR_CALLS = {
  register: 'an account registers and pays the fee',
  submit_midnight_finality: "Midnight's finality is handed to NEAR",
  prove_burn_tx: 'a burn on Midnight is proven to NEAR',
  prove_head_tx: "the Midnight contract's NEAR head is proven to NEAR",
  add_runtime_table: 'a table for a Midnight runtime is added',
  pay_fees: 'the registration fees are paid out',
};

// A method of the NEAR contract whose name is too long for a tile's mark, by a shorter word.
const SHORT = { submit_midnight_finality: 'finality', prove_burn_tx: 'prove burn', prove_head_tx: 'prove head', add_runtime_table: 'runtime table' };

// A transaction as a link to the explorer of its chain.
function txLink(chain, hash) {
  const href = chain === 'near' ? `https://testnet.nearblocks.io/txns/${hash}` : onExplorer('transactions', hash);
  const shown = { text: short(hash, 8, 6), title: hash };
  return href ? h('a', { ...shown, href, target: '_blank', rel: 'noopener' }) : h('span', shown);
}

// One tile of a lane: a deposit, a withdrawal or a call on the Midnight bridge. Its key stays while it changes.
function tile(row, mine) {
  if (row.kind === 'call') {
    const what = (row.chain === 'near' ? NEAR_CALLS : CALLS)[row.circuit] ?? row.circuit;
    const note = `${when(row.at)}${row.times > 1 ? ` · ${row.times} calls` : ''}${row.ok ? '' : ' · failed'}`;
    const node = h('li', { class: 'tile', title: `${row.circuit}: ${what}` }, onChain(row.chain, SHORT[row.circuit] ?? (row.circuit || 'call')), h('b', {}, txLink(row.chain, row.tx)), h('small', { text: note }));
    return { key: `c${row.first}`, node };
  }
  const deposit = row.kind === 'deposit';
  const [state, chain] = deposit ? (row.done ? ['minted', 'midnight'] : ['locked', 'near']) : row.done ? ['paid', 'near'] : ['pending', 'midnight'];
  const who = `${deposit ? 'from' : 'to'} ${short(row.account, 10, 8)}${mine ? ' · yours' : ''}`;
  const title = mine ? YOURS : `${deposit ? `deposit ${row.id} from` : 'withdrawal to'} ${row.account}`;
  // The lock and the payout are NEAR transactions. The index names them a little after their block.
  const sent = row.tx ? h('small', {}, txLink('near', row.tx)) : null;
  const node = h('li', { class: `tile${mine ? ' mine' : ''}`, title }, onChain(chain, state), h('b', { text: `${row.near} NEAR` }), h('small', { text: who }), sent);
  return { key: `${deposit ? 'd' : 'w'}${row.id}`, node };
}

// A deposit, a registration and the calls on Midnight but the burn run from NEAR to Midnight.
// A withdrawal, its burn and the other calls on NEAR run from Midnight to NEAR.
function laneOf(row) {
  if (row.kind !== 'call') return row.kind === 'deposit' ? 'in' : 'out';
  if (row.chain === 'near') return row.circuit === 'register' ? 'in' : 'out';
  return row.circuit === 'burn' ? 'out' : 'in';
}
const laneKeys = { in: null, out: null };

// Each lane shows its rows, the newest on the left. A new one drives in there and the rest move
// right, where the strip scrolls on to the older ones.
function renderLanes(rows, myBurns) {
  for (const lane of ['in', 'out']) {
    const before = laneKeys[lane];
    const keys = new Set();
    const nodes = rows
      .filter((row) => laneOf(row) === lane)
      .map((row) => {
        const { key, node } = tile(row, row.kind === 'withdrawal' && myBurns.has(row.id));
        keys.add(key);
        if (before && !before.has(key)) node.classList.add('enter');
        return node;
      });
    laneKeys[lane] = keys;
    $(`lane-${lane}`).replaceChildren(...(nodes.length ? nodes : [h('li', { class: 'tile none', text: lane === 'in' ? 'No deposit yet.' : 'No withdrawal yet.' })]));
  }
}

let publicShown = '';
function renderPublic(data) {
  const live = Boolean(data.bridge && data.board && !data.error);
  $('nets').className = `nets ${live ? 'live' : data.error ? 'down' : ''}`;
  $('live').classList.toggle('down', Boolean(data.error));
  for (const node of document.querySelectorAll('[data-least-reward]')) node.textContent = data.leastReward;
  renderStart(data);
  $('own-button').disabled = ownState !== 'idle' || !data.ownAgents;
  if (!data.bridge || !data.board) {
    $('chain-note').textContent = data.error ? `Reading the chains failed: ${data.error}` : 'Reading both chains…';
    return;
  }
  seen = data;
  explorer = EXPLORERS[data.network] ?? null;
  const { bridge } = data;
  // The note under the columns speaks only when a read went wrong.
  $('chain-note').textContent = data.error ? `The last read of the chains failed. This is what they showed at ${clock(data.readAt)}.` : '';
  renderCrowd(data.crowd ?? 0, data.crowdMind === 'model');
  renderStats(data);
  renderContracts(bridge, data.board);
  const note = runtimeNote(bridge);
  $('runtime-note').hidden = note === '';
  $('runtime-note').querySelector('span').textContent = note;
  const sizes = bridge.near.denominations.map(nearOfYocto);
  const lockSizes = sizes.filter((size) => Number(size) <= 1);
  for (const id of ['lock-sizes', 'join-sizes']) {
    if ($(id).textContent !== lockSizes.join('')) $(id).replaceChildren(...lockSizes.map((size) => h('button', { type: 'button', text: size })));
  }
  $('proven-near').textContent = `NEAR up to block #${group(bridge.midnight.nearHeight)}`;
  if (bridge.near.midnight) $('proven-midnight').textContent = `Midnight up to block #${group(bridge.near.midnight.finalized_number)}`;
  renderBounties();

  const myBurns = new Set(jobs.filter((job) => job.tool === 'withdraw' && job.state === 'done').map((job) => job.result?.id));
  const key = JSON.stringify([data.timeline, [...myBurns]]);
  if (key === publicShown) return;
  publicShown = key;
  renderLanes(data.timeline, myBurns);
}

async function pollPublic() {
  const { status, data } = await api('/api/public');
  if (status === 200) return renderPublic(data);
  $('nets').className = 'nets down';
  $('live').classList.add('down');
  $('chain-note').textContent = seen ? `The server does not answer. This is what the chains showed at ${clock(seen.readAt)}.` : 'The server does not answer.';
}

// Read at the click: the block of an own agent is filled in after the page loaded.
for (const card of document.querySelectorAll('.card.code')) card.querySelector('h3').append(copyButton(() => card.querySelector('pre code').textContent, 'Copy'));
$('own-button').addEventListener('click', () => void makeOwnAgent());
$('start-button').addEventListener('click', () => void startAgent(false));
$('fresh-button').addEventListener('click', () => void startAgent(true));
$('hero-start').addEventListener('click', () => $('sandbox').scrollIntoView({ behavior: 'smooth' }));
// A reward that came back lies in a wallet of its own until it is collected.
$('take-back').addEventListener('click', () => {
  void call('refund');
  void call('collect');
});
$('end-button').addEventListener('click', async () => {
  await api('/api/agent/end', {});
  leave('Session ended.');
});

for (const form of document.querySelectorAll('form[data-tool]')) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const args = Object.fromEntries([...new FormData(form)].filter(([, value]) => value !== ''));
    for (const field of form.querySelectorAll('[data-number]')) args[field.name] = Number(args[field.name]);
    for (const field of form.querySelectorAll('[data-wnear]')) if (args[field.name] !== undefined) args[field.name] = args[field.name].trim().replace(',', '.');
    const button = form.querySelector('button.wide');
    button.disabled = true;
    void call(form.dataset.tool, args).then((taken) => {
      button.disabled = false;
      if (taken) form.reset();
    });
  });
}
for (const button of document.querySelectorAll('button[data-call]')) {
  button.addEventListener('click', () => {
    // After a failed start, Refresh opens the wallets again before it reads the balance.
    if (button.dataset.call === 'balance' && latest('whoami')?.state === 'failed') void call('whoami');
    void call(button.dataset.call);
  });
}
for (const quick of document.querySelectorAll('.quick')) {
  quick.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button) quick.closest('form').elements[quick.dataset.for].value = button.textContent;
  });
}
for (const tab of document.querySelectorAll('#tabs button')) tab.addEventListener('click', () => showTab(tab.dataset.tab));
// The wheel moves a strip sideways while the pointer is on it. A turn of the wheel that began
// on the page keeps moving the page, and a strip at its end hands the wheel back to the page.
let wheelAt = 0;
let wheelOn = null;
document.addEventListener(
  'wheel',
  (event) => {
    if (event.timeStamp - wheelAt > 250) wheelOn = event.target.closest?.('.strip') ?? null;
    wheelAt = event.timeStamp;
    if (!wheelOn || event.ctrlKey || event.deltaY === 0) return;
    const before = wheelOn.scrollLeft;
    // The newest tile is on the left, so turning down goes right to the older ones.
    wheelOn.scrollLeft += event.deltaY;
    if (wheelOn.scrollLeft !== before) event.preventDefault();
  },
  { passive: false },
);
renderTour();
// The section menu of a narrow screen closes when a link in it is taken or a click lands beside it.
document.addEventListener('click', (event) => {
  const menu = $('menu');
  if (menu.open && (!menu.contains(event.target) || event.target.closest('a'))) menu.open = false;
});

// A session that is still open on the server continues after a reload.
const resumed = await api('/api/agent/jobs');
if (resumed.status === 200) enter(resumed.data.agent, resumed.data.fresh);
await Promise.all([pollJobs(), pollPublic()]);
setInterval(() => void pollJobs(), 1500);
setInterval(() => void pollPublic(), 8000);
setInterval(() => {
  renderJobs();
  renderIdentity();
  renderTour();
}, 1000);
