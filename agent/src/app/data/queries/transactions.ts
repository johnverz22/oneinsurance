import { useAgentAuthStore } from '@/store/agent-auth-store'
import { Transaction, TransactionsResponse } from '@/types/agent/transactions'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useGetTransactions(page: number = 1, perPage: number = 10) {
  const { accessToken } = useAgentAuthStore()

  return useQuery({
    queryKey: ['transactions', page, perPage],
    queryFn: async () => {
      const response = await axios.get<TransactionsResponse>(
        `/api/transactions?page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      return response.data
    },
    enabled: !!accessToken,
    // keepPreviousData option removed to satisfy types
  })
}
