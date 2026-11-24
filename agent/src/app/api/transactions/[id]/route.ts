import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, unauthorized } from '@/lib/api-helpers'

/**
 * GET /api/transactions/[id] — single transaction detail.
 * Supports numeric transaction ID, proposal number, merchant_transaction_id,
 * or policy_number. The agent-scoped upstream route is tried first.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const authHeaders = { Authorization: token, Accept: 'application/json' }

  // Strategy 1: direct endpoint lookup. The agent-scoped route accepts an id or
  // a proposal number and only returns the signed-in agent's own transactions,
  // so try it first and fall back to the shared transaction route.
  for (const path of [`/agents/transactions/${id}`, `/transactions/${id}`]) {
    try {
      const res = await axios.get(`${BASE_URL}${path}`, { headers: authHeaders })
      if (res.data?.data || res.data?.id)
        return NextResponse.json(res.data, { status: 200, headers })
    } catch {}
  }

  // Strategy 2: Search via POST /agents/transactions/search
  try {
    const searchRes = await axios.post(
      `${BASE_URL}/agents/transactions/search`,
      { keyword: id },
      { headers: authHeaders }
    )
    const list = Array.isArray(searchRes.data?.data)
      ? searchRes.data.data
      : Array.isArray(searchRes.data)
        ? searchRes.data
        : []

    if (list.length > 0) {
      const match =
        list.find(
          (t: any) =>
            t.merchant_transaction_id === id ||
            t.policy_number === id ||
            t.payment_id === id ||
            String(t.id) === id
        ) || list[0]

      if (match?.id) {
        try {
          const detailRes = await axios.get(`${BASE_URL}/transactions/${match.id}`, { headers: authHeaders })
          if (detailRes.data?.data)
            return NextResponse.json(detailRes.data, { status: 200, headers })
        } catch {}
      }

      return NextResponse.json({ success: true, data: match }, { status: 200, headers })
    }
  } catch {}

  // Strategy 3: Query /agents/transactions?search={id}&per_page=50
  try {
    const listRes = await axios.get(
      `${BASE_URL}/agents/transactions?search=${encodeURIComponent(id)}&per_page=50`,
      { headers: authHeaders }
    )
    const rawList = Array.isArray(listRes.data?.data?.data)
      ? listRes.data.data.data
      : Array.isArray(listRes.data?.data)
        ? listRes.data.data
        : []

    const match = rawList.find(
      (t: any) =>
        t.merchant_transaction_id === id ||
        t.policy_number === id ||
        t.payment_id === id ||
        String(t.id) === id
    )

    if (match) {
      if (match.id) {
        try {
          const detailRes = await axios.get(`${BASE_URL}/transactions/${match.id}`, { headers: authHeaders })
          if (detailRes.data?.data)
            return NextResponse.json(detailRes.data, { status: 200, headers })
        } catch {}
      }
      return NextResponse.json({ success: true, data: match }, { status: 200, headers })
    }
  } catch {}

  return NextResponse.json(
    { success: false, message: 'Transaction not found' },
    { status: 404, headers }
  )
}
