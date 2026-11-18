'use client'

import { useEffect } from 'react'

import { AGENT_CODE_COOKIE, isValidAgentCode, resolveAgentCode } from '@/lib/agent-code'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Persists the current /[agent-code] route segment so agent-less entry points
 * (the root redirect, shared pages) can keep the visitor's attribution. The
 * last visited agent code wins — a new code simply overwrites the old one.
 */
export function AgentCodeSync({ agentCode }: { agentCode: string }) {
  useEffect(() => {
    if (!isValidAgentCode(agentCode)) return
    const code = resolveAgentCode(agentCode)
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${AGENT_CODE_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`
  }, [agentCode])

  return null
}
