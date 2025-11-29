import { Product } from '@/types/agent/product'

export const PRODUCTS: Product[] = [
  {
    code: 'P-001',
    description: 'Travel Insurance',
    provider: 'OONA',
    commissionRate: 30,
    status: 'Active',
    link: 'products/travel-insurance',
  },
  {
    code: 'P-002',
    description: 'Comprehensive Auto',
    provider: 'OONA',
    commissionRate: 25,
    status: 'Active',
    link: 'products/ctpl-insurance',
  },
  {
    code: 'P-003',
    description: 'Travel Insurance',
    provider: 'MALAYAN',
    commissionRate: 30,
    status: 'Active',
    link: 'products/travel-insurance',
  },
  {
    code: 'P-004',
    description: 'Travel Insurance',
    provider: 'MALAYAN',
    commissionRate: 25,
    status: 'Active',
    link: 'products/travel-insurance',
  },
  {
    code: 'P-005',
    description: 'e-CTPL',
    provider: 'OONA',
    commissionRate: 25,
    status: 'Active',
    link: 'products/ctpl-insurance',
  },
]
