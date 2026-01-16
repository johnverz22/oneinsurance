import { useAuthStore } from '@/store/auth-store'
import { Invitation, InvitationPaginatedResponse } from '@/types/invitation'
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

export function useGetInvitationByEmail(email: string) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['invitation-by-email', email],
    queryFn: async () => {
      const token = `Bearer ${accessToken}`
      try {
        // Fetch all invitations by requesting a large per_page value
        // This ensures we don't miss any invitations
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/invitations?page=1&per_page=10000`
        const response = await axios.get<InvitationPaginatedResponse>(url, {
          headers: { Authorization: token },
        })

        // Find invitation by email (case-insensitive comparison)
        const invitation = response.data.data?.data.find(
          (inv) => inv.email.toLowerCase() === email.toLowerCase()
        )
        return invitation || null
      } catch (error) {
        handleApiError(error)
        return null
      }
    },
    enabled: !!accessToken && !!email,
    refetchOnWindowFocus: false,
  })
}
