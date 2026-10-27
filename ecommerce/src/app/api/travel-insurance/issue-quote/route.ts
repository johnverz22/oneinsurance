import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Per-attempt cap so a hung IGW connection becomes a retryable failure
// instead of stalling the whole retry loop forever.
const ATTEMPT_TIMEOUT_MS = 20_000
// Total wall-clock cap per request; the client retries the whole call, so
// the server must not stack long timeouts on top of that.
const TOTAL_BUDGET_MS = 45_000

/**
 * POST /api/travel-insurance/issue-quote
 *
 * Calls IGW /travel/issue-quote after DLT /sync has confirmed PAID.
 *
 * The IGW records payment via its own DLT webhook — there can be a short lag
 * between DLT confirming PAID to us via /sync and the IGW receiving that
 * notification.  We retry on 400 ("Payment not successful"), on 200 responses
 * with `success: false` (IGW still recording/processing), on any 5xx
 * (transient insurer failure), and on network-level errors with no response.
 * Only deterministic client errors (401/403/404/422, etc.) fail fast.
 *
 * Retry schedule: 2s, 4s, 6s, 8s, 10s, 12s, then 15s×4 → up to ~100s total.
 * The same proposal never issues two policies (IGW idempotent).
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body?.proposal_number) {
    return NextResponse.json(
      { success: false, message: 'proposal_number is required' },
      { status: 400 }
    )
  }

  if (!body?.payment?.reference) {
    return NextResponse.json(
      { success: false, message: 'payment.reference is required' },
      { status: 400 }
    )
  }

  if (typeof body.payment.reference === 'string' && body.payment.reference.length > 100) {
    return NextResponse.json(
      { success: false, message: 'payment.reference must not exceed 100 characters' },
      { status: 400 }
    )
  }

  // Build the payment object — only the fields the new contract accepts.
  // payment.status is optional and unchecked upstream; session_id,
  // coc_number, coc_status, coc_auth are no longer sent.
  const payment: Record<string, string> = {
    reference: body.payment.reference,
  }
  if (typeof body.payment.status === 'string' && body.payment.status) {
    payment.status = body.payment.status
  }
  if (typeof body.payment.paid_at === 'string' && body.payment.paid_at) {
    payment.paid_at = body.payment.paid_at
  }

  const requestBody = {
    proposal_number: body.proposal_number,
    payment,
    ...(body.custom_field ? { custom_field: body.custom_field } : {}),
  }

  const url = `${process.env.BASE_URL}/travel/issue-quote`
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
  }

  console.log('[issue-quote] → IGW payload:', JSON.stringify(requestBody))

  const RETRY_DELAYS = [2000, 4000, 6000, 8000, 10000, 12000, 15000, 15000, 15000, 15000] // ms — 10 retries, ~100s total
  // `single_attempt` is for read-only recovery probes (e.g. detecting an
  // already-issued policy by proposal number) — never wait through retries.
  const MAX_ATTEMPTS = body.single_attempt === true ? 1 : RETRY_DELAYS.length + 1

  const startedAt = Date.now()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Outcome of this attempt, normalised so HTTP errors and
    // 200+success:false share the same backoff/exhaustion path.
    let failStatus = 0
    let failData: any = null
    let failMessage = 'Issue quote failed'

    try {
      const response = await axios.post(url, requestBody, { headers, timeout: ATTEMPT_TIMEOUT_MS })

      if (response.data?.success !== false) {
        console.log(`[issue-quote] ← IGW 200 on attempt ${attempt}`)
        return NextResponse.json(response.data, { status: 200 })
      }

      // 200 but success:false — IGW hasn't recorded the payment yet or is
      // still processing. Wait and retry on the same schedule as a 400.
      failStatus = 200
      failData = response.data
      failMessage = response.data?.message || 'Issuance is still in progress'
      console.warn(`[issue-quote] ← IGW 200 success:false attempt ${attempt}/${MAX_ATTEMPTS} — ${failMessage}`)
    } catch (error: any) {
      if (!axios.isAxiosError(error)) {
        console.error('[issue-quote] unexpected error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
      }

      failStatus = error.response?.status ?? 0 // 0 = network failure / timeout — no response at all
      failData = error.response?.data
      failMessage = failData?.message || error.message || 'Issue quote failed'

      console.error(`[issue-quote] ← IGW ${failStatus || 'ERR'} attempt ${attempt}/${MAX_ATTEMPTS} — ${failMessage}`)

      // 400: payment not yet recorded by IGW — wait and retry
      // 5xx / no response: transient insurer or network failure — safe to retry
      // other 4xx (incl. 422): deterministic failure — forward immediately
      const retryable = failStatus === 0 || failStatus === 400 || failStatus >= 500
      if (!retryable) {
        console.error(
          '[issue-quote][SUPPORT-ALERT] issuance failed after payment —',
          JSON.stringify({
            proposal_number: body.proposal_number,
            payment_reference: body.payment.reference,
            status: failStatus,
            message: failMessage,
          })
        )
        return NextResponse.json(
          failData && typeof failData === 'object' && Object.keys(failData).length > 0
            ? failData
            : { success: false, message: failMessage },
          { status: failStatus }
        )
      }
    }

    if (attempt < MAX_ATTEMPTS && Date.now() - startedAt + RETRY_DELAYS[attempt - 1] < TOTAL_BUDGET_MS) {
      const delay = RETRY_DELAYS[attempt - 1]
      console.log(`[issue-quote] retrying in ${delay / 1000}s…`)
      await sleep(delay)
      continue
    }

    // Retries exhausted — forward the last IGW answer to the client.
    console.error(
      '[issue-quote][SUPPORT-ALERT] issuance failed after payment —',
      JSON.stringify({
        proposal_number: body.proposal_number,
        payment_reference: body.payment.reference,
        status: failStatus,
        message: failMessage,
      })
    )
    return NextResponse.json(
      failData && typeof failData === 'object' && Object.keys(failData).length > 0
        ? failData
        : { success: false, message: failMessage },
      { status: failStatus >= 400 ? failStatus : 502 }
    )
  }

  return NextResponse.json(
    { success: false, message: 'Payment confirmation is taking longer than expected. Please contact support with your proposal number.' },
    { status: 502 }
  )
}
