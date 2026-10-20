import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

/**
 * BFF proxy for payment status polling.
 *
 * The client calls POST /api/payment/verify-status with { proposal_number }.
 * This route adds the backend Authorization header server-side so the token
 * is never exposed to the browser.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body?.proposal_number) {
      return NextResponse.json(
        { success: false, message: 'proposal_number is required' },
        { status: 400 }
      )
    }

    const backendToken = process.env.BACKEND_ACCESS_TOKEN
    if (!backendToken) {
      console.error('BACKEND_ACCESS_TOKEN is not configured')
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      )
    }

    const url = `${process.env.BASE_URL}/transactions/verify-status`

    const response = await axios.post(
      url,
      { proposal_number: body.proposal_number },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${backendToken}`,
        },
      }
    )

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
