import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { TravelInsuranceApiResponse } from '@/types/plan'
import {
  ClientRequest,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import { travelInsurance } from '@/constants/travel-response'

export const useGetTravelQuote = (
  clientRequestId: string | undefined,
  enabled: boolean,
  setStatus?: (value: ClientRequest['status']) => void
) => {
  const { insurancePlans, setInsurancePlans } = useTravelInsuranceStore()

  return useQuery({
    queryKey: ['compare-quote', clientRequestId],
    queryFn: async ({ signal }) => {
      try {
        if (!clientRequestId) {
          throw new Error('ClientRequestId not found.')
        }

        return null

        if (insurancePlans) {
          return insurancePlans
        }

        const url = `/api/travel-insurance/init-compare?ClientRequestId=${clientRequestId}`

        // Create a race condition between the actual request and a timeout
        // This ensures the request doesn't hang indefinitely on Vercel
        const result = await axios.get<TravelInsuranceApiResponse>(url, {
          signal, // Pass the AbortController signal to axios
          timeout: 90000, // 90 second timeout for the request itself
        })

        setInsurancePlans(result.data)
        setStatus?.('success')
        return result.data
        // return travelInsurance
      } catch (error: any) {
        // Check if the error is due to request cancellation
        if (
          axios.isCancel(error) ||
          error?.message === 'Request was cancelled'
        ) {
          console.log('Travel quote request was cancelled')
          setStatus?.('error')
          throw error
        }

        // Handle timeout errors
        if (error?.message?.includes('timeout')) {
          console.log('Travel quote request timed out')
          setStatus?.('error')
          throw new Error('Request timeout: Please try again')
        }

        console.log('Get init quote error:', error)
        setStatus?.('error')
        throw error
      }
    },

    enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount, error: any) => {
      // Don't retry if request was cancelled or timed out
      if (
        axios.isCancel(error) ||
        error?.message?.includes('cancelled') ||
        error?.message?.includes('timeout')
      ) {
        return false
      }
      // Only retry once for other errors
      return failureCount < 1
    },
  })
}
