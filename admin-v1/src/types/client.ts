import { z } from 'zod'

export const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.coerce.date(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  occupation: z.string().min(1, 'Occupation is required'),
  annualIncome: z.number().min(0, 'Annual income must be a positive number'),
})

export type TClientSchema = z.infer<typeof clientSchema>

export type Client = TClientSchema & {
  id: string
  idType: string
  idNumber: string
  status: ClientStatus
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  documents?: Document[]
  notes?: string
}

export type Document = {
  id: string
  name: string
  type: string
  url: string
  uploadedAt: string
}

export type ClientStatus = 'pending' | 'approved' | 'rejected'
