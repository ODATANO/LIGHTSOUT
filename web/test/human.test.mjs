import assert from 'node:assert/strict';
import { test } from 'node:test';

// A page with a head that loads the check's script, or fails to, and the widget the script brings.
const scripts = [];
const widgets = [];
let loads = true;
const widget = {
  render(box, params) {
    widgets.push({ box, params, removed: false });
    return `widget-${widgets.length}`;
  },
  remove(id) {
    widgets[Number(id.split('-')[1]) - 1].removed = true;
  },
};
globalThis.window = {};
globalThis.document = {
  createElement: () => ({ removed: false, remove() { this.removed = true; } }),
  head: {
    append(script) {
      scripts.push(script);
      queueMicrotask(() => {
        if (!loads) return script.onerror();
        globalThis.window.turnstile = widget;
        script.onload();
      });
    },
  },
};
const { humanCheck } = await import('../public/human.js');
const shown = () => new Promise((resolve) => setTimeout(resolve));

test('a script that does not load is an error, and the next press loads it again', async () => {
  loads = false;
  await assert.rejects(humanCheck('site-key', 'a-box'), /did not load/);
  assert.equal(scripts[0].removed, true);
  loads = true;
  const check = humanCheck('site-key', 'a-box');
  await shown();
  assert.equal(scripts.length, 2);
  widgets.at(-1).params.callback('first-token');
  assert.equal((await check).token, 'first-token');
});

test('the widget is shown in the box with the site key, and its token comes back', async () => {
  const check = humanCheck('site-key', 'the-box');
  await shown();
  const { box, params } = widgets.at(-1);
  assert.equal(scripts.at(-1).src, 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
  assert.equal(box, 'the-box');
  assert.deepEqual([params.sitekey, params.theme, params.size], ['site-key', 'dark', 'flexible']);
  params.callback('a-token');
  const { token, remove } = await check;
  assert.equal(token, 'a-token');
  assert.equal(widgets.at(-1).removed, false);
  remove();
  assert.equal(widgets.at(-1).removed, true);
});

test('the script is loaded once for all checks', async () => {
  const before = scripts.length;
  const check = humanCheck('site-key', 'the-box');
  await shown();
  widgets.at(-1).params.callback('another-token');
  await check;
  assert.equal(scripts.length, before);
});

test('a check that does not pass is an error and takes its widget away', async () => {
  const check = humanCheck('site-key', 'the-box');
  await shown();
  const handled = widgets.at(-1).params['error-callback']('110200');
  await assert.rejects(check, /did not pass/);
  assert.equal(handled, true);
  assert.equal(widgets.at(-1).removed, true);
});

test('a browser that cannot run the check is told so', async () => {
  const check = humanCheck('site-key', 'the-box');
  await shown();
  widgets.at(-1).params['unsupported-callback']();
  await assert.rejects(check, /cannot run the bot check/);
});
