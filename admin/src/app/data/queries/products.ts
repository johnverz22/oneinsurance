import { useAuthStore } from '@/store/auth-store'
import { ProductsPaginatedResponse } from '@/types/products'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { handleApiError } from '@/utils/handle-api-error'

export function useGetProducts(page: number = 1, query?: string) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['products', page, query],
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams()
        searchParams.append('page', page.toString())
        if (query && query.trim().length > 0) {
          searchParams.append('keyword', query.trim())
        }

        const response = await axios.get<ProductsPaginatedResponse>(
          `/api/admin/products?${searchParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
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

export function searchProducts(query: string) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['search-products', query],
    queryFn: async () => {
      try {
        const response = await axios.get<ProductsPaginatedResponse>(
          `/api/admin/products?keyword=${encodeURIComponent(query.trim())}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!accessToken && query.trim().length > 0,
  })
}
