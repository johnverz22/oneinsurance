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
    console.log('Admin: Fetching policy details for ID:', policyId)
    
    // Use the same approach as agent API - fetch commission logs and find the matching one
    let commission = null
    let lastError: Error | null = null
    
    // Extract commission ID from policy ID (POL-000001 -> 1)
    const commissionId = policyId.replace(/^POL-0*/, '')
    
    // Approach 1: Try to get the specific commission log by ID
    try {
      const url = `${config.BASE_URL}/admin/commission-logs/${commissionId}`
      console.log('Admin: Fetching commission log from:', url)
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token,
          Accept: 'application/json',
        },
      })
      
      commission = response.data?.data
      if (commission) {
        console.log('Admin: Found commission by ID:', commission.id)
      }
    } catch (error) {
      console.log('Admin: Failed to fetch commission by ID:', error)
      lastError = error instanceof Error ? error : new Error(String(error))
    }
    
    // Approach 2: If not found, try to get all commission logs and find the matching one
    if (!commission) {
      try {
        const url = `${config.BASE_URL}/admin/commission-logs?per_page=100`
        console.log('Admin: Fetching all commission logs from:', url)
        
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
            Accept: 'application/json',
          },
        })
        
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          // Find the commission with matching ID
          commission = response.data.data.data.find((c: any) => 
            c.id.toString() === commissionId.toString()
          )
          
          if (commission) {
            console.log('Admin: Found commission by searching all logs:', commission.id)
          }
        }
      } catch (error) {
        console.log('Admin: Failed to fetch all commission logs:', error)
        lastError = error instanceof Error ? error : new Error(String(error))
      }
    }
    
    if (!commission) {
      console.error('Admin: Commission not found after all attempts. Last error:', lastError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Policy not found',
          debug: {
            searchedId: policyId,
            commissionId: commissionId,
            lastError: lastError?.message || 'Unknown error'
          }
        },
        { status: 404, headers }
      )
    }
    
    console.log('Admin: Commission data structure:', JSON.stringify(commission, null, 2))
    
    // Now try to get the actual policy details using quote/load API
    let policyDetails = null
    const proposalNumber = `PTRAVEL${commission.id.toString().padStart(9, '0')}`
    
    try {
      console.log('Admin: Trying to load policy details with proposal number:', proposalNumber)
      
      const policyResponse = await axios.post(`${config.BASE_URL}/quote/load`, {
        type: "policy",
        PolicyNo: proposalNumber
      }, {
        headers: {
          Authorization: token,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
      
      policyDetails = policyResponse.data?.data
      console.log('Admin: Successfully loaded policy details')
      console.log('Admin: Policy details structure:', JSON.stringify(policyDetails, null, 2))
      
      // Log customer information if available
      if (policyDetails?.PolicyCustomerList?.[0]) {
        console.log('Admin: Customer data found:', {
          name: `${policyDetails.PolicyCustomerList[0].FirstName || ''} ${policyDetails.PolicyCustomerList[0].LastName || ''}`.trim(),
          email: policyDetails.PolicyCustomerList[0].Email,
          phone: policyDetails.PolicyCustomerList[0].Mobile,
          address: policyDetails.PolicyCustomerList[0].AddressLine1
        })
      } else {
        console.log('Admin: No customer data found in PolicyCustomerList')
      }
    } catch (error: any) {
      console.log('Admin: Failed to load policy details:', error)
      console.log('Admin: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      // Continue without policy details - we'll use commission data
    }
    
    // Transform the commission data to match the expected policy response format
    const policyResponse = {
      success: true,
      message: 'Policy details retrieved successfully',
      data: {
        id: commission.id,
        policy_id: policyId,
        certificate_number: `CERT-${commission.id.toString().padStart(6, '0')}`,
        proposal_number: proposalNumber,
        status: 'active',
        plan_name: commission.product?.name || 'N/A',
        plan_type: commission.product?.category || 'Insurance',
        premium: commission.total_net_premium || commission.gross_commission || '0',
        currency: 'PHP',
        coverage_start: commission.period_start || commission.created_at,
        coverage_end: commission.period_end || commission.created_at,
        provider: commission.provider?.name || 'N/A',
        
        // Commission information
        gross_commission: commission.gross_commission || '0',
        net_commission: commission.net_commission || '0',
        agent: commission.agent || null,
        product: commission.product || null,
        
        // Enhanced customer information extraction with multiple fallback strategies
        customer_name: policyDetails?.PolicyCustomerList?.[0] 
          ? `${policyDetails.PolicyCustomerList[0].FirstName || ''} ${policyDetails.PolicyCustomerList[0].MiddleName || ''} ${policyDetails.PolicyCustomerList[0].LastName || ''}`.trim()
          : commission.customer_name || commission.applicant_name || 'N/A',
        customer_email: policyDetails?.PolicyCustomerList?.[0]?.Email 
          || commission.customer_email || commission.applicant_email || 'N/A',
        customer_phone: policyDetails?.PolicyCustomerList?.[0]?.TempData?.['MaskAfter-Mobile'] 
          || policyDetails?.PolicyCustomerList?.[0]?.Mobile 
          || commission.customer_phone || commission.applicant_phone || 'N/A',
        customer_address: policyDetails?.PolicyCustomerList?.[0] 
          ? `${policyDetails.PolicyCustomerList[0].AddressLine1 || ''}, ${policyDetails.PolicyCustomerList[0].AddressLine2 || ''}, ${policyDetails.PolicyCustomerList[0].City || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
          : commission.customer_address || commission.applicant_address || 'N/A',
        customer_dob: policyDetails?.PolicyCustomerList?.[0]?.DateOfBirth 
          ? new Date(policyDetails.PolicyCustomerList[0].DateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
          : commission.customer_dob || commission.applicant_dob || 'N/A',
        customer_id_type: policyDetails?.PolicyCustomerList?.[0]?.IdTypeCode === 'PAS' ? 'Passport' 
          : policyDetails?.PolicyCustomerList?.[0]?.IdTypeCode === 'DL' ? "Driver's License" 
          : policyDetails?.PolicyCustomerList?.[0]?.IdTypeCode 
          || commission.customer_id_type || commission.applicant_id_type || 'N/A',
        customer_id_number: policyDetails?.PolicyCustomerList?.[0]?.TempData?.['MaskAfter-IdNo'] 
          || policyDetails?.PolicyCustomerList?.[0]?.IdNo 
          || commission.customer_id_number || commission.applicant_id_number || 'N/A',
        
        // Additional policy information from commission with fallbacks
        agent_code_used: commission.agent_code || commission.referral_code || 'N/A',
        carrier_product_code: commission.product?.code || commission.carrier_product_code || policyDetails?.ProductCode || 'N/A',
        transaction_date: commission.created_at,
        amount: commission.total_net_premium || commission.gross_commission || policyDetails?.GrossPremium || '0',
        
        // Enhanced commission details for display
        commission_log: {
          gross_commission: commission.gross_commission || '0',
          net_commission: commission.net_commission || '0',
          commission_rate: commission.commission_rate || commission.rate || '0',
          vat_amount: commission.vat_amount || '0',
          withholding_tax_amount: commission.withholding_tax_amount || commission.tax_amount || '0',
          base_commission: commission.base_commission || commission.commission_amount || '0'
        },
        
        // Include the full policy details for the frontend to use
        policy_details: policyDetails,
        
        // Timestamps
        created_at: commission.created_at || new Date().toISOString(),
        updated_at: commission.updated_at || new Date().toISOString(),
      }
    }
    
    console.log('Admin: Returning policy response for commission ID:', commission.id)
    
    return NextResponse.json(policyResponse, {
      status: 200,
      headers,
    })

  } catch (error: any) {
    console.error('Admin: Error fetching policy details:', error)
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
      { status: 500, headers }
    )
  }
}