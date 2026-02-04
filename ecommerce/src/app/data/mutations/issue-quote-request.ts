import { IssueQuoteRequest } from '@/types/travel-insurance/policy-types'
import {
  IssueQuoteResponseSchema,
  IssueQuoteResponse,
} from '@/types/travel-insurance/policy-types'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { error } from 'console'

export function useIssueQuoteRequest() {
  return useMutation({
    mutationFn: async ({
      issueQuoteRequest,
    }: {
      issueQuoteRequest: IssueQuoteRequest
    }) => {
      try {
        const response = await axios.post(
          `/api/travel-insurance/issue-quote`,
          issueQuoteRequest,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        const parsed = IssueQuoteResponseSchema.safeParse(response.data)
        if (parsed.success) {
          return parsed.data as IssueQuoteResponse
        } else {
          return null
        }
      } catch (error) {
        return null
      }
    },
    retry: false,
  })
}
