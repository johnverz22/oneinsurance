import { z } from 'zod'

import { AgentSchema } from '@/types/agents'
import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'

export const ProviderSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  contact_email: z.string(),
  contact_phone: z.string(),
  address: z.string(),
  website: z.string().url(),
  logo: z.string().url().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
})

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

export const AgentProductSchema = z.object({
  id: z.number(),
  agen_id: z.number(),
  product_id: z.string().or(z.number()),
  commission_rate: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  product: ProductSchema,
  agent: AgentSchema,
})

export type AgentProduct = z.infer<typeof AgentProductSchema>

export const AgentProductPaginatedResponseSchema =
  createPaginatedResponseType<AgentProduct>(AgentProductSchema)
export type AgentProductPaginatedResponse = z.infer<
  typeof AgentProductPaginatedResponseSchema
>
