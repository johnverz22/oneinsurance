import { z } from 'zod'
import {
  InsurancePlanSchema,
  TravelDetailSchema,
  TravelInsuranceDataSchema,
} from '../plan'

export const TravelCoverageAreaEnum = z.enum([
  'APAC',
  'SCHENGEN',
  'DOMESTIC',
  'WORLD',
])

export type Country = { code: string; name: string; flag: string }
export type TravelCoverageArea = z.infer<typeof TravelCoverageAreaEnum>
export type TravelCoverage = Record<TravelCoverageArea, Country[]>

export const travelInsuranceSchema = z
  .object({
    travelType: z.enum(['INDIVIDUAL', 'FAMILY'], {
      required_error: 'Please select individual or family coverage',
    }),
    travelDetailList: z
      .array(TravelDetailSchema)
      .min(1, 'Must have at least one pair of origin and destination'),
    departureDate: z.date({ message: 'Departure date is required' }),
    returnDate: z.date({ message: 'Return date is required' }),
    dateOfBirth: z.date().optional(),
    noOfAdults: z.number().min(1, 'At least one adult is required'),
    noOfChildren: z.number().min(0),
    isAnnualMultiTrip: z.boolean(),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine(
    (data) => {
      if (!data.returnDate) return false

      const departure = new Date(data.departureDate)
      const returnDate = new Date(data.returnDate)
      return returnDate >= departure
    },
    {
      message: 'Return date must be on or after departure date',
      path: ['returnDate'],
    }
  )
  .superRefine((data, ctx) => {
    if (data.dateOfBirth) {
      const today = new Date()
      let currentAge = today.getFullYear() - data.dateOfBirth.getFullYear()
      const m = today.getMonth() - data.dateOfBirth.getMonth()

      if (m < 0 || (m === 0 && today.getDate() < data.dateOfBirth.getDate())) {
        currentAge--
      }

      if (currentAge < 18) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_date,
          path: ['dateOfBirth'],
          message: 'You must be 18 years old and above',
        })
      }
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        path: ['dateOfBirth'],
        message: 'Date of Birth is required',
      })
    }
  })

export type TravelInsuranceFormData = z.infer<typeof travelInsuranceSchema>

export const SelectedAddonBenefitsSchema = z.array(z.string()).optional()
export type SelectedAddonBenefitsFormData = z.infer<
  typeof SelectedAddonBenefitsSchema
>

export const CoverageOptionSchema = z.object({
  selectedPlan: InsurancePlanSchema.optional(),
  selectedAddonBenefits: SelectedAddonBenefitsSchema,
  carrierCode: z.string().min(1),
})

export type CoverageOptionFormData = z.infer<typeof CoverageOptionSchema>

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

export const getIdFormatDescription = (
  idType: z.infer<typeof PhilippineIdType>
): string => {
  const descriptions: Record<z.infer<typeof PhilippineIdType>, string> = {
    VOT: 'Format: 7501-00191-C145BCD', // Voter's ID (COMELEC VIN)
    POS: 'Format: ABC12345678', // Postal ID
    SSS: 'Format: 12-3456789-0', // Social Security System Number
    UMI: 'Format: 1234-5678-9012', // Unified Multi-Purpose ID
    PAS: 'Format: AA1234567 or A1234567', // Passport
    TIN: 'Format: 123-456-789-012', // Tax Identification Number
    DRI: 'Format: A12-34-567890', // Driver's License Number
    PRC: 'Format varies', // Professional Regulation Commission ID
    PID: 'Format: 12-345678901-2', // PhilHealth ID
    EPH: 'Format: 1234-5678-9012', // e-PhilSys ID
    PHI: 'Format: 1234-5678-9012', // PhilSys ID
    BID: 'Format varies', // Barangay ID
    SCC: 'Format varies', // Senior Citizen ID
    OTH: 'Format varies', // Other
  }

  return descriptions[idType]
}

export const SuffixEnum = z.enum([
  'JR',
  'SR',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'ETAL.',
  'No Suffix',
])

