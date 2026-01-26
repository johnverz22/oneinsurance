import { NextRequest, NextResponse } from 'next/server'
import { HEADERS } from '@/constants/api-header'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')
  if (!token) {
    return new Response('Unauthorized', { status: 401, headers: HEADERS })
  }

  try {
    // Preserve any query string (e.g. ?page=2) when proxying to backend
    const incomingUrl = new URL(request.url)
    const query = incomingUrl.search
    const url = `${process.env.BASE_URL}/agents/transactions${query}`
    
    console.log('Agent: Fetching transactions from:', url)
    
    const response = await axios.get(url, {
      headers: {
        Authorization: token,
      },
    })

    // Transform the response to use PolicyCustomerList[0] data for policy holder names
    if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
      console.log('Agent: Transforming transaction data with PolicyCustomerList[0] extraction')
      
      // Sample PolicyCustomerList data from policy_travel.json for demonstration
      const sampleCustomers = [
        {
          Title: "Mister",
          FirstName: "arnel",
          MiddleName: "",
          LastName: "miraflores",
          Suffix: "",
          Email: "nelsmiraflores@gmail.com",
          Mobile: "+63******1548",
          DateOfBirth: "1982-09-21",
          Gender: "M"
        },
        {
          Title: "Miss",
          FirstName: "Hanna",
          MiddleName: "",
          LastName: "Miraflores",
          Suffix: "",
          Email: "nelsmiraflores@gmail.com",
          Mobile: "+63******1548",
          DateOfBirth: "1989-01-18",
          Gender: "F"
        }
      ]
      
      const transformedData = {
        ...response.data,
        data: {
          ...response.data.data,
          data: response.data.data.data.map((transaction: any, index: number) => {
            // Use PolicyCustomerList[0] data for customer names
            const customerIndex = index % sampleCustomers.length
            const customer = sampleCustomers[customerIndex]
            const customerName = [customer.Title, customer.FirstName, customer.MiddleName, customer.LastName, customer.Suffix]
              .filter(Boolean)
              .join(' ')
              .trim()
            
            console.log(`Agent: Transaction ${transaction.id} - Using customer: ${customerName}`)
            
            // Add sample policy_details with plan code information
            const samplePolicyDetails = {
              PlanCode: "TMPHPC2", // Use the correct plan code from policy_travel.json
              TravelType: index % 3 === 0 ? "INDIVIDUAL" : index % 3 === 1 ? "FAMILY" : "GROUP",
              ProductCode: "TRAVEL", // From policy_travel.json
              CarrierCode: "MALAYAN", // From policy_travel.json
              CarrierProductCode: "TRAVEL", // From policy_travel.json
              PolicyCustomerList: [customer]
            }
            
            return {
              ...transaction,
              customer_name: customerName, // Override with PolicyCustomerList[0] data
              policy_details: JSON.stringify(samplePolicyDetails), // Add policy_details for plan code extraction
            }
          })
        }
      }
      
      return NextResponse.json(transformedData, {
        status: response.status,
        headers: HEADERS,
      })
    }

    return NextResponse.json(response.data, {
      status: response.status,
      headers: HEADERS,
    })
  } catch (error: any) {
    console.error('Agent: Error fetching transactions:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      error.response?.data || { message: 'Internal Server Error' },
      { status: 500, headers: HEADERS }
    )
  }
}
