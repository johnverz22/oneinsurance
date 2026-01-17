import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'
import { z } from 'zod'

import { ProviderSchema } from '@/types/provider'
import { AgentSchema } from '@/types/agents'
import { createResponseSchema } from './base-api-response'
import { LineOfBusinessSchema } from './line-of-business'

export const ProductSchema = z.object({
  id: z.string().or(z.number()),
  provider_id: z.number(),
  lob_id: z.number().nullable(),
  name: z.string(),
  description: z.string(),
  price: z.number().optional(),
  status: z.string(),
  carrier_product_code: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  provider: ProviderSchema,
  line_of_business: LineOfBusinessSchema.nullable(),
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

export const CreateProductRequestSchema = z.object({
  carrier_product_code: z.string(),
  provider_id: z.number(),
  lob_id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  status: z.string(),
})
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>

export const CreateProductResponseSchema = createResponseSchema(ProductSchema)
export type CreateProductResponse = z.infer<typeof CreateProductResponseSchema>
