import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import { TravelInsuranceApiResponse } from '@/types/plan'
import {
  TravelInsuranceFormData,
  InitTravelInsuranceRequest,
} from '@/types/travel-insurance/travel-insurance-request'
import { travelInsuranceSchemaToInitCompareQuote } from '@/utils/mappers/travel-insurance/init-compare-quote'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'

export const fetchCompareQuote = async (
  data: InitTravelInsuranceRequest
): Promise<TravelInsuranceApiResponse> => {
  try {
    const url = `/api/travel-insurance/compare-quote`

    const result = await axios.post<TravelInsuranceApiResponse>(url, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    })

    return result.data
  } catch (error: any) {
    const details = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
    }
    console.error('Compare quote error:', details)

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please try again.')
    }

    if (error.message === 'Network Error') {
      throw new Error(
        'Unable to connect to the server. Please check your internet connection and try again.'
      )
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

    if (error.response?.data) {
      const msg =
        error.response.data.error ||
        error.response.data.message ||
        'An error occurred'
      const err = new Error(msg) as any
      err.statusCode = error.response.status
      err.responseData = error.response.data
      throw err
    }

    throw error
  }
}

export const useCreateQuoteRequest = () => {
  const { setInsurancePlans, resetCoverageOption } = useTravelInsuranceStore()

  return useMutation({
    mutationFn: async ({
      values,
      agentCode,
    }: {
      values: TravelInsuranceFormData
      agentCode?: string
    }) => {
      const requestBody = travelInsuranceSchemaToInitCompareQuote(values, agentCode)
      const response = await fetchCompareQuote(requestBody)

      // Store plans directly — no WebSocket needed
      resetCoverageOption()
      setInsurancePlans(response)

      return response
    },
  })
}
