export type Product = {
  code: string
  description: string
  status: 'Active' | 'Inactive'
  provider: 'OONA' | 'MALAYAN' | 'MICO'
  commission_rate: number
}
