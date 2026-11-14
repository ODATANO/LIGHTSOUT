// The bot check in front of what the faucet pays: Cloudflare Turnstile. Its script comes from
// Cloudflare and is loaded on the first use, so a visitor who only reads never asks for it.
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading;

function load() {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const failed = () => {
      loading = undefined;
      script.remove();
      reject(new Error('The bot check did not load. Try again.'));
    };
    script.src = SCRIPT;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : failed());
    script.onerror = failed;
    document.head.append(script);
  });
  return loading;
}

/**
 * Shows the check of the widget `siteKey` in `box` and waits until the visitor passed it.
 * Returns the token, which is good for one request, and what takes the widget away again.
 */
export async function humanCheck(siteKey, box) {
  const turnstile = await load();
  return new Promise((resolve, reject) => {
    let id;
    const failed = (text) => {
      turnstile.remove(id);
      reject(new Error(text));
    };
    id = turnstile.render(box, {
      sitekey: siteKey,
      theme: 'dark',
      size: 'flexible',
      callback: (token) => resolve({ token, remove: () => turnstile.remove(id) }),
      // True tells the widget that the page shows the failure itself.
      'error-callback': () => (failed('The bot check did not pass. Try again.'), true),
      'unsupported-callback': () => failed('This browser cannot run the bot check.'),
    });
  });
}
