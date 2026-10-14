import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * POST /api/travel-insurance/issue-quote
 *
 * Calls IGW /travel/issue-quote after DLT /sync has confirmed PAID.
 *
 * The IGW records payment via its own DLT webhook — there can be a short lag
 * between DLT confirming PAID to us via /sync and the IGW receiving that
 * notification.  We retry on 400 ("Payment not successful") and 502 (transient
 * insurer failure) with exponential backoff.
 *
 * Retry schedule: 2s, 4s, 6s, 8s, 10s → up to ~30s total.
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

  const requestBody = {
    proposal_number: body.proposal_number,
    ...(body.CustomField ? { CustomField: body.CustomField } : {}),
  }

  const url = `${process.env.BASE_URL}/travel/issue-quote`
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
  }

  console.log('[issue-quote] → IGW payload:', JSON.stringify(requestBody))

  const RETRY_DELAYS = [2000, 4000, 6000, 8000, 10000] // ms — 5 retries, ~30s total
  const MAX_ATTEMPTS = RETRY_DELAYS.length + 1

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.post(url, requestBody, { headers })
      console.log(`[issue-quote] ← IGW 200 on attempt ${attempt}`)
      return NextResponse.json(response.data, { status: 200 })
    } catch (error: any) {
      if (!axios.isAxiosError(error)) {
        console.error('[issue-quote] unexpected error:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
      }

      const status = error.response?.status ?? 500
      const data = error.response?.data
      const message = data?.message || error.message || 'Issue quote failed'

      console.error(`[issue-quote] ← IGW ${status} attempt ${attempt}/${MAX_ATTEMPTS} — ${message}`)

      // 400: payment not yet recorded by IGW — wait and retry
      // 502: transient insurer failure — safe to retry per API spec
      const isRetryable = status === 400 || status === 502
      const hasMoreAttempts = attempt < MAX_ATTEMPTS

      if (isRetryable && hasMoreAttempts) {
        const delay = RETRY_DELAYS[attempt - 1]
        console.log(`[issue-quote] retrying in ${delay / 1000}s…`)
        await sleep(delay)
        continue
      }

      // Non-retryable or exhausted — forward IGW's error body to client
      return NextResponse.json(
        data && typeof data === 'object' && Object.keys(data).length > 0
          ? data
          : { success: false, message },
        { status }
      )
    }
  }

  return NextResponse.json(
    { success: false, message: 'Payment confirmation is taking longer than expected. Please contact support with your proposal number.' },
    { status: 502 }
  )
}
