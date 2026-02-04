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
        const response = await axios.post(
          `/api/travel-insurance/full-quote`,
          fullQuoteRequest,
          {
            headers: {
              'Content-Type': 'application/json',
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
