import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body?.ProposalNo) {
      return NextResponse.json(
        { success: false, error: 'ProposalNo is required' },
        { status: 400 }
      )
    }

    const requestPayload = {
      ProposalNo: body.ProposalNo,
      Type: 'proposal',
    }

    const url = `${process.env.BASE_URL}/quote/health/load-quote`

    console.log('Health Insurance Load Quote URL:', url)
    console.log('Request payload:', JSON.stringify(requestPayload, null, 2))

    const response = await axios.post(url, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
      },
      timeout: 60000,
    })

    console.log('Backend response status:', response.status)
    console.log('Backend response data:', JSON.stringify(response.data, null, 2))

    const backendData = response.data

    if (backendData?.success === false) {
      return NextResponse.json(
        { success: false, error: backendData.message || 'Failed to load quote', details: backendData },
        { status: 422 }
      )
    }

    return NextResponse.json({ success: true, ...backendData }, { status: 200 })
  } catch (error: any) {
    console.error('Health Insurance Load Quote error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })

    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
