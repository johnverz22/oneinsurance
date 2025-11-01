import { TravelPolicyResponse } from '@/types/quote'
import axios from 'axios'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')
    const body = await req.json()
    console.log('body', body)
    const url = `${process.env.BASE_URL}/quote/travel/load-quote`
    const response = await axios.post<TravelPolicyResponse>(url, body, {
      headers: {
        Authorization: token,
      },
      timeout: 1000 * 60 * 5,
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
    console.log('Load Quote', error)
    if (axios.isAxiosError(error)) {
      switch (error.status) {
        case 500:
          return NextResponse.json(
            { message: 'Server is currently down' },
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

    throw NextResponse.json(error.response.data, { status: error.status })
  }
}
