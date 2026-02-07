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
  const searchParams = req.nextUrl.searchParams
  const agentId = searchParams.get('agent_id')

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    console.log('Admin Policy Details: Fetching policy details for ID:', policyId)
    console.log('Admin Policy Details: Agent ID:', agentId)
    
    // The policyId is the transaction ID
    const transactionId = policyId
    
    if (!agentId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Agent ID is required',
          debug: {
            policyId,
            agentId
          }
        },
        { status: 400, headers }
      )
    }
    
    // Fetch all transactions for this agent and find the specific one
    const url = `${config.BASE_URL}/transactions/completed/agent/${agentId}?per_page=100`
    console.log('Admin Policy Details: Fetching agent transactions from:', url)
    
    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })
    
    const transactions = response.data?.data?.data
    
    if (!transactions || !Array.isArray(transactions)) {
      console.error('Admin Policy Details: No transactions found for agent')
      return NextResponse.json(
        { 
          success: false, 
          message: 'No transactions found for this agent',
          debug: {
            agentId,
            transactionId
          }
        },
        { status: 404, headers }
      )
    }
    
    // Find the specific transaction
    const transaction = transactions.find((t: any) => t.id.toString() === transactionId.toString())
    
    if (!transaction) {
      console.error('Admin Policy Details: Transaction not found in agent transactions')
      return NextResponse.json(
        { 
          success: false, 
          message: 'Policy not found',
          debug: {
            searchedId: policyId,
            transactionId: transactionId,
            agentId: agentId,
            availableTransactionIds: transactions.map((t: any) => t.id)
          }
        },
        { status: 404, headers }
      )
    }
    
    console.log('Admin Policy Details: Transaction found:', transaction.id)
    console.log('Admin Policy Details: Transaction has policy_details:', !!transaction.policy_details)
    
    // Parse policy_details if it's a string
    let policyDetails = null
    if (transaction.policy_details) {
      try {
        policyDetails = typeof transaction.policy_details === 'string' 
          ? JSON.parse(transaction.policy_details) 
          : transaction.policy_details
        console.log('Admin Policy Details: Successfully parsed policy_details')
      } catch (parseError) {
        console.log('Admin Policy Details: Failed to parse policy_details:', parseError)
      }
    }
    
    // Transform the transaction data to match the expected policy response format
    const policyResponse = {
      success: true,
      message: 'Policy details retrieved successfully',
      data: {
        id: transaction.id,
        policy_id: transaction.policy_id || policyId,
        certificate_number: transaction.certificate_number || null,
        proposal_number: transaction.proposal_number || null,
        policy_number: transaction.policy_number || null,
        policy_number_imo: transaction.policy_number_imo || null,
        status: transaction.status || null,
        plan_name: transaction.plan_name || null,
        product_name: transaction.product_name || null,
        plan_type: transaction.product?.line_of_business?.name || null,
        premium: transaction.amount || null,
        currency: 'PHP',
        coverage_start: policyDetails?.EffectiveDate || null,
        coverage_end: policyDetails?.ExpiryDate || null,
        provider: transaction.product?.provider?.name || null,
        
        // Commission information
        gross_commission: transaction.commission_log?.gross_commission || null,
        net_commission: transaction.commission_log?.net_commission || null,
        agent: transaction.agent || null,
        product: transaction.product || null,
        
        // Customer information from transaction
        customer_name: transaction.policy_holder || null,
        customer_email: null,
        customer_phone: null,
        customer_address: null,
        customer_dob: null,
        customer_id_type: null,
        customer_id_number: null,
        
        // Policy information
        agent_code_used: transaction.agent_code_used || null,
        carrier_product_code: transaction.carrier_product_code || null,
        transaction_date: transaction.transaction_date || transaction.created_at || null,
        amount: transaction.amount || null,
        
        // Commission details
        commission_log: transaction.commission_log || null,
        
        // Include the full policy details for the frontend to use
        policy_details: policyDetails,
        
        // Timestamps
        created_at: transaction.created_at || null,
        updated_at: transaction.updated_at || null,
      }
    }
    
    console.log('Admin Policy Details: Returning policy response for transaction ID:', transaction.id)
    
    return NextResponse.json(policyResponse, {
      status: 200,
      headers,
    })

  } catch (error: any) {
    console.error('Admin Policy Details: Error fetching policy details:', error)
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
          agentId,
          errorType: error.constructor.name
        }
      },
      { status: 500, headers }
    )
  }
}
