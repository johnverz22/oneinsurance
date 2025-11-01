import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useSearchTransactions() {
  const { accessToken } = useAgentAuthStore()

  return useMutation({
    mutationKey: ['search-transactions'],
    mutationFn: async ({ keyword }: { keyword: string }) => {
      const token = `Bearer ${accessToken}`
      const response = await axios.post(
        '/api/transactions/search',
        {
          keyword,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      )
      return response.data
    },
    retry: false,
  })
}
