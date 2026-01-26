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
    
    console.log('Fetching policy details for ID:', policyId)
    
    // Since there might not be a single transaction endpoint, we'll try different approaches
    let transaction = null
    let lastError: Error | null = null
    
    // Approach 1: Try to get all transactions and find the one with matching ID
    try {
      const url = `${process.env.BASE_URL}/agents/transactions?per_page=100`
      console.log('Fetching all transactions from:', url)
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token,
        },
      })
      
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        // Find the transaction with matching ID
        transaction = response.data.data.data.find((t: any) => 
          t.id.toString() === policyId.toString() || 
          t.policy_id === policyId ||
          t.proposal_number === policyId
        )
        
        if (transaction) {
          console.log('Found transaction by searching all transactions:', transaction.id)
        }
      }
    } catch (error) {
      console.log('Failed to fetch all transactions:', error)
      lastError = error instanceof Error ? error : new Error(String(error))
    }
    
    // Approach 2: If not found, try with a direct transaction ID endpoint (might exist)
    if (!transaction) {
      try {
        const url = `${process.env.BASE_URL}/agents/transactions/${policyId}`
        console.log('Trying direct transaction endpoint:', url)
        
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        
        transaction = response.data?.data || response.data
        console.log('Found transaction via direct endpoint')
      } catch (error) {
        console.log('Direct transaction endpoint failed:', error)
        lastError = error instanceof Error ? error : new Error(String(error))
      }
    }
    
    // Approach 3: Try searching by policy_id parameter
    if (!transaction) {
      try {
        const url = `${process.env.BASE_URL}/agents/transactions?policy_id=${policyId}`
        console.log('Trying policy_id parameter:', url)
        
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          transaction = response.data.data.data[0]
          if (transaction) {
            console.log('Found transaction by policy_id parameter')
          }
        }
      } catch (error) {
        console.log('Policy_id parameter search failed:', error)
        lastError = error instanceof Error ? error : new Error(String(error))
      }
    }
    
    if (!transaction) {
      console.error('Transaction not found after all attempts. Last error:', lastError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Policy not found',
          debug: {
            searchedId: policyId,
            lastError: lastError?.message || 'Unknown error'
          }
        },
        { status: 404, headers: HEADERS }
      )
    }
    
    // Transform the transaction data to match the expected policy response format
    const policyResponse = {
      success: true,
      message: 'Policy details retrieved successfully',
      data: {
        id: transaction.id,
        agent_id: transaction.agent_id || 0,
        agent_code_used: transaction.agent_code_used || '',
        proposal_number: transaction.proposal_number || '',
        carrier_product_code: transaction.carrier_product_code || 'PHTRAVEL',
        policy_id: transaction.policy_id || '',
        policy_details: transaction.policy_details || null, // Keep as string or null
        merchant_transaction_id: transaction.merchant_transaction_id || null,
        amount: transaction.amount || null, // Keep as original type (string or number)
        customer_id: transaction.customer_id || null,
        customer_name: transaction.customer_name || null, // Add customer name if available
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
    
    console.log('Returning policy response for transaction ID:', transaction.id)
    
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