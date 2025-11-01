import { z } from 'zod'

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
  transaction_status: z.string().nullable(),
  transaction_date: z.string().datetime().nullable(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
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
export type Transaction = z.infer<typeof TransactionSchema>
export type PaginationLink = z.infer<typeof PaginationLinkSchema>
export type TransactionsData = z.infer<typeof TransactionsDataSchema>
export type TransactionsResponse = z.infer<typeof TransactionsResponseSchema>
