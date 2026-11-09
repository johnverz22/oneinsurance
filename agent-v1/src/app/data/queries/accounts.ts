import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

import { useAgentAuthStore } from '@/store/agent-auth-store'
import { AccountsResponse } from '@/types/account'

export function useGetAccounts() {
  const { accessToken, user } = useAgentAuthStore()

  return useQuery({
    queryKey: ['agent-accounts', user?.id],
    queryFn: async () => {
      const url = `/api/accounts`
      const token = `Bearer ${accessToken}`

      const response = await axios.get<AccountsResponse>(url, {
        headers: {
          Authorization: token,
        },
      })

      const result = response.data
      const hasAccounts =
        result.data.bank_details.length > 0 || result.data.e_wallets.length > 0

      return { ...result, data: result.data, hasAccounts }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!accessToken && !!user,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: 1000,
  })
}
