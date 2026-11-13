// Finds the receipt of a contract call from what NEAR's RPC serves about blocks, chunks and
// transactions, for someone who knows the caller and the block but not the transaction.

/** What the search reads of the RPC's `block` answer. */
export interface BlockView {
  header: { height: number };
  chunks: { chunk_hash: string; height_included: number }[];
}

/** What the search reads of the RPC's `chunk` answer. An action is a name or an object with one key, its kind. */
export interface ChunkView {
  transactions: { hash: string; signer_id: string; receiver_id: string; actions: (string | Record<string, object>)[] }[];
}

/** A function call that an account signed itself. */
export interface SignedCall {
  signer: string;
  receiver: string;
  method: string;
}

/** One receipt of a transaction: its id and its logs. */
export interface ReceiptLogs {
  id: string;
  logs: string[];
}

/** What the search asks NEAR's RPC. */
export interface NearBlocks {
  /** The block at a height; null when NEAR has none there. */
  block(height: number): Promise<BlockView | null>;
  chunk(hash: string): Promise<ChunkView>;
  /** The receipts a transaction ran on the call's receiver. */
  receiptsOf(txHash: string, sender: string): Promise<ReceiptLogs[]>;
}

// A receipt runs one block after its transaction, later when chunks are missing or the shard is busy.
export const SEARCH_DEPTH = 6;

/** The chunks a block added. A shard that made no chunk shows its last one again, which is skipped. */
export function newChunks(block: BlockView): string[] {
  return block.chunks.filter((c) => c.height_included === block.header.height).map((c) => c.chunk_hash);
}

/** The hashes of the transactions in a chunk that make this call. */
export function callsIn(chunk: ChunkView, call: SignedCall): string[] {
  const calls = (action: string | Record<string, object>): boolean => {
    const made = typeof action === 'string' ? undefined : action.FunctionCall;
    return made !== undefined && 'method_name' in made && made.method_name === call.method;
  };
  return chunk.transactions.filter((tx) => tx.signer_id === call.signer && tx.receiver_id === call.receiver && tx.actions.some(calls)).map((tx) => tx.hash);
}

/** The id of the receipt whose first log is `line`. */
export function receiptWith(receipts: ReceiptLogs[], line: string): string | undefined {
  return receipts.find((r) => r.logs[0] === line)?.id;
}

/** The heights to search for the transaction of a receipt that ran at `height`, most likely first. */
export function searchHeights(height: number, depth = SEARCH_DEPTH): number[] {
  return [height - 1, height, ...Array.from({ length: depth - 1 }, (_, i) => height - 2 - i)].filter((h) => h >= 0);
}

/**
 * The id of the receipt in which `call` logged `line` first, given the height of the block that
 * receipt ran in. It looks for the caller's transaction in that block and the ones before it.
 */
export async function findReceipt(near: NearBlocks, call: SignedCall, line: string, height: number, depth = SEARCH_DEPTH): Promise<string> {
  for (const at of searchHeights(height, depth)) {
    const block = await near.block(at);
    if (!block) continue;
    for (const hash of newChunks(block)) {
      for (const tx of callsIn(await near.chunk(hash), call)) {
        const receipt = receiptWith(await near.receiptsOf(tx, call.signer), line);
        if (receipt) return receipt;
      }
    }
  }
  throw new Error(`no transaction of ${call.signer} calling ${call.method} on ${call.receiver} logged this in the ${depth + 1} blocks up to ${height}`);
}
