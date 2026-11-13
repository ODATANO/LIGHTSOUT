// The agents a visitor can get. One that is registered at the bridge is lent as a ready agent.
// One that is not registered yet is lent as a fresh agent, which its visitor makes a member.
import { agentNamed } from 'lightsout-kit/roles';

export interface PoolAgent {
  id: string;
  account: string; // its NEAR account
  env: Record<string, string>; // what the agent's MCP server needs to open it
}

/** The agents of `DEMO_AGENTS`, by default alice from `.env`. An empty list lends none of `.env`. */
export function agentsOf(names = process.env.DEMO_AGENTS ?? 'alice'): PoolAgent[] {
  const ids = names.split(',').map((name) => name.trim()).filter(Boolean);
  return ids.map((id) => ({ id, account: agentNamed(id).nearAccountId, env: { LIGHTSOUT_AGENT: id } }));
}

/** The lendable agents with who holds each. `isRegistered` asks the bridge about a NEAR account. */
export class Pool {
  private readonly holders = new Map<string, string>(); // agent id -> session
  private readonly registered = new Set<string>(); // agent ids; a registration stays for good

  constructor(
    private readonly agents: PoolAgent[],
    private readonly isRegistered: (account: string) => Promise<boolean>,
  ) {}

  /** Takes one more agent into the pool. */
  add(agent: PoolAgent): void {
    this.agents.push(agent);
  }

  /** Asks the bridge about every agent that was not registered when last asked. */
  async refresh(): Promise<void> {
    for (const agent of this.agents) {
      if (!this.registered.has(agent.id) && (await this.isRegistered(agent.account))) this.registered.add(agent.id);
    }
  }

  private freeOf(fresh: boolean): PoolAgent[] {
    return this.agents.filter((agent) => !this.holders.has(agent.id) && this.registered.has(agent.id) !== fresh);
  }

  /** A free agent for this session, fresh or ready, or undefined when none of that kind is free. */
  take(session: string, fresh: boolean): PoolAgent | undefined {
    const free = this.freeOf(fresh)[0];
    if (free) this.holders.set(free.id, session);
    return free;
  }

  release(agent: PoolAgent): void {
    this.holders.delete(agent.id);
  }

  /** Whether the pool lends an agent of this name. */
  has(name: string): boolean {
    return this.agents.some((agent) => agent.id === name);
  }

  /** Whether the bridge showed this agent as registered when last asked. */
  knowsRegistered(agent: PoolAgent): boolean {
    return this.registered.has(agent.id);
  }

  /** How many agents are free to take, fresh or ready. */
  free(fresh: boolean): number {
    return this.freeOf(fresh).length;
  }
}
