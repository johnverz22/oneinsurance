import { IssueQuoteRequest, IssueQuoteResponseSchema, IssueQuoteResponse } from '@/types/travel-insurance/policy-types'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export class IssueQuoteError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'IssueQuoteError'
    this.status = status
  }
}

/** 5xx and network failures carry no useful detail for the customer — show a plain-language message instead. */
function resolveIssueQuoteMessage(status: number | undefined, backendMessage?: string) {
  if (!status) return 'We couldn’t reach our servers. Check your connection and try again.'
  if (status >= 500) return 'We couldn’t reach the insurer to create your policy. Your payment is safe.'
  return backendMessage || 'We couldn’t create your policy this time.'
}

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
        const status: number | undefined = err?.response?.status
        const data = err?.response?.data
        const backendMessage: string | undefined =
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.error === 'string' && data.error) ||
          undefined
        console.warn('[issue-quote] HTTP error', { status, message: backendMessage ?? err?.message, data })
        throw new IssueQuoteError(resolveIssueQuoteMessage(status, backendMessage), status)
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
