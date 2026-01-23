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
      console.log('Calling commission logs for agent transactions:', url)
    } else {
      // For general admin transactions
      url = `${config.BASE_URL}/admin/transactions?${searchParams.toString()}`
      console.log('Calling general transactions URL:', url)
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    // If we're getting commission logs for agent transactions, transform the data
    if (agentId && response.data?.data?.data) {
      const transformedData = {
        success: true,
        message: 'Transactions retrieved successfully',
        data: {
          data: response.data.data.data.map((commission: any) => ({
            id: commission.id,
            certificate_number: `CERT-${commission.id.toString().padStart(6, '0')}`,
            policy_holder: `${commission.agent.first_name} ${commission.agent.last_name}`,
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
          })),
          total: response.data.data.total,
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
          per_page: response.data.data.per_page,
          from: response.data.data.from,
          to: response.data.data.to,
        }
      }
      return NextResponse.json(transformedData, { status: 200, headers })
    }

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    console.error('URL that failed:', agentId ? 
      `${config.BASE_URL}/admin/commission-logs?agent_id=${agentId}` : 
      `${config.BASE_URL}/admin/transactions?${searchParams.toString()}`
    )
    
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500, headers })
  }
}