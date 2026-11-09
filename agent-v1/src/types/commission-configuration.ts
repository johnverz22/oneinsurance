import { z } from 'zod'

// VAT Options Enum
export const VatOptionsEnum = z.enum(['DEDUCT', 'RETURN', 'VOID', 'WITH_GROSS_VAT'])
export type VatOptions = z.infer<typeof VatOptionsEnum>

// Commission Configuration Schema
export const CommissionConfigurationSchema = z.object({
  id: z.number(),
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
  isWithVAT: z.boolean().optional(),
  vatOptions: VatOptionsEnum.optional(),
  effectivity_date: z.string(),
  status: z.enum(['active', 'inactive']),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  product: z.object({
    id: z.number(),
    name: z.string(),
    category: z.string().optional(),
    code: z.string().optional(),
  }).optional(),
})

// Paginated Commission Configurations Response Schema
export const CommissionConfigurationsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    data: z.array(CommissionConfigurationSchema),
    current_page: z.number(),
    last_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    from: z.number(),
    to: z.number(),
  }),
})

// Single Commission Configuration Response Schema
export const CommissionConfigurationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CommissionConfigurationSchema,
})

// TypeScript Types
export type CommissionConfiguration = z.infer<typeof CommissionConfigurationSchema>
export type CommissionConfigurationsResponse = z.infer<typeof CommissionConfigurationsResponseSchema>
export type CommissionConfigurationResponse = z.infer<typeof CommissionConfigurationResponseSchema>