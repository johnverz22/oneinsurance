/** Shared Laravel-style paginated response wrapper */
export type Paginated<T> = {
  current_page: number
  data: T[]
  first_page_url?: string
  from: number | null
  last_page: number
  last_page_url?: string
  next_page_url: string | null
  path?: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type Provider = {
  id: number
  name: string
  status?: string
}

export type LineOfBusiness = {
  id: number
  name: string
  slug?: string
  description: string
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type Product = {
  id: number | string
  provider_id: number
  lob_id: number | null
  name: string
  description: string
  price?: number
  status: string
  carrier_product_code?: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  provider: Provider
  line_of_business: LineOfBusiness | null
}

export type ProductPayload = {
  name: string
  description: string
  carrier_product_code: string
  provider_id: number
  lob_id: number
  price: number
  status: string
}

export type LobPayload = {
  name: string
  slug: string
  description: string
  status: 'active' | 'inactive'
}

/** Default commission configuration created alongside a new product (matches admin-v1) */
export type CommissionConfigPayload = {
  product_id: number
  base_commission: number
  agent_commission: number
  agent_overrider_commission: number
  agent_admin_commission: number
  agent_admin_overrider_commission: number
  referral_commission: number
  referral_overrider_commission: number
  referral_admin_commission: number
  referral_admin_overrider_commission: number
  vat: number
  witholding_tax: number
  gross_vat: number
  vatOptions: string
  effectivity_date: string
  status: string
}
