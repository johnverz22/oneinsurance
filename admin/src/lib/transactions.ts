export type Transaction = {
  id: number
  agent_id?: number | null
  agent_code_used?: string | null
  policy_number?: string | null
  policy_number_imo?: string | null
  proposal_number?: string | null
  certificate_number?: string | null
  merchant_transaction_id?: string | null
  payment_id?: string | null
  payment_brand?: string | null
  payment_method?: string | null
  policy_holder?: string | null
  customer_name?: string | null
  client_email?: string | null
  client_phone?: string | null
  plan_name?: string | null
  plan?: string | null
  product_name?: string | null
  line_of_business?: string | null
  carrier_product_code?: string | null
  insurer_name?: string | null
  premium?: string | number | null
  amount?: string | number | null
  paid_amount?: string | number | null
  gross_commission?: string | number | null
  net_commission?: string | number | null
  commission_log?: { net_commission?: string | number | null } | null
  currency?: string | null
  status?: string | null
  transaction_status?: string | null
  transaction_status_code?: string | null
  transaction_date?: string | null
  coverage_start?: string | null
  coverage_end?: string | null
  created_at?: string | null
  policy_details?: string | Record<string, unknown> | null
  product?: { name?: string | null } | null
  agent?: { name?: string | null; code?: string | null } | null
}

/** Normalized display status: Successful / Rejected / Pending. */
export function txStatus(tx: Transaction): string {
  const status = (tx.status ?? '').toLowerCase()
  const txStatus = (tx.transaction_status ?? '').toLowerCase()
  if (status === 'completed' || status === 'successful' || txStatus === 'paid') {
    return 'Successful'
  }
  if (
    ['failed', 'rejected', 'declined', 'cancelled', 'canceled', 'error'].includes(
      status
    ) ||
    ['failed', 'rejected', 'declined'].includes(txStatus)
  ) {
    return 'Rejected'
  }
  return 'Pending'
}

export function txProductName(tx: Transaction): string | null {
  return (
    tx.product_name ?? tx.product?.name ?? tx.carrier_product_code ?? null
  )
}

export function txLineOfBusiness(tx: Transaction): string | null {
  return tx.line_of_business ?? null
}

export function txPremium(tx: Transaction): number | null {
  const raw = tx.premium ?? tx.paid_amount ?? tx.amount
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function txPaymentRef(tx: Transaction): string | null {
  return (
    tx.merchant_transaction_id ??
    tx.payment_id ??
    tx.proposal_number ??
    null
  )
}

export function formatAmount(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

export function formatTxDate(raw?: string | null): string | null {
  if (!raw) return null
  const d = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
