import {
  forwardRetryAfter,
  setResumeToken,
  withClientIp,
} from '@/lib/resume-token-server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/travel-insurance/full-quote/[proposalNumber]/otp/verify
 *
 * Verifies the emailed 6-digit code.  On success OI returns a short-lived
 * resume token (30 minutes); we keep it in an httpOnly cookie scoped to the
 * proposal and strip it from the body.  The browser then re-runs the normal
 * resume request, which the BFF authenticates with `X-Resume-Token`.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ proposalNumber: string }> }
) {
  const { proposalNumber } = await params

  if (!process.env.BASE_URL) {
    return NextResponse.json(
      { success: false, message: 'Server configuration error: BASE_URL is not set' },
      { status: 500 }
    )
  }

  let code: unknown
  try {
    const body = await req.json()
    code = body?.code
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  if (typeof code !== 'string' || !code) {
    return NextResponse.json(
      { success: false, errors: { code: ['The code is required.'] } },
      { status: 422 }
    )
  }

  const url = `${process.env.BASE_URL}/travel/full-quote/${encodeURIComponent(proposalNumber)}/otp/verify`

  try {
    const response = await axios.post(
      url,
      { code },
      {
        headers: withClientIp(
          {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
            Accept: 'application/json',
          },
          req
        ),
        validateStatus: () => true,
        timeout: 15_000,
      }
    )

    const status = response.status
    const body = response.data
    const resumeToken: string | undefined = body?.data?.resume_token
    const expiresAt: string | undefined = body?.data?.expires_at

    if (status === 200 && body?.data && typeof body.data === 'object') {
      delete body.data.resume_token
    }

    const res = NextResponse.json(body, { status })
    forwardRetryAfter(res, response.headers?.['retry-after'])

    if (status === 200 && resumeToken) {
      setResumeToken(res, proposalNumber, resumeToken, expiresAt)
    }

    return res
  } catch (err: any) {
    console.error('[resume-otp/verify] backend unreachable:', err?.message ?? err)
    return NextResponse.json(
      {
        success: false,
        message: 'We could not reach the server. Please try again in a moment.',
      },
      { status: 503 }
    )
  }
}
