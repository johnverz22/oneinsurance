import { useAuthStore } from '@/store/auth-store'
import { ProductsPaginatedResponse } from '@/types/products'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useGetProducts(page: number = 1) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['products', page],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/products?page=${page}`
      const response = await axios.get<ProductsPaginatedResponse>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      return response.data
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
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/products`
      const requestbody = {
        keyword: query.trim(),
      }
      const response = await axios.get<ProductsPaginatedResponse>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: requestbody,
      })
      return response.data
    },
    refetchOnWindowFocus: false,
    enabled: !!accessToken && query.trim().length > 0,
  })
}
