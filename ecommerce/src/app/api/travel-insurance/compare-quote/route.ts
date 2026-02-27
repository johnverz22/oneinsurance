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

    const url = `${process.env.BASE_URL}/quote/travel/compare-quote`

    console.log('Travel Insurance Compare Quote URL:', url)
    console.log('Request body:', JSON.stringify(body, null, 2))

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
      },
      timeout: 60000, // 60 second timeout
    })

    console.log('Backend response status:', response.status)
    console.log('Backend response data:', JSON.stringify(response.data, null, 2))

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Return the backend response as-is, even if it contains no plans
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error: any) {
    console.error('Error fetching travel insurance comparison quote:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    })
    
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}