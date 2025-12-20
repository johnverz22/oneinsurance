import { Product } from '@/types/agent/product'
import { AgentProduct } from '@/types/products'

export function mapAgentProductToMappedProduct(input: AgentProduct): Product {
  const code = `P-${String(input.product_id).padStart(3, '0')}`

  const link = `products/${input.product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

  const status = input.status.charAt(0).toUpperCase() + input.status.slice(1)

  return {
    code,
    description: input.product.name,
    commissionRate: parseFloat(input.commission_rate ?? 0),
    status: status as any,
    link,
  }
}
