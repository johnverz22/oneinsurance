import { IssueQuoteResponse } from '@/types/travel-insurance/policy-types'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = req.headers.get('Authorization')
    const url = `${process.env.BASE_URL}/quote/travel/issue-quote`
    const response = await axios.post<IssueQuoteResponse>(url, body, {
      headers: {
        Authorization: token,
      },
    })

    return NextResponse.json(response.data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.log('Issue Quote', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    throw NextResponse.json(error.response.data, { status: error.status })
  }
}
