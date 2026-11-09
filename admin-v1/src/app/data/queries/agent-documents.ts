import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'

export interface AgentDocument {
  id: number
  name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
  updated_at: string
}

export interface AgentDocumentsResponse {
  success: boolean
  message: string
  data: AgentDocument[]
  errors?: string[]
}

export function useGetAgentDocuments(agentId: number | null) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['admin-agent-documents', agentId],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID is required')
      
      const url = `/api/admin/agents/${agentId}/documents`
      const token = `Bearer ${accessToken}`

      const response = await axios.get<AgentDocumentsResponse>(url, {
        headers: {
          Authorization: token,
        },
      })

      return response.data
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!accessToken && !!agentId,
  })
}