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

    const response = await axios.post(url, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
      },
      timeout: 60000,
    })

    const backendData = response.data

    if (backendData?.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: backendData.message || 'Failed to load quote',
          details: backendData,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({ success: true, ...backendData }, { status: 200 })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
