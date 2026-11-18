import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

/**
 * Proposal resume tokens (GET/POST full-quote + email OTP).
 *
 * A resume token is scoped to exactly one proposal number, so it is stored in
 * its own httpOnly cookie.  Never expose it to the browser: the BFF reads it
 * and forwards it as `X-Resume-Token` on the upstream resume call.
 */
const COOKIE_PREFIX = 'oi_resume_'
const FALLBACK_MAX_AGE = 30 * 24 * 60 * 60 // 30 days — matches the full-quote token

export const resumeCookieName = (proposalNo: string) => `${COOKIE_PREFIX}${proposalNo}`

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
})

/** Reads the resume token stored for a proposal, if any. */
export async function getResumeToken(proposalNo: string): Promise<string | null> {
  try {
    const jar = await cookies()
    return jar.get(resumeCookieName(proposalNo))?.value ?? null
  } catch {
    return null
  }
}

/**
 * Stores a resume token on the outgoing response.
 * `expiresAt` (ISO datetime) wins over the 30-day fallback when valid.
 */
export function setResumeToken(
  res: NextResponse,
  proposalNo: string,
  token: string,
  expiresAt?: string | null
) {
  const expiry = expiresAt ? new Date(expiresAt) : null
  const maxAge =
    expiry && !isNaN(expiry.getTime())
      ? Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000))
      : FALLBACK_MAX_AGE

  res.cookies.set(resumeCookieName(proposalNo), token, cookieOptions(maxAge))
}

/** Removes a stale token (e.g. after a 404 on resume). */
export function clearResumeToken(res: NextResponse, proposalNo: string) {
  res.cookies.set(resumeCookieName(proposalNo), '', cookieOptions(0))
}

/**
 * Real client IP as seen by the proxy in front of Next.js.  Forwarded to OI so
 * its per-IP OTP rate limit is applied per user instead of per server.
 */
export function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip') ?? undefined
}

/** Adds `X-Forwarded-For` to an outgoing header bag when the IP is known. */
export function withClientIp(
  headers: Record<string, string>,
  req: NextRequest
): Record<string, string> {
  const ip = getClientIp(req)
  if (ip) headers['X-Forwarded-For'] = ip
  return headers
}

/** Copies `Retry-After` from an upstream response onto ours (seconds or date). */
export function forwardRetryAfter(
  res: NextResponse,
  retryAfter: string | string[] | number | undefined
) {
  const value = Array.isArray(retryAfter) ? retryAfter[0] : retryAfter
  if (value !== undefined && value !== null && value !== '') {
    res.headers.set('Retry-After', String(value))
  }
}
