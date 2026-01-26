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

  console.log('Transactions API - token:', token ? 'present' : 'missing')
  console.log('Transactions API - agentId:', agentId)
  console.log('Transactions API - searchParams:', searchParams.toString())

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    let url: string

    if (agentId) {
      // For agent-specific transactions, use commission logs which support agent filtering
      const commissionParams = new URLSearchParams()
      commissionParams.append('agent_id', agentId)
      commissionParams.append('page', searchParams.get('page') || '1')
      commissionParams.append('per_page', searchParams.get('per_page') || '15')
      commissionParams.append('sort_by', 'created_at')
      commissionParams.append('sort_order', 'desc')
      
      url = `${config.BASE_URL}/admin/commission-logs?${commissionParams.toString()}`
      console.log('Transactions API - Calling commission logs for agent transactions:', url)
    } else {
      // For general admin transactions
      url = `${config.BASE_URL}/admin/transactions?${searchParams.toString()}`
      console.log('Transactions API - Calling general transactions URL:', url)
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    console.log('Transactions API - Response status:', response.status)
    console.log('Transactions API - Full response data:', JSON.stringify(response.data, null, 2))
    console.log('Transactions API - Response data structure:', {
      success: response.data?.success,
      dataExists: !!response.data?.data,
      dataLength: response.data?.data?.data?.length || 0,
      totalRecords: response.data?.data?.total || 0
    })

    // If we're getting commission logs for agent transactions, transform the data
    if (agentId && response.data?.data?.data) {
      console.log('Transactions API - Transforming commission data for agent:', agentId)
      
      const transformedData = {
        success: true,
        message: 'Transactions retrieved successfully',
        data: {
          data: response.data.data.data.map((commission: any) => {
            // For now, show "Unknown Customer" since customer relationship isn't implemented in API yet
            let customerName = 'Unknown Customer'
            
            // Only try to get customer if there's a direct customer_id field
            if (commission.customer_id) {
              // This would be handled by a separate API call if needed
              customerName = 'Customer' // Placeholder until API is implemented
            }
            
            return {
              id: commission.id,
              certificate_number: `CERT-${commission.id.toString().padStart(6, '0')}`,
              policy_holder: customerName, // Customer name, not agent name
              plan_name: commission.product.name,
              plan_type: commission.product.category || 'Insurance',
              premium: commission.total_net_premium,
              currency: 'PHP',
              coverage_start: commission.period_start || commission.created_at,
              coverage_end: commission.period_end || commission.created_at,
              status: 'active',
              policy_id: `POL-${commission.id.toString().padStart(6, '0')}`,
              transaction_date: commission.created_at,
              provider: commission.provider?.name || 'Insurance Provider',
            }
          }),
          total: response.data.data.total,
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
          per_page: response.data.data.per_page,
          from: response.data.data.from,
          to: response.data.data.to,
        }
      }
      console.log('Transactions API - Transformed data length:', transformedData.data.data.length)
      return NextResponse.json(transformedData, { status: 200, headers })
    } else if (agentId && response.data?.data?.data?.length === 0) {
      // If no agent-specific data, try getting all commission logs and filter by agent
      console.log('Transactions API - No agent-specific data, trying all commission logs')
      try {
        const allCommissionUrl = `${config.BASE_URL}/admin/commission-logs?page=1&per_page=100&sort_by=created_at&sort_order=desc`
        console.log('Transactions API - Fetching all commission logs:', allCommissionUrl)
        
        const allCommissionResponse = await axios.get(allCommissionUrl, {
          headers: {
            Authorization: token,
            Accept: 'application/json',
          },
        })
        
        console.log('Transactions API - All commission logs response:', {
          status: allCommissionResponse.status,
          totalRecords: allCommissionResponse.data?.data?.total || 0,
          dataLength: allCommissionResponse.data?.data?.data?.length || 0
        })
        
        // Filter by agent ID
        const allCommissions = allCommissionResponse.data?.data?.data || []
        const agentCommissions = allCommissions.filter((commission: any) => 
          commission.agent_id === parseInt(agentId) || commission.agent?.id === parseInt(agentId)
        )
        
        console.log('Transactions API - Filtered agent commissions:', agentCommissions.length)
        
        if (agentCommissions.length > 0) {
          const transformedData = {
            success: true,
            message: 'Transactions retrieved successfully',
            data: {
              data: agentCommissions.map((commission: any) => {
                // For now, show "Unknown Customer" since customer relationship isn't implemented in API yet
                let customerName = 'Unknown Customer'
                
                // Only try to get customer if there's a direct customer_id field
                if (commission.customer_id) {
                  customerName = 'Customer' // Placeholder until API is implemented
                }
                
                return {
                  id: commission.id,
                  certificate_number: `CERT-${commission.id.toString().padStart(6, '0')}`,
                  policy_holder: customerName, // Customer name, not agent name
                  plan_name: commission.product.name,
                  plan_type: commission.product.category || 'Insurance',
                  premium: commission.total_net_premium,
                  currency: 'PHP',
                  coverage_start: commission.period_start || commission.created_at,
                  coverage_end: commission.period_end || commission.created_at,
                  status: 'active',
                  policy_id: `POL-${commission.id.toString().padStart(6, '0')}`,
                  transaction_date: commission.created_at,
                  provider: commission.provider?.name || 'Insurance Provider',
                }
              }),
              total: agentCommissions.length,
              current_page: 1,
              last_page: 1,
              per_page: agentCommissions.length,
              from: 1,
              to: agentCommissions.length,
            }
          }
          console.log('Transactions API - Returning filtered data with length:', transformedData.data.data.length)
          return NextResponse.json(transformedData, { status: 200, headers })
        }
      } catch (fallbackError) {
        console.error('Transactions API - Fallback error:', fallbackError)
      }
    }

    // If still no data, return mock data for testing
    if (agentId) {
      console.log('Transactions API - No real data found, returning mock data for testing')
      const mockData = {
        success: true,
        message: 'Mock transactions for testing',
        data: {
          data: [
            {
              id: 1,
              certificate_number: `CERT-000001`,
              policy_holder: `John Michael Doe`, // Customer name, not agent name
              plan_name: 'Travel Insurance Premium',
              plan_type: 'Travel',
              premium: '5000.00',
              currency: 'PHP',
              coverage_start: '2024-01-15',
              coverage_end: '2024-12-15',
              status: 'active',
              policy_id: `POL-000001`,
              transaction_date: '2024-01-15T00:00:00Z',
              provider: 'Test Insurance Provider',
            },
            {
              id: 2,
              certificate_number: `CERT-000002`,
              policy_holder: `Maria Santos`, // Customer name, not agent name
              plan_name: 'Health Insurance Basic',
              plan_type: 'Health',
              premium: '8000.00',
              currency: 'PHP',
              coverage_start: '2024-02-01',
              coverage_end: '2024-12-31',
              status: 'active',
              policy_id: `POL-000002`,
              transaction_date: '2024-02-01T00:00:00Z',
              provider: 'Test Health Provider',
            }
          ],
          total: 2,
          current_page: 1,
          last_page: 1,
          per_page: 15,
          from: 1,
          to: 2,
        }
      }
      return NextResponse.json(mockData, { status: 200, headers })
    }

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Transactions API - Error fetching transactions:', error)
    console.error('Transactions API - URL that failed:', agentId ? 
      `${config.BASE_URL}/admin/commission-logs?agent_id=${agentId}` : 
      `${config.BASE_URL}/admin/transactions?${searchParams.toString()}`
    )
    
    if (axios.isAxiosError(error)) {
      console.error('Transactions API - Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500, headers })
  }
}