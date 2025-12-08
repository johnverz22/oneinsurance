import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'
import { z } from 'zod'

import { ProviderSchema } from '@/types/provider'
import { AgentSchema } from '@/types/agents'

export const ProductSchema = z.object({
  id: z.string().or(z.number()),
  provider_id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  provider: ProviderSchema,
})

export type Product = z.infer<typeof ProductSchema>

export const ProductsPaginatedResponseSchema =
  createPaginatedResponseType<Product>(ProductSchema)
export type ProductsPaginatedResponse = z.infer<
  typeof ProductsPaginatedResponseSchema
>

export const ProductAssignmentSchema = z.object({
  product: ProductSchema,
  provider: ProviderSchema,
  agents: z.array(AgentSchema),
  commission_rate: z.string(),
  status: z.string(),
  price: z.string(),
})
export type ProductAssignment = z.infer<typeof ProductAssignmentSchema>
