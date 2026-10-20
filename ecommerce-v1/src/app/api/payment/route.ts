import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// ---------------------------------------------------------------------------
// In-memory OAuth token cache
// ---------------------------------------------------------------------------
// The DLT machine client is bound to exactly one merchant account, so a single
// server-level token serves all requests. We never expose the access_token to
// the browser — all DLT calls go through this BFF.

interface TokenCache {
  access_token: string
  expiresAt: number // ms since epoch
}

let tokenCache: TokenCache | null = null
// In-flight refresh promise — prevents multiple concurrent /oauth/token calls
let refreshPromise: Promise<string> | null = null

/**
 * Fetch a new OAuth token from DLT and update the module-level cache.
 * TTL = expires_in − 60s (floor at 60s) to guard against clock skew.
 */
async function refreshToken(): Promise<string> {
  const url = `${process.env.PAYMENT_BASE_URL}/oauth/token`
  const response = await axios.post<{
    access_token: string
    expires_in: number
    token_type: string
  }>(
    url,
    {
      grant_type: 'client_credentials',
      client_id: process.env.PAYMENT_CLIENT_ID ?? '',
      client_secret: process.env.PAYMENT_CLIENT_SECRET ?? '',
    },
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  )

  const { access_token, expires_in } = response.data
  const ttlMs = Math.max(expires_in - 60, 60) * 1000
  tokenCache = { access_token, expiresAt: Date.now() + ttlMs }
  return access_token
}

/**
 * Return a valid access token.  Uses the in-memory cache when still valid;
 * otherwise shares a single in-flight refresh promise so concurrent callers
 * don't race to `/oauth/token`.
 */
export async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.access_token
  }

  if (!refreshPromise) {
    refreshPromise = refreshToken().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

/**
 * Retry a DLT API call once after flushing the token cache on an auth error.
 * Prevents a single stale/expired token from permanently breaking a request.
 */
export async function withDltAuthRetry<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getToken()
  try {
    return await fn(token)
  } catch (err: any) {
    // 401 / 403 → flush cache and retry once with a fresh token
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      tokenCache = null
      const freshToken = await getToken()
      return fn(freshToken)
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// GET /api/payment  — fetch available DLT payment brands
// ---------------------------------------------------------------------------
// Brands list is consumed by the browser to show available payment options.
// The access token is injected here server-side; it never goes to the browser.

export async function GET(_req: NextRequest) {
  try {
    const data = await withDltAuthRetry(async (token) => {
      const url = new URL(`${process.env.PAYMENT_BASE_URL}/api/v1/collection/apn/brands`)
      url.searchParams.set('merchant_account_id', process.env.MERCHANT_ACCOUNT_ID ?? '')
      url.searchParams.set('service_code', process.env.PAYMENT_SERVICE_CODE ?? '')

      const response = await axios.get(url.toString(), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        timeout: 10_000,
      })
      return response.data
    })

    return NextResponse.json(data)
  } catch (err: any) {
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { success: false, message: 'Unable to connect to payment gateway. Please try again later.' },
        { status: 503 }
      )
    }
    const status = err?.response?.status ?? 500
    const message = err?.response?.data?.message ?? err.message ?? 'Internal server error'
    return NextResponse.json({ success: false, message }, { status })
  }
}
