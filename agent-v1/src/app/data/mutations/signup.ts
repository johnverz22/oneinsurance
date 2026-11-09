import { AgentSignUpAutoFillResponse } from '@/types/agent/auth'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useGetSignUpAutoFill() {
  return useMutation({
    mutationKey: ['signup-autofill'],
    mutationFn: async (token: string) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/invitations/applicant`
      const response = await axios.post<AgentSignUpAutoFillResponse>(url, {token})
      return response.data
    },
  })
}
