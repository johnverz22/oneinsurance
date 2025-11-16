type Product = 'Life' | 'Health' | 'Business' | 'Travel' | 'CPTL'

type Status = 'Paid' | 'Pending' | 'New'

type BaseSale = {
  id: string | number
  customer: string
  product: Product
  totalSales: number
  date: Date
}

export type MySale = BaseSale & {
  commission: number
  status: Status
}

export type TeamSale = BaseSale & {
  overrider_commission: number
  upline_deduction: number
}
