import { z } from 'zod'

export const baseInsuranceSchema = z.object({
  name: z.string().min(1, 'Please select insurance'),
  merchant: z.string().min(1, 'Please select merchant'),
  insuranceId: z.string().min(1, 'Please select an insurance product'),
  planIndex: z.coerce.number(),
})

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(11, 'Please enter a valid phone number')
    .max(11, 'Please enter a valid phone number'),
  dateOfBirth: z.coerce.date({ message: 'Date of Birth is required' }),
  address: z.string().min(5, 'Please enter a valid address'),
  sex: z.enum(['male', 'female']),
  city: z.string().min(1, 'City is required'),
  zipCode: z.coerce.number({ message: 'Please enter a valid zip code' }),
  emergencyContact: z.string().min(1, 'Emergency contact name is required'),
  emergencyPhone: z.string().min(10, 'Emergency contact phone is required'),
  idType: z.enum(['Voter', 'Postal', 'SSS', 'UMID', 'Passport']),
  idNumber: z.string().min(1, 'ID number is required'),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to terms and conditions'),
})

const mergedSchema = baseInsuranceSchema.extend(personalInfoSchema.shape)

export const hmoInsuranceSchema = mergedSchema.extend({
  type: z.literal('hmo'),
  lifestyle: z.object({
    smoker: z.boolean(),
    drinker: z.enum(['Never', 'Occasionally', 'Regularly']),
    exerciseFrequency: z.enum(['Never', 'Rarely', 'Weekly', 'Daily']),
  }),
  roomType: z.enum(['Ward', 'Semi-Private', 'Private'], {
    errorMap: () => ({ message: 'Please select room type preference' }),
  }),
})

export const travelInsuranceSchema = mergedSchema.extend({
  type: z.literal('travel'),
  travelType: z.enum(['Domestic', 'International'], {
    errorMap: () => ({ message: 'Please select travel type' }),
  }),
  destinations: z.string().min(1, 'Please add at least one destination'),
  travelDate: z.string().min(1, 'Travel date is required'),
  purposeOfTravel: z.enum(
    ['Leisure', 'Business', 'Study', 'Medical', 'Transit'],
    {
      errorMap: () => ({ message: 'Please select purpose of travel' }),
    }
  ),
})

export const generalInsuranceSchema = mergedSchema.extend({
  type: z.literal('general'),
  category: z.string().min(1, { message: 'Category is required' }),
})
export const medicalInsuranceSchema = mergedSchema.extend({
  type: z.literal('medical'),
  category: z.string().min(1, { message: 'Category is required' }),
})

export const paymentSchema = z.object({
  cardType: z.enum(['credit', 'debit']),
  nameOnCard: z.string().min(1, 'Card Name is required'),
  cardNumber: z
    .string()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{4}$/, 'Valid Card Number is required'),
  validOn: z.string().regex(/^\d{2}\/\d{2}$/, 'Valid date is required'),
  cvv: z
    .string()
    .min(3, 'CVV must be at least 3 digits')
    .max(4, 'CVV must be at most 4 digits'),
  saveCard: z.boolean(),
})

export const checkoutFormSchema = z.discriminatedUnion('type', [
  hmoInsuranceSchema,
  travelInsuranceSchema,
  generalInsuranceSchema,
  medicalInsuranceSchema,
])

export type HMOInsuranceForm = z.infer<typeof hmoInsuranceSchema>
export type GeneralInsuranceForm = z.infer<typeof generalInsuranceSchema>
export type MedicalInsuranceForm = z.infer<typeof medicalInsuranceSchema>
export type TravelInsuranceForm = z.infer<typeof travelInsuranceSchema>
export type CheckoutForm = z.infer<typeof checkoutFormSchema>
