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
    queryKey: ['agentLOBProducts', agentLOBs?.map(lob => lob.id)],
    queryFn: async () => {
      if (!agentLOBs || agentLOBs.length === 0) {
        return []
      }

      // Fetch products for each LOB
      const productPromises = agentLOBs.map(async (agentLOB) => {
        try {
          const response = await axios.get<LOBProductsResponse>(
            `/api/agent/lobs/${agentLOB.id}/products`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
            }
          )

          // Log the response structure for debugging
          console.log('=== LOB Products API Response ===')
          console.log('LOB ID:', agentLOB.id)
          console.log('LOB Name:', agentLOB.line_of_business?.name)
          console.log('Full Response:', JSON.stringify(response.data, null, 2))
          console.log('Products:', response.data.data.data)
          console.log('================================')

          return response.data.data.data.map(product => {
            // Extract commission rate from either direct field or nested agent_product
            const commissionRate = product.agent_product?.commission_rate || product.commission_rate || '0'
            
            console.log(`Product: ${product.name}`)
            console.log(`  - Commission Rate: ${commissionRate}`)
            console.log(`  - Provider: ${product.provider?.name}`)
            console.log(`  - LOB: ${product.line_of_business?.name || agentLOB.line_of_business?.name}`)
            console.log(`  - Product Details:`, product)
            
            return {
              ...product,
              commission_rate: commissionRate,
              lobName: product.line_of_business?.name || agentLOB.line_of_business?.name,
              lobSlug: product.line_of_business?.slug || agentLOB.line_of_business?.slug,
              providerName: product.provider?.name,
            }
          })
        } catch (error) {
          console.error(`Error fetching products for LOB ${agentLOB.id}:`, error)
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
