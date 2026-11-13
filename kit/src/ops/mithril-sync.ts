// Brings the NEAR bridge's Mithril light client to the newest certificate by hand. The relay
// does the same by itself.
// npm run mithril -- [--as alice|bob]
import '../plain-errors.js';
import { parseArgs } from 'node:util';
import { syncMithril, type MithrilView } from '../mithril.js';
import { callBridge, nearAccount, PROVE_DEPOSIT, PROVE_GAS, viewBridge } from '../near.js';
import { userRole } from '../roles.js';

const { values } = parseArgs({ options: { as: { type: 'string' } } });
const account = nearAccount(userRole(values.as));
const view = await viewBridge<MithrilView>('get_mithril');
if (!view) throw new Error('this bridge does not follow Mithril');
console.log(`bridge at Mithril epoch ${view.epoch}, token ${view.token.tx_hash.slice(0, 12)}#${view.token.index}`);
const after = await syncMithril(view, (method, args) => callBridge(account, method, args, PROVE_DEPOSIT, PROVE_GAS));
console.log(`  ok  Mithril epoch ${after.epoch}, token ${after.token.tx_hash.slice(0, 12)}#${after.token.index}`);
