import { useAuthStore } from '@/store/auth-store'
import { InterviewPaginatedResponse } from '@/types/interview'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { headers } from 'next/headers'
import { handleApiError } from '@/utils/handle-api-error'

export function useGetInterviews(page: number = 1) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['interviews', page],
    queryFn: async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/interviews?page=${page}`
        const token = `Bearer ${accessToken}`
        const response = await axios.get<InterviewPaginatedResponse>(url, {
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
    staleTime: 5 * 60 * 1000,
  })
}
