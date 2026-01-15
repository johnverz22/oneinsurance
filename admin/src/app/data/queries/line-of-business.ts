import { useAuthStore } from '@/store/auth-store'
import { LineOfBusinessPaginatedResponse } from '@/types/line-of-business'
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

export function useGetLineOfBusinessList(params: LineOfBusinessParams = {}) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['line-of-business', params],
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
      if (params.name) searchParams.append('name', params.name)

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/lobs?${searchParams.toString()}`
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
