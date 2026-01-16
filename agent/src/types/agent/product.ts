type BaseType = {
  description: string
  status: 'Active' | 'Inactive'
  link: string
  lobId?: number | null
}

export type Referral = BaseType & {
  id: string
}

export type Product = BaseType & {
  code: string
  commissionRate: number
  name?: string
  providerName?: string
  lobName?: string
  carrierProductCode?: string
}
