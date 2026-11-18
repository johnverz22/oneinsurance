import {
  clearResumeToken,
  getResumeToken,
  withClientIp,
} from '@/lib/resume-token-server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/travel-insurance/full-quote/[proposalNumber]
 *
 * Thin BFF proxy for OI's GET /api/v1/travel/full-quote/{proposalNumber}.
 * Tells the FE whether the quotation can still be resumed, has expired, is
 * already completed, or is temporarily unavailable (IGW error / login failure).
 *
 * States forwarded verbatim from the backend:
 *   resumable   → 200  { success: true,  data: { state: 'resumable', ... } }
 *   expired     → 410  { success: false, data: { state: 'expired', ... } }
 *   completed   → 409  { success: false, data: { state: 'completed' | 'paid_not_issued', ... } }
 *   not_found   → 404  { success: false, data: { state: 'not_found', ... } }
 *   unavailable → 503  { success: false, data: { state: 'unavailable', ... } }
 *
 * If the backend is completely unreachable we synthesise an `unavailable`
 * response (503) so the FE always gets the same structure and can offer retry.
 *
 * Resume token: the token is read from an httpOnly cookie scoped to this
 * proposal and forwarded as `X-Resume-Token`.  With the backend switch on, a
 * 404 means either "unknown proposal" or "missing/wrong/expired token" — the
 * FE treats both as "needs email verification".  We clear the cookie on a 404
 * so a stale token doesn't linger.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ proposalNumber: string }> }
) {
  const { proposalNumber } = await params

  // Validate proposal number format: {insurer}-{plan}-{yymmdd}-{6 digits}
  // e.g. MIC-TMPHPC1-261019-000002 — backend reports this state as `invalid`
  // Plan codes may themselves contain dashes (e.g. OONA-TRVL-APAC-01-261028-000005),
  // so only the trailing date + sequence segments are fixed.
  if (!proposalNumber || !/^[A-Z0-9]+(?:-[A-Z0-9]+)+-\d{6}-\d{6}$/i.test(proposalNumber)) {
    return NextResponse.json(
      {
        success: false,
        message: 'The proposal number is not valid.',
        data: { state: 'invalid', resumable: false, proposal_number: proposalNumber },
      },
      { status: 422 }
    )
  }

  const url = `${process.env.BASE_URL}/travel/full-quote/${encodeURIComponent(proposalNumber)}`

  // The token only unlocks this one proposal; the BFF owns it so the browser
  // never sees it.  When absent the resume call goes out unauthenticated and
  // the backend answers 404 (unknown or needs verification — same answer).
  const resumeToken = await getResumeToken(proposalNumber)

  try {
    const response = await axios.get(url, {
      headers: withClientIp(
        {
          Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
          Accept: 'application/json',
          ...(resumeToken ? { 'X-Resume-Token': resumeToken } : {}),
        },
        req
      ),
      // Do not throw on 4xx/5xx — we forward the status ourselves
      validateStatus: () => true,
      timeout: 15_000,
    })

    const status = response.status
    const body = response.data

    // Surface the backend's X-Request-Id in data.request_id (documented for
    // `unavailable` responses) when the body doesn't already carry it.
    const requestId = response.headers?.['x-request-id'] as string | undefined
    if (requestId && body?.data && typeof body.data === 'object' && !body.data.request_id) {
      body.data.request_id = requestId
    }

    // Pass backend status codes through directly — the FE interprets them.
    // We normalise only when the backend is completely silent.
    const res = NextResponse.json(body, { status })

    // A 404 after sending a token means the token is missing/wrong/expired
    // (the backend deliberately can't tell us which).  Drop the stale cookie
    // so the next attempt starts from the email-code verification screen.
    if (status === 404 && resumeToken) {
      clearResumeToken(res, proposalNumber)
    }

    return res
  } catch (err: any) {
    // Network-level error (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, etc.)
    // Treat as unavailable so the FE can offer retry, not a hard error.
    const requestId =
      (err?.response?.headers?.['x-request-id'] as string | undefined) ?? undefined

    console.error('[full-quote/resumption] backend unreachable:', err?.message ?? err)

    return NextResponse.json(
      {
        success: false,
        message: 'The quoting service is temporarily unavailable. Please try again shortly.',
        data: {
          state: 'unavailable',
          resumable: false,
          proposal_number: proposalNumber,
          ...(requestId ? { request_id: requestId } : {}),
        },
      },
      { status: 503 }
    )
  }
}
