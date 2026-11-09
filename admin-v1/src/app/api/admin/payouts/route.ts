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

// Generate payouts for a date range
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
    
    console.log('Admin Payouts API - Generating payouts:', body)

    const response = await axios.post(
      `${config.BASE_URL}/admin/payouts/generate`,
      body,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    )

    console.log('Admin Payouts API - Payouts generated successfully:', response.data)

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Admin Payouts API - Error generating payouts:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('Admin Payouts API - Axios error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Failed to generate payouts' },
      { status: 500, headers }
    )
  }
}

// Get all payouts with optional filters
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')
  const searchParams = req.nextUrl.searchParams
  
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('per_page') || '15'
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const status = searchParams.get('status')

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    let url = `${config.BASE_URL}/admin/payouts?page=${page}&per_page=${perPage}`
    
    if (dateFrom) url += `&date_from=${dateFrom}`
    if (dateTo) url += `&date_to=${dateTo}`
    if (status) url += `&status=${status}`

    console.log('Admin Payouts API - Fetching payouts:', url)

    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    console.log('Admin Payouts API - Payouts fetched successfully')

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Admin Payouts API - Error fetching payouts:', error)
    
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500, headers }
    )
  }
}
