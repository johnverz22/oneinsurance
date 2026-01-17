import {
  CTPLProductType,
  InitCompareCTPLRequest,
} from '@/types/ctpl-insurance/init-compare'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

interface InitCTPLRequest {
  productType: CTPLProductType
  data: InitCompareCTPLRequest
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as InitCTPLRequest
    const token = `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`

    if (!data.productType) {
      return NextResponse.json(
        { message: 'Product type is required' },
        { status: 400 }
      )
    }

    const paths: Record<CTPLProductType, string> = {
      MOTORCYCLE: '/quote/ctpl/motorcycle/compare-quote',
      PRIVATECAR: '/quote/ctpl/private-car/compare-quote',
      ACTC: '/quote/ctpl/actc/compare-quote',
      LMT: '/quote/ctpl/lmt/compare-quote',
      TPMB: '/quote/ctpl/tpmb/compare-quote',
      PTB: '/quote/ctpl/ptb/compare-quote',
      HTPB: '/quote/ctpl/htpb/compare-quote',
    }

    const path = paths[data.productType]

    const url = `${process.env.BASE_URL}${path}`
    console.log('URL:', url)
    console.log('Request Data:', data.data)

    const response = await axios.post(url, data.data, {
      headers: { Authorization: token },
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
    console.log('Init Compare', error)
    if (axios.isAxiosError(error)) {
      switch (error.status) {
        case 500:
          return NextResponse.json(
            { message: `Server is currently down ${error.message}` },
            {
              status: 500,
            }
          )
        case 422:
          return NextResponse.json(
            error.response?.data || { message: 'Unprocessable Entity' },
            { status: 422 }
          )
        case 401:
          return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
    }

    throw NextResponse.json(error, { status: error.status })
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
