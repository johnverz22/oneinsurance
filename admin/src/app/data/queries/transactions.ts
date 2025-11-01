import { useAuthStore } from '@/store/auth-store'
import { TransactionsResponse } from '@/types/transactions'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { removeLocalStorage } from '@/utils/remove-session-storage'

export function useGetTransactions(page = 1) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['transactions', page],
    queryFn: async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/transactions?page=${page}`
        const response = await axios.get<TransactionsResponse>(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        })

        return response.data
      } catch (error) {
        if (axios.isAxiosError(error)) {
          switch (error.response?.status) {
            case 401:
              alert('Session expired. Please log in again.')
              removeLocalStorage('admin-auth-storage')
              window.location.href = '/login'
              break
          }
        }
        throw error
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!accessToken,
  })
}
