import {
  CoverageOptionFormData,
  TravelInsuranceFormData,
  TravelersInfoFormData,
} from '@/types/travel-insurance/travel-insurance-request'
import {
  PolicyCustomer,
  PolicyRisk,
  TravelDetail,
  TravelPolicyData,
} from '@/types/travel-insurance/policy-types'
import { calculateAge } from '@/utils/calculate-age'

// ── IGW full-quote contract (api_docs/travel_compare_quote_api2.md §3) ──────

export interface IgwFullQuoteTraveller {
  is_principal_applicant: boolean
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  date_of_birth: string // YYYY-MM-DD
  gender: 'male' | 'female'
  id_type: string
  id_number: string
  address: {
    line1: string
    line2: string | null
    city: string
    province: string
    city_code: string
    province_code: string
    postal_code: string
    country: string
  }
  email: string
  mobile: string
}

export interface IgwTravellerListEntry {
  first_name: string
  middle_name: string
  last_name: string
  date_of_birth: string // MM-DD-YYYY (kept from the old flow — API-only field)
  contact_number: string
  is_covid_vaccinated: boolean
  is_data_sharing_consent: boolean
}

export interface IgwFullQuoteRequest {
  ClientRequestId: string
  AgentCode: string
  insurer_code: string
  product_code: string
  plan_code: string
  client_email: string
  travellers: IgwFullQuoteTraveller[]
  CustomField: {
    PlanName: string
    TravellerLists: IgwTravellerListEntry[]
  }
}

export interface IgwFullQuoteResponse {
  success: boolean
  message: string
  data?: {
    id: string
    proposal_number: string
    status: string
    insurer: { code: string; name: string }
    product: { code: string; name: string }
    plan: { code: string; name: string }
    premium: { amount: string; currency: string }
    travellers: unknown[]
    expires_at: string
  }
  errors?: Record<string, string[]>
}

export interface KycProfile {
  email: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'prefer not to say'
  phoneNumber: string
  country: string
  state: string
  city: string
  zipCode: string
  address: string
}

// Helper: format a Date to YYYY-MM-DD using LOCAL date parts (avoids UTC shift)
function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

/**
 * Builds the IGW full-quote request per api_docs/travel_compare_quote_api2.md §3.1.
 * The traveller count must equal NoOfTravellers sent at compare-quote init, with
 * exactly one is_principal_applicant.
 */
export function mapToIgwFullQuoteRequest(
  state: {
    travelDetails: TravelInsuranceFormData
    coverageOption: CoverageOptionFormData
    travelersInfo: TravelersInfoFormData
  },
  clientRequestId: string,
  agentCode: string
): IgwFullQuoteRequest {
  const plan = state.coverageOption.selectedPlan!

  const travellers: IgwFullQuoteTraveller[] = state.travelersInfo.map(
    (t, index) => ({
      is_principal_applicant: index === 0,
      first_name: t.firstName,
      middle_name: t.middleName || null,
      last_name: t.lastName,
      suffix: t.suffix && t.suffix !== 'No Suffix' ? t.suffix : null,
      date_of_birth: formatLocalDate(toDate(t.dateOfBirth)),
      gender: t.gender === 'F' ? 'female' : 'male',
      id_type: t.idType,
      id_number: t.idNumber,
      address: {
        line1: t.address.line1,
        line2: t.address.line2 || null,
        city: t.address.city,
        province: t.address.province,
        city_code: t.address.city,
        province_code: t.address.province,
        postal_code: t.address.zipCode,
        country: 'PH',
      },
      email: t.email,
      mobile: t.mobileNumber,
    })
  )

  // Kept from the old flow — CustomField is used only by this API,
  // never forwarded to the insurer gateway.
  const travellerLists: IgwTravellerListEntry[] = state.travelersInfo.map(
    (t) => {
      const dob = toDate(t.dateOfBirth)
      const formattedDob = `${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}-${dob.getFullYear()}`
      return {
        first_name: t.firstName,
        middle_name: t.middleName || '',
        last_name: t.lastName,
        date_of_birth: formattedDob,
        contact_number: t.mobileNumber,
        is_covid_vaccinated: t.isCovidVaccinated || false,
        is_data_sharing_consent: t.is_data_sharing_consent || false,
      }
    }
  )

  return {
    ClientRequestId: clientRequestId,
    AgentCode: agentCode,
    insurer_code: plan.InsurerCode ?? '',
    product_code: plan.CarrierProductCode,
    plan_code: plan.CarrierPlanCode,
    client_email: state.travelersInfo[0]?.email ?? '',
    travellers,
    CustomField: {
      PlanName: plan.CarrierPlanDesc,
      TravellerLists: travellerLists,
    },
  }
}

