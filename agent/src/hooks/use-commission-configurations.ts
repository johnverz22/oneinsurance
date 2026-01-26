import { useState, useEffect } from 'react'
import { CommissionConfigurationsResponse, CommissionConfigurationsResponseSchema } from '@/types/commission-configuration'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { toast } from 'sonner'

interface UseCommissionConfigurationsOptions {
  product_id?: number
  status?: 'active' | 'inactive'
  sort_by?: 'created_at' | 'effectivity_date' | 'base_commission'
  sort_order?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

export function useCommissionConfigurations(options: UseCommissionConfigurationsOptions = {}) {
  const [data, setData] = useState<CommissionConfigurationsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const getAuthToken = useAgentAuthStore((state) => state.getAuthToken)
  const isAuthenticated = useAgentAuthStore((state) => state.isAuthenticated)

  const fetchCommissionConfigurations = async () => {
    if (!isAuthenticated) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Build query parameters
      const params = new URLSearchParams()
      if (options.product_id) params.append('product_id', options.product_id.toString())
      if (options.status) params.append('status', options.status)
      if (options.sort_by) params.append('sort_by', options.sort_by)
      if (options.sort_order) params.append('sort_order', options.sort_order)
      if (options.per_page) params.append('per_page', options.per_page.toString())
      if (options.page) params.append('page', options.page.toString())

      const url = `/api/agent/commission-configurations${params.toString() ? `?${params.toString()}` : ''}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      
      // Validate the response data
      try {
        const validatedData = CommissionConfigurationsResponseSchema.parse(responseData)
        setData(validatedData)
      } catch (validationError) {
        console.warn('Commission configurations data validation failed:', validationError)
        // Use raw data if validation fails
        setData(responseData)
      }
    } catch (err) {
      console.error('Error fetching commission configurations:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch commission configurations'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchCommissionConfigurations()
    }
  }, [isAuthenticated, options.product_id, options.status, options.sort_by, options.sort_order, options.per_page, options.page])

  return { 
    data, 
    isLoading, 
    error, 
    refetch: fetchCommissionConfigurations 
  }
}