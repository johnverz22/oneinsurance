import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { TravelPolicyResponse, TravelPolicyResponseSchema } from '@/types/quote'

export const useLoadQuoteRequest = (policyNo?: string) => {
  return useQuery({
    queryKey: ['quote-request'],
    queryFn: async () => {
      try {
        if (!policyNo) {
          throw new Error('PolicyNo not found.')
        }

        const response = await axios.post(
          `/api/travel-insurance/load-quote`,
          { Type: 'policy', PolicyNo: policyNo },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        const parsed = TravelPolicyResponseSchema.safeParse(response.data)

        if (parsed.success) {
          return parsed.data as TravelPolicyResponse
        } else {
          return null
        }
      } catch (error) {
        throw error
      }
    },
  })
}
