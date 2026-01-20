import { FullQuoteRequest } from '@/types/full-quote-request'
import { FullQuoteResponseSchema } from '@/types/travel-insurance/policy-types'
import { FullQuoteResponseValidationError } from '@/types/travel-insurance/error-travel-response'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export function useFullQuoteRequest() {
  return useMutation({
    mutationFn: async ({
      fullQuoteRequest,
    }: {
      fullQuoteRequest: FullQuoteRequest
    }) => {
      try {
        const token = `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/quote/travel/full-quote`,
          fullQuoteRequest,
          {
            headers: {
              Authorization: token,
            },
          }
        )

        if (FullQuoteResponseSchema.safeParse(response.data).success) {
          return FullQuoteResponseSchema.safeParse(response.data).data
        }

        return response.data
      } catch (error: any) {
        return error.response.data
      }
    },
    retry: false,
  })
}
