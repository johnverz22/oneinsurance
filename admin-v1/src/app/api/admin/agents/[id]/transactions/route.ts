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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get('Authorization')
  const { id: agentId } = await params
  const searchParams = req.nextUrl.searchParams

  console.log('Admin Agent Transactions API - Received agentId:', agentId)

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    // Build the query parameters for pagination
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('per_page') || '10'
    
    // Use the transactions/completed/agent/{agent_id} endpoint with pagination
    const url = `${config.BASE_URL}/transactions/completed/agent/${agentId}?page=${page}&per_page=${perPage}`
    console.log('Admin Agent Transactions API - Fetching from:', url)
    
    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })
    
    console.log('Admin Agent Transactions API - Response:', {
      status: response.status,
      dataExists: !!response.data?.data,
      dataLength: response.data?.data?.data?.length || 0,
      totalRecords: response.data?.data?.total || 0,
      currentPage: response.data?.data?.current_page || 0,
      lastPage: response.data?.data?.last_page || 0
    })
    
    // The endpoint returns data in the correct format already
    if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
      console.log('Admin Agent Transactions API - Returning transactions, count:', response.data.data.data.length)
      
      // Return the data as-is since it's already in the correct format
      return NextResponse.json(response.data, { status: 200, headers })
    }
    
    // If no transactions found, return empty result
    console.log('Admin Agent Transactions API - No transactions found for agentId:', agentId)
    return NextResponse.json({
      success: true,
      message: `No transactions found for agent ID: ${agentId}`,
      data: {
        data: [],
        total: 0,
        current_page: 1,
        last_page: 1,
        per_page: 15,
        from: 0,
        to: 0,
      }
    }, { status: 200, headers })

  } catch (error) {
    console.error('Admin Agent Transactions API - Error:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('Admin Agent Transactions API - Axios error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500, headers })
  }
}
