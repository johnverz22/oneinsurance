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
      // For agent-specific transactions, use commission logs with agent_id parameter
      console.log('Admin Transactions API - Fetching transactions for agent:', agentId)
      
      // Build the query parameters for commission logs
      const commissionParams = new URLSearchParams()
      commissionParams.append('agent_id', agentId)
      commissionParams.append('page', searchParams.get('page') || '1')
      commissionParams.append('per_page', searchParams.get('per_page') || '15')
      commissionParams.append('sort_by', 'created_at')
      commissionParams.append('sort_order', 'desc')
      
      // Add any additional filters from the original search params
      for (const [key, value] of searchParams.entries()) {
        if (key !== 'agent_id' && key !== 'page' && key !== 'per_page') {
          commissionParams.append(key, value)
        }
      }
      
      // Use commission logs endpoint which exists and works
      url = `${config.BASE_URL}/admin/commission-logs?${commissionParams.toString()}`
      console.log('Admin Transactions API - Fetching from commission logs:', url)
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token,
          Accept: 'application/json',
        },
      })
      
      console.log('Admin Transactions API - Commission logs response:', {
        status: response.status,
        dataExists: !!response.data?.data,
        dataLength: response.data?.data?.data?.length || 0,
        totalRecords: response.data?.data?.total || 0
      })
      
      // Transform commission logs to transaction format
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        console.log('Admin Transactions API - Processing commission logs, count:', response.data.data.data.length)
        
        // Log the first commission to see what data we're getting
        if (response.data.data.data.length > 0) {
          const firstCommission = response.data.data.data[0]
          console.log('Admin Transactions API - First commission sample:', {
            id: firstCommission.id,
            agent_id: firstCommission.agent_id,
            product: firstCommission.product?.name,
            total_net_premium: firstCommission.total_net_premium,
            gross_commission: firstCommission.gross_commission,
            net_commission: firstCommission.net_commission,
            created_at: firstCommission.created_at
          })
        }
        
        const enhancedData = {
          success: true,
          message: 'Agent transactions from commission logs',
          data: {
            data: response.data.data.data.map((commission: any) => {
              console.log(`Admin Transactions API - Processing commission ${commission.id}`)
              
              // Create transaction-like structure from commission data
              // Since commission logs don't have customer names or policy numbers,
              // we'll leave those fields empty like Plan Name
              const customerName = '' // Leave empty since commission logs don't have customer data
              const policyNumber = `POL-${commission.id.toString().padStart(6, '0')}`
              const carrierPolicyNumber = `P${commission.id.toString().padStart(7, '0')}`
              
              return {
                id: commission.id,
                agent_id: commission.agent_id,
                certificate_number: carrierPolicyNumber,
                policy_id: policyNumber,
                customer_name: customerName,
                policy_holder: customerName, // Leave empty like Plan Name
                plan_name: commission.product?.name || '',
                plan_type: commission.product?.line_of_business?.name || 'Insurance',
                premium: parseFloat(commission.total_net_premium || commission.product_price || '0'),
                amount: parseFloat(commission.total_net_premium || commission.product_price || '0'),
                currency: 'PHP',
                coverage_start: commission.created_at,
                coverage_end: null,
                status: 'active',
                transaction_date: commission.created_at,
                provider: commission.provider?.name || '',
                agent: commission.agent,
                gross_commission: commission.gross_commission,
                net_commission: commission.net_commission,
                policy_details: JSON.stringify({
                  PolicyNo: policyNumber,
                  CarrierPolicyNo: carrierPolicyNumber,
                  GrossPremium: parseFloat(commission.total_net_premium || commission.product_price || '0'),
                  ProductName: commission.product?.name || 'Insurance Product',
                  EffectiveDate: commission.created_at,
                  PolicyCustomerList: [
                    {
                      FirstName: '',
                      LastName: '',
                      IsPolicyHolder: 'Y',
                      Email: '',
                      Mobile: ''
                    }
                  ]
                }),
                created_at: commission.created_at,
                updated_at: commission.updated_at,
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
        
        console.log('Admin Transactions API - Returning commission data as transactions, count:', enhancedData.data.data.length)
        return NextResponse.json(enhancedData, { status: 200, headers })
      }
      
      // If no transactions found, return empty result
      console.log('Admin Transactions API - No transactions found for agent:', agentId)
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
      // For general admin transactions (no specific agent)
      url = `${config.BASE_URL}/admin/transactions?${searchParams.toString()}`
      console.log('Admin Transactions API - Fetching general transactions:', url)
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token,
          Accept: 'application/json',
        },
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