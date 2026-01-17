import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import { Login, LoginResponse } from '@/types/auth'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { useAuthStore } from '@/store/auth-store'
import { handleApiError } from '@/utils/handle-api-error'

export function useLoginAdmin() {
  return useMutation({
    mutationKey: ['login-admin'],
    mutationFn: async ({ data }: { data: Login }) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/login`
        const response = await axios.post<LoginResponse>(url, data)
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}

export function useLogoutAdmin() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['logout-admin'],
    mutationFn: async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/logout`

        const response = await axios.post(url, null, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (response.status !== 200) {
          throw new Error('Failed to logout')
        }
        // Clear local auth state/storage
        removeLocalStorage('admin-auth-storage')

      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
