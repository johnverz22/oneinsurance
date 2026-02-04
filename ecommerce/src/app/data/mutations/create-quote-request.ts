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
    const url = `/api/travel-insurance/compare-quote`
    
    console.log('Making request to local API:', url)
    console.log('Request data:', data)

    const result = await axios.post<InitCompareQuote>(url, data, {
      headers: { 
        'Content-Type': 'application/json'
      },
      timeout: 30000, // 30 second timeout
    })
    return result.data
  } catch (error: any) {
    console.error('API Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    })
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.')
    }
    
    if (error.response?.status === 404) {
      throw new Error('API endpoint not found. Please contact support.')
    }
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please refresh the page and try again.')
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.')
    }
    
    throw error
  }
}

export const useCreateQuoteRequest = () => {
  return useMutation({
    mutationFn: async (values: TravelInsuranceFormData) => {
      // Debug environment variables
      console.log('Environment check:', {
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        hasToken: !!process.env.NEXT_PUBLIC_ACCESS_TOKEN,
        tokenLength: process.env.NEXT_PUBLIC_ACCESS_TOKEN?.length
      })

      const initCompareQuoteRequoteBody =
        travelInsuranceSchemaToInitCompareQuote(values)
      try {
        const response = await initCompareQuote(initCompareQuoteRequoteBody)

        return response.data.ClientRequestId
      } catch (error: any) {
        console.error('Mutation error:', error)
        // Re-throw with more user-friendly message
        if (error.message.includes('Network Error')) {
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.')
        }
        throw error
      }
    },
  })
}