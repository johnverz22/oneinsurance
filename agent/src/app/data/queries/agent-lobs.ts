import { useAgentAuthStore } from '@/store/agent-auth-store'
import { AgentLOBsResponse, AgentLOB } from '@/types/agent/lob'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useGetAgentLOBs(status?: string) {
  const { accessToken, user } = useAgentAuthStore()

  return useQuery<AgentLOB[]>({
    queryKey: ['agentLOBs', status],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (status) params.append('status', status)
        params.append('sort_by', 'created_at')
        params.append('sort_order', 'desc')
        params.append('per_page', '100')

        const url = `/api/agent/lobs?${params.toString()}`
        const response = await axios.get<AgentLOBsResponse>(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        })

        return response.data.data.data
      } catch (error) {
        if (axios.isAxiosError(error)) {
          switch (error.response?.status) {
            case 401:
              alert('Session expired. Please log in again.')
              removeLocalStorage('agent-auth-storage')
              window.location.href = '/login'
              return []
          }
        }

        throw error
      }
    },
    retry: false,
    enabled: !!accessToken && !!user?.id,
  })
}



