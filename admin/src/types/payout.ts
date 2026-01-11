export type Payout = {
  payout_reference: string
  agent_id: string
  agent_name: string
  payout_amount: number
  account_type: string
  account_name: string
  account_number: string
  date_from: string
  date_to: string
  generated_by: string
  date_generated: string
  status: string
}

export type GetPayoutResponse = {
  count: number
  payouts: Payout[]
}
