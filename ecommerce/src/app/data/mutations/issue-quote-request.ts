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
          const issueQuoteData = parsed.data as IssueQuoteResponse
          
          // Update localStorage proposal with policy_number after successful payment
          if (issueQuoteData.success && issueQuoteData.data?.ProposalNo) {
            try {
              const proposalKey = `proposal_${issueQuoteData.data.ProposalNo}`
              const existingProposal = localStorage.getItem(proposalKey)
              
              if (existingProposal) {
                const proposalData = JSON.parse(existingProposal)
                // Add policy_number to the saved proposal
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
