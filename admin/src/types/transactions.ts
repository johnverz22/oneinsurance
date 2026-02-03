import { z } from 'zod'

// Enhanced Transaction Schema that matches what the agent API returns
export const TransactionSchema = z.object({
  id: z.number(),
  agent_id: z.number().optional(),
  agent_code_used: z.string().optional(),
  proposal_number: z.string().optional(),
  policy_id: z.string().optional(),
  certificate_number: z.string().optional(),
  merchant_transaction_id: z.string().nullable().optional(),
  amount: z.number().or(z.string()).nullable().optional(),
  customer_id: z.number().nullable().optional(),
  customer_name: z.string().optional(), // Enhanced field from agent API
  policy_holder: z.string().optional(), // Enhanced field from agent API
  transaction_status: z.string().nullable().optional(),
  transaction_date: z.string().datetime().nullable().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled', 'active']).optional(),
  plan_name: z.string().optional(),
  plan_type: z.string().optional(),
  premium: z.number().or(z.string()).optional(),
  currency: z.string().optional(),
  coverage_start: z.string().optional(),
  coverage_end: z.string().optional(),
  provider: z.string().optional(),
  policy_details: z.string().optional(), // JSON string with policy details
  commission_log: z.any().optional(), // Commission log data
  agent: z.any().optional(), // Agent data
  gross_commission: z.string().or(z.number()).optional(),
  net_commission: z.string().or(z.number()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable().optional(),
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
export type Transaction = z.infer<typeof TransactionSchema>
export type PaginationLink = z.infer<typeof PaginationLinkSchema>
export type TransactionsData = z.infer<typeof TransactionsDataSchema>
export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>
