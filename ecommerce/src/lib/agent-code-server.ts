import { cookies } from 'next/headers'

import { AGENT_CODE_COOKIE, resolveAgentCode } from './agent-code'

/**
 * Agent code persisted by AgentCodeSync whenever a visitor lands on a
 * /[agent-code]/... route. Falls back to the primary agent code when no
 * (valid) code has been stored yet.
 */
export async function getPersistedAgentCode(): Promise<string> {
  const jar = await cookies()
  return resolveAgentCode(jar.get(AGENT_CODE_COOKIE)?.value)
}
