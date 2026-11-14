// The calls a contract took, as a NIGHTGATE gateway's index lists them. The list is for looking
// a transaction up. What it names can be checked on the chain.
import { api } from './bridge.js';

export interface ContractCall {
  circuit: string; // the entry point the call ran
  tx: string; // 64 hex; the ledger transaction
  height: number; // the Midnight block
  at: number; // Unix seconds; that block's time
  ok: boolean; // the transaction ran in full
}

interface Row {
  actionType: string;
  entryPoint: string | null;
  transaction: { ledgerTxHash: string; block: { height: string; timestamp: number }; transactionResult?: { status: string } | null };
}

const QUERY = {
  $orderby: 'transaction/block/height desc,actionIndex desc',
  $select: 'actionType,entryPoint,actionIndex',
  $expand: 'transaction($select=hash,ledgerTxHash;$expand=block($select=height,timestamp),transactionResult($select=status))',
};

/** The newest `most` calls on a contract, the newest first. Undefined without a gateway. */
export async function contractCalls(address: string, most = 50): Promise<ContractCall[] | undefined> {
  if (!api) return undefined;
  const query = { $filter: `address eq '${address}'`, $top: String(most), ...QUERY };
  // The gateway takes a space as %20 only.
  const url = `${api.baseUrl}/odata/v4/midnight/ContractActions?${Object.entries(query).map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('&')}`;
  const auth: Record<string, string> = api.agentToken ? { 'x-agent-token': api.agentToken } : api.token ? { Authorization: `Bearer ${api.token}` } : {};
  const res = await fetch(url, { headers: { Accept: 'application/json', ...auth }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`the gateway answered ${res.status} to the list of calls on ${address}`);
  const { value } = (await res.json()) as { value: Row[] };
  return value
    .filter((row) => row.actionType === 'CALL')
    .map((row) => ({
      circuit: row.entryPoint ?? '',
      tx: row.transaction.ledgerTxHash,
      height: Number(row.transaction.block.height),
      at: Number(row.transaction.block.timestamp),
      ok: row.transaction.transactionResult?.status === 'SUCCESS',
    }));
}

export interface NearCall {
  method: string;
  tx: string; // base58; the NEAR transaction
  signer: string; // the account that sent it
  height: number; // the NEAR block the call ran in
  at: number; // Unix seconds; that block's time
}

interface IndexRow {
  transaction_hash: string;
  predecessor_account_id: string;
  receiver_account_id: string;
  block_timestamp: string; // nanoseconds
  receipt_block: { block_height: number };
  actions: { action: string; method: string | null }[] | null;
}

// The nearblocks index of the account's network, or the one NEARBLOCKS_API_URL names.
const nearIndex = (account: string): string => (process.env.NEARBLOCKS_API_URL || (account.endsWith('.testnet') ? 'https://api-testnet.nearblocks.io' : 'https://api.nearblocks.io')).replace(/\/+$/, '');

/** The newest calls on a NEAR account, the newest first, as the nearblocks index lists them. It names transactions; it proves nothing. */
export async function nearCalls(account: string, most = 100): Promise<NearCall[]> {
  // Without a key the index counts requests by the caller's address, and allows few.
  const key = process.env.NEARBLOCKS_API_KEY;
  const headers = { Accept: 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) };
  const res = await fetch(`${nearIndex(account)}/v1/account/${account}/txns?per_page=${most}&order=desc`, { headers, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`the NEAR index answered ${res.status} to the list of calls on ${account}`);
  const { txns } = (await res.json()) as { txns: IndexRow[] };
  return txns.flatMap((row) => {
    const method = row.actions?.[0]?.action === 'FUNCTION_CALL' ? row.actions[0].method : null;
    // A call of the account on itself is the second half of another call.
    if (!method || row.receiver_account_id !== account || row.predecessor_account_id === account) return [];
    return [{ method, tx: row.transaction_hash, signer: row.predecessor_account_id, height: row.receipt_block.block_height, at: Number(BigInt(row.block_timestamp) / 1_000_000_000n) }];
  });
}
