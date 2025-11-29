import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

import { useAgentAuthStore } from '@/store/agent-auth-store'
import { AccountsResponse } from '@/types/account'

export function useGetAccounts() {
  const { accessToken } = useAgentAuthStore()

  return useQuery({
    queryKey: ['agentAccounts'],
    queryFn: async () => {
      const url = `/api/accounts`
      const token = `Bearer ${accessToken}`

      const response = await axios.get<AccountsResponse>(url, {
        headers: {
          Authorization: token,
        },
      })

      return response.data
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!accessToken,
  })
}
