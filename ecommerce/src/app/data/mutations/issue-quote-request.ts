import { IssueQuoteRequest } from '@/types/travel-insurance/policy-types'
import {
  IssueQuoteResponseSchema,
  IssueQuoteResponse,
} from '@/types/travel-insurance/policy-types'
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
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        responseData = response.data
      } catch (err: any) {
        const backendMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Issue quote request failed'
        console.error('Issue quote HTTP error:', err?.response?.data || err)
        throw new Error(backendMessage)
      }

      const parsed = IssueQuoteResponseSchema.safeParse(responseData)
      if (!parsed.success) {
        // Could be backend returning { message: "Successful", data: {} } with empty data
        const raw = responseData as any
        const hasEmptyData = raw?.data && typeof raw.data === 'object' && Object.keys(raw.data).length === 0
        if (hasEmptyData) {
          console.error('Issue quote returned empty data object:', responseData)
          throw new Error(raw?.message || 'Issue quote returned no policy data')
        }
        console.error('Issue quote response parse error:', parsed.error, 'Raw response:', responseData)
        const backendMessage = raw?.message || raw?.error || 'Unexpected response from issue quote'
        throw new Error(backendMessage)
      }

      const issueQuoteData = parsed.data as IssueQuoteResponse

      if (!issueQuoteData.success) {
        const backendMessage = issueQuoteData.message || 'Issue quote returned unsuccessful'
        console.error('Issue quote unsuccessful:', issueQuoteData)
        throw new Error(backendMessage)
      }

      // Validate that data is actually a full policy object
      const policyData = issueQuoteData.data
      if (!policyData?.PolicyId) {
        const backendMessage = issueQuoteData.message
        const isBackendMisleading = backendMessage?.toLowerCase() === 'successful'
        const errorMessage = isBackendMisleading
          ? 'Policy issuance is pending. Your payment was received — please contact support with your proposal number.'
          : backendMessage || 'Issue quote returned no policy data'
        console.error('Issue quote returned no valid policy data:', issueQuoteData)
        throw new Error(errorMessage)
      }

      // Update localStorage proposal with policy_number after successful payment
      if (issueQuoteData.data?.ProposalNo) {
        try {
          const proposalKey = `proposal_${issueQuoteData.data.ProposalNo}`
          const existingProposal = localStorage.getItem(proposalKey)
          if (existingProposal) {
            const proposalData = JSON.parse(existingProposal)
            proposalData.policy_number = issueQuoteData.data.CarrierPolicyNo || issueQuoteData.data.PolicyNo
            proposalData.PolicyNo = issueQuoteData.data.PolicyNo
            proposalData.CarrierPolicyNo = issueQuoteData.data.CarrierPolicyNo
            localStorage.setItem(proposalKey, JSON.stringify(proposalData))
            console.log('Updated proposal in localStorage with policy_number:', proposalData.policy_number)
          }
        } catch (storageError) {
          console.warn('Failed to update proposal in localStorage:', storageError)
        }
      }

      return issueQuoteData
    },
    retry: false,
  })
}
