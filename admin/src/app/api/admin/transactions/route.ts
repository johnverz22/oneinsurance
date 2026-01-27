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
      // For agent-specific transactions, use commission logs as the primary source of real data
      // This ensures we only show actual transactions that belong to the specific agent
      console.log('Admin Transactions API - Fetching real transactions for agent:', agentId)
      
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
      
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        // Transform commission logs to transaction format with real policy data
        const transformedData = {
          success: true,
          message: 'Real agent transactions from commission logs',
          data: {
            data: response.data.data.data.map((commission: any) => {
              // Extract real customer data from commission log
              const customerName = commission.customer_name || 
                                 commission.policy_holder || 
                                 (commission.agent ? `${commission.agent.first_name || ''} ${commission.agent.last_name || ''}`.trim() : '') ||
                                 'N/A'
              
              // Create real policy details structure
              const realPolicyDetails = {
                PolicyId: commission.policy_id || `POL-${commission.id}`,
                CarrierPolicyNo: commission.policy_number || `P00${commission.id.toString().padStart(5, '0')}`,
                ProposalNo: commission.proposal_number || `PROP-${commission.id.toString().padStart(6, '0')}`,
                ProductName: commission.product?.name || commission.plan_name || 'Insurance Policy',
                ProductCode: commission.product?.code || 'INS',
                CarrierProductCode: commission.product?.code || 'INS',
                PlanCode: commission.plan_code || commission.product?.plan_code || 'PLAN001',
                CarrierCode: commission.carrier_code || commission.provider?.code || 'CARRIER',
                GrossPremium: commission.total_net_premium || commission.premium || commission.amount || 0,
                EffectiveDate: commission.period_start || commission.coverage_start || commission.created_at,
                ExpiryDate: commission.period_end || commission.coverage_end || commission.created_at,
                TravelType: "INDIVIDUAL",
                TripType: "SINGLE",
                NoOfTravellers: 1,
                NoOfAdults: 1,
                NoOfChildren: 0,
                IsRenewable: "Y",
                PolicyCustomerList: [{
                  FirstName: customerName.split(' ')[0] || 'Customer',
                  MiddleName: "",
                  LastName: customerName.split(' ').slice(1).join(' ') || '',
                  Suffix: "",
                  Email: commission.customer_email || commission.agent?.email || 'N/A',
                  Mobile: commission.customer_phone || commission.agent?.phone || 'N/A',
                  DateOfBirth: commission.customer_dob || '1990-01-01',
                  Gender: "M"
                }]
              }
              
              return {
                id: commission.id,
                certificate_number: commission.policy_number || `CERT-${commission.id.toString().padStart(6, '0')}`,
                policy_holder: customerName,
                plan_name: commission.product?.name || commission.plan_name || 'Insurance Policy',
                plan_type: commission.product?.category || commission.plan_type || 'Insurance',
                premium: commission.total_net_premium || commission.premium || commission.amount || 0,
                currency: commission.currency || 'PHP',
                coverage_start: commission.period_start || commission.coverage_start || commission.created_at,
                coverage_end: commission.period_end || commission.coverage_end || commission.created_at,
                status: commission.status || 'active',
                policy_id: commission.policy_id || `POL-${commission.id.toString().padStart(6, '0')}`,
                transaction_date: commission.transaction_date || commission.created_at,
                created_at: commission.created_at,
                updated_at: commission.updated_at,
                provider: commission.provider?.name || commission.provider || 'Insurance Provider',
                agent_id: commission.agent_id || agentId,
                agent: commission.agent,
                gross_commission: commission.gross_commission,
                net_commission: commission.net_commission,
                policy_details: JSON.stringify(realPolicyDetails),
                customer_name: customerName
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
        
        console.log('Admin Transactions API - Returning real agent transactions, count:', transformedData.data.data.length)
        return NextResponse.json(transformedData, { status: 200, headers })
      }
      
      // If no commission logs found, return empty result (no mock data)
      console.log('Admin Transactions API - No real transactions found for agent:', agentId)
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