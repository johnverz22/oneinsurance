import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get('Authorization')
  const { id } = await params

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL
    
    // Try to fetch agent payment accounts using agent-specific endpoint
    const url = `${baseUrl}/agents/accounts?agent_id=${id}`
    
    console.log('Admin: Fetching agent accounts from:', url)

    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    console.log('Admin: Agent accounts response:', response.status, response.data)

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Admin: Error fetching agent accounts:', error)
    
    if (axios.isAxiosError(error)) {
      // If the endpoint doesn't exist or returns 404/422, return empty data
      if (error.response?.status === 404 || error.response?.status === 422) {
        return NextResponse.json({
          success: true,
          message: 'No payment details found',
          data: {
            bank_details: [],
            e_wallets: []
          },
          errors: []
        }, { status: 200, headers })
      }
      
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'No payment details found',
        data: {
          bank_details: [],
          e_wallets: []
        },
        errors: []
      },
      { status: 200, headers }
    )
  }
}