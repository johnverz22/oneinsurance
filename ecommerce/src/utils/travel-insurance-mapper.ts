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
  agentCode: string
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

  travelInsurance.travelersInfo.map((traveler) => {
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
      LastName: traveler.lastName,
      MiddleName: traveler.middleName || '',
      Mobile: `+63${traveler.mobileNumber}`,
      PostCode: traveler.address.zipCode,
      Suffix: traveler.suffix,
      Title: traveler.gender === 'F' ? 'Miss' : 'Mister',
    } as PolicyCustomer)
  })

  const policyRiskList: PolicyRisk[] = []

  travelInsurance.travelersInfo.forEach((traveler) => {
    // Ensure we have a proper Date object for date of birth
    const dobDate =
      traveler.dateOfBirth instanceof Date
        ? traveler.dateOfBirth
        : new Date(traveler.dateOfBirth)

    const travelerAge = calculateAge(dobDate)

    // Add traveler as main insured
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
      Suffix: traveler.suffix || '',
    } as PolicyRisk)

    // If traveler has a beneficiary, add them as non-main insured with traveler's details
    if (
      traveler.beneficiary &&
      traveler.beneficiary.firstName &&
      traveler.beneficiary.firstName.length > 0
    ) {
      const beneficiary = traveler.beneficiary
      const beneficiaryDobDate =
        beneficiary.dateOfBirth instanceof Date
          ? beneficiary.dateOfBirth
          : new Date(beneficiary.dateOfBirth!)

      const beneficiaryAge = calculateAge(beneficiaryDobDate)

      policyRiskList.push({
        FirstName: beneficiary.firstName,
        LastName: beneficiary.lastName,
        MiddleName: beneficiary.middleName || '',
        AddrProvince: traveler.address.province, // Use traveler's address
        AddressLine1: traveler.address.line1,
        AddressLine2: traveler.address.line2 || 'null',
        Age: beneficiaryAge,
        City: traveler.address.city,
        DateOfBirth: beneficiaryDobDate.toISOString().split('T').at(0),
        Email: traveler.email, // Use traveler's email
        Gender: traveler.gender, // Use traveler's gender
        IdNo: traveler.idNumber, // Use traveler's ID
        IdTypeCode: traveler.idType,
        IsAdultTraveller: beneficiaryAge >= 18 ? 'Y' : 'N',
        IsMainInsured: 'N', // Beneficiaries are not main insured
        Mobile: `+63${traveler.mobileNumber}`, // Use traveler's mobile
        PolicyCoverageList: policyCoverageList,
        PostCode: traveler.address.zipCode,
        ProductElementCode: 'R00001',
        Suffix: traveler.suffix || '', // Use traveler's suffix
      } as PolicyRisk)
    }
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
