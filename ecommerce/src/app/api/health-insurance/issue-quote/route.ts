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

    if (!body.ProposalNo) {
      return NextResponse.json(
        { error: 'ProposalNo is required' },
        { status: 400 }
      )
    }

    const requestBody = {
      ProposalNo: body.ProposalNo,
      CustomField: {
        ...body.CustomField,
      },
    }

    const url = `${process.env.BASE_URL}/quote/health/issue-quote`

    const response = await axios.post(url, requestBody, {
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
