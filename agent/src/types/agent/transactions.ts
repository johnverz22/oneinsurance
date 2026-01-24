import { z } from 'zod'

// Commission Log Schema
export const CommissionLogSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  product_id: z.number(),
  provider_id: z.number(),
  transaction_id: z.number(),
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
  base_commission: z.string(),
  agent_commission: z.string(),
  agent_overrider_commission: z.string(),
  agent_admin_commission: z.string(),
  agent_admin_overrider_commission: z.string(),
  referral_commission: z.string(),
  referral_overrider_commission: z.string(),
  referral_admin_commission: z.string(),
  referral_admin_overrider_commission: z.string(),
  is_included_in_payout: z.boolean(),
  payout_id: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
})

// Transaction Schema
export const TransactionSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent_code_used: z.string(),
  proposal_number: z.string(),
  policy_id: z.string(),
  merchant_transaction_id: z.string().nullable(),
  amount: z.number().or(z.string()).nullable(),
  customer_id: z.number().nullable(),
  customer_name: z.string().nullable().optional(), // Add customer name field
  transaction_status: z.string().nullable(),
  transaction_date: z.string().datetime().nullable(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  commission_log: CommissionLogSchema.nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
})

// Pagination Link Schema
export const PaginationLinkSchema = z.object({
  url: z.string().url().nullable(),
  label: z.string(),
  active: z.boolean(),
})

// Transactions Data Schema
export const TransactionsDataSchema = z.object({
  current_page: z.number(),
  data: z.array(TransactionSchema),
  first_page_url: z.string().url(),
  from: z.number(),
  last_page: z.number(),
  last_page_url: z.string().url(),
  links: z.array(PaginationLinkSchema),
  next_page_url: z.string().url().nullable(),
  path: z.string().url(),
  per_page: z.number(),
  prev_page_url: z.string().url().nullable(),
  to: z.number(),
  total: z.number(),
})

// Full Response Schema
export const TransactionsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: TransactionsDataSchema,
})

// TypeScript Types derived from Zod schemas
export type CommissionLog = z.infer<typeof CommissionLogSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type PaginationLink = z.infer<typeof PaginationLinkSchema>
export type TransactionsData = z.infer<typeof TransactionsDataSchema>
export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>
