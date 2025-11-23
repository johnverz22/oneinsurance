type BaseType = {
  description: string
  status: 'Active' | 'Inactive'
  provider: 'OONA' | 'MALAYAN' | 'MICO'
  commissionRate: number
}

export type Referral = BaseType & {
  id: string
  link: string
  clicks: number
  conversions: number
}

export type Product = BaseType & {
  code: string
}
