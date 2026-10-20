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
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ proposalNumber: string }> }
) {
  const { proposalNumber } = await params

  // Validate proposal number format: {insurer}-{plan}-{yymmdd}-{6 digits}
  // e.g. MIC-TMPHPC1-261019-000002 — backend reports this state as `invalid`
  if (!proposalNumber || !/^[A-Z0-9]+-[A-Z0-9]+-\d{6}-\d{6}$/i.test(proposalNumber)) {
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

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
        Accept: 'application/json',
      },
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
    return NextResponse.json(body, { status })
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
