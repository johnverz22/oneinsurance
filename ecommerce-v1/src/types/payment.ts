// ---------------------------------------------------------------------------
// DLT Payment Collection API v4.0 — Type Definitions
//
// v4.0 is DLT Hosted Checkout only.  Card and e-wallet payments both go to a
// DLT-hosted page reached via `payment_url`.  There is no `is_card_payment`
// branch, no card-number field, and no 3DS device block in the submit payload.
// ---------------------------------------------------------------------------

// OAuth
export interface PaymentAuthRequest {
  grant_type: string
  client_id: string
  client_secret: string
  scope?: string
}

export interface PaymentAuthResponse {
  token_type: string
  expires_in: number
  access_token: string
}

// Brands
export interface PaymentBrand {
  value: string  // human-readable name, e.g. "Visa", "GCash"
  code: string   // opaque, time-sensitive payment_brand_code — copy verbatim into submit
  image: string
  is_card: boolean
}

export interface PaymentBrandsResponse {
  success: boolean
  message: string
  data: PaymentBrand[]
}

// ---------------------------------------------------------------------------
// Submit Payment — v4.0 Hosted Checkout
//
// merchant_account_id, service_code, channel, time_offset are intentionally
// omitted here — the BFF injects them server-side so the client can't tamper
// with them.
// ---------------------------------------------------------------------------
export type PaymentSubmitRequest = {
  /** Stable unique reference minted server-side via GET /api/payment/transaction-id */
  merchant_transaction_id: string

  /** Decimal string, e.g. "1299.00". No parseFloat — integer-cents arithmetic only. */
  amount: string

  currency?: string // defaults to PHP

  /** Brand value from GET /api/payment (brands API), e.g. "Visa" or "GCash" */
  payment_brand: string
  /** Opaque brand code from brands API — copy verbatim, do not decode */
  payment_brand_code: string

  // Product / order reference
  product_name?: string
  product_description: string   // treat as required — DLT 500s without it
  product_reference_id?: string

  // Payor details (billing)
  first_name: string
  last_name: string
  email: string
  phone?: string

  // Billing address
  address_line_one: string
  address_line_two?: string
  city_municipality: string
  state_province_region: string
  country_code: string   // 2-letter ISO, e.g. "PH"
  postal_code: string

  // Redirect URLs — BFF may build these; client can also supply them
  success_url?: string
  failure_url?: string

  // Optional merchant references shown on DLT checkout page
  other_reference_1?: string
  other_reference_1_caption?: string
  other_reference_2?: string
  other_reference_2_caption?: string

  // ---------------------------------------------------------------------------
  // v3.0 legacy fields — accepted here for backward compatibility with health/
  // CTPL payment steps; the BFF strips them before calling DLT v4.0.
  // ---------------------------------------------------------------------------
  /** @deprecated BFF-owned; stripped by BFF. */
  time_offset?: string
  /** @deprecated BFF-owned; hardcoded to 4 in BFF. */
  channel?: number
  /** @deprecated Card fields are stripped by the BFF in v4.0. */
  is_card_payment?: boolean
  card_holder_name?: string
  card_number?: string
  expiration_month?: string
  expiration_year?: string
  ccv?: number
  /** @deprecated Device info is not required by DLT v4.0 Hosted Checkout. */
  device?: Record<string, unknown>
}

export type PaymentSubmitResponse = {
  success: boolean
  message: string
  data: PaymentSubmitData
}

export type PaymentSubmitData = {
  /** false for Hosted Checkout — compatibility metadata only */
  is_card_payment: boolean
  payment_status: 'PAID' | 'PENDING' | 'REJECTED'
  transaction_id: string       // DLT internal ID
  merchant_transaction_id: string
  amount: string
  /** Redirect the payor here — DLT-hosted checkout page */
  payment_url: string | null
  success_url: string | null
  failure_url: string | null
  timestamp: string
}

// ---------------------------------------------------------------------------
// Sync — POST /api/payment/sync
// ---------------------------------------------------------------------------
export type PaymentSyncRequest = {
  merchant_transaction_id: string
}

export type PaymentSyncResponse = {
  success: boolean
  message: string
  data: {
    merchant_transaction_id: string
    payment_status: 'PAID' | 'PENDING' | 'REJECTED'
    provider_message: string | null
    timestamp: string
  }
}

// Legacy — kept for the verify-status route (our own backend, not DLT)
export type PaymentConfirmationResponse = {
  message: string
  status: string
  code: number
  timestamp: string
}
