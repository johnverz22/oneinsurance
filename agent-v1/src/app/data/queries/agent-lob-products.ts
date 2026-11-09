import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useGetAgentLOBs } from './agent-lobs'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

type LOBProduct = {
  id: number
  carrier_product_code: string
  provider_id: number
  lob_id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  commission_rate?: string | number
  agent_product?: {
    id: number
    agent_id: number
    product_id: number
    commission_rate: string
    status: string
  }
  commission_configurations?: Array<{
    id: number
    product_id: number
    base_commission: string
    agent_commission: string
    agent_overrider_commission: string
    agent_admin_commission: string
    agent_admin_overrider_commission: string
    referral_commission: string
    referral_overrider_commission: string
    referral_admin_commission: string
    referral_admin_overrider_commission: string
    vat: string
    witholding_tax: string
    gross_vat: string
    vatOptions: string
    effectivity_date: string
    status: string
    created_at: string
    updated_at: string
    deleted_at: string | null
  }>
  provider?: {
    id: number
    name: string
    description: string
    contact_email: string
    contact_phone: string
    address: string
    website: string
    logo: string | null
    status: string
  }
  line_of_business?: {
    id: number
    name: string
    slug: string
    description: string
    status: string
  }
}

type LOBProductsResponse = {
  success: boolean
  message: string
  data: {
    data: LOBProduct[]
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export function useGetAgentLOBProducts() {
  const { accessToken } = useAgentAuthStore()
  const { data: agentLOBs, isLoading: isLOBsLoading } = useGetAgentLOBs('active')

  return useQuery({
    queryKey: ['agentLOBProducts', agentLOBs?.map(lob => lob.lob_id)],
    queryFn: async () => {
      if (!agentLOBs || agentLOBs.length === 0) {
        return []
      }

      // Fetch products for each LOB
      const productPromises = agentLOBs.map(async (agentLOB) => {
        try {
          const response = await axios.get<LOBProductsResponse>(
            `/api/agent/lobs/${agentLOB.lob_id}/products`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
            }
          )

          return response.data.data.data.map(product => {
            // Extract commission rate from either direct field or nested agent_product
            const commissionRate = product.agent_product?.commission_rate || product.commission_rate || '0'

            // Extract agent commission from commission_configurations (most recent active config)
            const activeConfig = product.commission_configurations?.find(c => c.status === 'active')
              ?? product.commission_configurations?.[0]
            const agentCommission = activeConfig?.agent_commission ?? null

            return {
              ...product,
              commission_rate: commissionRate,
              agentCommission,
              lobName: product.line_of_business?.name || agentLOB.line_of_business?.name,
              lobSlug: product.line_of_business?.slug || agentLOB.line_of_business?.slug,
              providerName: product.provider?.name,
            }
          })
        } catch (error) {
          console.error(`Error fetching products for LOB ID ${agentLOB.lob_id}:`, error)
          return []
        }
      })

      const productsArrays = await Promise.all(productPromises)
      const allProducts = productsArrays.flat()

      return allProducts
    },
    enabled: !!accessToken && !isLOBsLoading && !!agentLOBs && agentLOBs.length > 0,
    retry: false,
  })
}
