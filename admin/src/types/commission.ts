import { z } from 'zod'
import { ProductSchema } from './products'
import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'
import { createResponseSchema } from './base-api-response'

// VAT Options Enum
export const VatOptionsEnum = z.enum(['DEDUCT', 'RETURN', 'VOID', 'WITH_GROSS_VAT'])
export type VatOptions = z.infer<typeof VatOptionsEnum>

export const CommissionConfigSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  base_commission: z.string(),
  agent_commission: z.string(),
  // Backend might return either old or new field names
  agent_overrider_commission: z.string().optional(),
  agent_overriders_commission: z.string().optional(),
  agent_admin_commission: z.string().optional(),
  ifrc_admin: z.string().optional(),
  agent_admin_overrider_commission: z.string().optional(),
  ifrc_overrider_commission: z.string().optional(),
  referral_commission: z.string().optional(),
  ifrc_digitech: z.string().optional(),
  referral_overrider_commission: z.string().optional(),
  digitech_referral: z.string().optional(),
  referral_admin_commission: z.string().optional(),
  digitech_overriders: z.string().optional(),
  referral_admin_overrider_commission: z.string().optional(),
  vat: z.string().optional(),
  witholding_tax: z.string().optional(),
  gross_vat: z.string().optional(),
  isWithVAT: z.boolean().optional(),
  vatOptions: VatOptionsEnum.optional(),
  effectivity_date: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  product: ProductSchema,
})

export type CommissionConfig = z.infer<typeof CommissionConfigSchema>

export const CommissionConfigPaginatedResponseSchema =
  createPaginatedResponseType<CommissionConfig>(CommissionConfigSchema)
export type CommissionConfigPaginatedResponse = z.infer<
  typeof CommissionConfigPaginatedResponseSchema
>

export const CommissionConfigUpdateRequestSchema = z.object({
  base_commission: z.number(),
  agent_commission: z.number(),
  agent_overrider_commission: z.number(),
  agent_admin_commission: z.number(),
  agent_admin_overrider_commission: z.number(),
  referral_commission: z.number(),
  referral_overrider_commission: z.number(),
  referral_admin_commission: z.number(),
  referral_admin_overrider_commission: z.number(),
  vat: z.number(),
  witholding_tax: z.number(),
  gross_vat: z.number().optional(),
  isWithVAT: z.boolean().optional(),
  vatOptions: VatOptionsEnum,
  effectivity_date: z.string(),
  status: z.string(),
})

export type CommissionConfigUpdateRequest = z.infer<
  typeof CommissionConfigUpdateRequestSchema
>
export const CommissionConfigUpdateResponseSchema = createResponseSchema(
  CommissionConfigSchema
)
export type CommissionConfigUpdateResponse = z.infer<
  typeof CommissionConfigUpdateResponseSchema
>

export const CreateCommitionConfigRequestSchema = z.object({
  product_id: z.number(),
  base_commission: z.number(),
  agent_commission: z.number(),
  agent_overrider_commission: z.number(),
  agent_admin_commission: z.number(),
  agent_admin_overrider_commission: z.number(),
  referral_commission: z.number(),
  referral_overrider_commission: z.number(),
  referral_admin_commission: z.number(),
  referral_admin_overrider_commission: z.number(),
  vat: z.number(),
  witholding_tax: z.number(),
  gross_vat: z.number().optional(),
  vatOptions: VatOptionsEnum,
  effectivity_date: z.string(),
  status: z.string(),
})
export type CreateCommitionConfigRequest = z.infer<
  typeof CreateCommitionConfigRequestSchema
>

export const CreateCommitionConfigResponseSchema = createResponseSchema(
  CommissionConfigSchema
)
export type CreateCommitionConfigResponse = z.infer<
  typeof CreateCommitionConfigResponseSchema
>
