import { useAuthStore } from '@/store/auth-store'
import { InvitationPaginatedResponse } from '@/types/invitation'
import { handleApiError } from '@/utils/handle-api-error'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

type useGetInviatationsParams = {
  page?: number
  per_page?: number
}

export function useGetInviatations({
  page = 1,
  per_page = 15,
}: useGetInviatationsParams) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['invitations', page, per_page],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/invitations?page=${page}&per_page=${per_page}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get<InvitationPaginatedResponse>(url, {
          headers: { Authorization: token },
        })

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
  })
}
