import { InsuranceCompany } from './insurance-company'

export type Insurance = {
  id: string
  categoryId: string
  companyId: InsuranceCompany['id']
  title: string
  description: string
  image: string
  checkoutLink: string
  tag?: 'Popular' | 'Featured'
  more: {
    overview: string
    explanation: string
    eligibleAge: string
    notes: string[]
    faqs: {
      question: string
      answer: string
    }[]
  }
}
