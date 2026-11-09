/** Transaction / sale record matching backend Laravel API */
export type Transaction = {
  id: string | number
  policy_number?: string | null
  carrier_policy_no?: string | null
  certificate_number?: string | null
  payment_id?: string | null
  merchant_transaction_id?: string | null
  proposal_number?: string | null
  payment_status?: string
  status?: 'pending' | 'completed' | 'failed' | 'cancelled' | string
  transaction_status?: string
  product?: string | { id?: number; name?: string }
  product_name?: string | null
  plan?: string | null
  plan_name?: string | null
  premium?: number | string
  amount?: number | string
  net_commission?: number | string
  commission_log?: {
    agent_commission?: string | number
    net_commission?: string | number
    gross_commission?: string | number
  } | null
  created_at?: string | null
  transaction_date?: string | null
  customer_id?: number | string | null
  customer_name?: string | null
  policy_details?: string | Record<string, unknown> | null
}

/** Agent statistics summary */
export type AgentStatistics = {
  total_sales?: number
  total_premium?: number
  number_of_sales?: number
  total_cases?: number
  gross_commissions?: number
  net_commissions?: number
  number_of_products?: number
  products_count?: number
  average_payout?: number
  active_policies?: number
  daily_premiums?: Record<string, number>
  product_sales_ranking?: Array<{
    product_id: number
    product_name: string
    total_cases: number
    total_sales: number
  }>
}

/** Sales list API response */
export type SalesListResponse = {
  data: Transaction[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
