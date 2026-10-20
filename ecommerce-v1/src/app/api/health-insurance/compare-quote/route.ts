import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/quote/health/compare-quote`

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
      },
      timeout: 60000,
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientRequestId =
      searchParams.get('clientRequestId') ??
      req.headers.get('X-Client-Request-Id')

    if (!clientRequestId) {
      return NextResponse.json(
        { error: 'clientRequestId is required' },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/quote/health/compare-quote`

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
      },
      data: { ClientRequestId: clientRequestId },
      timeout: 30000,
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
