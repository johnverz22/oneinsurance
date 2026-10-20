import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { withDltAuthRetry } from '../dlt-auth'

// ---------------------------------------------------------------------------
// POST /api/payment/submit
//
// Accepts the billing-details + payment-brand payload from the browser and
// forwards it to DLT as a Hosted Checkout submit.  The DLT OAuth token is
// fetched and injected server-side — the browser never holds or sends it.
//
// v4.0 rules:
//   • No card fields (card_number, ccv, expiry, device) accepted or forwarded.
//   • merchant_account_id, service_code, channel, time_offset are BFF-owned.
//   • channel is hardcoded to 4 (Custom hosted checkout).
//   • time_offset is hardcoded to "+08:00".
//   • amount must be a decimal string e.g. "1299.00".
// ---------------------------------------------------------------------------

const AMOUNT_RE = /^\d{1,10}\.\d{2}$/

function validateAmount(raw: unknown): string | null {
  if (typeof raw !== 'string' || !AMOUNT_RE.test(raw)) return null
  // Use integer arithmetic — no parseFloat on the canonical value
  const parts = raw.split('.')
  const wholeCents = parseInt(parts[0], 10) * 100 + parseInt(parts[1], 10)
  if (wholeCents <= 0 || wholeCents > 50_000_000) return null // max 500,000.00 PHP
  return raw
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  const merchantAccountId = process.env.MERCHANT_ACCOUNT_ID
  const serviceCode = process.env.PAYMENT_SERVICE_CODE

  if (!merchantAccountId || !serviceCode) {
    console.error('[payment/submit] MERCHANT_ACCOUNT_ID or PAYMENT_SERVICE_CODE is not set')
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }

  // Validate merchant_transaction_id
  const txnId = body.merchant_transaction_id
  if (typeof txnId !== 'string' || !/^[A-Za-z0-9_-]{1,45}$/.test(txnId)) {
    return NextResponse.json(
      { success: false, message: 'Invalid merchant_transaction_id' },
      { status: 400 }
    )
  }

  // Validate amount — must be a decimal string; coerce number if needed
  const rawAmount = typeof body.amount === 'number'
    ? (body.amount as number).toFixed(2)
    : body.amount
  const amount = validateAmount(rawAmount)
  if (!amount) {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid amount "${body.amount}" — expected decimal string e.g. "1299.00"`,
        received_amount: body.amount,
        received_type: typeof body.amount,
      },
      { status: 400 }
    )
  }

  // Strip v3.0 card/device fields and BFF-owned fields from the client payload
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    is_card_payment: _icp,
    card_number: _cn,
    card_holder_name: _chn,
    expiration_month: _em,
    expiration_year: _ey,
    ccv: _ccv,
    device: _dev,
    merchant_account_id: _ma,
    service_code: _sc,
    channel: _ch,
    time_offset: _to,
    currency: _cur,
    ...rest
  } = body as any

  const submitUrl = `${process.env.PAYMENT_BASE_URL}/api/v1/collection/apn/submit`

  // Build the DLT payload — BFF owns the sensitive/structural fields
  const payload = {
    ...rest,
    merchant_account_id: merchantAccountId,
    service_code: serviceCode,
    merchant_transaction_id: txnId,
    amount,
    channel: 4,           // Custom hosted checkout
    time_offset: '+08:00',
    currency: 'PHP',
  }

  console.log('[payment/submit] → DLT payload:', JSON.stringify(payload, null, 2))

  try {
    const data = await withDltAuthRetry(async (token) => {
      const response = await axios.post(submitUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      return response.data
    })

    console.log('[payment/submit] ← DLT success:', JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (err: any) {
    const status = err?.response?.status ?? 500
    const responseData = err?.response?.data

    console.error(`[payment/submit] ← DLT error ${status}:`, JSON.stringify(responseData ?? err.message, null, 2))

    // 409 = DLT already has this merchant_transaction_id — never auto-retry
    if (status === 409) {
      return NextResponse.json(
        { success: false, message: 'TRANSACTION_REFERENCE_CONFLICT', code: 'CONFLICT' },
        { status: 409 }
      )
    }

    // 503 = SUBMISSION_UNKNOWN — transaction may or may not have been created.
    // Return HTTP 200 so the client handles it gracefully (keep same txn ID,
    // show verify-status screen). Never resubmit on this code.
    if (status === 503) {
      const dltBody = responseData ?? {}
      console.warn('[payment/submit] ← DLT 503 SUBMISSION_UNKNOWN')
      return NextResponse.json({
        success: false,
        code: 'SUBMISSION_UNKNOWN',
        message: dltBody.message ?? 'SUBMISSION_UNKNOWN',
        data: dltBody.data ?? null,
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: responseData?.message ?? responseData?.error ?? 'Payment submission failed',
        dlt_status: status,
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    )
  }
}
