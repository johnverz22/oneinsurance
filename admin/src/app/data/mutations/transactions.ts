import { useAuthStore } from '@/store/auth-store'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export function useSearchTransaction() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['search-transaction'],
    mutationFn: async (searchKey: string) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/transactions/search`
      const token = `Bearer ${accessToken}`

      const response = await axios.post(
        url,
        {
          keyword: searchKey,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      )

      return response.data
    },
  })
}
