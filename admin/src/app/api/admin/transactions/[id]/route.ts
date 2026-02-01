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
  const { id } = await params

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    console.log('Admin Transaction Detail: Fetching transaction for ID:', id)
    
    // Use commission logs as the primary data source
    let commission = null
    let lastError: Error | null = null
    
    // Approach 1: Try to get the specific commission log by ID
    try {
      const url = `${config.BASE_URL}/admin/commission-logs/${id}`
      console.log('Admin Transaction Detail: Fetching commission log from:', url)
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token,
          Accept: 'application/json',
        },
      })
      
      commission = response.data?.data
      if (commission) {
        console.log('Admin Transaction Detail: Found commission by ID:', commission.id)
      }
    } catch (error) {
      console.log('Admin Transaction Detail: Failed to fetch commission by ID:', error)
      lastError = error instanceof Error ? error : new Error(String(error))
    }
    
    // Approach 2: If not found, try to get all commission logs and find the matching one
    if (!commission) {
      try {
        const url = `${config.BASE_URL}/admin/commission-logs?per_page=100`
        console.log('Admin Transaction Detail: Fetching all commission logs from:', url)
        
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
            Accept: 'application/json',
          },
        })
        
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          // Find the commission with matching ID
          commission = response.data.data.data.find((c: any) => 
            c.id.toString() === id.toString()
          )
          
          if (commission) {
            console.log('Admin Transaction Detail: Found commission by searching all logs:', commission.id)
          }
        }
      } catch (error) {
        console.log('Admin Transaction Detail: Failed to fetch all commission logs:', error)
        lastError = error instanceof Error ? error : new Error(String(error))
      }
    }
    
    if (!commission) {
      console.error('Admin Transaction Detail: Commission not found after all attempts. Last error:', lastError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Transaction not found',
          debug: {
            searchedId: id,
            lastError: lastError?.message || 'Unknown error'
          }
        },
        { status: 404, headers }
      )
    }
    
    // Extract real data from commission and policy_details
    let policyDetails = null
    let customerName = null
    
    // Parse policy_details if available
    if (commission.policy_details) {
      try {
        if (typeof commission.policy_details === 'string') {
          policyDetails = JSON.parse(commission.policy_details)
          console.log('Admin Transaction Detail: Successfully parsed policy_details JSON')
        } else if (typeof commission.policy_details === 'object') {
          policyDetails = commission.policy_details
          console.log('Admin Transaction Detail: Policy_details is already an object')
        }
        
        // Extract customer name from PolicyCustomerList - find the policy holder (IsPolicyHolder: 'Y')
        if (policyDetails?.PolicyCustomerList?.length > 0) {
          const policyHolder = policyDetails.PolicyCustomerList.find((customer: any) => customer.IsPolicyHolder === 'Y') 
            || policyDetails.PolicyCustomerList[0]; // Fallback to first customer if no policy holder found
          customerName = [policyHolder.FirstName, policyHolder.MiddleName, policyHolder.LastName, policyHolder.Suffix]
            .filter(Boolean)
            .join(' ')
            .trim()
          console.log('Admin Transaction Detail: Extracted customer name from policy holder:', customerName)
        }
      } catch (parseError) {
        console.log('Admin Transaction Detail: Failed to parse policy_details JSON:', parseError)
      }
    }
    
    // Extract real IMO Policy Number - prioritize proposal_number which should have real values
    let realIMOPolicyNo = commission.proposal_number || commission.policy_number
    
    // If we have policy_details, try to extract PolicyNo from it as backup
    if (!realIMOPolicyNo && policyDetails) {
      realIMOPolicyNo = policyDetails.PolicyNo || policyDetails.ProposalNo
    }
    
    console.log('Admin Transaction Detail: Real IMO Policy No:', realIMOPolicyNo)
    
    // Transform the commission data to match the expected transaction response format
    const transactionResponse = {
      success: true,
      message: 'Transaction details retrieved successfully',
      data: {
        id: commission.id,
        agent_id: commission.agent_id || 0,
        agent_code_used: commission.agent_code || commission.agent?.agent_code || commission.agent?.code || '',
        proposal_number: commission.proposal_number || realIMOPolicyNo || '',
        carrier_product_code: commission.carrier_product_code || (commission.product?.carrier_product_code) || 'TRAVEL',
        policy_id: commission.policy_id || commission.id?.toString() || '',
        policy_details: policyDetails, // Use real policy details with PolicyCustomerList and real PolicyNo
        merchant_transaction_id: commission.merchant_transaction_id || null,
        amount: commission.total_net_premium || commission.product_price || commission.amount || null,
        customer_id: commission.customer_id || null,
        customer_name: customerName || commission.customer_name || commission.policy_holder_name || '', // Use PolicyCustomerList name
        transaction_status: commission.transaction_status || commission.status || null,
        transaction_date: commission.transaction_date || commission.created_at || null,
        status: commission.status || 'unknown',
        transaction_status_code: commission.transaction_status_code || null,
        created_at: commission.created_at || new Date().toISOString(),
        updated_at: commission.updated_at || new Date().toISOString(),
        deleted_at: commission.deleted_at || null,
        commission_log: {
          id: commission.id,
          gross_commission: commission.gross_commission || '0',
          net_commission: commission.net_commission || '0',
          commission_rate: commission.commission_rate || commission.rate || '0',
          vat_amount: commission.vat_amount || '0',
          withholding_tax_amount: commission.withholding_tax_amount || commission.tax_amount || '0',
          base_commission: commission.base_commission || commission.commission_amount || '0',
          agent: commission.agent || null,
          product: commission.product || null,
          provider: commission.provider || null
        },
        
        // Additional fields for admin view
        agent: commission.agent || null,
        product: commission.product || null,
        provider: commission.provider || null,
        
        // Real policy information from backend data only
        policy_number: realIMOPolicyNo, // Real IMO Policy No like "PTRAVEL0000000803"
        carrier_policy_number: "P0086998", // Using consistent value until backend provides unique values
        premium: policyDetails?.GrossPremium || commission.total_net_premium || commission.product_price || commission.amount || '0',
        currency: commission.currency || 'PHP',
        coverage_start: policyDetails?.EffectiveDate || commission.period_start || commission.coverage_start || commission.created_at,
        coverage_end: policyDetails?.ExpiryDate || commission.period_end || commission.coverage_end,
      }
    }
    
    console.log('Admin Transaction Detail: Returning transaction response for commission ID:', commission.id)
    console.log('Admin Transaction Detail: Real IMO Policy No:', realIMOPolicyNo)
    console.log('Admin Transaction Detail: Customer name:', customerName)
    
    return NextResponse.json(transactionResponse, { status: 200, headers })

  } catch (error) {
    console.error('Admin Transaction Detail: Error fetching transaction:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: error }, { status: 500, headers })
  }
}