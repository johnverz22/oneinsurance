import {
  InitTravelInsuranceRequest,
  TravelInsuranceFormData,
} from '@/types/travel-insurance/travel-insurance-request'

export function travelInsuranceSchemaToInitCompareQuote(
  travelInsurance: TravelInsuranceFormData
) {
  // Ensure dates are properly converted to Date objects
  const dateOfBirth = travelInsurance.dateOfBirth
    ? new Date(travelInsurance.dateOfBirth).toISOString().split('T').at(0)
    : null

  const departureDate = travelInsurance.departureDate
    ? new Date(travelInsurance.departureDate).toISOString().split('T').at(0)
    : null

  const returnDate = travelInsurance.returnDate
    ? new Date(travelInsurance.returnDate).toISOString().split('T').at(0)
    : null

  const age = (dob: Date | string) => {
    const dobDate = new Date(dob)
    const today = new Date()
    return today.getFullYear() - dobDate.getFullYear()
  }

  const travelDetailList = travelInsurance.travelDetailList.map((td) => ({
    TravelCoverageArea: td.TravelCoverageArea,
    PlaceOfOrgin: td.PlaceOfOrgin,
    TravelCountry: td.TravelCountry,
    DisplaySequence: td.DisplaySequence,
  }))

  return {
    ProductCode: 'TRAVEL',
    ProductVersion: '1.0',
    EffectiveDate: departureDate,
    ExpiryDate: returnDate,
    TripType: travelInsurance.isAnnualMultiTrip ? 'ANNUAL' : 'SINGLE',
    TravelType: travelInsurance.travelType.toUpperCase(),
    Age: travelInsurance.dateOfBirth ? age(travelInsurance.dateOfBirth) : 0,
    NoOfTravellers: travelInsurance.noOfAdults + travelInsurance.noOfChildren,
    BranchCode: '',
    LGT: '',
    PromoCodeList: '',
    TravelDetailList: travelDetailList,
    PolicyCustomerList: [
      {
        DateOfBirth: dateOfBirth,
      },
    ],
    PolicyLobList: [
      {
        ProductCode: 'TRAVEL',
        PolicyRiskList: [
          {
            ProductElementCode: 'R00001',
            IsMainInsured: 'Y',
            DateOfBirth: dateOfBirth,
            IsAdultTraveller: '',
            FirstName: '',
            MiddleName: '',
            LastName: '',
            IdNo: '',
            IdTypeCode: '',
            Suffix: '',
            Gender: '',
            AddrProvince: '',
            City: '',
            PostCode: '',
            AddressLine1: '',
            AddressLine2: '',
            Email: '',
            Mobile: '',
          },
        ],
      },
    ],
  } as InitTravelInsuranceRequest
}
