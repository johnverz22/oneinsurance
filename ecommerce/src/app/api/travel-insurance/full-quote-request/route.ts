import {
  FullQuoteResponse,
  FullQuoteResponseSchema,
} from '@/types/travel-insurance/policy-types'
import {
  FullQuoteResponseValidationError,
  FullQuoteResponseValidationErrorSchema,
} from '@/types/travel-insurance/error-travel-response'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = req.headers.get('Authorization')
    const url = `${process.env.BASE_URL}/quote/travel/full-quote`
    const response = await axios.post(url, body, {
      headers: {
        Authorization: token,
      },
    })

    if (FullQuoteResponseSchema.safeParse(response.data).success) {
      return NextResponse.json(response.data as FullQuoteResponse, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // if (FullQuoteResponseValidationErrorSchema.safeParse(response.data).success) {

    // }

    return NextResponse.json(
      response.data as FullQuoteResponseValidationError,
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  } catch (error: any) {
    console.log('Full Quote', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    throw NextResponse.json(error.response.data, { status: error.status })
  }
}
