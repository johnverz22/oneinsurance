import { NextRequest, NextResponse } from 'next/server'
import { HEADERS } from '@/constants/api-header'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  const token = request.headers.get('Authorization')
  if (!token) {
    return new Response('Unauthorized', { status: 401, headers: HEADERS })
  }

  let policyId = 'unknown'
  
  try {
    const resolvedParams = await params
    policyId = resolvedParams.policyId
    
    console.log('Agent: Fetching policy details for transaction ID:', policyId)
    
    // Use the same endpoint as admin portal: /api/v1/transactions/{transactionId}
    const transactionId = policyId
    const url = `${process.env.BASE_URL}/transactions/${transactionId}`
    console.log('Agent: Fetching transaction from:', url)
    
    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })
    
    const transaction = response.data?.data
    
    if (!transaction) {
      console.error('Agent: Transaction not found')
      return NextResponse.json(
        { 
          success: false, 
          message: 'Policy not found',
          debug: {
            transactionId: transactionId
          }
        },
        { status: 404, headers: HEADERS }
      )
    }
    
    console.log('Agent: Transaction found:', transaction.id)
    console.log('Agent: Transaction has policy_details:', !!transaction.policy_details)
    console.log('Agent: Transaction payment_brand:', transaction.payment_brand)
    console.log('Agent: Transaction payment_method:', transaction.payment_method)
    
    // Parse policy_details from backend - NO FALLBACK DATA
    let policyDetails = null
    let customerName = null
    
    if (transaction.policy_details) {
      try {
        if (typeof transaction.policy_details === 'string') {
          policyDetails = JSON.parse(transaction.policy_details)
          console.log('Agent: Successfully parsed policy_details JSON')
          console.log('Agent: Found', policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.length || 0, 'travelers in PolicyRiskList')
          console.log('Agent: Found', policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.[0]?.PolicyCoverageList?.length || 0, 'coverages for first traveler')
        } else if (typeof transaction.policy_details === 'object') {
          policyDetails = transaction.policy_details
          console.log('Agent: Policy_details is already an object')
          console.log('Agent: Found', policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.length || 0, 'travelers in PolicyRiskList')
          console.log('Agent: Found', policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.[0]?.PolicyCoverageList?.length || 0, 'coverages for first traveler')
        }
        
        // Extract customer name from PolicyCustomerList - find the policy holder (IsPolicyHolder: 'Y')
        if (policyDetails?.PolicyCustomerList?.length > 0) {
          const policyHolder = policyDetails.PolicyCustomerList.find((customer: any) => customer.IsPolicyHolder === 'Y') 
            || policyDetails.PolicyCustomerList[0]; // Fallback to first customer if no policy holder found
          customerName = [policyHolder.FirstName, policyHolder.MiddleName, policyHolder.LastName, policyHolder.Suffix]
            .filter(Boolean)
            .join(' ')
            .trim()
          console.log('Agent: Extracted customer name from policy holder (IsPolicyHolder: Y):', customerName)
        }
      } catch (parseError) {
        console.log('Agent: Failed to parse policy_details JSON:', parseError)
      }
    } else {
      console.log('Agent: No policy_details found in transaction data')
    }
    
    // Transform the transaction data to match the expected policy response format
    // NO FALLBACK DATA - only real backend data
    const policyResponse = {
      success: true,
      message: 'Policy details retrieved successfully',
      data: {
        id: transaction.id,
        agent_id: transaction.agent_id || 0,
        agent_code_used: transaction.agent_code_used || '',
        proposal_number: transaction.proposal_number || '',
        carrier_product_code: transaction.carrier_product_code || '',
        policy_id: transaction.policy_id || '',
        policy_number: transaction.policy_number || null,
        policy_details: policyDetails, // Only real backend data, null if not available
        merchant_transaction_id: transaction.merchant_transaction_id || null,
        amount: transaction.amount || null,
        payment_brand: transaction.payment_brand || null,
        payment_method: transaction.payment_method || null,
        customer_id: transaction.customer_id || null,
        customer_name: customerName || transaction.customer_name || null, // Use extracted name or transaction name
        transaction_status: transaction.transaction_status || null,
        transaction_date: transaction.transaction_date || null,
        status: transaction.status || 'unknown',
        transaction_status_code: transaction.transaction_status_code || null,
        created_at: transaction.created_at || new Date().toISOString(),
        updated_at: transaction.updated_at || new Date().toISOString(),
        deleted_at: transaction.deleted_at || null,
        commission_log: transaction.commission_log || null,
      }
    }
    
    console.log('Agent: Returning policy response for transaction ID:', transaction.id)
    console.log('Agent: Policy details available:', !!policyDetails)
    console.log('Agent: Customer name:', customerName || 'N/A')
    console.log('Agent: Payment brand in response:', policyResponse.data.payment_brand)
    console.log('Agent: Policy number in response:', policyResponse.data.policy_number)
    
    return NextResponse.json(policyResponse, {
      status: 200,
      headers: HEADERS,
    })

  } catch (error: any) {
    console.error('Error fetching policy details:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal Server Error', 
        error: error.message,
        debug: {
          policyId,
          errorType: error.constructor.name
        }
      },
      { status: 500, headers: HEADERS }
    )
  }
}