import { useAgentAuthStore } from '@/store/agent-auth-store'
import { Transaction, TransactionsResponse } from '@/types/agent/transactions'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useGetTransactions(page: number = 1) {
  const { accessToken } = useAgentAuthStore()

  return useQuery({
    queryKey: ['transactions', page],
    queryFn: async () => {
      const response = await axios.get<TransactionsResponse>(
        `/api/transactions?page=${page}`,
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
