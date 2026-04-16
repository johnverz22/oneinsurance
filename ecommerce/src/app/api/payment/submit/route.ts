import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const data = await req.json()
  const token = req.headers.get('Authorization')

  if (!data || !token) {
    return NextResponse.json(
      { message: 'Invalid request data' },
      { status: 400 }
    )
  }

  console.log('Payment submit payload:', JSON.stringify(data, null, 2))

  const url = `${process.env.PAYMENT_BASE_URL}/api/collection/apn/submit`

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    })

    if (!response) {
      throw new Error('Payment submission failed')
    }

    return NextResponse.json(response.data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.error(error.response?.data || error.message)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }
    return NextResponse.json(
      { message: 'Payment submission failed' },
      { status: 500 }
    )
  }
}
