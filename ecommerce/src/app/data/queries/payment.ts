import { PaymentBrandsResponse } from '@/types/payment'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useGetPaymentBrands() {
  return useQuery({
    queryKey: ['get-payment-brands'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/payment')

        return response.data as PaymentBrandsResponse
      } catch (error) {
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnReconnect: false, // Don't refetch when reconnecting to internet
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}
