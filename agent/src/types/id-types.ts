import { z } from 'zod'

export const PhilippineIdType = z.enum([
  'VOT', // VOTER'S ID
  'POS', // POSTAL ID
  'SSS', // SOCIAL SECURITY SYSTEM NUMBER
  'UMI', // UNIFIED MULTI-PURPOSE ID
  'PAS', // PASSPORT
  'TIN', // TAX IDENTIFICATION NUMBER
  'DRI', // DRIVER LICENSE NUMBER
  'PRC', // PROFESSIONAL REGULATION COMMISSION
  'PID', // PHILHEALTH
  'EPH', // E-PHILSYS
  'PHI', // PHILSYS
  'BID', // BARANGAY ID
  'SCC', // SENIOR CITIZEN ID
  'OTH', // OTHER
])

export type PhilippineIdTypeEnum = z.infer<typeof PhilippineIdType>

// ID Number format validators
export const formatValidators = {
  VOT: z
    .string()
    .min(1, 'Voter ID is required')
    .max(25, 'Voter ID must be at most 25 characters'),

  POS: z
    .string()
    .regex(
      /^[A-Z0-9]{8,12}$/,
      'Postal ID format: 8-12 alphanumeric characters'
    ),

  SSS: z.string().regex(/^\d{2}-\d{7}-\d{1}$/, 'SSS ID format: 00-0000000-0'),

  UMI: z.string().regex(/^\d{4}-\d{7}-\d{1}$/, 'UMID format: 0000-0000000-0'),

  PAS: z
    .string()
    .regex(
      /^([A-Z]{2}\d{7}|[A-Z]\d{7}|[A-Z]{2}\d{6})$/,
      'Passport format: AA1234567 or A1234567'
    ),

  TIN: z
    .string()
    .regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/, 'TIN format: 000-000-000-000'),

  DRI: z
    .string()
    .regex(
      /^[A-Z]\d{2}-\d{2}-\d{6}$/,
      "Driver's License format: A00-00-000000"
    ),

  PRC: z
    .string()
    .min(5, 'PRC ID format varies, minimum 5 characters')
    .max(20, 'PRC ID format varies, maximum 20 characters'),

  PID: z
    .string()
    .regex(/^\d{2}-\d{9}-\d{1}$/, 'PhilHealth ID format: 00-000000000-0'),

  EPH: z
    .string()
    .regex(
      /^\d{4}-\d{4}-\d{4}-\d{4}$/,
      'e-PhilSys ID format: 0000-0000-0000-0000'
    ),

  PHI: z
    .string()
    .regex(
      /^\d{4}-\d{4}-\d{4}-\d{4}$/,
      'PhilSys ID format: 0000-0000-0000-0000'
    ),

  BID: z
    .string()
    .min(5, 'Barangay ID format varies, minimum 5 characters')
    .max(20, 'Barangay ID format varies, maximum 20 characters'),

  SCC: z
    .string()
    .min(5, 'Senior Citizen ID format varies, minimum 5 characters')
    .max(20, 'Senior Citizen ID format varies, maximum 20 characters'),

  OTH: z.string().min(3, 'Other ID format varies, minimum 3 characters'),
}

export const PH_ID_TYPES = {
  VOT: "Voter's ID",
  POS: 'Postal ID',
  SSS: 'Social Security System Number',
  UMI: 'Unified Multi-Purpose ID',
  PAS: 'Passport',
  TIN: 'Tax Identification Number',
  DRI: "Driver's License Number",
  PRC: 'Professional Regulation Commission ID',
  PID: 'PhilHealth ID',
  EPH: 'E-PhilSys ID',
  PHI: 'PhilSys ID',
  BID: 'Barangay ID',
  SCC: 'Senior Citizen ID',
  OTH: 'Other',
}
