import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/config/env'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Create individual payout for an agent
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    const body = await req.json()
    
    console.log('Admin Payouts API - Creating individual payout:', body)

    // Call backend endpoint for creating individual payout
    // Backend needs to implement POST /admin/payouts/individual endpoint
    const response = await axios.post(
      `${config.BASE_URL}/admin/payouts/individual`,
      body,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    )

    console.log('Admin Payouts API - Payout created successfully:', response.data)

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Admin Payouts API - Error creating payout:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('Admin Payouts API - Axios error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Failed to create payout' },
      { status: 500, headers }
    )
  }
}
