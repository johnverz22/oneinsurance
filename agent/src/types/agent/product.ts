type BaseType = {
  description: string
  status: 'Active' | 'Inactive'
  provider: 'OONA' | 'MALAYAN' | 'MICO'
  commissionRate: number
  link: string
}

export type Referral = BaseType & {
  id: string
  clicks: number
  conversions: number
}

export type Product = BaseType & {
  code: string
}
