import { TravelInsuranceStoreState } from '@/store/travel-insurance-store'
import {
  FullQuoteRequest,
  PolicyCoverage,
  PolicyCustomer,
  PolicyLob,
  PolicyRisk,
  PromoCode,
  TravelDetail,
} from '@/types/full-quote-request'
import { InsurancePlan } from '@/types/plan'
import { calculateAge } from './calculate-age'
import { log } from 'console'

export function mapTravelInsuranceStoreToFullQuoteRequest(
  travelInsurance: Omit<
    TravelInsuranceStoreState,
    | 'clientRequest'
    | 'step'
    | 'policyNo'
    | 'highestVisitedStep'
    | 'isFormModified'
    | 'insurancePlans'
    | 'paymentSubmitResponse'
    | 'quoteRefetchCount'
    | 'refCode'
    | 'issueQuoteResponse'
    | 'selectedPaymentBrand'
    | 'paymentBillingDetails'
  >,
  agentCode: string,
  kycProfile?: {
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
) {
  const plan = travelInsurance.coverageOption.selectedPlan!

  // Add safety check for MainBenefits
  const mainBenefits = plan.MainBenefits || []
  const policyCoverageList = mainBenefits.map(
    (benefits) =>
      ({
        ProductElementCode: benefits.BenefitCode!,
      }) satisfies PolicyCoverage
  )

  if (travelInsurance.coverageOption.selectedAddonBenefits) {
    const addonBenefits =
      travelInsurance.coverageOption.selectedAddonBenefits.map(
        (benefit) =>
          ({
            ProductElementCode: benefit,
          }) as PolicyCoverage
      )
    policyCoverageList.push(...addonBenefits)

    // const childAddonBenefits = plan.AddonBenefits.map((benefit) => {
    //   if (
    //     travelInsurance.coverageOption.selectedAddonBenefits!.includes(
    //       benefit.ParentBenefit!
    //     )
    //   ) {
    //     return {
    //       ProductElementCode: benefit.BenefitCode!,
    //     } as PolicyCoverage
    //   }
    // })
    // console.log('childAddonBenefits', childAddonBenefits)
    // policyCoverageList.push(
    //   ...(childAddonBenefits.filter(Boolean) as PolicyCoverage[])
    // )
  }

  const departureDate = new Date(
    travelInsurance.travelDetails.departureDate.toString()
  )
    .toISOString()
    .split('T')
    .at(0)

  const returnDate = new Date(
    travelInsurance.travelDetails.returnDate!.toString()
  )
    .toISOString()
    .split('T')
    .at(0)

  const dateOfBirth = new Date(
    travelInsurance.travelDetails.dateOfBirth!.toString()
  )
    .toISOString()
    .split('T')
    .at(0)

  const age = calculateAge(new Date(travelInsurance.travelDetails.dateOfBirth!))

  const policyCustomerList: PolicyCustomer[] = []

  // If KYC profile is provided, add it as the policy holder first
  if (kycProfile) {
    const kycDobDate = kycProfile.dateOfBirth instanceof Date 
      ? kycProfile.dateOfBirth 
      : new Date(kycProfile.dateOfBirth)

    policyCustomerList.push({
      AddrProvince: kycProfile.state,
      AddressLine1: kycProfile.address,
      AddressLine2: null,
      City: kycProfile.city,
      DateOfBirth: kycDobDate.toISOString().split('T').at(0),
      Email: kycProfile.email,
      FirstName: kycProfile.firstName,
      Gender: kycProfile.gender === 'male' ? 'M' : kycProfile.gender === 'female' ? 'F' : 'M',
      IdNo: '', // KYC profile might not have ID number, will need to be filled separately
      IdTypeCode: 'PAS', // Default to passport, can be updated
      IsPolicyHolder: 'Y', // KYC signer is the policy holder
      LastName: kycProfile.lastName,
      MiddleName: '',
      Mobile: `+63${kycProfile.phoneNumber}`,
      PostCode: kycProfile.zipCode,
      Suffix: '',
      Title: kycProfile.gender === 'female' ? 'Miss' : 'Mister',
    } as PolicyCustomer)
  }

  // Add travelers to the policy customer list
  travelInsurance.travelersInfo.map((traveler, index) => {
    const dobDate =
      traveler.dateOfBirth instanceof Date
        ? traveler.dateOfBirth
        : new Date(traveler.dateOfBirth)

    policyCustomerList.push({
      AddrProvince: traveler.address.province,
      AddressLine1: traveler.address.line1,
      AddressLine2: traveler.address.line2 || 'null',
      City: traveler.address.city,
      DateOfBirth: dobDate.toISOString().split('T').at(0),
      Email: traveler.email,
      FirstName: traveler.firstName,
      Gender: traveler.gender,
      IdNo: traveler.idNumber,
      IdTypeCode: traveler.idType,
      IsPolicyHolder: 'N', // Travelers are not policy holders when KYC profile is provided, or first traveler is policy holder when no KYC
      LastName: traveler.lastName,
      MiddleName: traveler.middleName || '',
      Mobile: `+63${traveler.mobileNumber}`,
      PostCode: traveler.address.zipCode,
      Suffix: traveler.suffix === 'No Suffix' ? '' : traveler.suffix,
      Title: traveler.gender === 'F' ? 'Miss' : 'Mister',
    } as PolicyCustomer)
  })

  // If no KYC profile provided, set first traveler as policy holder (backward compatibility)
  if (!kycProfile && policyCustomerList.length > 0) {
    policyCustomerList[0].IsPolicyHolder = 'Y'
  }

  const policyRiskList: PolicyRisk[] = []

  travelInsurance.travelersInfo.forEach((traveler) => {
    // Ensure we have a proper Date object for date of birth
    const dobDate =
      traveler.dateOfBirth instanceof Date
        ? traveler.dateOfBirth
        : new Date(traveler.dateOfBirth)

    const travelerAge = calculateAge(dobDate)

    // Add traveler as insured person
    policyRiskList.push({
      FirstName: traveler.firstName,
      LastName: traveler.lastName,
      MiddleName: traveler.middleName || '',
      AddrProvince: traveler.address.province,
      AddressLine1: traveler.address.line1,
      AddressLine2: traveler.address.line2 || 'null',
      Age: travelerAge,
      City: traveler.address.city,
      DateOfBirth: dobDate.toISOString().split('T').at(0),
      Email: traveler.email,
      Gender: traveler.gender,
      IdNo: traveler.idNumber,
      IdTypeCode: traveler.idType,
      IsAdultTraveller: travelerAge >= 18 ? 'Y' : 'N',
      IsMainInsured: 'Y', // All travelers are main insured
      Mobile: `+63${traveler.mobileNumber}`,
      PolicyCoverageList: policyCoverageList,
      PostCode: traveler.address.zipCode,
      ProductElementCode: 'R00001',
      Suffix: traveler.suffix === 'No Suffix' ? '' : traveler.suffix,
    } as PolicyRisk)

    // NOTE: Beneficiary form is disabled - no beneficiary processing
  })

  const travelDetailList = travelInsurance.travelDetails.travelDetailList.map(
    (td) => ({
      TravelCoverageArea: td.TravelCoverageArea,
      PlaceOfOrgin: td.PlaceOfOrgin,
      TravelCountry: td.TravelCountry,
      DisplaySequence: td.DisplaySequence,
    })
  )

  return {
    AgentCode: agentCode,
    Age: age,
    CarrierCode: travelInsurance.coverageOption.carrierCode,
    CarrierPlanCode:
      travelInsurance.coverageOption.selectedPlan!.CarrierPlanCode,
    CarrierProductCode:
      travelInsurance.coverageOption.selectedPlan!.CarrierProductCode,
    EffectiveDate: departureDate!,
    ExpiryDate: returnDate!,
    IsAgent: 'N',
    LGT: parseInt(plan.LGTAmount.toString()),
    NoOfAdults: travelInsurance.travelDetails.noOfAdults,
    NoOfChildren: travelInsurance.travelDetails.noOfChildren,
    PlanCode: travelInsurance.coverageOption.selectedPlan!.CarrierPlanCode,
    PolicyCustomerList: policyCustomerList,
    PolicyLobList: [
      {
        ProductCode: 'TRAVEL',
        PolicyRiskList: policyRiskList as PolicyRisk[],
      },
    ] as PolicyLob[],
    Portal: 1,
    ProductCode: 'TRAVEL',
    ProductVersion: '1.0',
    PromoCodeList: '',
    TravelDetailList: travelDetailList as TravelDetail[],
    TravelType: travelInsurance.travelDetails.travelType,
    TripType: travelInsurance.travelDetails.isAnnualMultiTrip
      ? 'ANNUAL'
      : 'SINGLE',
  } satisfies FullQuoteRequest
}
