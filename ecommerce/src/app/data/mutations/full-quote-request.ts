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
          const validatedData = FullQuoteResponseSchema.safeParse(response.data).data
          
          // Save proposal to localStorage for offline access
          if (validatedData && validatedData.success && validatedData.data?.ProposalNo) {
            try {
              const proposalKey = `proposal_${validatedData.data.ProposalNo}`
              localStorage.setItem(proposalKey, JSON.stringify(validatedData.data))
              console.log('Saved proposal to localStorage:', validatedData.data.ProposalNo)
            } catch (storageError) {
              console.warn('Failed to save proposal to localStorage:', storageError)
            }
          }
          
          return validatedData
        }

        return response.data
      } catch (error: any) {
        return error.response.data
      }
    },
    retry: false,
  })
}
