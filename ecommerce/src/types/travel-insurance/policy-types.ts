import { z } from 'zod'
import { createResponseSchema } from '@/types/base-api-response'

// Shared Schemas
export const TempDataSchema = z.object({
  'Mask-IdNo': z.string().optional(),
  'MaskAfter-IdNo': z.string().optional(),
  'Mask-Mobile': z.string().optional(),
  'MaskAfter-Mobile': z.string().optional(),
})

export const PolicyCoverageSchema = z.object({
  BusinessObjectId: z.number(),
  CoverageName: z.string(),
  IsFinalLevelCt: z.string(),
  ParentElementType: z.string(),
  ParentPolicyElementId: z.number(),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyStatus: z.number(),
  ProductElementCode: z.string(),
  ProductElementId: z.number(),
  SequenceNumber: z.number(),
})

export const PolicyRiskSchema = z.object({
  AddrProvince: z.string(),
  AddressLine1: z.string(),
  AddressLine2: z.string().optional(),
  Age: z.number(),
  BusinessObjectId: z.number(),
  City: z.string(),
  DateOfBirth: z.string(),
  Email: z.string(),
  FirstName: z.string(),
  Gender: z.string(),
  IdNo: z.string(),
  IdTypeCode: z.string(),
  InsuredName: z.string().optional(),
  IsAdultTraveller: z.string(),
  IsMainInsured: z.string(),
  LastName: z.string(),
  MiddleName: z.string().optional(),
  Mobile: z.string(),
  ParentElementType: z.string(),
  ParentPolicyElementId: z.number(),
  PolicyCoverageList: z.array(z.lazy(() => PolicyCoverageSchema)).optional(),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyStatus: z.number(),
  PostCode: z.string(),
  ProductElementCode: z.string(),
  ProductElementId: z.number(),
  SequenceNumber: z.number(),
  Suffix: z.string().optional(),
  TempData: TempDataSchema,
})

export const PolicyLobSchema = z.object({
  BusinessObjectId: z.number(),
  ParentElementType: z.string(),
  ParentPolicyElementId: z.number(),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyRiskList: z.array(z.lazy(() => PolicyRiskSchema)),
  PolicyStatus: z.number(),
  ProductCode: z.string(),
  ProductElementCode: z.string(),
  ProductElementId: z.number(),
  ProductId: z.number(),
  ProductLobId: z.number(),
  SequenceNumber: z.number(),
  TechProductCode: z.string(),
  TechProductId: z.number(),
})

export const PromoCodeSchema = z.object({
  BusinessObjectId: z.number(),
  DiscountPercent: z.number(),
  ParentElementType: z.string(),
  ParentPolicyElementId: z.number(),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyStatus: z.number(),
  PromoCode: z.string(),
  SequenceNumber: z.number(),
})

export const TravelDetailSchema = z.object({
  BusinessObjectId: z.number(),
  DisplaySequence: z.number(),
  ParentElementType: z.string(),
  ParentPolicyElementId: z.number(),
  PlaceOfOrgin: z.string(),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyStatus: z.number(),
  SequenceNumber: z.number(),
  TravelCountry: z.string(),
  TravelCoverageArea: z.string(),
})

export const PolicyCustomerSchema = z.object({
  AddrProvince: z.string(),
  AddressLine1: z.string(),
  AddressLine2: z.string().optional(),
  BusinessObjectId: z.number().optional(),
  City: z.string(),
  DateOfBirth: z.string(),
  Email: z.string(),
  FirstName: z.string(),
  Gender: z.string(),
  IdNo: z.string(),
  IdTypeCode: z.string(),
  IsInsured: z.string().optional(),
  IsOrgParty: z.string().optional(),
  IsPolicyHolder: z.string().optional(),
  LastName: z.string(),
  MiddleName: z.string().optional(),
  Mobile: z.string(),
  ParentElementType: z.string().optional(),
  ParentPolicyElementId: z.number().optional(),
  PolicyElementId: z.number().optional(),
  PolicyId: z.string().optional(),
  PolicyStatus: z.number().optional(),
  PostCode: z.string(),
  SequenceNumber: z.number().optional(),
  Suffix: z.string().optional(),
  Title: z.string().optional(),
  TempData: TempDataSchema.optional(),
})

