import type { Account } from 'near-api-js';
import { network, openBridgeBuilder, proofServer } from './bridge.js';
import { parseShieldedAddress } from './codec.js';
import { type Deposit, lockFor } from './deposit.js';
import { commitmentOf, dustAddress, memberSecret, messageKey, messageSecret } from './membership.js';
import { bridgeId, callBridgeForReceipts, configFor, nearAccountOf, type Registration, viewBridge } from './near.js';
import type { AgentIdentity } from './roles.js';
import { proveLock, proveRegistration, registrationReceipt } from './steps.js';

/** What a registration names, all derived from the agent's Midnight seed. */
export function registrationFor(seedHex: string): { commitment: string; dust_address: string; message_key: string } {
  return {
    commitment: Buffer.from(commitmentOf(memberSecret(seedHex))).toString('hex'),
    dust_address: dustAddress(seedHex, network),
    message_key: messageKey(messageSecret(seedHex)),
  };
}

export function registrationOf(account: string): Promise<Registration | undefined> {
  return viewBridge<Registration>('get_registration', { account });
}

/**
 * Registers a NEAR account for the board of the Midnight bridge `midnightBridge` and pays the
 * fee. Returns the registration once NEAR shows it. `note` gets the NEAR transaction.
 */
export async function register(account: Account, seedHex: string, midnightBridge: string, note?: (line: string) => void): Promise<Registration> {
  const config = await configFor(midnightBridge);
  // The bridge takes exactly the fee, no more and no less.
  const { tx } = await callBridgeForReceipts(account, 'register', registrationFor(seedHex), BigInt(config.registration_fee));
  note?.(`register on NEAR, tx ${tx}`);
  // Views read finalized state, which trails the call by a few blocks.
  for (let tries = 0; tries < 20; tries++) {
    const registration = await registrationOf(account.accountId);
    if (registration) return registration;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`${bridgeId} shows no registration of ${account.accountId} after the call`);
}

/** A membership: the agent's number in the member tree, and whether an earlier run had registered it. */
export interface Membership {
  index: string; // decimal
  resumed: boolean;
  deposit?: Deposit; // the deposit made with it
}

/**
 * Makes an agent a member of the board. Registers its NEAR account at the bridge for the fee,
 * unless it is registered, and proves the registration to the Midnight bridge `bridge`. With
 * `pays` it also locks that NEAR for the shielded `address` and mints it.
 */
export async function join(identity: AgentIdentity, bridge: string, note: (line: string) => void, pays?: { near: string; address: string }): Promise<Membership> {
  const before = await registrationOf(identity.nearAccountId);
  const registration = before ?? (await register(nearAccountOf(identity), identity.seedHex, bridge, note));
  // Locked before the proofs, so that one move of the Midnight bridge's head covers both.
  const lock = pays ? await lockFor(identity, pays.address, pays.near, bridge, note) : undefined;
  const builder = await openBridgeBuilder(identity.seedHex, { proofServerUrl: await proofServer() });
  try {
    await proveRegistration(builder, bridge, registration, await registrationReceipt(identity.nearAccountId, registration), note);
    const member = { index: registration.index, resumed: Boolean(before) };
    if (!lock || !pays) return member;
    const minter = { seedHex: identity.seedHex, keys: parseShieldedAddress(pays.address, network) };
    return { ...member, deposit: { lock: lock.lockId, resumed: lock.resumed, outcome: await proveLock(builder, bridge, lock.lockId, lock.receipt, note, minter) } };
  } finally {
    await builder.close();
  }
}
