import { IssueQuoteRequest, IssueQuoteResponseSchema, IssueQuoteResponse } from '@/types/travel-insurance/policy-types'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export function useIssueQuoteRequest() {
  return useMutation({
    mutationFn: async ({
      issueQuoteRequest,
    }: {
      issueQuoteRequest: IssueQuoteRequest
    }) => {
      let responseData: unknown
      try {
        const response = await axios.post(
          `/api/travel-insurance/issue-quote`,
          issueQuoteRequest,
          { headers: { 'Content-Type': 'application/json' } }
        )
        responseData = response.data
      } catch (err: any) {
        const backendMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Issue quote request failed'
        console.error(
          '[issue-quote] HTTP error:',
          'status:', err?.response?.status,
          'data:', err?.response?.data || err
        )
        throw new Error(backendMessage)
      }

      const parsed = IssueQuoteResponseSchema.safeParse(responseData)
      if (!parsed.success) {
        const raw = responseData as any
        console.error('[issue-quote] parse error:', parsed.error, 'raw:', responseData)
        throw new Error(raw?.message || raw?.error || 'Unexpected response from issue quote')
      }

      const result = parsed.data as IssueQuoteResponse

      if (!result.success) {
        console.error('[issue-quote] unsuccessful:', result)
        throw new Error(result.message || 'Issue quote returned unsuccessful')
      }

      if (!result.data?.policy_no) {
        // Issued but no policy_no yet — insurer may still be processing
        console.warn('[issue-quote] success but no policy_no:', result)
      }

      console.log('[issue-quote] issued OK — policy_no:', result.data?.policy_no, 'proposal:', result.data?.proposal_number)
      return result
    },
    retry: false,
  })
}
