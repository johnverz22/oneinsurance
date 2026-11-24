/** Transaction / sale record matching backend Laravel API (agents/transactions) */
export type Transaction = {
  id: string | number
  agent_id?: number | string | null
  agent_code_used?: string | null
  policy_number?: string | null
  certificate_number?: string | null
  proposal_number?: string | null
  policy_id?: number | string | null
  policy_holder?: string | null
  insurer_name?: string | null
  carrier_product_code?: string | null
  merchant_transaction_id?: string | null
  /** Sale progress: pending | completed */
  status?: string
  /** Payment result, e.g. PAID, UNDERPAID. Empty until payment notification. */
  transaction_status?: string | null
  transaction_status_code?: string | null
  /** Catalog product object or null (e.g. null for travel). Do not display. */
  product?: { id?: number; name?: string } | null
  product_name?: string | null
  line_of_business?: string | null
  plan_name?: string | null
  /** Money values are strings, e.g. "1500.00" */
  amount?: number | string | null
  paid_amount?: number | string | null
  currency?: string | null
  payment_brand?: string | null
  /** Null until a commission has been logged for the sale */
  net_commission?: number | string | null
  commission_log?: {
    agent_commission?: string | number
    net_commission?: string | number
    gross_commission?: string | number
  } | null
  customer_id?: number | string | null
  /** ISO 8601 UTC, e.g. "2026-10-13T10:00:00.000000Z" */
  created_at?: string | null
  updated_at?: string | null
  /** Plain "YYYY-MM-DD HH:MM:SS" in server timezone — no T or Z */
  transaction_date?: string | null

  // ── Legacy fields (not returned by the updated agents/transactions list) ──
  /** @deprecated use merchant_transaction_id */
  payment_id?: string | null
  /** @deprecated use amount */
  premium?: number | string | null
  /** @deprecated use transaction_status for payment result */
  payment_status?: string
  carrier_policy_no?: string | null
  plan?: string | null
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
    product_id: number | null
    product_name: string | null
    total_cases: number
    total_sales: number
  }>
}

/** Laravel paginator page info — returned directly on `data`, no `meta` wrapper */
export type PaginationInfo = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/** GET /agents/transactions response: { success, message, data: paginator } */
export type SalesListResponse = {
  success?: boolean
  message?: string
  data: PaginationInfo & {
    data: Transaction[]
    next_page_url?: string | null
    prev_page_url?: string | null
  }
}
