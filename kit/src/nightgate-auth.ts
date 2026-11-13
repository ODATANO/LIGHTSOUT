/** How a script signs in to NIGHTGATE: the hosted service's access key, or the agent token a self-hosted instance grants. */
export type NightgateAuth = { accessKey: string } | { agentToken: string };

/** The credential in this process's environment, or null when there is none. */
export function authFromEnv(): NightgateAuth | null {
  const accessKey = process.env.ODATANO_ACCESS_KEY;
  const agentToken = process.env.NIGHTGATE_AGENT_TOKEN;
  if (accessKey && agentToken) throw new Error('set ODATANO_ACCESS_KEY or NIGHTGATE_AGENT_TOKEN, not both');
  if (accessKey) return { accessKey };
  return agentToken ? { agentToken } : null;
}
