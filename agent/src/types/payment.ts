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
  merchant_account_id: string
  merchant_transaction_id: string
  product_reference_id?: string
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
  postal_code: string
  is_card_payment: boolean
  card_holder_name?: string // if is_card_payment is true
  card_number?: number // if is_card_payment is true
  expiration_month?: string // if is_card_payment is true - format: "01", "02", etc.
  expiration_year?: string // if is_card_payment is true - format: "24", "25", etc.
  ccv?: number // if is_card_payment is true
  payment_brand_code: string
  payment_brand: string
  amount: number
  currency: string
  description?: string
  callback_url: string
  time_offset: string
  device: DeviceInfo
}

export type PaymentSubmitResponse = {
  success: boolean
  message: string
  data: PaymentSubmitData
}

export type PaymentSubmitData = {
  is_card_payment: boolean
  status_code: string
  merchant_transaction_id: string
  amount: string | number
  fee: string | number
  total_due: string | number
  redirect_url: string | null
  transaction_date_time: Date
}
