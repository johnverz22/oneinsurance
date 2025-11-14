import { z } from 'zod'

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
  data: TravelInsuranceDataSchema,
})

export type TravelCompareQuoteResponse = z.infer<
  typeof TravelInsuranceApiResponseSchema
>
