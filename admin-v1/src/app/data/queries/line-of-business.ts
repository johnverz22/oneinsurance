import { useAuthStore } from '@/store/auth-store'
import { AgentLineOfBusinessPaginatedResponse } from '@/types/agents'
import {
  LineOfBusinessAgents,
  LineOfBusinessAgentsResponse,
  LineOfBusinessPaginatedResponse,
} from '@/types/line-of-business'
import { handleApiError } from '@/utils/handle-api-error'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface LineOfBusinessParams {
  status?: 'active' | 'inactive' | 'pending'
  name?: string
  sort_by?: 'created_at' | 'name' | 'status'
  sort_order?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

interface AgentLineOfBusinessParams {
  status?: 'active' | 'inactive' | 'pending'
  agent_id?: number
  lob_id?: number
  sort_by?: 'created_at' | 'name' | 'status'
  sort_order?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

export function useGetLineOfBusinessList(params: LineOfBusinessParams = {}) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['line-of-business', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (params.page) searchParams.append('page', params.page.toString())
      else searchParams.append('page', '1')
      if (params.per_page)
        searchParams.append('per_page', params.per_page.toString())
      else searchParams.append('per_page', '15')
      if (params.sort_by) searchParams.append('sort_by', params.sort_by)
      else searchParams.append('sort_by', 'created_at')
      if (params.sort_order)
        searchParams.append('sort_order', params.sort_order)
      else searchParams.append('sort_order', 'desc')
      if (params.status) searchParams.append('status', params.status)
      if (params.name) searchParams.append('name', params.name)

      const url = `/api/admin/lobs?${searchParams.toString()}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get<LineOfBusinessPaginatedResponse>(url, {
          headers: {
            Authorization: token,
          },
        })

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useGetAllAgentLineOfBusiness(
  params: AgentLineOfBusinessParams = {}
) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['all-agent-lobs', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (params.page) searchParams.append('page', params.page.toString())
      if (params.per_page)
        searchParams.append('per_page', params.per_page.toString())
      else searchParams.append('per_page', '15')
      if (params.sort_by) searchParams.append('sort_by', params.sort_by)
      else searchParams.append('sort_by', 'created_at')
      if (params.sort_order)
        searchParams.append('sort_order', params.sort_order)
      else searchParams.append('sort_order', 'desc')
      if (params.status) searchParams.append('status', params.status)
      if (params.agent_id)
        searchParams.append('agent_id', params.agent_id.toString())
      if (params.lob_id) searchParams.append('lob_id', params.lob_id.toString())

      const url = `/api/admin/agent-lobs?${searchParams.toString()}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get<AgentLineOfBusinessPaginatedResponse>(
          url,
          {
            headers: {
              Authorization: token,
            },
          }
        )

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useGetLobAgents(lobId: number) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['lob-agents', lobId],
    queryFn: async () => {
      const url = `/api/admin/agent-lobs/lob/${lobId}/agents`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get<LineOfBusinessAgentsResponse>(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken && !!lobId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useGetAgentLobs(agentId: number) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['agent-lobs', agentId],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.append('agent_id', agentId.toString())
      searchParams.append('per_page', '100')
      searchParams.append('status', 'active')

      const url = `/api/admin/agent-lobs?${searchParams.toString()}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get<AgentLineOfBusinessPaginatedResponse>(
          url,
          {
            headers: {
              Authorization: token,
            },
          }
        )
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken && !!agentId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Helper function to extract LOB slugs for a specific agent
export function useGetAgentLobSlugs(agentId: number) {
  const query = useGetAgentLobs(agentId)
  
  const slugs = query.data?.data?.data?.map(
    (agentLob) => agentLob.line_of_business.slug
  ).filter(Boolean) || []

  return {
    ...query,
    slugs,
  }
}
