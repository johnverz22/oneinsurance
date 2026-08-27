export interface PaymentAuthRequest {
  grant_type: string
  client_id: string
  client_secret: string
  scope: string
}

export interface PaymentAuthResponse {
  token_type: string
  expires_in: number
  access_token: string
}

export interface PaymentBrand {
  value: string
  code: string
  image: string
  is_card: boolean
}

export interface PaymentBrandsResponse {
  success: boolean
  message: string
  data: PaymentBrand[]
}

export type DeviceInfo = {
  timezone: string
  browser_color_depth: string
  browser_language: string
  browser_screen_height: string
  browser_screen_width: string
  os: string
  browser_accept_header: string
  user_agent: string
  browser_javascript_enabled: boolean
  browser_java_enabled: boolean
  accept_content: string
}

export type PaymentSubmitRequest = {
  service_code: string // Required by DLT v1.3+ — issued by DLT (e.g. "APN-COLLECTION")
  channel: number // Required by DLT v3.0 — 1=API, 2=QuickLink, 3=WooCommerce, 4=Custom
  merchant_account_id: string
  merchant_transaction_id: string
  product_reference_id?: string
  product_name?: string // required in practice despite spec listing as optional
  product_description: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address_line_one: string
  address_line_two: string
  city_municipality: string
  state_province_region: string
  country_code: string
  postal_code: string // undocumented but required in practice
  is_card_payment: boolean
  card_holder_name?: string // if is_card_payment is true
  card_number?: string // if is_card_payment is true - keep as string for payment gateway
  expiration_month?: string // if is_card_payment is true - format: "01", "02", etc.
  expiration_year?: string // if is_card_payment is true - format: "24", "25", etc.
  ccv?: number // if is_card_payment is true
  payment_brand_code: string
  payment_brand: string
  amount: number | string
  currency: string
  success_url?: string // DLT v3.0 — redirect after successful e-wallet payment
  failure_url?: string // DLT v3.0 — redirect after failed e-wallet payment
  time_offset: string
  device?: DeviceInfo // required only if is_card_payment is true
}

export type PaymentSubmitResponse = {
  success: boolean
  message: string
  data: PaymentSubmitData
}

export type PaymentSubmitData = {
  is_card_payment: boolean
  payment_status: string // "PAID" | "PENDING" | "REJECTED"
  merchant_transaction_id: string
  amount: string | number
  payment_url: string | null // redirect target for e-wallet flows; null for card
  success_url: string | null
  failure_url: string | null
  timestamp: string // e.g. "2026-08-18T04:07:32.060+0000"
}

export type PaymentConfirmationResponse = {
  message: string
  status: string
  code: number
  timestamp: string
}
