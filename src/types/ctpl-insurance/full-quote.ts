import { InitCompareCTPLRequestSchema } from '@/types/ctpl-insurance/init-compare'
import { z } from 'zod'

export const FullQuoteCTPLRequestSchema = InitCompareCTPLRequestSchema.extend({
  CarrierCode: z.string(),
  CarrierPlanCode: z.string(),
  CarrierProductCode: z.string(),
})

export type FullQuoteCTPLRequest = z.infer<typeof FullQuoteCTPLRequestSchema>

export const FullQuoteCTPLResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    AnnualPremium: z.number(),
    AutoUwResultCode: z.string(),
    BeforeVatPremium: z.number(),
    BusinessCateCode: z.string(),
    BusinessObjectId: z.number(),
    CarrierCode: z.string(),
    CarrierPlanCode: z.string(),
    CarrierProductCode: z.string(),
    CarrierProposalNo: z.string(),
    DataEntryUserId: z.number(),
    DataEntryUserRealName: z.string(),
    DuePremium: z.number(),
    Duration: z.number(),
    EffectiveDate: z.string(), // ISO Date
    ExpiryDate: z.string(), // ISO Date
    FirstDataEntryDate: z.string(), // DateTime
    GrossPremium: z.number(),
    IsCTPL: z.string(),
    IsPremiumCalcSuccess: z.string(),
    IsRenewable: z.string(),
    IsTakeUpPolicy: z.string(),
    OrgCode: z.string(),

    PolicyCustomerList: z.array(
      z.object({
        AddrProvince: z.string(),
        AddressLine1: z.string(),
        AddressLine2: z.string(),
        BusinessObjectId: z.number(),
        City: z.string(),
        CustomerType: z.string(),
        DateOfBirth: z.string(), // ISO date
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
    ),

    PolicyElementId: z.number(),
    PolicyId: z.string(),

    PolicyLobList: z.array(
      z.object({
        BusinessObjectId: z.number(),
        ParentElementType: z.string(),
        ParentPolicyElementId: z.number(),
        PolicyElementId: z.number(),
        PolicyId: z.string(),
        PolicyRiskList: z.array(
          z.object({
            BodyType: z.string(),
            BusinessObjectId: z.number(),
            ChassisNo: z.string(),
            DateOfRegistration: z.string(),
            EngineNo: z.string(),
            FieldOfficeCode: z.string(),
            IsPlateNoAvailable: z.string(),
            LicensePlateNumber: z.string(),
            ModelYear: z.string(),
            MvFileNumber: z.string(),
            ParentElementType: z.string(),
            ParentPolicyElementId: z.number(),
            PolicyCoverageList: z.array(
              z.object({
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
            ),
            PolicyElementId: z.number(),
            PolicyId: z.string(),
            PolicyStatus: z.number(),
            ProductElementCode: z.string(),
            ProductElementId: z.number(),
            SequenceNumber: z.number(),
            SubModel: z.string(),
            VehicleMake: z.string(),
            VehicleModel: z.string(),
            VehicleType: z.string(),
            VehicleUsage: z.string(),
          })
        ),
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
    ),

    PolicyStatus: z.number(),
    PolicyStatusForDisplay: z.number(),
    PolicyType: z.string(),
    PremCalcFactorHash: z.string(),
    PremCalcResultHash: z.string(),
    PremiumTaxAmt: z.number(),
    ProductCode: z.string(),
    ProductId: z.number(),
    ProductType: z.string(),
    ProductVersion: z.string(),
    ProposalDate: z.string(),
    ProposalNo: z.string(),
    ProposalStatus: z.string(),
    QuotationDate: z.string(),
    ReferenceNo: z.string(),
    SchemaVersion: z.number(),
    TechProductCode: z.string(),
    TechProductId: z.number(),
    VersionSeq: z.number(),
  }),
})

export type FullQuoteCTPLResponse = z.infer<typeof FullQuoteCTPLResponseSchema>
