import { NextRequest, NextResponse } from 'next/server'
import { buildApiHeaders, getAuthToken, unauthorized } from '@/lib/api-helpers'

/**
 * Agent payment accounts.
 * The backend endpoint does not properly filter by agent ID and returns the
 * same data for all agents, so we return an empty payload until it is fixed
 * (same behaviour as the previous admin app).
 */
export async function GET(req: NextRequest) {
  if (!getAuthToken(req)) return unauthorized(req)

  return NextResponse.json(
    {
      success: true,
      message: 'No payment details found',
      data: { bank_details: [], e_wallets: [] },
      errors: [],
    },
    { status: 200, headers: buildApiHeaders(req) }
  )
}
