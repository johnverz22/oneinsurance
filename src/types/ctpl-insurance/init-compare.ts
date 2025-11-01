import { z } from 'zod'
import { createResponseSchema } from '../base-api-response'

const PolicyCustomerSchema = z.object({
  AddrProvince: z.string(),
  AddressLine1: z.string(),
  AddressLine2: z.string(),
  City: z.string(),
  CustomerType: z.string(),
  DateOfBirth: z.string().datetime(), // validates ISO datetime
  Email: z.string().email(),
  FirstName: z.string(),
  Gender: z.string(),
  IdNo: z.string(),
  IdTypeCode: z.string(),
  LastName: z.string(),
  MiddleName: z.string(),
  Mobile: z.string(),
  PostCode: z.number(),
  Suffix: z.string(),
  Title: z.string(),
})

const PolicyRiskSchema = z.object({
  BodyType: z.string(),
  ChassisNo: z.string(),
  DateOfRegistration: z.string().date(), // validates date format (YYYY-MM-DD)
  EngineNo: z.string(),
  FieldOfficeCode: z.string(),
  IsPlateNoAvailable: z.string(),
  LicensePlateNumber: z.string(),
  ModelYear: z.string(),
  MvFileNumber: z.string(),
  ProductElementCode: z.string(),
  SubModel: z.string(),
  VehicleMake: z.string(),
  VehicleModel: z.string(),
  VehicleUsage: z.string(),
})

const PolicyLobSchema = z.object({
  PolicyRiskList: z.array(PolicyRiskSchema),
  ProductCode: z.string(),
})

export const CTPLProductTypeEnum = z.enum([
  'MOTORCYCLE',
  'PRIVATECAR',
  'ACTC',
  'LMT',
  'TPMB',
  'PTB',
  'HTPB',
])

export const InitCompareCTPLRequestSchema = z.object({
  Duration: z.number().or(z.string()),
  EffectiveDate: z.string().date(), // YYYY-MM-DD
  ExpiryDate: z.string().date(),
  IsCTPL: z.string(),
  PolicyCustomerList: z.array(PolicyCustomerSchema),
  PolicyLobList: z.array(PolicyLobSchema),
  ProductCode: z.string(),
  ProductType: CTPLProductTypeEnum,
  ProductVersion: z.string(),
})

export type InitCompareCTPLRequest = z.infer<
  typeof InitCompareCTPLRequestSchema
>
export type CTPLProductType = z.infer<typeof CTPLProductTypeEnum>

export const CTPLInitCompareResponseSchema = z.object({
  success: z.boolean({ required_error: 'Success flag is required' }),
  message: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message cannot be empty'),
  data: z.object({
    ClientRequestId: z
      .string({ required_error: 'ClientRequestId is required' })
      .uuid('ClientRequestId must be a valid UUID'),
    Message: z
      .string({ required_error: 'Data message is required' })
      .min(1, 'Message cannot be empty'),
    ProductCode: z
      .string({ required_error: 'ProductCode is required' })
      .min(1, 'ProductCode cannot be empty'),
    ProductVersion: z
      .string({ required_error: 'ProductVersion is required' })
      .min(1, 'ProductVersion cannot be empty'),
    Status: z
      .string({ required_error: 'Status is required' })
      .min(1, 'Status cannot be empty'),
    SupportedCarrier: z
      .array(z.string().min(1, 'Carrier cannot be empty'), {
        required_error: 'SupportedCarrier is required',
      })
      .nonempty('At least one carrier is required'),
  }),
})

export type CTPLInitCompareResponse = z.infer<
  typeof CTPLInitCompareResponseSchema
>

const BenefitSchema = z.object({
  '@pk': z.number().optional(),

  BenefitCode: z.string().nullable().optional(),
  BenefitDesc: z.string(),
  BenefitType: z.string(),

  DisplaySeqNo: z.string(),

  MaxDeductible: z.string().optional(),
  MinDeductible: z.string().optional(),
  StdDeductible: z.string().optional(),

  ParentBenefit: z.string().nullable().optional(),
  Premium: z.string().optional(),
  Silimit: z.string().optional(),

  CarrierCode: z.string().optional(),
  CarrierCoverageCode: z.string().optional(),
  CarrierCoverageDesc: z.string().optional(),
  CarrierPlanCode: z.string().optional(),
  CarrierProductCode: z.string().optional(),

  DataTableId: z.number().optional(),

  IMOPlanCode: z.string().optional(),
  IMOProductCode: z.string().optional(),
  IMOProductType: z.string().optional(),

  Id: z.string().optional(),

  IsAdditionalBenefit: z.string().optional(),
  IsApplicable: z.string().optional(),
  IsMainBenefit: z.string().optional(),

  RecordId: z.number().optional(),
  RecordUsage: z.number().optional(),

  // Extra fields from second schema
  CoverageArea: z.string().optional(),
  CoverageName: z.string().optional(),
  DefaultLimitDesc: z.string().optional(),
  LimitModeDesc: z.string().optional(),
  SubCoverageName: z.string().optional(),
})

const PlanSchema = z.object({
  AddonBenefits: z.array(BenefitSchema),
  BeforeVatPremium: z.union([z.number(), z.string()]),
  CarrierPlanCode: z.string(),
  CarrierPlanDesc: z.string(),
  CarrierProductCode: z.string(),
  CarrierProductName: z.string(),
  DiscountAmount: z.union([z.number(), z.string(), z.null()]),
  DuePremium: z.union([z.number(), z.string()]),
  GrossPremium: z.union([z.number(), z.string()]),
  LGTAmount: z.union([z.number(), z.string()]),
  MainBenefits: z.array(BenefitSchema),
  PremiumTaxAmt: z.union([z.number(), z.string()]),
  StampDuty: z.union([z.number(), z.string()]),
  SumInsured: z.union([z.string(), z.null()]),
  TaxAmount: z.union([z.number(), z.string(), z.null()]),
  VatAmount: z.union([z.number(), z.string()]),
})

const DataItemSchema = z.array(
  z.object({
    CarrierCode: z.string(),
    ClientRequestId: z.string(),
    Plans: z.array(PlanSchema),
    ProductCode: z.string(),
    ProductVersion: z.string(),
  })
)

export const CTPLCoverageOptionSchema = z.object({
  selectedPlan: PlanSchema.optional(),
  selectedAddonBenefits: z.array(z.string()).optional(),
  carrierCode: z.string().min(1),
})

export const CTPLCompareQuoteSchema = createResponseSchema(DataItemSchema)

export type CTPLCompareQuoteResponse = z.infer<typeof CTPLCompareQuoteSchema>
export type CTPLCoverageOptionFormData = z.infer<
  typeof CTPLCoverageOptionSchema
>
export type InsurancePlan = z.infer<typeof PlanSchema>
export type InsuranceBenefit = z.infer<typeof BenefitSchema>
