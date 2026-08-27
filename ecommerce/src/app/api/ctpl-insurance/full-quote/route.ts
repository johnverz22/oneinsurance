import { FullQuoteCTPLRequest } from '@/types/ctpl-insurance/full-quote'
import { CTPLProductType } from '@/types/ctpl-insurance/init-compare'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

interface CTPLFullQuoteRequest {
  productType: CTPLProductType
  data: FullQuoteCTPLRequest
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CTPLFullQuoteRequest

    if (!body) {
      return NextResponse.json({ message: 'No body' }, { status: 400 })
    }

    const token = `Bearer ${process.env.BACKEND_ACCESS_TOKEN}`

    const paths: Record<CTPLProductType, string> = {
      MOTORCYCLE: '/quote/ctpl/motorcycle/full-quote',
      PRIVATECAR: '/quote/ctpl/private-car/full-quote',
      ACTC: '/quote/ctpl/actc/full-quote',
      LMT: '/quote/ctpl/lmt/full-quote',
      TPMB: '/quote/ctpl/tpmb/full-quote',
      PTB: '/quote/ctpl/ptb/full-quote',
      HTPB: '/quote/ctpl/htpb/full-quote',
    }
    const url = `${process.env.BASE_URL}${paths[body.productType]}`

    const response = await axios.post(url, body.data, {
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
        'Access-Control-Max-Age': '86400',
      },
    })
  } catch (error: any) {
    console.log('ctpl full quote error', error)
    handleServerSideAxiosError(error)
    return NextResponse.json(
      {
        message: error?.message || 'Something went wrong',
      },
      { status: 500 }
    )
  }
}
