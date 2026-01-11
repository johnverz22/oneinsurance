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

export type Payout = z.infer<typeof PayoutSchema>
export type GetPayoutResponse = z.infer<typeof GetPayoutResponseSchema>
export type GetPayoutFilterByStatusResponse = z.infer<
  typeof GetPayoutFilterByStatusResponseSchema
>