/**
 * The IGW full-quote response is thin (proposal number + premium + echoes).
 * Downstream UI (review page, payment, PDF) still expects the old InsureMo
 * TravelPolicyData shape, so this synthesizes one by merging the response
 * with data we already hold in the store.
 */
export function igwFullQuoteToPolicyData(
  data: NonNullable<IgwFullQuoteResponse['data']>,
  ctx: {
    travelDetails: TravelInsuranceFormData
    coverageOption: CoverageOptionFormData
    travelersInfo: TravelersInfoFormData
    kycProfile?: KycProfile
  }
): TravelPolicyData {
  const { travelDetails, travelersInfo, coverageOption } = ctx
  const plan = coverageOption.selectedPlan!

  const premium = Number.parseFloat(data.premium.amount) || 0
  const now = new Date().toISOString()
  const departureDate = formatLocalDate(toDate(travelDetails.departureDate))
  const returnDate = formatLocalDate(toDate(travelDetails.returnDate!))
  const mainDob = travelDetails.dateOfBirth
    ? toDate(travelDetails.dateOfBirth)
    : null
  const age = mainDob ? calculateAge(mainDob) : 0

  const policyCustomerList: PolicyCustomer[] = []

  if (ctx.kycProfile) {
    const k = ctx.kycProfile
    policyCustomerList.push({
      AddrProvince: k.state,
      AddressLine1: k.address,
      City: k.city,
      DateOfBirth: formatLocalDate(toDate(k.dateOfBirth)),
      Email: k.email,
      FirstName: k.firstName,
      Gender: k.gender === 'female' ? 'F' : 'M',
      IdNo: '',
      IdTypeCode: 'PAS',
      IsPolicyHolder: 'Y',
      LastName: k.lastName,
      MiddleName: '',
      Mobile: `+63${k.phoneNumber}`,
      PostCode: k.zipCode,
      Suffix: '',
      Title: k.gender === 'female' ? 'Miss' : 'Mister',
    })
  }

  travelersInfo.forEach((t, i) => {
    policyCustomerList.push({
      AddrProvince: t.address.province,
      AddressLine1: t.address.line1,
      AddressLine2: t.address.line2 || undefined,
      City: t.address.city,
      DateOfBirth: formatLocalDate(toDate(t.dateOfBirth)),
      Email: t.email,
      FirstName: t.firstName,
      Gender: t.gender,
      IdNo: t.idNumber,
      IdTypeCode: t.idType,
      IsPolicyHolder: !ctx.kycProfile && i === 0 ? 'Y' : 'N',
      LastName: t.lastName,
      MiddleName: t.middleName || undefined,
      Mobile: `+63${t.mobileNumber}`,
      PostCode: t.address.zipCode,
      Suffix: t.suffix && t.suffix !== 'No Suffix' ? t.suffix : undefined,
      Title: t.gender === 'F' ? 'Miss' : 'Mister',
    })
  })

  const policyRiskList: PolicyRisk[] = travelersInfo.map((t, i) => {
    const dob = toDate(t.dateOfBirth)
    const travelerAge = calculateAge(dob)
    return {
      AddrProvince: t.address.province,
      AddressLine1: t.address.line1,
      AddressLine2: t.address.line2 || undefined,
      Age: travelerAge,
      BusinessObjectId: 0,
      City: t.address.city,
      DateOfBirth: formatLocalDate(dob),
      Email: t.email,
      FirstName: t.firstName,
      Gender: t.gender,
      IdNo: t.idNumber,
      IdTypeCode: t.idType,
      IsAdultTraveller: travelerAge >= 18 ? 'Y' : 'N',
      IsMainInsured: 'Y',
      LastName: t.lastName,
      MiddleName: t.middleName || undefined,
      Mobile: `+63${t.mobileNumber}`,
      ParentElementType: '',
      ParentPolicyElementId: 0,
      PolicyElementId: 0,
      PolicyId: data.id,
      PolicyStatus: 0,
      PostCode: t.address.zipCode,
      ProductElementCode: 'R00001',
      ProductElementId: 0,
      SequenceNumber: i + 1,
      Suffix: t.suffix && t.suffix !== 'No Suffix' ? t.suffix : undefined,
      TempData: {},
    }
  })

  const travelDetailList: TravelDetail[] = travelDetails.travelDetailList.map(
    (td, i) => ({
      BusinessObjectId: 0,
      DisplaySequence: td.DisplaySequence,
      ParentElementType: '',
      ParentPolicyElementId: 0,
      PlaceOfOrgin: td.PlaceOfOrgin,
      PolicyElementId: 0,
      PolicyId: data.id,
      PolicyStatus: 0,
      SequenceNumber: i + 1,
      TravelCountry: td.TravelCountry,
      TravelCoverageArea: td.TravelCoverageArea,
    })
  )

  return {
    Age: age,
    AnnualPremium: premium,
    AutoUwResultCode: '',
    BeforeVatPremium: premium,
    BusinessCateCode: '',
    BusinessObjectId: 0,
    CarrierCode: coverageOption.carrierCode,
    CarrierPlanCode: data.plan.code,
    CarrierProductCode: data.product.code,
    DataEntryUserId: 0,
    DataEntryUserRealName: '',
    DuePremium: premium,
    EffectiveDate: departureDate,
    ExpiryDate: returnDate,
    FirstDataEntryDate: now,
    GrossPremium: premium,
    IsAgent: 'N',
    IsPremiumCalcSuccess: 'Y',
    IsTakeUpPolicy: 'N',
    LGT: 0,
    NoOfAdults: travelDetails.noOfAdults,
    NoOfChildren: travelDetails.noOfChildren,
    NoOfTravellers: travelersInfo.length,
    OrgCode: '',
    PlanCode: data.plan.code,
    PolicyCustomerList: policyCustomerList,
    PolicyElementId: 0,
    PolicyId: data.id,
    PolicyLobList: [
      {
        BusinessObjectId: 0,
        ParentElementType: '',
        ParentPolicyElementId: 0,
        PolicyElementId: 0,
        PolicyId: data.id,
        PolicyRiskList: policyRiskList,
        PolicyStatus: 0,
        ProductCode: 'TRAVEL',
        ProductElementCode: 'R00001',
        ProductElementId: 0,
        ProductId: 0,
        ProductLobId: 0,
        SequenceNumber: 1,
        TechProductCode: 'TRAVEL',
        TechProductId: 0,
      },
    ],
    PolicyStatus: 0,
    PolicyType: 'TRAVEL',
    Portal: '1',
    PremCalcFactorHash: '',
    PremCalcResultHash: '',
    ProductCode: 'TRAVEL',
    ProductName: data.product.name,
    ProductId: 0,
    ProductVersion: '1.0',
    ProposalDate: now,
    ProposalNo: data.proposal_number,
    ProposalStatus: data.status,
    QuotationDate: now,
    SchemaVersion: 0,
    SumInsured: plan.SumInsured ? Number.parseFloat(plan.SumInsured) : 0,
    TechProductCode: 'TRAVEL',
    TechProductId: 0,
    TravelDetailList: travelDetailList,
    TravelType: travelDetails.travelType,
    TripType: travelDetails.isAnnualMultiTrip ? 'ANNUAL' : 'SINGLE',
    VersionSeq: 0,
  }
}
