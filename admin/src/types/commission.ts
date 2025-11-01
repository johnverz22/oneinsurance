export interface Commission {
  id: number
  name: string
  policyId: number
  type: 'Life' | 'Health' | 'Business' | 'Travel' | 'CPTL'
  commission: number
  status: 'Paid' | 'Pending' | 'Clawback'
  paidOn: Date
}

export interface MonthlyPerformance {
  month: string
  commission: number
}
