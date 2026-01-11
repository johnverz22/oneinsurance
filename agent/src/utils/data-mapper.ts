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

type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S

type Camelize<T> = {
  [K in keyof T as SnakeToCamel<K & string>]: T[K]
}

const snakeToCamel = (str: string) =>
  str.replace(/_([a-z])/g, (_, char) => char.toUpperCase())

export const mapSnakeToCamel = <T extends Record<string, any>>(
  data: T
): Camelize<T> => {
  return Object.keys(data).reduce((acc, key) => {
    const camelKey = snakeToCamel(key)
    acc[camelKey] = data[key]
    return acc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as any)
}
