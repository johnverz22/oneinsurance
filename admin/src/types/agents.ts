import { z } from 'zod'

import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'
import { ProviderSchema } from '@/types/provider'
import { LineOfBusinessSchema } from './line-of-business'
import { createResponseSchema } from './base-api-response'

export const AgentSchema = z.object({
  id: z.number(),
  company_id: z.number().nullable(),
  role: z.number(),
  username: z.string().nullable(),
  first_name: z.string(),
  middle_name: z.string().nullable(),
  last_name: z.string(),
  designation: z.string().nullable(),
  job_description: z.string().nullable(),
  avatar: z.string().nullable(),
  email: z.string().email(),
  email_verified_at: z.string().nullable(),
  status: z.string(),
  phone: z.string().nullable(),
  phone_verified_at: z.string().nullable(),
  phone_description: z.string().nullable(),
  telephone: z.string().nullable(),
  address: z.string().nullable(),
  is_super_admin: z.number(),
  birth_date: z.string().nullable(),
  agent_code: z.string().nullable().optional(), // Add agent_code field
  code: z.string().nullable().optional(), // Alternative agent code field
  name: z.string().nullable().optional(), // Add name field for display
  profile_photo_url: z.string().nullable().optional(), // Add profile photo field
  referral_code: z.string().nullable().optional(), // Add referral code field
  created_at: z.string(),
  updated_at: z.string(),
})

export const PaginationLinkSchema = z.object({
  url: z.string().nullable(),
  label: z.string(),
  active: z.boolean(),
})

export const AgentsDataSchema = z.object({
  current_page: z.number(),
  data: z.array(AgentSchema),
  first_page_url: z.string(),
  from: z.number().nullable(),
  last_page: z.number(),
  last_page_url: z.string(),
  links: z.array(PaginationLinkSchema),
  next_page_url: z.string().nullable(),
  path: z.string(),
  per_page: z.number(),
  prev_page_url: z.string().nullable(),
  to: z.number().nullable(),
  total: z.number(),
})

export const AgentsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: AgentsDataSchema,
})

export type Agent = z.infer<typeof AgentSchema>
export type AgentsData = z.infer<typeof AgentsDataSchema>
export type AgentsResponse = z.infer<typeof AgentsResponseSchema>

export default Agent

export const ProductSchema = z.object({
  id: z.string().or(z.number()),
  provider_id: z.number(),
  lob_id: z.number().nullable().optional(),
  carrier_product_code: z.string().nullable().optional(),
  name: z.string(),
  description: z.string(),
  price: z.number().optional(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  provider: ProviderSchema,
  line_of_business: LineOfBusinessSchema.nullable().optional(),
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

export const ProductCommisionInfoSchema = z.object({
  product: ProductSchema,
  commission_rate: z.string(),
  commission_status: z.string(),
  commission_id: z.number(),
})
export type ProductCommissionInfo = z.infer<typeof ProductCommisionInfoSchema>

export const AgentProductAssignmentSchema = z.object({
  agent: AgentSchema,
  products: z.array(ProductCommisionInfoSchema),
})
export type AgentProductAssignment = z.infer<
  typeof AgentProductAssignmentSchema
>

export type AssignProductAgentPayload = {
  agent_id: number
  product_id: number
  commission_rate: number
  status: string
}

export const AgentLineOfBusinessSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  lob_id: z.number(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  agent: AgentSchema,
  line_of_business: LineOfBusinessSchema,
})

export type AgentLineOfBusiness = z.infer<typeof AgentLineOfBusinessSchema>
export const AgentLineOfBusinessPaginatedResponseSchema =
  createPaginatedResponseType<AgentLineOfBusiness>(AgentLineOfBusinessSchema)
export type AgentLineOfBusinessPaginatedResponse = z.infer<
  typeof AgentLineOfBusinessPaginatedResponseSchema
>

export const AssignLobAgentPayloadFormSchema = z.object({
  agent_id: z.number({ message: 'Agent ID is required' }),
  lob_id: z.number({ message: 'Line of Business ID is required' }),
  status: z.enum(['active', 'inactive'], {
    required_error: 'Status is required',
  }),
})
export type AssignLobAgentRequest = z.infer<
  typeof AssignLobAgentPayloadFormSchema
>
export const AgentLineOfBusinessResponseSchema = createResponseSchema(
  AgentLineOfBusinessSchema
)
export type AgentLineOfBusinessResponse = z.infer<
  typeof AgentLineOfBusinessResponseSchema
>
