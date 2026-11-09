import { useAuthStore } from '@/store/auth-store'
import { ProvidersPaginatedResponse } from '@/types/provider'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { handleApiError } from '@/utils/handle-api-error'

export function useGetProviders(page: number = 1, search?: string) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['providers', page],
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        const queryString = params.toString()
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/providers?page=${page}${queryString ? `&${queryString}` : ''}`
        const token = `Bearer ${accessToken}`
        const response = await axios.get<ProvidersPaginatedResponse>(url, {
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
  })
}
