import { AxiosError } from 'axios'
import { toast } from 'sonner'

/**
 * Handles API errors, specifically checking for unauthorized (401) responses
 * and logging out the user if the session has expired
 */
export function handleApiError(error: unknown): never {
  if (error instanceof AxiosError) {
    // Check for 401 Unauthorized response
    if (error.response?.status === 401) {
      // Clear the auth storage
      localStorage.removeItem('admin-auth-storage')
      
      // Show alert to user
      toast.error('Session expired. Please login again.', {
        duration: 5000,
      })
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    }
  }
  
  // Re-throw the error so it can be handled by the caller if needed
  throw error
}
