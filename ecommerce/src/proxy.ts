import { NextResponse, type NextRequest } from 'next/server'
import {
  AGENT_CODE_COOKIE,
  PRIMARY_AGENT_CODE,
  resolveAgentCode,
} from '@/lib/agent-code'

const DIRECT_PRODUCT_SLUGS = new Set([
  'travel-insurance',
  'health-insurance',
  'motor-insurance',
  'ctpl-insurance',
  'marine-cargo-insurance',
  'engineering-insurance',
  'specialized-insurance',
  'providers',
])

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Ignore internal Next.js requests, API routes, and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return NextResponse.next()
  }

  const first = segments[0]?.toLowerCase()

  // Case 1: Accessed /login or /login/...
  // Ecommerce has no login route (portal auth lives on port 4000/5000).
  // Redirect to the resolved storefront path and purge any stale 'login' cookie.
  if (first === 'login') {
    const rawCookie = req.cookies.get(AGENT_CODE_COOKIE)?.value
    const agentCode = resolveAgentCode(rawCookie)
    const rest = segments.slice(1).join('/')
    const target = rest ? `/${agentCode}/${rest}` : `/${agentCode}`
    const url = new URL(target, req.url)
    url.search = req.nextUrl.search

    const res = NextResponse.redirect(url)
    if (rawCookie?.toLowerCase() === 'login') {
      res.cookies.set(AGENT_CODE_COOKIE, PRIMARY_AGENT_CODE, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      })
    }
    return res
  }

  // Case 2: Directly accessing a product suite (e.g. /travel-insurance or /travel-insurance/plans)
  // without an affiliate agent code prefix. Default to the visitor's persisted agent code
  // or PRIMARY_AGENT_CODE.
  if (DIRECT_PRODUCT_SLUGS.has(first)) {
    const rawCookie = req.cookies.get(AGENT_CODE_COOKIE)?.value
    const agentCode = resolveAgentCode(rawCookie)
    const target = `/${agentCode}/${segments.join('/')}`
    const url = new URL(target, req.url)
    url.search = req.nextUrl.search

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
