import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// Poll for compare-quote results using ClientRequestId
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const clientRequestId = body?.ClientRequestId

    if (!clientRequestId) {
      return NextResponse.json(
        { error: 'ClientRequestId is required' },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/quote/health/compare-quote`

    console.log('Health Insurance Poll Compare Quote URL:', url)
    console.log('ClientRequestId:', clientRequestId)

    // Send as GET with body (Postman collection shows GET with ClientRequestId in body)
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
      },
      data: { ClientRequestId: clientRequestId },
      timeout: 30000,
    })

    console.log('Poll response status:', response.status)
    console.log('Poll response data:', JSON.stringify(response.data, null, 2))

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    console.error('Health Insurance Poll error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })

    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
