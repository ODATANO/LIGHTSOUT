// One MCP server process per agent. The page's calls are the MCP tools, one at a time per agent.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { PoolAgent } from './pool.js';

const MCP = resolve(dirname(fileURLToPath(import.meta.url)), '../../mcp');
// The longest a call may go without a progress line, and the longest it may take in all.
const QUIET_MS = 10 * 60_000;
const CALL_MS = 30 * 60_000;
// What the MCP server prints when the wallets fail to open. It then fails every call.
const DID_NOT_OPEN = 'the agent did not open';

export const TOOLS = ['whoami', 'balance', 'register', 'deposit', 'send', 'withdraw', 'withdrawal', 'refund', 'collect', 'ask', 'bounties'] as const;
export type Tool = (typeof TOOLS)[number];

export interface Outcome {
  ok: boolean;
  value: unknown; // the tool's JSON answer
}

function ownEnv(): Record<string, string> {
  return Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
}

export class AgentProcess {
  private client?: Promise<Client>;
  private last: Promise<unknown> = Promise.resolve();
  private broken = false;
  usedAt = Date.now();

  constructor(private readonly agent: PoolAgent) {}

  private open(): Promise<Client> {
    if (this.client) return this.client;
    const opened: Promise<Client> = (async () => {
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: ['--import', 'tsx', resolve(MCP, 'src/server.ts')],
        cwd: MCP,
        env: { ...ownEnv(), ...this.agent.env },
        stderr: 'pipe',
      });
      let rest = '';
      // What the process prints is for the operator. A visitor gets progress through the protocol.
      transport.stderr?.on('data', (chunk: Buffer) => {
        const lines = (rest + chunk.toString('utf8')).split(/\r?\n/);
        rest = lines.pop() ?? '';
        for (const line of lines) {
          if (line.includes(DID_NOT_OPEN)) this.broken = true;
          if (line.trim()) console.error(`${this.agent.id}: ${line}`);
        }
      });
      const client = new Client({ name: 'lightsout-web', version: '0.1.0' });
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

  /**
   * Runs one tool after the agent's earlier calls. `onStart` says whether the call is still
   * wanted when its turn comes. `onLine` gets the agent's progress lines.
   */
  call(tool: Tool, args: Record<string, unknown>, onStart: () => boolean, onLine: (line: string) => void): Promise<Outcome> {
    const run = async (): Promise<Outcome> => {
      if (!onStart()) return { ok: false, value: { error: 'The session ended before this call ran.' } };
      this.usedAt = Date.now();
      try {
        const client = await this.open();
        const result = await client.callTool({ name: tool, arguments: args }, undefined, {
          timeout: QUIET_MS,
          resetTimeoutOnProgress: true,
          maxTotalTimeout: CALL_MS,
          onprogress: ({ message }) => {
            if (message) onLine(message);
          },
        });
        const first = Array.isArray(result.content) ? (result.content[0] as { type?: string; text?: string } | undefined) : undefined;
        const text = first?.type === 'text' && first.text !== undefined ? first.text : '';
        let value: unknown = text;
        try {
          value = JSON.parse(text);
        } catch {
          // A plain text answer, for example a schema error of the MCP server.
        }
        return { ok: result.isError !== true, value };
      } catch (e) {
        // The process may still run a call that timed out, so the next call gets a new one.
        this.broken = true;
        throw e;
      } finally {
        this.usedAt = Date.now();
        if (this.broken) await this.stop();
      }
    };
    const next = this.last.then(run, run);
    this.last = next.catch(() => undefined);
    return next;
  }

  get running(): boolean {
    return this.client !== undefined;
  }

  private async stop(): Promise<void> {
    const client = this.client;
    this.client = undefined;
    this.broken = false;
    await (await client?.catch(() => undefined))?.close();
  }

  /** Stops the process after the running call. The next call starts it again from the saved wallet state. */
  async close(): Promise<void> {
    await this.last;
    await this.stop();
  }
}
