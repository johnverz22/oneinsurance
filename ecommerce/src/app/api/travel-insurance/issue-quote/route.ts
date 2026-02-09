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

    // Ensure CustomField object exists and includes all fields from the request
    const requestBody = {
      ...body,
      CustomField: {
        ...body.CustomField,
      }
    }

    const url = `${process.env.BASE_URL}/quote/travel/issue-quote`

    console.log('Travel Insurance Issue Quote URL:', url)
    console.log('Request body with CustomField:', JSON.stringify(requestBody, null, 2))

    const response = await axios.post(url, requestBody, {
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
    console.error('Error issuing travel insurance quote:', error)
    
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}