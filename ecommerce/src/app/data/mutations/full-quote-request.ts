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
        // Use the Next.js API route handler instead of calling the external API directly
        const url = `/api/travel-insurance/full-quote`
        const token = `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`
        
        const response = await axios.post(
          url,
          { fullQuoteRequest },
          {
            headers: {
              Authorization: token,
            },
            timeout: 120000, // 2 minute timeout
          }
        )

        if (FullQuoteResponseSchema.safeParse(response.data).success) {
          return FullQuoteResponseSchema.safeParse(response.data).data
        }

        return response.data
      } catch (error: any) {
        console.error('Full quote request error:', error)
        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          })
          // If we have a response with data, return it (might be validation error)
          if (error.response?.data) {
            return error.response.data
          }
        }
        // Throw error so form submission can catch it
        throw new Error(error?.response?.data?.message || error?.message || 'Failed to request full quote')
      }
    },
    retry: false,
  })
}
