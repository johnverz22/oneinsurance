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
  { params }: { params: Promise<{ policyId: string }> }
) {
  const token = req.headers.get('Authorization')
  const { policyId } = await params

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    // Try to load policy using the quote/load endpoint
    const url = `${config.BASE_URL}/quote/load`
    const requestBody = {
      type: "policy",
      PolicyNo: policyId
    }

    console.log('Loading policy details for policyId:', policyId)
    console.log('Request URL:', url)
    console.log('Request body:', requestBody)

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log('Policy load successful:', response.data)
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Error loading policy details:', error)
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      
      // If the policy load fails, try to get it from commission logs
      if (error.response?.status === 404 || error.response?.status === 400 || error.response?.status === 422) {
        // Extract the commission ID from policy ID (POL-000123 -> 123)
        const commissionId = policyId.replace(/^POL-0*/, '')
        const commissionUrl = `${config.BASE_URL}/admin/commission-logs/${commissionId}`
        
        try {
          console.log('Policy load failed, trying commission logs for policy:', policyId)
          console.log('Fetching commission details from:', commissionUrl)
          console.log('Commission ID extracted:', commissionId)
          
          const commissionResponse = await axios.get(commissionUrl, {
            headers: {
              Authorization: token,
              Accept: 'application/json',
            },
          })

          console.log('Commission data retrieved successfully:', commissionResponse.data)

          // Transform commission data to policy format
          const commission = commissionResponse.data.data
          const policyData = {
            success: true,
            data: {
              certificate_number: `CERT-${commission.id.toString().padStart(6, '0')}`,
              policy_holder: `${commission.agent.first_name} ${commission.agent.last_name}`,
              plan_name: commission.product.name,
              plan_type: commission.product.category || 'Insurance',
              premium: commission.total_net_premium,
              currency: 'PHP',
              coverage_start: commission.period_start || commission.created_at,
              coverage_end: commission.period_end || commission.created_at,
              status: 'active',
              policy_id: policyId,
              provider: commission.provider?.name || 'Insurance Provider',
              gross_commission: commission.gross_commission,
              net_commission: commission.net_commission,
              agent: commission.agent,
              product: commission.product,
            }
          }

          console.log('Transformed policy data:', policyData)
          return NextResponse.json(policyData, { status: 200, headers })
        } catch (commissionError) {
          console.error('Error fetching from commission logs:', commissionError)
          if (axios.isAxiosError(commissionError)) {
            console.error('Commission logs error details:', {
              status: commissionError.response?.status,
              statusText: commissionError.response?.statusText,
              data: commissionError.response?.data,
              url: commissionUrl
            })
            
            // If direct commission lookup fails, try searching through commission logs
            if (commissionError.response?.status === 404) {
              try {
                console.log('Direct commission lookup failed, searching through commission logs...')
                const searchUrl = `${config.BASE_URL}/admin/commission-logs?per_page=100&sort_by=created_at&sort_order=desc`
                
                const searchResponse = await axios.get(searchUrl, {
                  headers: {
                    Authorization: token,
                    Accept: 'application/json',
                  },
                })
                
                // Find commission that matches the policy ID pattern
                const commissions = searchResponse.data?.data?.data || []
                const matchingCommission = commissions.find((comm: any) => 
                  `POL-${comm.id.toString().padStart(6, '0')}` === policyId
                )
                
                if (matchingCommission) {
                  console.log('Found matching commission:', matchingCommission)
                  const policyData = {
                    success: true,
                    data: {
                      certificate_number: `CERT-${matchingCommission.id.toString().padStart(6, '0')}`,
                      policy_holder: `${matchingCommission.agent.first_name} ${matchingCommission.agent.last_name}`,
                      plan_name: matchingCommission.product.name,
                      plan_type: matchingCommission.product.category || 'Insurance',
                      premium: matchingCommission.total_net_premium,
                      currency: 'PHP',
                      coverage_start: matchingCommission.period_start || matchingCommission.created_at,
                      coverage_end: matchingCommission.period_end || matchingCommission.created_at,
                      status: 'active',
                      policy_id: policyId,
                      provider: matchingCommission.provider?.name || 'Insurance Provider',
                      gross_commission: matchingCommission.gross_commission,
                      net_commission: matchingCommission.net_commission,
                      agent: matchingCommission.agent,
                      product: matchingCommission.product,
                    }
                  }
                  
                  console.log('Transformed policy data from search:', policyData)
                  return NextResponse.json(policyData, { status: 200, headers })
                } else {
                  console.log('No matching commission found in search results')
                }
              } catch (searchError) {
                console.error('Error searching commission logs:', searchError)
              }
            }
          }
          return handleServerSideAxiosError(error)
        }
      }
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: 'Failed to load policy details' }, { status: 500, headers })
  }
}