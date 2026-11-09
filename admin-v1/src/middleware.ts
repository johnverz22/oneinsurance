// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Array of blocked paths
  const blockedPaths = [
    "/hierarchy",
    "/leaderboard",
    "/teams",
  ]

  // Check if the current path matches any blocked path
  const isBlocked = blockedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isBlocked) {
    const rootUrl = new URL('/', request.url)
    rootUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(rootUrl)
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    '/hierarchy/:path*',
    '/leaderboard/:path*',
    '/teams/:path*',
  ],
}