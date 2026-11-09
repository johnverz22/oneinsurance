export const PRIMARY_AGENT_CODE = 'ckO6uNx2O6'
export const AGENT_CODE_COOKIE = 'oi-agent-code'

const AGENT_CODE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

/** Returns a safe agent code, falling back to the primary agent code. */
export function resolveAgentCode(raw: string | undefined | null): string {
  return raw && AGENT_CODE_PATTERN.test(raw) ? raw : PRIMARY_AGENT_CODE
}
