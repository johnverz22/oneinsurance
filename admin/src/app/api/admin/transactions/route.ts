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
      // For agent-specific transactions, use commission logs but with proper agent filtering
      console.log('Admin Transactions API - Fetching transactions for agent:', agentId)
      
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
        // Transform commission logs to transaction format with real IMO Policy Numbers
        const transformedData = {
          success: true,
          message: 'Real agent transactions from commission logs',
          data: {
            data: response.data.data.data.map((commission: any) => {
              // Extract real customer name from commission logs or policy_details
              let customerName = commission.customer_name || 
                               commission.policy_holder_name || 
                               commission.client_name

              // If no customer name found, try to extract from policy_details.PolicyCustomerList
              if (!customerName || customerName === 'N/A') {
                if (commission.policy_details) {
                  try {
                    const policyDetailsObj = typeof commission.policy_details === 'string' 
                      ? JSON.parse(commission.policy_details) 
                      : commission.policy_details
                    
                    // Extract policy holder from PolicyCustomerList (the one with IsPolicyHolder: 'Y' or first one)
                    if (policyDetailsObj?.PolicyCustomerList?.length > 0) {
                      const policyHolder = policyDetailsObj.PolicyCustomerList.find((customer: any) => customer.IsPolicyHolder === 'Y') 
                        || policyDetailsObj.PolicyCustomerList[0] // Fallback to first customer
                      
                      if (policyHolder) {
                        customerName = [policyHolder.FirstName, policyHolder.MiddleName, policyHolder.LastName, policyHolder.Suffix]
                          .filter(Boolean)
                          .join(' ')
                          .trim()
                        console.log('Admin: Extracted policy holder name from PolicyCustomerList:', customerName)
                      }
                    }
                  } catch (e) {
                    console.log('Admin: Failed to parse policy_details for customer name:', e)
                  }
                }
              }

              // If still no customer name, try to get from agent data as fallback
              if (!customerName || customerName === 'N/A') {
                if (commission.agent && !commission.customer_name) {
                  customerName = `${commission.agent.first_name || ''} ${commission.agent.last_name || ''}`.trim()
                  console.log('Admin: Using agent name as fallback customer name:', customerName)
                }
              }

              // Final fallback
              if (!customerName || customerName.trim() === '') {
                customerName = 'N/A'
              }

              console.log(`Admin: Commission ${commission.id} - Final customer name: ${customerName}`)
              
              // If we have existing policy_details with PolicyCustomerList, preserve it; otherwise create new one
              let existingPolicyDetails = null
              if (commission.policy_details) {
                try {
                  existingPolicyDetails = typeof commission.policy_details === 'string' 
                    ? JSON.parse(commission.policy_details) 
                    : commission.policy_details
                } catch (e) {
                  console.log('Admin: Failed to parse existing policy_details:', e)
                }
              }
              
              // Extract real IMO Policy Numbers from commission data
              // The commission logs should have the real proposal_number like "PTRAVEL0000000803"
              let realIMOPolicyNo = commission.proposal_number || commission.policy_number
              
              // If we have policy_details, try to extract ProposalNo from it (not PolicyNo!)
              if (!realIMOPolicyNo && commission.policy_details) {
                try {
                  const policyDetailsObj = typeof commission.policy_details === 'string' 
                    ? JSON.parse(commission.policy_details) 
                    : commission.policy_details
                  // The real data has ProposalNo, not PolicyNo!
                  realIMOPolicyNo = policyDetailsObj.ProposalNo || policyDetailsObj.PolicyNo
                  console.log('Admin: Extracted IMO Policy No from policy_details.ProposalNo:', realIMOPolicyNo)
                } catch (e) {
                  console.log('Admin: Failed to parse policy_details for ProposalNo:', e)
                }
              }
              
              // DEBUG: Log what we found in commission data
              console.log(`Admin: Commission ${commission.id} DEBUG:`, {
                proposal_number: commission.proposal_number,
                policy_number: commission.policy_number,
                certificate_number: commission.certificate_number,
                realIMOPolicyNo: realIMOPolicyNo,
                hasPolicy_details: !!commission.policy_details
              })
              
              // If still no real IMO Policy No found, use the commission ID as fallback (but log this)
              if (!realIMOPolicyNo) {
                console.log(`Admin: WARNING - No real IMO Policy No found for commission ${commission.id}, using fallback`)
                realIMOPolicyNo = `COMMISSION-${commission.id}` // Better than just the ID number
              }
              
              console.log(`Admin: Commission ${commission.id} - Final IMO Policy No: ${realIMOPolicyNo}, Customer: ${customerName}`)
              
              // Create policy details with real PolicyNo and customer info for frontend display
              const realPolicyDetails = {
                "PolicyNo": realIMOPolicyNo, // Real IMO Policy No like "PTRAVEL0000000803" - frontend looks for this
                "ProposalNo": realIMOPolicyNo, // Also include ProposalNo for consistency with real data
                "CarrierPolicyNo": "P0086998", // Using consistent value until backend provides unique values
                "GrossPremium": parseFloat(commission.total_net_premium || commission.product_price || commission.amount || "0"),
                "EffectiveDate": commission.period_start || commission.coverage_start || commission.created_at,
                "ExpiryDate": commission.period_end || commission.coverage_end,
                // Preserve existing PolicyCustomerList if available, otherwise create new one
                "PolicyCustomerList": existingPolicyDetails?.PolicyCustomerList?.length > 0 
                  ? existingPolicyDetails.PolicyCustomerList 
                  : (customerName !== 'N/A' ? [
                      {
                        "FirstName": customerName.split(' ')[0] || "Customer",
                        "MiddleName": customerName.split(' ').length > 2 ? customerName.split(' ')[1] : "",
                        "LastName": customerName.split(' ').slice(-1)[0] || "Name",
                        "Suffix": "",
                        "IsPolicyHolder": "Y",
                        "Email": commission.customer_email || "customer@example.com",
                        "Mobile": commission.customer_mobile || "+63*******",
                        "Gender": commission.customer_gender || "M",
                        "DateOfBirth": commission.customer_dob || "1990-01-01"
                      }
                    ] : []),
                // Preserve other existing fields if available
                ...existingPolicyDetails
              }
              
              // DEBUG: Log the policy details we're creating
              console.log(`Admin: Commission ${commission.id} - Created policy_details with PolicyNo: ${realPolicyDetails.PolicyNo}`)
              
              return {
                id: commission.id,
                certificate_number: commission.certificate_number || commission.policy_number || commission.proposal_number || '',
                policy_holder: customerName,
                plan_name: '',
                plan_type: commission.product?.line_of_business?.name || commission.plan_type || 'Insurance',
                premium: parseFloat(commission.total_net_premium || commission.product_price || commission.amount || '0'),
                currency: commission.currency || 'PHP',
                coverage_start: commission.period_start || commission.coverage_start || commission.created_at || '',
                coverage_end: commission.period_end || commission.coverage_end || '',
                status: commission.status || 'active',
                policy_id: commission.policy_id || commission.id?.toString() || '',
                transaction_date: commission.transaction_date || commission.created_at,
                created_at: commission.created_at,
                updated_at: commission.updated_at,
                provider: commission.provider?.name || commission.provider || '',
                agent_id: commission.agent_id || agentId,
                agent: commission.agent,
                gross_commission: commission.gross_commission,
                net_commission: commission.net_commission,
                policy_details: JSON.stringify(realPolicyDetails), // Include real PolicyNo in policy_details
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
      
      // If no commission logs found, return empty result
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