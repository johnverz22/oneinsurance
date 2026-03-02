export interface PolicyCustomer {
  AddrProvince: string
  AddressLine1: string
  AddressLine2?: string | null
  City: string
  DateOfBirth: string // ISO date string
  Email: string
  FirstName: string
  Gender: string
  IdNo: string
  IdTypeCode: string
  IsPolicyHolder?: string // 'Y' or 'N' - marks the policy holder
  LastName: string
  MiddleName?: string | null
  Mobile: string
  PostCode: string
  Suffix: string
  Title: string
}

export interface Nominee {
  FirstName: string
  MiddleName?: string | null
  LastName: string
  DateOfBirth: string // ISO date string (YYYY-MM-DD)
  Relationship: string
}

export interface PolicyCoverage {
  ProductElementCode: string
}

export interface PolicyRisk {
  FirstName: string
  LastName: string
  MiddleName: string
  AddrProvince: string
  AddressLine1: string
  AddressLine2?: string | null
  Age: number
  City: string
  DateOfBirth: string // ISO date string
  Email: string
  Gender: string
  IdNo: string
  IdTypeCode: string
  IsAdultTraveller: string
  IsMainInsured: string
  Mobile: string
  PolicyCoverageList: PolicyCoverage[]
  PostCode: string
  ProductElementCode: string
  Suffix?: string | null
}

export interface PolicyLob {
  PolicyRiskList: PolicyRisk[]
  ProductCode: string
}

export interface PromoCode {
  DiscountPercent: string
  PromoCode: string
}

export interface TravelDetail {
  DisplaySequence: number
  TravelCountry: string
  PlaceOfOrgin: string
  TravelCoverageArea: string
}

export interface TravellerListItem {
  first_name: string
  middle_name: string
  last_name: string
  date_of_birth: string // MM-DD-YYYY format
  contact_number: string
  is_covid_vaccinated: boolean
  is_data_sharing_consent: boolean
}

export interface CustomField {
  travellerlists: TravellerListItem[]
}

export interface FullQuoteRequest {
  AgentCode: string
  Age: number
  CarrierCode: string
  CarrierPlanCode: string
  CarrierProductCode: string
  EffectiveDate: string // ISO date string
  ExpiryDate: string // ISO date string
  IsAgent: string
  LGT: number
  NoOfAdults: number
  NoOfChildren: number
  NomineeList?: Nominee[] // Optional list of nominees/beneficiaries
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
  CustomField?: CustomField // Optional custom field with traveler details
}
