import { useAuthStore } from '@/store/auth-store'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { handleApiError } from '@/utils/handle-api-error'

export function useSendInvitation() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['send-invitation'],
    mutationFn: async ({
      email,
      role = 'agent',
      invitation_url,
    }: {
      email: string
      role?: string
      invitation_url: string
    }) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/invitations`
        const response = await axios.post(
          url,
          { email, role, invitation_url },
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
  })
}

export function useCancelInvitation() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['cancel-invitation'],
    mutationFn: async (invitationId: number) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/invitations/${invitationId}`
        const response = await axios.delete(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}

export function useResendInvitation() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['resend-invitation'],
    mutationFn: async (invitationId: number) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/invitations/${invitationId}/resend`
        const response = await axios.post(
          url,
          {},
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
  })
}
