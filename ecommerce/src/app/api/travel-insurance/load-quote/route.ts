import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    const response = await axios.post(url, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_TOKEN}`,
      },
    })

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }

    // Check if the backend response indicates an error
    const backendData = response.data
    
    // If backend returns success: false, it's an error response
    if (backendData && backendData.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: backendData.error || backendData.message || 'Failed to load proposal',
          message: backendData.message || backendData.error || 'Failed to load proposal',
          details: backendData
        },
        { status: 422, headers } // Return 422 for business logic errors
      )
    }

    // Ensure response has success flag for successful responses
    const responseData = {
      success: true,
      ...backendData
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