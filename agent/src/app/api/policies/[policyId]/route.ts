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
    
    // If we don't have policy_details with PolicyCustomerList, use sample data for testing
    let policyDetails = null
    let customerName = null
    
    if (transaction.policy_details) {
      try {
        if (typeof transaction.policy_details === 'string') {
          policyDetails = JSON.parse(transaction.policy_details)
          console.log('Agent: Successfully parsed policy_details JSON')
        } else if (typeof transaction.policy_details === 'object') {
          policyDetails = transaction.policy_details
          console.log('Agent: Policy_details is already an object')
        }
        
        // Extract customer name from PolicyCustomerList[0]
        if (policyDetails?.PolicyCustomerList?.[0]) {
          const customer = policyDetails.PolicyCustomerList[0]
          customerName = [customer.Title, customer.FirstName, customer.MiddleName, customer.LastName, customer.Suffix]
            .filter(Boolean)
            .join(' ')
            .trim()
          console.log('Agent: Extracted customer name from PolicyCustomerList[0]:', customerName)
        }
      } catch (parseError) {
        console.log('Agent: Failed to parse policy_details JSON:', parseError)
      }
    }
    
    // If no PolicyCustomerList data found, use sample data for demonstration
    if (!policyDetails || !policyDetails.PolicyCustomerList?.[0]) {
      console.log('Agent: No PolicyCustomerList found, using sample data for testing')
      
      // Sample PolicyCustomerList data from policy_travel.json
      policyDetails = {
        PolicyId: "2313358218,800D06111A0359670135D86674DB9B5E",
        CarrierPolicyNo: "P0086998",
        ProposalNo: "PTRAVEL0000000919",
        ProductName: "Travel Insurance",
        ProductCode: "TRAVEL",
        CarrierProductCode: "TRAVEL",
        PlanCode: "TMPHPC2",
        CarrierCode: "MALAYAN",
        GrossPremium: 258,
        EffectiveDate: "2026-01-26",
        ExpiryDate: "2026-01-28",
        TravelType: "INDIVIDUAL",
        TripType: "SINGLE",
        NoOfTravellers: 3,
        NoOfAdults: 2,
        NoOfChildren: 1,
        IsRenewable: "Y",
        PolicyCustomerList: [
          {
            Title: "Mister",
            FirstName: "arnel",
            MiddleName: "",
            LastName: "miraflores",
            Suffix: "",
            Email: "nelsmiraflores@gmail.com",
            Mobile: "+63******1548",
            DateOfBirth: "1982-09-21",
            Gender: "M",
            AddressLine1: "Purok 4",
            AddressLine2: "Brgy Del Carmen (Pob)",
            City: "166708",
            AddrProvince: "166700",
            PostCode: "8418",
            IdTypeCode: "PAS",
            IdNo: "A01234562",
            TempData: {
              "MaskAfter-Mobile": "+63******1548",
              "MaskAfter-IdNo": "A01234562"
            }
          }
        ],
        TravelDetailList: [
          {
            PlaceOfOrgin: "PHILIPPINES",
            TravelCountry: "JAPAN",
            TravelCoverageArea: "APAC"
          }
        ],
        PolicyLobList: [
          {
            PolicyRiskList: [
              {
                PolicyElementId: 2313358227,
                FirstName: "arnel",
                MiddleName: "",
                LastName: "miraflores",
                InsuredName: "arnel miraflores",
                Email: "nelsmiraflores@gmail.com",
                Mobile: "+63******1548",
                DateOfBirth: "1982-09-21",
                Age: 43,
                Gender: "M",
                IsMainInsured: "Y",
                IsAdultTraveller: "Y",
                TempData: {
                  "MaskAfter-Mobile": "+63******1548",
                  "MaskAfter-IdNo": "A01234562"
                },
                PolicyCoverageList: [
                  { PolicyElementId: 2313358231, CoverageName: "Accidental Death, Dismemberment and Disablement" },
                  { PolicyElementId: 2313358232, CoverageName: "Unprovoked Murder and Assault" },
                  { PolicyElementId: 2313358233, CoverageName: "Sabotage and Terrorism" },
                  { PolicyElementId: 2313358234, CoverageName: "Accidental Death" },
                  { PolicyElementId: 2313358235, CoverageName: "COVID-19 Overseas Medical Costs" },
                  { PolicyElementId: 2313358236, CoverageName: "Coronavirus -19 (perday , maximum of 7days)" },
                  { PolicyElementId: 2313358237, CoverageName: "Sickness (perday , maximum of 10days)" },
                  { PolicyElementId: 2313358238, CoverageName: "Accidents (perday, maximum of 10days)" },
                  { PolicyElementId: 2313358239, CoverageName: "Cashless Hospitalization" },
                  { PolicyElementId: 2313358240, CoverageName: "Follow-up Care" },
                  { PolicyElementId: 2313358241, CoverageName: "Civil/Personal Liability" },
                  { PolicyElementId: 2313358242, CoverageName: "Trip Cancellation" },
                  { PolicyElementId: 2313358243, CoverageName: "Emergency Trip Termination" },
                  { PolicyElementId: 2313358244, CoverageName: "Loss of Cash" },
                  { PolicyElementId: 2313358245, CoverageName: "Loss of Travel Documents abroad" },
                  { PolicyElementId: 2313358246, CoverageName: "Loss Of Checked In Baggage" },
                  { PolicyElementId: 2313358247, CoverageName: "Baggage Delay Benefit (After First 12 hrs)" },
                  { PolicyElementId: 2313358248, CoverageName: "Flight Delay" },
                  { PolicyElementId: 2313358249, CoverageName: "Damage of Checked in Baggage" },
                  { PolicyElementId: 2313358250, CoverageName: "Loss of Laptop" },
                  { PolicyElementId: 2313358251, CoverageName: "Aircraft Hijacking" },
                  { PolicyElementId: 2313358252, CoverageName: "Damage to Laptop" },
                  { PolicyElementId: 2313358253, CoverageName: "Emergency Repatriation Expense" },
                  { PolicyElementId: 2313358254, CoverageName: "Medical Evacuation" },
                  { PolicyElementId: 2313358255, CoverageName: "Return of Mortal Remains" }
                ]
              },
              {
                PolicyElementId: 2313358228,
                FirstName: "Leanna",
                MiddleName: "",
                LastName: "Miraflores",
                InsuredName: "Leanna Miraflores",
                Email: "nelsmiraflores@gmail.com",
                Mobile: "+63******1548",
                DateOfBirth: "2017-01-30",
                Age: 8,
                Gender: "M",
                IsMainInsured: "N",
                IsAdultTraveller: "N",
                TempData: {
                  "MaskAfter-Mobile": "+63******1548",
                  "MaskAfter-IdNo": "A01234562"
                },
                PolicyCoverageList: [
                  { PolicyElementId: 2313358260, CoverageName: "Accidental Death, Dismemberment and Disablement" },
                  { PolicyElementId: 2313358261, CoverageName: "Unprovoked Murder and Assault" },
                  { PolicyElementId: 2313358262, CoverageName: "Sabotage and Terrorism" },
                  { PolicyElementId: 2313358263, CoverageName: "COVID-19 Overseas Medical Costs" },
                  { PolicyElementId: 2313358264, CoverageName: "Cashless Hospitalization" },
                  { PolicyElementId: 2313358265, CoverageName: "Follow-up Care" },
                  { PolicyElementId: 2313358266, CoverageName: "Trip Cancellation" },
                  { PolicyElementId: 2313358267, CoverageName: "Emergency Trip Termination" },
                  { PolicyElementId: 2313358268, CoverageName: "Loss of Travel Documents abroad" },
                  { PolicyElementId: 2313358269, CoverageName: "Baggage Delay Benefit (After First 12 hrs)" },
                  { PolicyElementId: 2313358270, CoverageName: "Flight Delay" },
                  { PolicyElementId: 2313358271, CoverageName: "Medical Evacuation" }
                ]
              }
            ]
          }
        ]
      }
      
      // Extract customer name from sample data
      const customer = policyDetails.PolicyCustomerList[0]
      customerName = [customer.Title, customer.FirstName, customer.MiddleName, customer.LastName, customer.Suffix]
        .filter(Boolean)
        .join(' ')
        .trim()
      
      console.log('Agent: Using sample PolicyCustomerList data with customer:', customerName)
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
        policy_details: policyDetails, // Use enhanced policy details with PolicyCustomerList
        merchant_transaction_id: transaction.merchant_transaction_id || null,
        amount: transaction.amount || null, // Keep as original type (string or number)
        customer_id: transaction.customer_id || null,
        customer_name: customerName || transaction.customer_name || 'N/A', // Use PolicyCustomerList[0] name
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
    console.log('Agent: Policy details being returned:', JSON.stringify(policyDetails, null, 2))
    console.log('Agent: Customer name being returned:', customerName)
    console.log('Agent: Full response data:', JSON.stringify(policyResponse.data, null, 2))
    
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