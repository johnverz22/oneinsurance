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

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')
  const searchParams = req.nextUrl.searchParams
  const agentId = searchParams.get('agent_id')

  console.log('Admin Transactions API - Received agent_id parameter:', agentId)

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    let url: string

    if (agentId) {
      // For agent-specific transactions, use the completed transactions endpoint
      console.log('Admin Transactions API - Fetching transactions for agent_id:', agentId)
      
      // Build the query parameters for pagination
      const page = searchParams.get('page') || '1'
      const perPage = searchParams.get('per_page') || '15'
      
      // Use the transactions/completed/agent/{agent_id} endpoint with pagination
      url = `${config.BASE_URL}/transactions/completed/agent/${agentId}?page=${page}&per_page=${perPage}`
      console.log('Admin Transactions API - Fetching from completed transactions endpoint:', url)
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token,
          Accept: 'application/json',
        },
      })
      
      console.log('Admin Transactions API - Response:', {
        status: response.status,
        dataExists: !!response.data?.data,
        dataLength: response.data?.data?.data?.length || 0,
        totalRecords: response.data?.data?.total || 0,
        currentPage: response.data?.data?.current_page || 0,
        lastPage: response.data?.data?.last_page || 0
      })
      
      // The endpoint returns data in the correct format already
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        console.log('Admin Transactions API - Returning transactions, count:', response.data.data.data.length)
        
        // Return the data as-is since it's already in the correct format
        return NextResponse.json(response.data, { status: 200, headers })
      }
      
      // If no transactions found, return empty result
      console.log('Admin Transactions API - No transactions found for agent_id:', agentId)
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
      
    } else {
      // For all transactions (no specific agent) - use the general transactions endpoint
      const page = searchParams.get('page') || '1'
      const perPage = searchParams.get('per_page') || '15'
      
      url = `${config.BASE_URL}/transactions?page=${page}&per_page=${perPage}`
      console.log('Admin Transactions API - Fetching all transactions:', url)
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token,
          Accept: 'application/json',
        },
      })
      
      console.log('Admin Transactions API - All transactions response:', {
        status: response.status,
        dataExists: !!response.data?.data,
        dataLength: response.data?.data?.data?.length || 0,
        totalRecords: response.data?.data?.total || 0,
        currentPage: response.data?.data?.current_page || 0,
        lastPage: response.data?.data?.last_page || 0
      })
      
      return NextResponse.json(response.data, { status: 200, headers })
    }

  } catch (error) {
    console.error('Admin Transactions API - Error:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('Admin Transactions API - Axios error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500, headers })
  }
}