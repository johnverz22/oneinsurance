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

    const url = `${process.env.BASE_URL}/quote/travel/full-quote`

    console.log('Travel Insurance Full Quote URL:', url)
    console.log('Request body:', body)

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
      },
    })

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error: any) {
    console.error('Error fetching travel insurance full quote:', error)
    
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}