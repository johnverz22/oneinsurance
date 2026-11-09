import { useState, useEffect } from 'react'
import { PolicyApiResponse, PolicyApiResponseSchema } from '@/types/policy'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { toast } from 'sonner'

export function usePolicy(policyId: string) {
  const [policy, setPolicy] = useState<PolicyApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const getAuthToken = useAgentAuthStore((state) => state.getAuthToken)
  const isAuthenticated = useAgentAuthStore((state) => state.isAuthenticated)

  const fetchPolicy = async () => {
    if (!policyId) return

    try {
      setIsLoading(true)
      setError(null)

      if (!isAuthenticated) {
        throw new Error('Not authenticated')
      }

      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/policies/${policyId}`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Validate the response data with better error handling
      try {
        const validatedData = PolicyApiResponseSchema.parse(data)
        setPolicy(validatedData)
      } catch (validationError) {
        console.warn('Policy data validation failed, using raw data:', validationError)
        
        // If validation fails, create a compatible structure manually
        const fallbackPolicy: PolicyApiResponse = {
          success: data.success || true,
          message: data.message || 'Policy retrieved successfully',
          data: {
            id: data.data?.id || parseInt(policyId),
            agent_id: data.data?.agent_id || 0,
            agent_code_used: data.data?.agent_code_used || '',
            proposal_number: data.data?.proposal_number || '',
            carrier_product_code: data.data?.carrier_product_code || 'PHTRAVEL',
            policy_id: data.data?.policy_id || '',
            policy_number: data.data?.policy_number || null,
            policy_details: data.data?.policy_details || null, // Preserve policy_details with PolicyCustomerList
            merchant_transaction_id: data.data?.merchant_transaction_id || null,
            amount: data.data?.amount ? (typeof data.data.amount === 'string' ? parseFloat(data.data.amount) : data.data.amount) : null,
            payment_brand: data.data?.payment_brand || null,
            payment_method: data.data?.payment_method || null,
            customer_id: data.data?.customer_id || null,
            customer_name: data.data?.customer_name || null, // Add customer name
            transaction_status: data.data?.transaction_status || null,
            transaction_date: data.data?.transaction_date || null,
            status: data.data?.status || 'unknown',
            transaction_status_code: data.data?.transaction_status_code || null,
            created_at: data.data?.created_at || new Date().toISOString(),
            updated_at: data.data?.updated_at || new Date().toISOString(),
            deleted_at: data.data?.deleted_at || null,
            commission_log: data.data?.commission_log || null,
          }
        }
        
        setPolicy(fallbackPolicy)
      }
    } catch (err) {
      console.error('Error fetching policy:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch policy details'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && policyId) {
      fetchPolicy()
    }
  }, [policyId, isAuthenticated])

  return { policy, isLoading, error, refetch: fetchPolicy }
}