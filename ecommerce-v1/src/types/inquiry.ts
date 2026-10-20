import { z } from 'zod'

export type InquiryStatus = 'new' | 'in-progress' | 'resolved' | 'closed'

export const inquirySchema = z.object({
  type: z.enum(
    ['agent-enrollment', 'general', 'product', 'claim', 'support', 'complaint'],
    { message: 'Please select at least one inquiry type' }
  ),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  customerInfo: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    preferredContact: z.enum(['email', 'phone', 'both']),
  }),
})

export type InquireForm = z.infer<typeof inquirySchema>
export type Inquiry = InquireForm & {
  id: string
  status: InquiryStatus
  productInterest?: string
  policyNumber?: string
  submittedAt: string
  updatedAt: string
  assignedTo?: string
  response?: string
  responseAt?: string
}
