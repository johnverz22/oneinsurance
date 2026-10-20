import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// GET — legacy polling endpoint used by CTPL coverage-option (useGetTravelQuote).
// Still works against the old synchronous path; do not remove until CTPL migrates.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientRequestId = searchParams.get('ClientRequestId')

    if (!clientRequestId) {
      return NextResponse.json(
        { error: 'ClientRequestId is required' },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/quote/compare?ClientRequestId=${clientRequestId}`

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
      },
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST — starts an async compare-quote and returns ClientRequestId (202).
// The browser subscribes to the WebSocket channel, then GETs compare-quote?id={id}.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/travel/compare-quote/init`

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
      },
    })

    // Forward the 202 (or 200 on instant results) status from the backend
    return NextResponse.json(response.data, { status: response.status })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
