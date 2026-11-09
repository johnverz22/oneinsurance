export interface Commission {
  id: string
  amount: number
  grossCommission: number
  deductions: number
  netCommission: number
  source: 'personal_sales' | 'overriders' | 'referrals'
  sourceDetails: string
  status: 'Paid' | 'Pending' | 'Approved'
  paidOn: Date
}

export interface MonthlyPerformance {
  month: string
  commission: number
}
