import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

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
