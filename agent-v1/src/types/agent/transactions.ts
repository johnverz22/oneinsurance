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

// Product Schema
export const ProductSchema = z.object({
  id: z.number(),
  lob_id: z.number(),
  carrier_product_code: z.string(),
  provider_id: z.number(),
  name: z.string(),
  description: z.string(),
  status: z.string(),
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
  plan_name: z.string().nullable(), // New field from API
  product_name: z.string().nullable(), // New field from API
  carrier_product_code: z.string(),
  carrier_policy_no: z.string().nullable().optional(), // Old field (deprecated)
  policy_number: z.string().nullable().optional(), // NEW: Carrier Policy Number (source of truth)
  policy_number_imo: z.string().nullable().optional(), // NEW: IMO Policy Number
  policy_holder: z.string().nullable().optional(), // NEW: Policy Holder full name (source of truth)
  policy_id: z.string(),
  policy_details: z.string().nullable().optional(),
  merchant_transaction_id: z.string().nullable(),
  amount: z.number().or(z.string()).nullable(),
  customer_id: z.number().nullable(),
  customer_name: z.string().nullable().optional(),
  policy_holder_name: z.string().nullable().optional(), // Old field (deprecated)
  transaction_status: z.string().nullable(),
  transaction_date: z.string().datetime().nullable(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  transaction_status_code: z.string().optional(),
  commission_log: CommissionLogSchema.nullable().optional(),
  product: ProductSchema.optional(), // New product object from API
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
export type Product = z.infer<typeof ProductSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type PaginationLink = z.infer<typeof PaginationLinkSchema>
export type TransactionsData = z.infer<typeof TransactionsDataSchema>
export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>
