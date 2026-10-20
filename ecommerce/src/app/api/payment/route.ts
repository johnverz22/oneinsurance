import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { withDltAuthRetry } from './dlt-auth'

// ---------------------------------------------------------------------------
// GET /api/payment  — fetch available DLT payment brands
// ---------------------------------------------------------------------------
// Brands list is consumed by the browser to show available payment options.
// The access token is injected here server-side; it never goes to the browser.

export async function GET(_req: NextRequest) {
  try {
    const data = await withDltAuthRetry(async (token) => {
      const url = new URL(`${process.env.PAYMENT_BASE_URL}/api/v1/collection/apn/brands`)
      url.searchParams.set('merchant_account_id', process.env.MERCHANT_ACCOUNT_ID ?? '')
      url.searchParams.set('service_code', process.env.PAYMENT_SERVICE_CODE ?? '')

      const response = await axios.get(url.toString(), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        timeout: 10_000,
      })
      return response.data
    })

    return NextResponse.json(data)
  } catch (err: any) {
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { success: false, message: 'Unable to connect to payment gateway. Please try again later.' },
        { status: 503 }
      )
    }
    const status = err?.response?.status ?? 500
    const message = err?.response?.data?.message ?? err.message ?? 'Internal server error'
    return NextResponse.json({ success: false, message }, { status })
  }
}
