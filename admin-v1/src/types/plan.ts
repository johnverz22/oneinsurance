import { z } from 'zod'

// Zod Schemas
export const InsuranceBenefitSchema = z.object({
  BenefitCode: z.string().nullable(),
  BenefitDesc: z.string(),
  BenefitType: z.string(),
  CarrierCode: z.string().optional(),
  CarrierPlanCode: z.string().optional(),
  CarrierProductCode: z.string().optional(),
  CoverageArea: z.string().optional(),
  CoverageName: z.string().optional(),
  DefaultLimitDesc: z.string().optional(),
  DisplaySeqNo: z.string(),
  LimitModeDesc: z.string().optional(),
  ParentBenefit: z.string().nullable().optional(),
  IMOProductCode: z.string().optional(),
  Id: z.string().optional(),
  IsApplicable: z.string().optional(),
  IsMainBenefit: z.string().optional(),
  Silimit: z.string().optional(),
  SubCoverageName: z.string().optional(),
})

export const InsurancePlanSchema = z.object({
  AddonBenefits: z.array(InsuranceBenefitSchema),
  BeforeVatPremium: z.union([z.number(), z.string()]),
  CarrierPlanCode: z.string(),
  CarrierPlanDesc: z.string(),
  CarrierProductCode: z.string(),
  CarrierProductName: z.string(),
  DiscountAmount: z.string().nullable(),
  DuePremium: z.union([z.number(), z.string()]),
  GrossPremium: z.union([z.number(), z.string()]),
  LGTAmount: z.union([z.number(), z.string()]),
  MainBenefits: z.array(InsuranceBenefitSchema),
  PremiumTaxAmt: z.union([z.number(), z.string()]).nullable(),
  StampDuty: z.union([z.number(), z.string()]).nullable(),
  SumInsured: z.string().nullable(),
  TaxAmount: z.union([z.number(), z.string()]).nullable(),
  VatAmount: z.union([z.number(), z.string()]).nullable(),
})

export const TravelInsuranceDataSchema = z.object({
  CarrierCode: z.string(),
  ClientRequestId: z.string(),
  Plans: z.array(InsurancePlanSchema),
  ProductCode: z.string(),
  ProductVersion: z.string(),
})

export const TravelInsuranceApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(TravelInsuranceDataSchema),
})

export const BenefitSchema = z.object({
  BenefitCode: z.string(),
  BenefitDesc: z.string(),
  BenefitType: z.string(),
  CoverageName: z.string(),
  DefaultLimitDesc: z.string(),
  DisplaySeqNo: z.string(),
  LimitModeDesc: z.string(),
  ParentBenefit: z.string(),
  Silimit: z.string(),
  SubCoverageName: z.string(),
})

export const PlanSchema = z.object({
  BeforeVatPremium: z.number(),
  CarrierPlanCode: z.string(),
  CarrierPlanDesc: z.string(),
  CarrierProductCode: z.string(),
  CarrierProductName: z.string(),
  DiscountAmount: z.number().nullable(),
  DuePremium: z.number(),
  GrossPremium: z.number(),
  LGTAmount: z.number(),
  MainBenefits: z.array(BenefitSchema),
  AddonBenefits: z.array(BenefitSchema),
  PremiumTaxAmt: z.number(),
  StampDuty: z.number(),
  SumInsured: z.string(),
  TaxAmount: z.number(),
  VatAmount: z.null(),
})

export const PromoCodeSchema = z.object({
  PromoCode: z.string(),
  DiscountPercent: z.string(),
})

export const TravelDetailSchema = z.object({
  TravelCoverageArea: z.string().min(2, 'Travel Coverage Area is required'),
  PlaceOfOrgin: z.string().min(2, 'Place of Origin is required'),
  TravelCountry: z.string().min(2, 'Travel Country is required'),
  DisplaySequence: z.number(),
})

export const PolicyCustomerSchema = z.object({
  DateOfBirth: z.string(),
})

export const PolicyRiskSchema = z.object({
  ProductElementCode: z.string(),
  IsMainInsured: z.string(),
  IsAdultTraveller: z.string(),
  FirstName: z.string(),
  MiddleName: z.string().nullable(),
  LastName: z.string(),
  DateOfBirth: z.string(),
  IdNo: z.string(),
  IdTypeCode: z.string(),
  Suffix: z.string().nullable(),
  Gender: z.string(),
  AddrProvince: z.string(),
  City: z.string(),
  PostCode: z.string(),
  AddressLine1: z.string(),
  AddressLine2: z.string().nullable(),
  Email: z.string(),
  Mobile: z.string(),
})

export const PolicyLobSchema = z.object({
  ProductCode: z.string(),
  PolicyRiskList: z.array(PolicyRiskSchema),
})

export const TravelPolicySchema = z.object({
  ProductCode: z.string(),
  ProductVersion: z.string(),
  EffectiveDate: z.string(),
  ExpiryDate: z.string(),
  TripType: z.string(),
  TravelType: z.string(),
  NoOfTravellers: z.number(),
  BranchCode: z.string(),
  Age: z.number(),
  LGT: z.number(),
  PromoCodeList: z.array(PromoCodeSchema),
  TravelDetailList: z.array(TravelDetailSchema),
  PolicyCustomerList: z.array(PolicyCustomerSchema),
  PolicyLobList: z.array(PolicyLobSchema),
})

// Inferred TypeScript Types
export type TravelInsuranceApiResponse = z.infer<
  typeof TravelInsuranceApiResponseSchema
>
export type TravelInsuranceData = z.infer<typeof TravelInsuranceDataSchema>
export type InsurancePlan = z.infer<typeof InsurancePlanSchema>
export type InsuranceBenefit = z.infer<typeof InsuranceBenefitSchema>
export type Benefit = z.infer<typeof BenefitSchema>
export type Plan = z.infer<typeof PlanSchema>
export type PromoCode = z.infer<typeof PromoCodeSchema>
export type TravelDetail = z.infer<typeof TravelDetailSchema>
export type PolicyCustomer = z.infer<typeof PolicyCustomerSchema>
export type PolicyRisk = z.infer<typeof PolicyRiskSchema>
export type PolicyLob = z.infer<typeof PolicyLobSchema>
export type TravelPolicy = z.infer<typeof TravelPolicySchema>

export type InitCompareQuote = {
  success: boolean
  message: string
  data: {
    ClientRequestId: string
    Message: string
    ProductCode: string
    ProductVersion: string
    Status: string
    SupportedCarrier: string[]
  }
}
