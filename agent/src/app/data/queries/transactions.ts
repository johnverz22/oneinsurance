import { useAgentAuthStore } from '@/store/agent-auth-store'
import { Transaction, TransactionsResponse } from '@/types/agent/transactions'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useGetTransactions(page: number = 1, perPage: number = 10, dateFrom?: string, dateTo?: string) {
  const { accessToken } = useAgentAuthStore()

  return useQuery({
    queryKey: ['transactions', page, perPage, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      })
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await axios.get<TransactionsResponse>(
        `/api/transactions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      return response.data
    },
    enabled: !!accessToken,
  })
}

export function useGetCompletedTransactions(page: number = 1, perPage: number = 10) {
  const { accessToken } = useAgentAuthStore()

  return useQuery({
    queryKey: ['completedTransactions', page, perPage],
    queryFn: async () => {
      const response = await axios.get<TransactionsResponse>(
        `/api/transactions/completed?page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      return response.data
    },
    enabled: !!accessToken,
  })
}