// Main Data Schemas
export const TravelPolicyDataSchema = z.object({
  Age: z.number(),
  AnnualPremium: z.number(),
  AutoUwResultCode: z.string(),
  BeforeVatPremium: z.number(),
  BusinessCateCode: z.string(),
  BusinessObjectId: z.number(),
  CarrierCode: z.string(),
  CarrierPlanCode: z.string(),
  CarrierProductCode: z.string(),
  DataEntryUserId: z.number(),
  DataEntryUserRealName: z.string(),
  DuePremium: z.number(),
  EffectiveDate: z.string(),
  ExpiryDate: z.string(),
  FirstDataEntryDate: z.string(),
  GrossPremium: z.number(),
  IsAgent: z.string(),
  IsPremiumCalcSuccess: z.string(),
  IsRenewable: z.string().optional(),
  IsTakeUpPolicy: z.string(),
  IssueDate: z.string().optional(),
  IssueUserId: z.number().optional(),
  IssueUserRealName: z.string().optional(),
  LGT: z.number(),
  NoOfAdults: z.number(),
  NoOfChildren: z.number(),
  NoOfTravellers: z.number(),
  OrgCode: z.string(),
  PlanCode: z.string(),
  PolicyCustomerList: z.array(PolicyCustomerSchema),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyLobList: z.array(PolicyLobSchema),
  PolicyNo: z.string().optional(),
  PolicyStatus: z.number(),
  PolicyStatusForDisplay: z.number().optional(),
  PolicyType: z.string(),
  Portal: z.string(),
  PremCalcFactorHash: z.string(),
  PremCalcResultHash: z.string(),
  ProductCode: z.string(),
  ProductId: z.number(),
  ProductVersion: z.string(),
  PromoCodeList: z.array(PromoCodeSchema).optional(),
  ProposalDate: z.string(),
  ProposalNo: z.string(),
  ProposalStatus: z.string(),
  QuotationDate: z.string(),
  SchemaVersion: z.number(),
  SumInsured: z.number().optional(),
  TechProductCode: z.string(),
  TechProductId: z.number(),
  TravelDays: z.number().optional(),
  TravelDetailList: z.array(TravelDetailSchema),
  TravelType: z.string(),
  TripType: z.string(),
  VersionSeq: z.number(),
})

export const TravelPolicyResponseSchema = createResponseSchema(
  TravelPolicyDataSchema
)
export type TravelPolicyResponse = z.infer<typeof TravelPolicyResponseSchema>
export type TravelPolicyData = z.infer<typeof TravelPolicyDataSchema>
export type PolicyRisk = z.infer<typeof PolicyRiskSchema>
export type PolicyCustomer = z.infer<typeof PolicyCustomerSchema>
export type PolicyLob = z.infer<typeof PolicyLobSchema>
export type PromoCode = z.infer<typeof PromoCodeSchema>
export type TravelDetail = z.infer<typeof TravelDetailSchema>
export type PolicyCoverage = z.infer<typeof PolicyCoverageSchema>
export type TempData = z.infer<typeof TempDataSchema>

export const FullQuoteResponseSchema = createResponseSchema(
  TravelPolicyDataSchema
)
export type FullQuoteResponse = z.infer<typeof FullQuoteResponseSchema>

export const IssueQuoteResponseSchema = createResponseSchema(
  TravelPolicyDataSchema
)
export type IssueQuoteResponse = z.infer<typeof IssueQuoteResponseSchema>

// For requests
export interface FullQuoteRequest {
  Age: number
  CarrierCode: string
  CarrierPlanCode: string
  CarrierProductCode: string
  EffectiveDate: string
  ExpiryDate: string
  IsAgent: string
  LGT: number
  NoOfAdults: number
  NoOfChildren: number
  PlanCode: string
  PolicyCustomerList: PolicyCustomer[]
  PolicyLobList: PolicyLob[]
  Portal: number
  ProductCode: string
  ProductVersion: string
  PromoCodeList: PromoCode[] | string
  TravelDetailList: TravelDetail[]
  TravelType: string
  TripType: string
}

export type IssueQuoteRequest = {
  ProposalNo: string
  PolicyPaymentInfoList?: Array<{
    PaymentReferenceNo: string
    PaymentDate: string
    Amount: string
    PaymentMode: string
    PaymentStatus: string
    IsInstallment: string
  }>
  CustomField?: {
    PlanName?: string
    [key: string]: any
  }
}
