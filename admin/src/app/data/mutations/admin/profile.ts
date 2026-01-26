import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'

interface UpdateAdminProfileData {
  name: string
  email: string
}

interface UpdateAdminProfileParams {
  id: number
  data: UpdateAdminProfileData
}

interface UploadAdminProfilePhotoParams {
  id: number
  file: File
}

// Helper function to split full name into first and last name
const splitName = (fullName: string) => {
  const nameParts = fullName.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  return { firstName, lastName }
}

// Update admin profile
export const useUpdateAdminProfile = () => {
  const queryClient = useQueryClient()
  const { getAuthToken, updateUser, user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ id, data }: UpdateAdminProfileParams) => {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Split the name into first_name and last_name as expected by the backend
      const { firstName, lastName } = splitName(data.name)
      
      // Prepare data in the format expected by the backend API (from Postman collection)
      const backendData = {
        id: id, // Include user ID for the API route
        first_name: firstName,
        last_name: lastName,
        email: data.email,
        // Include existing fields to avoid overwriting them
        designation: user?.designation || 'Admin' // Keep existing designation
      }

      console.log('Attempting to update admin profile with data:', backendData)

      const response = await axios.put(`/api/admin/profile`, backendData, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Profile update successful:', response.data)
      return response.data
    },
    onSuccess: (response, variables) => {
      console.log('Profile update successful:', response)
      
      // Update the local store with the new data
      updateUser({
        name: variables.data.name,
        email: variables.data.email
      })
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] })
    },
    onError: (error: any) => {
      console.error('Update admin profile error:', error)
      throw error
    },
  })
}

// Upload admin profile photo
export const useUploadAdminProfilePhoto = () => {
  const queryClient = useQueryClient()
  const { getAuthToken, updateUser } = useAuthStore()

  return useMutation({
    mutationFn: async ({ id, file }: UploadAdminProfilePhotoParams) => {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const formData = new FormData()
      formData.append('profile_photo', file)

      const response = await axios.post(`/api/admin/users/${id}/photo`, formData, {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data',
        },
      })

      // Update user in store with new photo URL
      if (response.data?.profile_photo_url) {
        updateUser({ profile_photo_url: response.data.profile_photo_url })
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] })
    },
    onError: (error: any) => {
      console.error('Upload admin profile photo error:', error)
      throw error
    },
  })
}

// Delete admin profile photo
export const useDeleteAdminProfilePhoto = () => {
  const queryClient = useQueryClient()
  const { getAuthToken, updateUser } = useAuthStore()

  return useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await axios.delete(`/api/admin/users/${id}/photo`, {
        headers: {
          Authorization: token,
        },
      })

      // Update user in store to remove photo URL
      updateUser({ profile_photo_url: null })

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] })
    },
    onError: (error: any) => {
      console.error('Delete admin profile photo error:', error)
      throw error
    },
  })
}