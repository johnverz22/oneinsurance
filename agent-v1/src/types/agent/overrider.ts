export type Overrider = {
  name: string
  code: string
  status: 'Active' | 'Inactive' | 'Training'
  rank: string
  recruited: string
  lastSale: string
  totalSales: number
  salesCount: number
  overrider_commission: number
  upline_deduction: number
  authorizedProducts: string[]
}
