import { z } from 'zod'

// Policy Customer Schema
export const PolicyCustomerSchema = z.object({
  AddrProvince: z.string(),
  AddressLine1: z.string(),
  AddressLine2: z.string(),
  BusinessObjectId: z.number(),
  City: z.string(),
  DateOfBirth: z.string(),
  Email: z.string(),
  FirstName: z.string(),
  Gender: z.string(),
  IdNo: z.string(),
  IdTypeCode: z.string(),
  IsInsured: z.string(),
  IsOrgParty: z.string(),
  IsPolicyHolder: z.string(),
  LastName: z.string(),
  MiddleName: z.string(),
  Mobile: z.string(),
  ParentElementType: z.string(),
  ParentPolicyElementId: z.number(),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyStatus: z.number(),
  PostCode: z.string(),
  SequenceNumber: z.number(),
  Suffix: z.string(),
  Title: z.string(),
  TempData: z.object({
    'Mask-IdNo': z.string(),
    'MaskAfter-IdNo': z.string(),
    'Mask-Mobile': z.string(),
    'MaskAfter-Mobile': z.string(),
  }),
})

// Policy Coverage Schema
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

// Policy Risk Schema
export const PolicyRiskSchema = z.object({
  AddrProvince: z.string(),
  AddressLine1: z.string(),
  AddressLine2: z.string(),
  Age: z.number(),
  BusinessObjectId: z.number(),
  City: z.string(),
  DateOfBirth: z.string(),
  Email: z.string(),
  FirstName: z.string(),
  Gender: z.string(),
  IdNo: z.string(),
  IdTypeCode: z.string(),
  InsuredName: z.string(),
  IsAdultTraveller: z.string(),
  IsMainInsured: z.string(),
  LastName: z.string(),
  MiddleName: z.string(),
  Mobile: z.string(),
  ParentElementType: z.string(),
  ParentPolicyElementId: z.number(),
  PolicyCoverageList: z.array(PolicyCoverageSchema),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyStatus: z.number(),
  PostCode: z.string(),
  ProductElementCode: z.string(),
  ProductElementId: z.number(),
  SequenceNumber: z.number(),
  Suffix: z.string(),
  TempData: z.object({
    'Mask-IdNo': z.string(),
    'MaskAfter-IdNo': z.string(),
    'Mask-Mobile': z.string(),
    'MaskAfter-Mobile': z.string(),
  }),
})

// Policy LOB Schema
export const PolicyLobSchema = z.object({
  BusinessObjectId: z.number(),
  ParentElementType: z.string(),
  ParentPolicyElementId: z.number(),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyRiskList: z.array(PolicyRiskSchema),
})

// Promo Code Schema
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

// Travel Detail Schema
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

// Nominee Schema
export const NomineeSchema = z.object({
  FirstName: z.string(),
  MiddleName: z.string().optional(),
  LastName: z.string(),
  DateOfBirth: z.string(),
  Relationship: z.string(),
  SharePercent: z.number().optional(),
  BusinessObjectId: z.number().optional(),
  ParentElementType: z.string().optional(),
  ParentPolicyElementId: z.number().optional(),
  PolicyElementId: z.number().optional(),
  PolicyId: z.string().optional(),
  PolicyStatus: z.number().optional(),
  SequenceNumber: z.number().optional(),
})

