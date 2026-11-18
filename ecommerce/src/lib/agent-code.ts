export const PRIMARY_AGENT_CODE = 'ckO6uNx2O6'
export const AGENT_CODE_COOKIE = 'oi-agent-code'

const AGENT_CODE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

/**
 * Known app routes, product slugs, and auth keywords that must NEVER be
 * accepted or persisted as an affiliate agent code.
 */
export const RESERVED_SLUGS = new Set([
  'login',
  'signin',
  'logout',
  'signout',
  'register',
  'signup',
  'auth',
  'admin',
  'agent',
  'portal',
  'dashboard',
  'api',
  'travel-insurance',
  'health-insurance',
  'motor-insurance',
  'ctpl-insurance',
  'marine-cargo-insurance',
  'engineering-insurance',
  'specialized-insurance',
  'agent-application',
  'coming-soon',
  'providers',
  'errors',
  'travel-insurance-terms',
  'pacific-cross-health-brochure',
  'test',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

export function isValidAgentCode(raw: string | undefined | null): raw is string {
  if (!raw || !AGENT_CODE_PATTERN.test(raw)) return false
  return !RESERVED_SLUGS.has(raw.toLowerCase())
}

/** Returns a safe agent code, falling back to the primary agent code. */
export function resolveAgentCode(raw: string | undefined | null): string {
  return isValidAgentCode(raw) ? raw : PRIMARY_AGENT_CODE
}
