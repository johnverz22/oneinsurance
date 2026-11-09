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

export function txProduct(tx: Transaction): string | null {
  return (
    tx.product?.name ?? tx.product_name ?? tx.carrier_product_code ?? null
  )
}

type CatalogProduct = {
  name?: string | null
  carrier_product_code?: string | null
  line_of_business?: { name?: string | null } | null
}

/*
 * Known payload gaps in the transactions endpoints (observed on stage):
 * - `currency` is not returned at all; it exists only on the checkout payment
 *   request. We do not assume a value, so the column shows — until the API
 *   exposes it.
 * - `product`, `product_name`, and `policy_details` are typically null; the
 *   only product identifier is `carrier_product_code` (e.g. MIC-TRAVEL-MASTER).
 *   The line-of-business name (e.g. "Travel Insurance") is therefore resolved
 *   through the admin product catalog. Carrier codes with no catalog product,
 *   or products with no line_of_business, stay unresolved and fall back to
 *   the product name / raw code — i.e. the "Travel Insurance" type is missing
 *   whenever the catalog mapping is incomplete.
 */
export function txProductType(
  tx: Transaction,
  byCode?: Map<string, CatalogProduct>
): string | null {
  const match = tx.carrier_product_code
    ? byCode?.get(tx.carrier_product_code)
    : undefined
  return (
    match?.line_of_business?.name ??
    match?.name ??
    tx.product?.name ??
    tx.product_name ??
    tx.carrier_product_code ??
    null
  )
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
