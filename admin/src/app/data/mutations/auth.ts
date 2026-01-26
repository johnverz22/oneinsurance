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
        // Use internal API route instead of direct external call
        const url = `/api/admin/auth/login`
        
        console.log('Admin login URL:', url)
        console.log('Login data:', data)
        
        const response = await axios.post<LoginResponse>(url, data)
        return response.data
      } catch (error) {
        console.error('Admin login error:', error)
        handleApiError(error)
      }
    },
  })
}

export function useLogoutAdmin() {
  const { getAuthToken, logout } = useAuthStore()

  return useMutation({
    mutationKey: ['logout-admin'],
    mutationFn: async () => {
      try {
        const url = `/api/admin/auth/logout`
        const token = getAuthToken()

        console.log('Admin logout mutation - Starting logout')
        console.log('Admin logout mutation - Token:', token ? 'present' : 'missing')

        if (token) {
          const response = await axios.post(url, null, {
            headers: {
              Authorization: token,
            },
          })

          console.log('Admin logout mutation - API response:', response.status)
          
          if (response.status !== 200) {
            throw new Error('Failed to logout from server')
          }
        } else {
          console.log('Admin logout mutation - No token, skipping API call')
        }

        // Always clear local auth state regardless of API success
        console.log('Admin logout mutation - Clearing local storage')
        removeLocalStorage('admin-auth-storage')
        
        // Clear the auth store
        console.log('Admin logout mutation - Clearing auth store')
        logout()

      } catch (error) {
        console.error('Admin logout mutation - Error:', error)
        
        // Even if API call fails, clear local state
        console.log('Admin logout mutation - API failed, clearing local state anyway')
        removeLocalStorage('admin-auth-storage')
        logout()
        
        // Don't throw the error - we want logout to always succeed locally
        console.log('Admin logout mutation - Local logout completed despite API error')
      }
    },
  })
}
