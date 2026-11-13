import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MCPCallToolResultLike, MCPClientLike, MCPToolLike } from '@anthropic-ai/sdk/helpers/beta/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { shownBalance, shownCollected } from 'lightsout-kit/shown';
import { faultOf, isTool, textOf } from './guard.js';

const MCP = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// The longest a call may go without a progress line, and the longest it may take in all.
const QUIET_MS = 10 * 60_000;
const CALL_MS = 30 * 60_000;
// What the MCP server prints when the wallets fail to open. It then fails every call.
const DID_NOT_OPEN = 'the agent did not open';

/** An agent's MCP server as the crowd uses it. */
export interface Server extends MCPClientLike {
  tools(): Promise<MCPToolLike[]>;
  close(): Promise<void>;
}

// What the loop reads from the tools' JSON answers.
export const Whoami = z.object({ name: z.string(), nearAccount: z.string(), address: z.string() });
export type Who = z.infer<typeof Whoami>;
export const Balance: z.ZodType<ReturnType<typeof shownBalance>> = z.object({ balance: z.string() });
export const Refunds = z.array(z.object({ bounty: z.string(), tx: z.string() }));
export const Collected: z.ZodType<ReturnType<typeof shownCollected>> = z.object({ total: z.string(), txs: z.array(z.string()) });

/** The JSON a tool answered with. A tool's error is thrown. */
export function answerOf(result: MCPCallToolResultLike): unknown {
  if (result.isError) throw new Error(faultOf(result) || 'the tool failed without a word');
  return JSON.parse(textOf(result));
}

/** Calls a tool of `client` and reads the answer as the protocol's tool result. */
export async function callOn(client: Client, params: { name: string; arguments?: Record<string, unknown> }, options?: RequestOptions): Promise<MCPCallToolResultLike> {
  const { content, isError } = CallToolResultSchema.parse(await client.callTool(params, CallToolResultSchema, options));
  return { content, isError };
}

/** The tools of `client` that a turn of the crowd may call. */
export async function crowdTools(client: Client): Promise<MCPToolLike[]> {
  return (await client.listTools()).tools.filter((tool) => isTool(tool.name));
}

function ownEnv(): Record<string, string> {
  return Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
}

/** The MCP server of one agent as a process of its own. Only that process opens the agent's wallets. */
export class AgentServer implements Server {
  private client?: Promise<Client>;
  private broken = false;

  constructor(readonly agent: string) {}

  private open(): Promise<Client> {
    if (this.client) return this.client;
    const opened: Promise<Client> = (async () => {
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: ['--import', 'tsx', resolve(MCP, 'src/server.ts')],
        cwd: MCP,
        env: { ...ownEnv(), LIGHTSOUT_AGENT: this.agent },
        stderr: 'pipe',
      });
      let rest = '';
      transport.stderr?.on('data', (chunk: Buffer) => {
        const lines = (rest + chunk.toString('utf8')).split(/\r?\n/);
        rest = lines.pop() ?? '';
        for (const line of lines) {
          if (line.includes(DID_NOT_OPEN)) this.broken = true;
          if (line.trim()) console.error(`${this.agent}: ${line}`);
        }
      });
      const client = new Client({ name: 'lightsout-crowd', version: '0.1.0' });
      // A process that ended by itself is started again by the next call.
      client.onclose = () => {
        if (this.client === opened) this.client = undefined;
      };
      await client.connect(transport);
      return client;
    })();
    this.client = opened;
    return opened;
  }

  async tools(): Promise<MCPToolLike[]> {
    return crowdTools(await this.open());
  }

  async callTool(params: { name: string; arguments?: Record<string, unknown> }): Promise<MCPCallToolResultLike> {
    try {
      // The agent's lines arrive on stderr. Asking for progress only keeps a long call from timing out.
      return await callOn(await this.open(), params, { timeout: QUIET_MS, resetTimeoutOnProgress: true, maxTotalTimeout: CALL_MS, onprogress: () => undefined });
    } catch (e) {
      // The process may still run a call that timed out, so the next call gets a new one.
      this.broken = true;
      throw e;
    } finally {
      if (this.broken) await this.close();
    }
  }

  /** Ends the process, which saves the agent's wallets first. The next call starts it again. */
  async close(): Promise<void> {
    const client = this.client;
    this.client = undefined;
    this.broken = false;
    await (await client?.catch(() => undefined))?.close();
  }
}
