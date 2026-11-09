// commission collection

import { z } from 'zod'
import { ProductSchema } from './products'
import { AgentSchema } from './agents'
import { ProviderSchema } from './provider'
import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'

export const CommissionLogs = z.object({
  id: z.number(),
  agent_id: z.number(),
  product_id: z.number(),
  provider_id: z.number(),
  case_count: z.number(),
  total_net_premium: z.string(),
  product_price: z.string(),
  commission_rate: z.string(),
  gross_commission: z.string(),
  vat_percentage: z.string(),
  vat_amount: z.string(),
  withholding_tax_percentage: z.string(),
  withholding_tax_amount: z.string(),
  net_commission: z.string(),
  is_included_in_payout: z.boolean(),
  payout_id: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  agent: AgentSchema,
  product: ProductSchema,
  provider: ProviderSchema,
})

export type CommissionLogs = z.infer<typeof CommissionLogs>

export const CommissionLogsPaginatedResponseSchema =
  createPaginatedResponseType<CommissionLogs>(CommissionLogs)
export type CommissionLogsPaginatedResponse = z.infer<
  typeof CommissionLogsPaginatedResponseSchema
>
