import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { withDltAuthRetry } from '@/app/api/payment/route'

// ---------------------------------------------------------------------------
// POST /api/payment/sync
//
// Post-redirect status recovery.  Called once when the payor's browser lands
// back on the success/failure return page.  Uses DLT's authenticated /sync
// endpoint — the authoritative source of truth for payment status.
//
// Request body: { merchant_transaction_id: string }
//
// Response proxies DLT's /sync shape:
// {
//   success: boolean,
//   message: string,
//   data: {
//     merchant_transaction_id: string,
//     payment_status: "PAID" | "PENDING" | "REJECTED",
//     provider_message: string | null,
//     timestamp: string
//   }
// }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: { merchant_transaction_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  const { merchant_transaction_id } = body

  if (
    typeof merchant_transaction_id !== 'string' ||
    !/^[A-Za-z0-9_-]{1,45}$/.test(merchant_transaction_id)
  ) {
    return NextResponse.json(
      { success: false, message: 'Invalid merchant_transaction_id' },
      { status: 400 }
    )
  }

  const syncUrl = `${process.env.PAYMENT_BASE_URL}/api/v1/collection/apn/sync`

  try {
    const data = await withDltAuthRetry(async (token) => {
      const response = await axios.post(
        syncUrl,
        { merchant_transaction_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          // Don't throw on 4xx — we want to inspect the body
          validateStatus: () => true,
        }
      )

      // 409 SYNC_NOT_AVAILABLE — transaction exists but hasn't propagated yet.
      // Return as a 200 with a PENDING-like status so the client can display it.
      if (response.status === 409 && response.data?.error_code === 'SYNC_NOT_AVAILABLE') {
        return {
          success: false,
          message: 'Payment is still being processed. Please check again in a moment.',
          data: {
            merchant_transaction_id,
            payment_status: 'PENDING',
            provider_message: response.data.message ?? null,
            timestamp: new Date().toISOString(),
          },
        }
      }

      // For other non-2xx, throw so withDltAuthRetry can handle auth errors
      if (response.status >= 400) {
        const err: any = new Error(response.data?.message ?? 'Sync failed')
        err.response = response
        throw err
      }

      return response.data
    })

    return NextResponse.json(data)
  } catch (err: any) {
    const status = err?.response?.status ?? 500
    const message = err?.response?.data?.message ?? err.message ?? 'Sync request failed'
    console.error('[payment/sync] DLT error:', message)
    return NextResponse.json({ success: false, message }, { status: status >= 400 ? status : 500 })
  }
}
