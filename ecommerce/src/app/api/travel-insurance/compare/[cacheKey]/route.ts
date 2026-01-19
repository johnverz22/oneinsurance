import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120 // 2 minutes
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cacheKey: string }> }
) {
  try {
    const { cacheKey } = await params
    const token = `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`

    if (!cacheKey) {
      return NextResponse.json(
        { error: 'Missing cacheKey parameter' },
        { status: 400 }
      )
    }

    // Use BASE_URL (server-side) or fallback to NEXT_PUBLIC_BASE_URL
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error: BASE_URL is not set' },
        { status: 500 }
      )
    }

    const url = `${baseUrl}/quote/compare/${cacheKey}`
    console.log('Fetching quote compare for cacheKey:', cacheKey)

    const response = await axios.get(url, {
      headers: { Authorization: token },
      timeout: 120000, // 2 minute timeout
    })

    return NextResponse.json(response.data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.error('Error fetching quote compare:', error)
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || error.status || 500
      return NextResponse.json(
        error.response?.data || { message: error.message || 'Failed to fetch quote' },
        { status }
      )
    }

    return NextResponse.json(
      { message: error?.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