export const beneficiarySchema = z
  .object({
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    dateOfBirth: z.date().nullable().optional(),
    relationship: z.string().optional(),
  })
  .refine(
    (data) => {
      // If any field has a value, all fields must be filled
      const hasAnyValue =
        data.firstName || data.lastName || data.dateOfBirth || data.relationship
      if (hasAnyValue) {
        return !!(
          data.firstName &&
          data.lastName &&
          data.dateOfBirth &&
          data.relationship
        )
      }
      // If no fields have values, that's okay (beneficiary is optional)
      return true
    },
    {
      message: 'All beneficiary fields are required if you have a beneficiary',
      path: ['name'], // Show error on name field
    }
  )

export const personalInfoSchema = z
  .object({
    idType: PhilippineIdType,
    idNumber: z.string().min(1, 'ID number is required'),
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().nullable().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email'),
    mobileNumber: z.string().regex(/^9\d{9}$/, {
      message: 'Mobile number must start with 9 and be 10 digits long',
    }),
    dateOfBirth: z.date({ message: 'Date of Birth is required' }),
    suffix: SuffixEnum.optional(),
    gender: z.enum(['M', 'F']),
    address: z.object({
      city: z.string().min(1, 'City is required'),
      province: z.string().min(1, 'Province is required'),
      zipCode: z.string().min(1, 'ZIP code is required'),
      line1: z
        .string()
        .min(1, 'Address Line 1 is required')
        .max(
          40,
          'Address Line 1 must not exceed 40 characters. Use Address Line 2 for additional details'
        ),

      line2: z
        .string()
        .min(1, 'Address Line 2 is required')
        .max(40, 'Address Line 2 must not exceed 40 characters'),
    }),
    hasBeneficiary: z.boolean(),
    beneficiary: beneficiarySchema,
  })
  .superRefine((data, ctx) => {
    const validator = formatValidators[data.idType]
    if (validator) {
      const result = validator.safeParse(data.idNumber)
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['idNumber'],
          message:
            result.error.errors[0]?.message ||
            `Invalid format for ${data.idType}`,
        })
      }
    }

    if (data.hasBeneficiary) {
      const b = data.beneficiary

      if (
        !b?.firstName ||
        !b?.lastName ||
        !b?.dateOfBirth ||
        !b?.relationship
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['beneficiary'],
          message:
            'All beneficiary fields are required if you have a beneficiary',
        })
      }
    }
  })

export const reviewDataSchema = z.object({
  marketingConsent: z.boolean(),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal']),
})

export const travelersInfoSchema = z.array(personalInfoSchema)

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>
export type ReviewFormData = z.infer<typeof reviewDataSchema>
export type TravelersInfoFormData = z.infer<typeof travelersInfoSchema>

// Root object
export interface InitTravelInsuranceRequest {
  ProductCode: string // e.g., "TRAVEL"
  ProductVersion: string // e.g., "1.0"
  EffectiveDate: string // ISO Date (YYYY-MM-DD)
  ExpiryDate: string // ISO Date (YYYY-MM-DD)
  TripType: 'SINGLE' | 'ANNUAL' // Alternative values possible
  TravelType: 'INDIVIDUAL' | 'FAMILY'
  NoOfTravellers?: string | number
  BranchCode?: string
  Age?: number
  LGT?: string
  PromoCodeList: string
  TravelDetailList: TravelDetail[]
  PolicyCustomerList: PolicyCustomer[]
  PolicyLobList: PolicyLob[]
}

// Travel Details

export interface TravelDetail {
  TravelCoverageArea: TravelCoverageArea
  PlaceOfOrgin: string
  TravelCountry: string
  DisplaySequence: number
}

// Policy Customers
export interface PolicyCustomer {
  DateOfBirth?: string // ISO Date (YYYY-MM-DD)
}

// Line of Business
export interface PolicyLob {
  ProductCode: string // e.g., "TRAVEL"
  PolicyRiskList: PolicyRisk[]
}

// Policy Risks
export interface PolicyRisk {
  ProductElementCode: string // e.g., "R00001"
  IsMainInsured: 'Y' | 'N' | string
  DateOfBirth: string // ISO Date (YYYY-MM-DD)
  IsAdultTraveller?: 'Y' | 'N' | string
  FirstName?: string
  MiddleName?: string
  LastName?: string
  IdNo?: string
  IdTypeCode?: string // up to 10 characters
  Suffix?: string
  Gender?: string
  AddrProvince?: string
  City?: string
  PostCode?: string
  AddressLine1?: string
  AddressLine2?: string
  Email?: string
  Mobile?: string
}
