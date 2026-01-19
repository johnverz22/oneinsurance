import { FullQuoteRequest } from '@/types/full-quote-request'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120 // 2 minutes
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as { fullQuoteRequest: FullQuoteRequest }
    const token = `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`

    if (!data || !data.fullQuoteRequest) {
      return NextResponse.json(
        { message: 'Request data is required' },
        { status: 400 }
      )
    }

    // Use BASE_URL (server-side) or fallback to NEXT_PUBLIC_BASE_URL for local development
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL
    
    if (!baseUrl) {
      console.error('BASE_URL and NEXT_PUBLIC_BASE_URL are both undefined')
      return NextResponse.json(
        { 
          message: 'Server configuration error: BASE_URL is not set. Please check your environment variables.' 
        },
        { status: 500 }
      )
    }

    const url = `${baseUrl}/quote/travel/full-quote`
    console.log('Full Quote URL:', url)
    console.log('Full Quote Request Data:', JSON.stringify(data.fullQuoteRequest, null, 2))

    const response = await axios.post(url, data.fullQuoteRequest, {
      headers: { Authorization: token },
      timeout: 120000, // 2 minute timeout
    })

    console.log('Full Quote Response Status:', response.status)
    console.log('Full Quote Response Data:', JSON.stringify(response.data, null, 2))

    return NextResponse.json(response.data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.log('Travel Full Quote Error:', error)
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || error.status || 500
      switch (status) {
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
        case 404:
          return NextResponse.json(
            { message: 'Endpoint not found. Please check the API configuration.' },
            { status: 404 }
          )
      }
    }

    return NextResponse.json(
      { message: error?.message || 'Something went wrong' },
      { status: error?.status || 500 }
    )
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