// Policy Details Schema (the JSON string parsed)
export const PolicyDetailsSchema = z.object({
  Age: z.number(),
  AnnualPremium: z.number(),
  AutoUwResultCode: z.string(),
  BeforeVatPremium: z.number(),
  BusinessCateCode: z.string(),
  BusinessObjectId: z.number(),
  CarrierCode: z.string(),
  CarrierPlanCode: z.string(),
  CarrierPolicyNo: z.string(),
  CarrierProductCode: z.string(),
  CarrierProductName: z.string(),
  CarrierProposalNo: z.string(),
  DataEntryUserId: z.number(),
  DataEntryUserRealName: z.string(),
  DuePremium: z.number(),
  EffectiveDate: z.string(),
  ExpiryDate: z.string(),
  FirstDataEntryDate: z.string(),
  GrossPremium: z.number(),
  InsertBy: z.number(),
  InsertTime: z.string(),
  IsAgent: z.string(),
  IsPremiumCalcSuccess: z.string(),
  IsRenewable: z.string(),
  IsTakeUpPolicy: z.string(),
  IssueDate: z.string(),
  IssueUserId: z.number(),
  IssueUserRealName: z.string(),
  LGT: z.number(),
  NoOfAdults: z.number(),
  NoOfChildren: z.number(),
  NoOfTravellers: z.number(),
  NomineeList: z.array(NomineeSchema).optional(),
  OldPrimaryKey: z.number(),
  OrgCode: z.string(),
  PlanCode: z.string(),
  PolicyCustomerList: z.array(PolicyCustomerSchema),
  PolicyElementId: z.number(),
  PolicyId: z.string(),
  PolicyLobList: z.array(PolicyLobSchema),
  PolicyStatus: z.number(),
  PolicyStatusForDisplay: z.number(),
  PolicyType: z.string(),
  Portal: z.string(),
  PremCalcFactorHash: z.string(),
  PremCalcResultHash: z.string(),
  PremiumTaxAmt: z.number(),
  ProductCode: z.string(),
  ProductId: z.number(),
  ProductName: z.string(),
  ProductVersion: z.string(),
  PromoCodeList: z.array(PromoCodeSchema),
  ProposalDate: z.string(),
  ProposalNo: z.string(),
  ProposalStatus: z.string(),
  QuotationDate: z.string(),
  SchemaVersion: z.number(),
  SumInsured: z.number(),
  TechProductCode: z.string(),
  TechProductId: z.number(),
  TravelDetailList: z.array(TravelDetailSchema),
  TravelType: z.string(),
  TripType: z.string(),
  UpdateBy: z.number(),
  UpdateTime: z.string(),
  VersionSeq: z.number(),
})

// Main Policy Response Schema (updated to handle transaction data)
export const PolicyResponseSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  agent_code_used: z.string(),
  proposal_number: z.string(),
  carrier_product_code: z.string(),
  policy_id: z.string(),
  policy_number: z.string().nullable(),
  policy_details: z.string().nullable().transform((str) => {
    if (!str) return null
    try {
      return PolicyDetailsSchema.parse(JSON.parse(str))
    } catch {
      return null
    }
  }),
  merchant_transaction_id: z.string().nullable(),
  amount: z.union([z.number(), z.string()]).nullable().transform((val) => {
    if (val === null || val === undefined) return null
    return typeof val === 'string' ? parseFloat(val) : val
  }),
  payment_brand: z.string().nullable(),
  payment_method: z.string().nullable(),
  customer_id: z.number().nullable(),
  customer_name: z.string().nullable(), // Add customer name field
  transaction_status: z.string().nullable(),
  transaction_date: z.string().nullable(),
  status: z.string(),
  transaction_status_code: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  commission_log: z.any().nullable(),
})

// API Response Schema
export const PolicyApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: PolicyResponseSchema,
})

// TypeScript Types
export type PolicyCustomer = z.infer<typeof PolicyCustomerSchema>
export type PolicyCoverage = z.infer<typeof PolicyCoverageSchema>
export type PolicyRisk = z.infer<typeof PolicyRiskSchema>
export type PolicyLob = z.infer<typeof PolicyLobSchema>
export type PromoCode = z.infer<typeof PromoCodeSchema>
export type TravelDetail = z.infer<typeof TravelDetailSchema>
export type Nominee = z.infer<typeof NomineeSchema>
export type PolicyDetails = z.infer<typeof PolicyDetailsSchema>
export type PolicyResponse = z.infer<typeof PolicyResponseSchema>
export type PolicyApiResponse = z.infer<typeof PolicyApiResponseSchema>