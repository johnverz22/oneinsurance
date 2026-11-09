export type PaymentsSummary = {
  total_records: number
  total_cases: number
  total_gross_commission: string
  total_vat_amount: string
  total_withholding_tax: string
  total_net_commission: string
  total_net_premium: string
}

export interface PaymentHistory {
  id: number
  agent_id: number
  product_id: number
  provider_id: number
  transaction_id: number
  case_count: number
  total_net_premium: string
  product_price: string
  commission_rate: string
  gross_commission: string
  vat_percentage: string
  vat_amount: string
  withholding_tax_percentage: string
  withholding_tax_amount: string
  net_commission: string
  agent_commission: string
  is_included_in_payout: boolean
  payout_id: string | number | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  agent: Agent
  product: Product
  provider: Provider
  transaction: {
    id: number
    merchant_transaction_id: string
  }
}

export interface Agent {
  id: number
  company_id: string | number | null
  role: number
  username: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  designation: string
  job_description: string | null
  avatar: string | null
  email: string
  email_verified_at: string
  status: string
  phone: string
  phone_verified_at: string | null
  phone_description: string | null
  telephone: string | null
  address: string | null
  is_super_admin: number
  birth_date: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  lob_id: string | null
  carrier_product_code: string
  provider_id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Provider {
  id: number
  name: string
  description: string
  contact_email: string
  contact_phone: string
  address: string
  website: string
  logo: string | null
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type CommissionBreakdown = {
  label: string
  amount: number
}

export type PaymentStatus = 'Paid' | 'Pending'

export type PayoutHistory = {
  id: string
  period: string
  salesCount: number
  status: PaymentStatus

  grossCommission: {
    total: number
    breakdown: CommissionBreakdown[]
  }

  overriderDeduction: {
    total: number
    breakdown: CommissionBreakdown[]
  }

  netPayment: {
    amount: number
    method: string
    date: string
  }

  paymentStatus: {
    dueDate: string
    paidDate?: string
  }
}
