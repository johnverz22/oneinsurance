import { ApplicationStatus } from '@/types/application'

export interface Quotation {
  id: number
  name: string
  type: 'Life' | 'Health' | 'Business' | 'Travel' | 'CPTL'
  premium: number
  coverage: number
  status: ApplicationStatus
  createdOn: Date
}

export type QuoteStatus = 'Sent' | 'Accepted' | 'Expired' | 'Draft'
