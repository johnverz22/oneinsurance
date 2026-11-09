import axios, { AxiosError } from 'axios'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

/** Resolve the backend base URL (server-side only) */
export const BASE_URL =
  process.env.BASE_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  'https://dev-one-insurance.intel-soln.com.ph/api/v1'

/**
 * The canonical origin of this Next.js app (server-only env var).
 * Set APP_URL in .env to the deployed URL (e.g. https://agent.oneinsurance.shop).
 * Cross-origin requests from any other origin will be blocked by the browser.
 */
const APP_URL = process.env.APP_URL ?? 'http://localhost:5000'

/**
 * Build CORS + JSON response headers scoped to this app's origin.
 * Only echoes the request origin back when it matches APP_URL.
 * Any other origin gets an empty Allow-Origin — the browser will block it.
 */
export function buildApiHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin === APP_URL ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

/**
 * Extract and validate the Authorization header from a request.
 * Returns the token string or null if missing.
 */
export function getAuthToken(req: NextRequest): string | null {
  return req.headers.get('Authorization')
}

/**
 * Map Axios errors to structured NextResponse objects.
 * Preserves the upstream status code and error body.
 */
export function handleAxiosError(error: AxiosError, req: NextRequest): NextResponse {
  const status = error.response?.status ?? 500
  const body = error.response?.data ?? { message: 'Internal server error' }
  return NextResponse.json(body, { status, headers: buildApiHeaders(req) })
}

/** Convenience: 401 Unauthorized */
export function unauthorized(req: NextRequest): NextResponse {
  return NextResponse.json(
    { success: false, message: 'Unauthorized' },
    { status: 401, headers: buildApiHeaders(req) }
  )
}

type ProxyOptions = {
  /** Forward the incoming Authorization header upstream (default true). */
  auth?: boolean
  /** Forward the incoming query string (default true). */
  search?: boolean
  /** Override the request body sent upstream (defaults to the incoming JSON body). */
  data?: unknown
}

/**
 * Proxy a request to the One Insurance backend and relay the response.
 * - Forwards the incoming query string and JSON body (for non-GET methods).
 * - Attaches the caller's Authorization header when present.
 * - Wraps the response with origin-scoped CORS headers.
 */
export async function proxyApiRequest(
  req: NextRequest,
  upstreamPath: string,
  { auth = true, search = true, data }: ProxyOptions = {}
): Promise<NextResponse> {
  const method = req.method.toUpperCase()
  const token = getAuthToken(req)

  if (auth && !token) return unauthorized(req)

  const url = `${BASE_URL}${upstreamPath}${search ? req.nextUrl.search : ''}`
  const body =
    data !== undefined
      ? data
      : method === 'GET' || method === 'HEAD' || method === 'DELETE'
        ? undefined
        : await req.json().catch(() => undefined)

  try {
    const res = await axios.request({
      url,
      method,
      data: body,
      headers: {
        ...(token ? { Authorization: token } : {}),
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
    })
    return NextResponse.json(res.data, {
      status: res.status,
      headers: buildApiHeaders(req),
    })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json(
      { success: false, message: 'Upstream request failed' },
      { status: 500, headers: buildApiHeaders(req) }
    )
  }
}
