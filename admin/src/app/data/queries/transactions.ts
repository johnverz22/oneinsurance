import { useAuthStore } from '@/store/auth-store'
import { TransactionsResponse } from '@/types/transactions'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { handleApiError } from '@/utils/handle-api-error'

export function useGetTransactions(page = 1) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['transactions', page],
    queryFn: async () => {
      try {
        const response = await axios.get<TransactionsResponse>(
          `/api/admin/transactions?page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        )

        return response.data
      } catch (error) {
        handleApiError(error)
        }
      },
      refetchOnWindowFocus: false,
      enabled: !!accessToken,
  })
}

export function useGetAgentTransactions(agentId: number, page = 1) {
  const { accessToken } = useAuthStore()
  
  console.log('useGetAgentTransactions - Called with:', { agentId, page, accessToken: accessToken ? 'present' : 'missing' })
  
  return useQuery({
    queryKey: ['agent-transactions', agentId, page],
    queryFn: async () => {
      console.log('useGetAgentTransactions - Making API call for agentId:', agentId, 'page:', page)
      
      try {
        const response = await axios.get<TransactionsResponse>(
          `/api/admin/transactions?agent_id=${agentId}&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        )

        console.log('useGetAgentTransactions - API response:', response.data)
        return response.data
      } catch (error) {
        console.error('useGetAgentTransactions - API error:', error)
        handleApiError(error)
        throw error
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!accessToken && !!agentId && agentId > 0,
    retry: 3,
    retryDelay: 1000,
  })
}
