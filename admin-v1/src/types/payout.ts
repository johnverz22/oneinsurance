import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'
import { z } from 'zod'

export const PayoutSchema = z.object({
  payout_reference: z.string(),
  agent_id: z.string(),
  agent_name: z.string(),
  payout_amount: z.number(),
  account_type: z.string(),
  account_name: z.string(),
  account_number: z.string(),
  date_from: z.string(),
  date_to: z.string(),
  generated_by: z.string(),
  date_generated: z.string(),
  status: z.string(),
})

export const GetPayoutResponseSchema = z.object({
  count: z.number(),
  payouts: z.array(PayoutSchema),
})

export const GetPayoutFilterByStatusResponseSchema =
  createPaginatedResponseType(PayoutSchema)

export const GeneratePayoutResponseSchema = z.object({
  message: z.string(),
  count: z.number(),
  payouts: z.array(PayoutSchema),
  date_range: z.object({
    from: z.string(),
    to: z.string(),
  }),
})

export const PayoutStatisticsSchema = z.object({
  total_payouts: z.number(),
  total_amount: z.number(),
  pending_count: z.number(),
  completed_count: z.number(),
  pending_amount: z.number(),
  completed_amount: z.number(),
})

export type Payout = z.infer<typeof PayoutSchema>
export type GetPayoutResponse = z.infer<typeof GetPayoutResponseSchema>
export type GetPayoutFilterByStatusResponse = z.infer<
  typeof GetPayoutFilterByStatusResponseSchema
>
export type GeneratePayoutResponse = z.infer<
  typeof GeneratePayoutResponseSchema
>
export type PayoutStatistics = z.infer<typeof PayoutStatisticsSchema>
