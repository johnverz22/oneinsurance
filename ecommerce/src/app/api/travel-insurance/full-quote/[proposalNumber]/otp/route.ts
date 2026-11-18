import { forwardRetryAfter, withClientIp } from '@/lib/resume-token-server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/travel-insurance/full-quote/[proposalNumber]/otp
 *
 * BFF proxy for OI's "email me a resume code" endpoint.  Always answers 202
 * (or 429 on rate limit) — it never reveals whether the proposal exists or
 * whether an email was actually sent.
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

  const url = `${process.env.BASE_URL}/travel/full-quote/${encodeURIComponent(proposalNumber)}/otp`

  try {
    const response = await axios.post(
      url,
      undefined,
      {
        headers: withClientIp(
          {
            Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
            Accept: 'application/json',
          },
          req
        ),
        validateStatus: () => true,
        timeout: 15_000,
      }
    )

    const res = NextResponse.json(response.data, { status: response.status })
    forwardRetryAfter(res, response.headers?.['retry-after'])
    return res
  } catch (err: any) {
    console.error('[resume-otp] backend unreachable:', err?.message ?? err)
    return NextResponse.json(
      {
        success: false,
        message: 'We could not reach the server. Please try again in a moment.',
      },
      { status: 503 }
    )
  }
}
