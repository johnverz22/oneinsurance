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
      timeout: 60000, // Increased to 60 seconds
    })
    
    console.log('API Response received:', result.data)
    
    // Backend returned data successfully, even if no plans available
    return result.data
  } catch (error: any) {
    console.error('API Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      code: error.code
    })
    
    // Handle timeout specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again.')
    }
    
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
    
    // If backend returned an error response with data, use it
    if (error.response?.data) {
      const msg = error.response.data.error || error.response.data.message || 'An error occurred'
      // Attach status code so callers can differentiate
      const err = new Error(msg) as any
      err.statusCode = error.response.status
      err.responseData = error.response.data
      throw err
    }
    
    throw error
  }
}

export const useCreateQuoteRequest = () => {
  return useMutation({
    mutationFn: async ({ values, agentCode }: { values: TravelInsuranceFormData; agentCode?: string }) => {
      const initCompareQuoteRequoteBody =
        travelInsuranceSchemaToInitCompareQuote(values, agentCode)
      try {
        const response = await initCompareQuote(initCompareQuoteRequoteBody)
        return response.data.ClientRequestId
      } catch (error: any) {
        console.error('Mutation error:', error)
        if (error.message.includes('Network Error')) {
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.')
        }
        throw error
      }
    },
  })
}