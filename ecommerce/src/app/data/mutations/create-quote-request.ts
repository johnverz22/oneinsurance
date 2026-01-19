import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import { InitCompareQuote, TravelPolicy } from '@/types/plan'
import {
  PersonalInfoFormData,
  TravelInsuranceFormData,
  InitTravelInsuranceRequest,
} from '@/types/travel-insurance/travel-insurance-request'
import { travelInsuranceSchemaToInitCompareQuote } from '@/utils/mappers/travel-insurance/init-compare-quote'

export type TravelQuoteRequestArgs = {
  values: TravelInsuranceFormData & PersonalInfoFormData
}

export const initCompareQuote = async (data: InitTravelInsuranceRequest) => {
  try {
    // Use the Next.js API route handler instead of calling the external API directly
    const url = `/api/travel-insurance/init-compare`
    const token = `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`

    const result = await axios.post<InitCompareQuote>(url, data, {
      headers: { Authorization: token },
      timeout: 120000, // 2 minute timeout to match backend
    })
    
    console.log('API Route Response:', result.data)
    
    // Validate response structure
    if (!result.data || !result.data.data || !result.data.data.ClientRequestId) {
      console.error('Invalid response structure:', result.data)
      throw new Error('Invalid response from server: Missing ClientRequestId')
    }
    
    return result.data
  } catch (error: any) {
    console.error('initCompareQuote error:', error)
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
    }
    throw error
  }
}

export const useCreateQuoteRequest = () => {
  return useMutation({
    mutationFn: async (values: TravelInsuranceFormData) => {
      const initCompareQuoteRequoteBody =
        travelInsuranceSchemaToInitCompareQuote(values)
      try {
        const response = await initCompareQuote(initCompareQuoteRequoteBody)

        return response.data.ClientRequestId
      } catch (error) {
        throw error
      }
    },
  })
}
