import { z } from 'zod'
import { InsuranceCompany } from './insurance-company'

export type Insurance = {
  id: string
  categoryId: string
  companyId: InsuranceCompany['id']
  title: string
  description: string
  image: string
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
  plans: {
    name: string
    coverage: string[]
    benefits: string[]
    mbl: string
    price: number
  }[]
}

export const insuranceSchema = z.object({
  id: z.string().min(1, 'Id is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  image: z.string().url('Must be a valid URL'),
  categoryId: z.enum(['general', 'travel', 'medical', 'hmo'], {
    message: 'Category is required',
  }),
  companyId: z.enum(
    [
      'pacific-cross',
      'malayan-insurance',
      'mercantile-insurance',
      'oona-insurance',
    ],
    { message: 'Company is required' }
  ),
  tag: z.enum(['Popular', 'Featured']).optional(),
  more: z.object({
    overview: z.string().min(1, 'Overview is required'),
    explanation: z.string().min(1, 'Explanation is required'),
    eligibleAge: z.string().min(1, 'Eligible age is required'),
    notes: z.array(z.string().min(1, 'Note cannot be empty')),
    faqs: z.array(
      z.object({
        question: z.string().min(1, 'Question is required'),
        answer: z.string().min(1, 'Answer is required'),
      })
    ),
  }),
  plans: z
    .array(
      z.object({
        name: z.string().min(1, 'Plan name is required'),
        coverage: z.array(z.string().min(1, 'Coverage item cannot be empty')),
        benefits: z.array(z.string().min(1, 'Benefit item cannot be empty')),
        mbl: z.string().min(1, 'MBL is required'),
        price: z.number().min(0, 'Price must be positive'),
      })
    )
    .min(1, 'At least one plan is required'),
})
