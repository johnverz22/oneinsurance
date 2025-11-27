import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'
import { z } from 'zod'

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

export type Product = z.infer<typeof ProductSchema>

export const ProductsPaginatedResponseSchema =
  createPaginatedResponseType<Product>(ProductSchema)
export type ProductsPaginatedResponse = z.infer<
  typeof ProductsPaginatedResponseSchema
>
