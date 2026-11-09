import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

// Types for statistics response
export interface AgentStatistics {
  total_sales: number
  number_of_sales: number
  gross_commissions: number
  net_commissions: number
  average_payout: number
  number_of_products: number
  active_policies?: number
  total_cases?: number
  total_commission?: number
  conversion_rate?: number
  pending_applications?: number
  product_sales_ranking: Array<{
    product_id: number
    product_name: string
    total_cases: number
    total_sales: number
  }>
}

export interface LOBProductStatistics {
  lob_id: number
  lob_name: string
  total_sales: number
  total_cases: number
  total_commission: number
  products: Array<{
    product_id: number
    product_name: string
    sales: number
    cases: number
    commission: number
  }>
}

export interface AgentStatisticsResponse {
  success: boolean
  data: AgentStatistics
}

export interface LOBProductStatisticsResponse {
  success: boolean
  data: {
    summary: {
      total_sales: number
      total_cases: number
      total_commission: number
    }
    lobs: LOBProductStatistics[]
  }
}

// Hook to get agent statistics
export const useGetAgentStatistics = (dateFrom?: string, dateTo?: string) => {
  const { accessToken, user } = useAgentAuthStore()

  // Get from Jan 1 last year to now if dates not provided
  const getDefaultDates = () => {
    const now = new Date()
    const lastYear = now.getFullYear() - 1
    const start = new Date(lastYear, 0, 1) // January 1st of last year
    
    return {
      dateFrom: start.toISOString().split('T')[0], // YYYY-MM-DD format
      dateTo: now.toISOString().split('T')[0],
    }
  }

  const dates = dateFrom && dateTo 
    ? { dateFrom, dateTo } 
    : getDefaultDates()

  return useQuery<AgentStatistics>({
    queryKey: ['agentStatistics', user?.id, dates.dateFrom, dates.dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('date_from', dates.dateFrom)
      params.append('date_to', dates.dateTo)

      const url = `/api/agent/statistics?${params.toString()}`

      const response = await axios.get<AgentStatisticsResponse>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })

      // Check if response has nested data property or is direct
      return response.data.data || response.data
    },
    enabled: !!user?.id && !!accessToken,
    retry: false,
  })
}

// Hook to get LOB product statistics
export const useGetLOBProductStatistics = (
  dateFrom?: string,
  dateTo?: string,
  lobId?: number
) => {
  const { accessToken, user } = useAgentAuthStore()

  return useQuery({
    queryKey: ['lobProductStatistics', user?.id, dateFrom, dateTo, lobId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (lobId) params.append('lob_id', lobId.toString())

      const url = `/api/agent/lobs/products/statistics${params.toString() ? `?${params.toString()}` : ''}`

      const response = await axios.get<LOBProductStatisticsResponse>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })

      return response.data.data
    },
    enabled: !!user?.id && !!accessToken,
  })
}

// Admin hooks
export const useGetOverallAgentStatistics = (
  dateFrom?: string,
  dateTo?: string
) => {
  const { accessToken, user } = useAgentAuthStore()

  return useQuery<AgentStatistics>({
    queryKey: ['overallAgentStatistics', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const url = `/api/admin/agent-statistics${params.toString() ? `?${params.toString()}` : ''}`

      const response = await axios.get<AgentStatisticsResponse>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })

      return response.data.data
    },
    enabled: !!user?.id && !!accessToken,
  })
}

export const useGetSpecificAgentStatistics = (
  agentId: number,
  dateFrom?: string,
  dateTo?: string
) => {
  const { accessToken, user } = useAgentAuthStore()

  return useQuery<AgentStatistics>({
    queryKey: ['specificAgentStatistics', agentId, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const url = `/api/admin/agent-statistics/${agentId}${params.toString() ? `?${params.toString()}` : ''}`

      const response = await axios.get<AgentStatisticsResponse>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })

      return response.data.data
    },
    enabled: !!user?.id && !!accessToken && !!agentId,
  })
}

export const useGetAdminLOBProductStatistics = (
  dateFrom?: string,
  dateTo?: string,
  lobId?: number
) => {
  const { accessToken, user } = useAgentAuthStore()

  return useQuery({
    queryKey: ['adminLobProductStatistics', dateFrom, dateTo, lobId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (lobId) params.append('lob_id', lobId.toString())

      const url = `/api/admin/agent-lobs/products/statistics${params.toString() ? `?${params.toString()}` : ''}`

      const response = await axios.get<LOBProductStatisticsResponse>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })

      return response.data.data
    },
    enabled: !!user?.id && !!accessToken,
  })
}
