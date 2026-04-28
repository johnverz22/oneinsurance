import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cacheKey = searchParams.get('cacheKey')

    if (!cacheKey) {
      return NextResponse.json(
        { error: 'Cache key is required' },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/quote/compare/${cacheKey}`

    console.log('Motor Insurance Load Quote by Cache URL:', url)

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
      },
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    console.error('Error loading motor insurance quote by cache:', error)

    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
