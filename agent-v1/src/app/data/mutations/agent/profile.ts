import { api } from '@/lib/axios'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface UpdateProfileData {
  name: string
  email: string
  phone: string
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const updateUser = useAgentAuthStore((state) => state.updateUser)
  const user = useAgentAuthStore((state) => state.user)
  
  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      // Use fetch instead of axios to bypass the interceptor
      const { accessToken } = useAgentAuthStore.getState()
      
      if (!user?.id) {
        throw new Error('User ID not found')
      }
      
      const response = await fetch('/api/agent/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...data
        }),
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update profile')
      }
      
      return responseData
    },
    onSuccess: async (responseData, variables) => {
      // Update the user data in the auth store
      updateUser({
        name: variables.name,
        email: variables.email,
        phone: variables.phone,
      })
      
      // Invalidate any profile-related queries
      await queryClient.invalidateQueries({ queryKey: ['agent-profile'] })
    },
  })
}

export const useUploadProfilePhoto = () => {
  const queryClient = useQueryClient()
  const updateUser = useAgentAuthStore((state) => state.updateUser)
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('photo', file)
      
      // Use fetch instead of axios to bypass the interceptor
      const { accessToken } = useAgentAuthStore.getState()
      
      const response = await fetch('/api/agent/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload photo')
      }
      
      const data = await response.json()
      return data
    },
    onSuccess: async (responseData) => {
      // Update the user's profile photo URL in the auth store
      if (responseData?.data?.profile_photo_url) {
        updateUser({
          profile_photo_url: responseData.data.profile_photo_url
        })
      }
      
      await queryClient.invalidateQueries({ queryKey: ['agent-profile'] })
    },
  })
}

export const useDeleteProfilePhoto = () => {
  const queryClient = useQueryClient()
  const updateUser = useAgentAuthStore((state) => state.updateUser)
  
  return useMutation({
    mutationFn: async () => {
      // Use fetch instead of axios to bypass the interceptor
      const { accessToken } = useAgentAuthStore.getState()
      
      const response = await fetch('/api/agent/profile/photo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete photo')
      }
      
      const data = await response.json()
      return data
    },
    onSuccess: async () => {
      // Clear the user's profile photo URL in the auth store
      updateUser({
        profile_photo_url: null
      })
      
      await queryClient.invalidateQueries({ queryKey: ['agent-profile'] })
    },
  })
}