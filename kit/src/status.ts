// Shows where both bridge contracts stand. Reads only; anyone can run it.
// npm run status
import './plain-errors.js';
import { yoctoToNear } from 'near-api-js';
import { nearOf } from './codec.js';
import { closedBecause } from './near.js';
import { boardOverview, bridgeOverview } from './overview.js';

const { near, midnight } = await bridgeOverview();
const board = process.env.MIDNIGHT_BOARD ? await boardOverview() : undefined;
// Who could change a contract, from the number of keys the chain shows for it.
const changeable = (keys: number, what: string): string => (keys === 0 ? `no key: nobody can replace ${what}` : `${keys} key${keys > 1 ? 's' : ''}: a holder of one can replace ${what}`);
console.log(`NEAR bridge ${near.bridge}`);
console.log(`  ${changeable(near.keys, 'the contract')}; code ${near.codeHash}`);
console.log(`  pays out burns of Midnight bridge ${near.midnightBridge} ${near.midnightBridge === midnight.bridge ? '(match)' : `(NOT ${midnight.bridge})`}`);
console.log(`  locks ${near.locks}, locked ${yoctoToNear(near.locked)} NEAR, released ${yoctoToNear(near.released)} NEAR`);
const limit = yoctoToNear(near.dailyLimit);
console.log(`  a lock is ${near.denominations.length ? `${near.denominations.map((d) => yoctoToNear(d)).join(', ')} NEAR` : 'any amount'}; today ${yoctoToNear(near.lockedToday)} of ${limit} NEAR locked and ${yoctoToNear(near.releasedToday)} of ${limit} NEAR released`);
console.log(`  registrations ${near.registered}, each for ${yoctoToNear(near.registrationFee)} NEAR to ${near.beneficiary}`);
const r = near.runtime;
if (r) {
  console.log(`  Midnight runtime ${r.spec}; ${r.locks_open ? 'takes new locks' : `takes no new locks: ${closedBecause(r)}`}`);
}
if (near.midnight) console.log(`  follows Midnight to block ${near.midnight.finalized_number}, authority set ${near.midnight.set_id} with ${near.midnight.authorities} authorities`);

console.log(`Midnight bridge ${midnight.bridge}`);
console.log(`  ${changeable(midnight.keys, 'its circuits')}`);
console.log(`  mints for locks on ${midnight.nearBridge} ${midnight.nearBridge === near.bridge ? '(match)' : `(NOT ${near.bridge})`}`);
console.log(`  follows NEAR to block ${midnight.nearHeight}, ${midnight.era} ${midnight.era === 1n ? 'epoch' : 'epochs'} after its start; producers of the next epoch ${midnight.nextProducersKnown ? 'known' : 'not read yet'}`);
console.log(`  locks proven and not minted ${midnight.provenLocks}, minted ${midnight.minted}, members ${midnight.members}`);
for (const burn of midnight.burns) console.log(`  burn ${burn.id}: ${nearOf(burn.amount)} NEAR to ${burn.to}, ${burn.paid ? 'paid out' : 'not paid out in full yet'}`);

if (board) {
  const now = Date.now() / 1000;
  const answered = board.bounties.filter((b) => b.answer).length;
  const waiting = board.bounties.filter((b) => !b.answer && b.reward !== undefined);
  const overdue = waiting.filter((b) => Number(b.deadline) < now).length;
  console.log(`Board ${board.board}`);
  console.log(`  ${changeable(board.keys, 'its circuits')}`);
  console.log(`  bounties ${board.bounties.length}: answered ${answered}, open ${waiting.length - overdue}, overdue ${overdue}, refunded ${board.bounties.length - answered - waiting.length}`);
}
