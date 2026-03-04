import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Request body is required',
          message: 'Request body is required'
        },
        { status: 400 }
      )
    }

    // Support proposal search format
    let requestPayload: any

    if (body.ProposalNo) {
      // Proposal search format
      requestPayload = {
        Type: 'proposal',
        ProposalNo: body.ProposalNo
      }
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'ProposalNo is required',
          message: 'ProposalNo is required'
        },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/quote/travel/load-quote`

    console.log('Travel Insurance Load Quote URL:', url)
    console.log('Request payload:', JSON.stringify(requestPayload, null, 2))

    const response = await axios.post(url, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
      },
    })

    console.log('Backend Response Status:', response.status)
    console.log('Backend Response Data:', JSON.stringify(response.data, null, 2))

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Ensure response has success flag
    const responseData = {
      success: true,
      ...response.data
    }

    return NextResponse.json(responseData, { status: 200, headers })
  } catch (error: any) {
    console.error('Error loading travel insurance quote:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    
    if (axios.isAxiosError(error)) {
      const errorResponse = error.response?.data
      return NextResponse.json(
        {
          success: false,
          error: errorResponse?.message || error.message,
          message: errorResponse?.message || 'Failed to load proposal',
          details: errorResponse
        },
        { status: error.response?.status || 500 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}