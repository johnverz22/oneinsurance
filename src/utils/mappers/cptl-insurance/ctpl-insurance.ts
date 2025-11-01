import {
  InitCompareCTPLRequest,
  CTPLProductType,
} from '@/types/ctpl-insurance/init-compare'
import { CptlInsuranceState } from '@/store/ctpl-store'
import { FullQuoteCTPLRequest } from '@/types/ctpl-insurance/full-quote'

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date | string): string {
  if (!date) return ''
  if (typeof date === 'string') return date.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

export function mapCptlStateToInitCompareRequest(
  state: Pick<
    CptlInsuranceState,
    'selectedVehicle' | 'vehicleRegistration' | 'personalInfo' | 'duration'
  >
): InitCompareCTPLRequest {
  const { selectedVehicle, vehicleRegistration, personalInfo, duration } = state

  return {
    Duration: duration.duration.toString(),
    EffectiveDate: formatDate(duration.effectiveDate),
    ExpiryDate: formatDate(duration.expiryDate),
    IsCTPL: 'Y',
    PolicyCustomerList: [
      {
        AddrProvince: personalInfo.province,
        AddressLine1: personalInfo.addressLine1,
        AddressLine2: personalInfo.addressLine2 ?? '',
        City: personalInfo.city,
        CustomerType: 'INDIVIDUAL', // Individual
        DateOfBirth: formatDate(personalInfo.dateOfBirth),
        Email: personalInfo.email,
        FirstName: personalInfo.firstName,
        Gender: personalInfo.gender,
        IdNo: personalInfo.idNumber,
        IdTypeCode: personalInfo.idType,
        LastName: personalInfo.lastName,
        MiddleName: personalInfo.middleName ?? '',
        Mobile: `(+63)${personalInfo.mobileNumber}`,
        PostCode: Number(personalInfo.zipCode) || 0,
        Suffix: personalInfo.suffix === 'No Suffix' ? '' : personalInfo.suffix,
        Title: personalInfo.gender === 'M' ? 'Mister' : 'Miss',
      },
    ],
    PolicyLobList: [
      {
        PolicyRiskList: [
          {
            BodyType: vehicleRegistration.bodyType,
            ChassisNo: vehicleRegistration.chassisNumber,
            DateOfRegistration: formatDate(
              vehicleRegistration.dateOfRegistration
            ),
            EngineNo: vehicleRegistration.engineNumber,
            FieldOfficeCode: vehicleRegistration.fieldOfficeCode,
            IsPlateNoAvailable: vehicleRegistration.plateNumber ? 'Y' : 'N',
            LicensePlateNumber: vehicleRegistration.plateNumber,
            ModelYear: vehicleRegistration.modelYear,
            MvFileNumber: vehicleRegistration.mvFileNumber,
            ProductElementCode: 'R00004', // Optional, fill if available
            SubModel: vehicleRegistration.subModel,
            VehicleMake: vehicleRegistration.make,
            VehicleModel: vehicleRegistration.model,
            VehicleUsage: vehicleRegistration.typeOfUse,
          },
        ],
        ProductCode: 'MOTOR',
      },
    ],
    ProductCode: 'MOTOR',
    ProductType: selectedVehicle.code as CTPLProductType,
    ProductVersion: '1.0', // or set as needed
  } as InitCompareCTPLRequest
}

export function mapCptlStateToFullQuoteRequest(state: CptlInsuranceState) {
  const {
    selectedVehicle,
    vehicleRegistration,
    personalInfo,
    duration,
    coverageOption,
  } = state

  return {
    CarrierCode: coverageOption.carrierCode,
    CarrierPlanCode: coverageOption.selectedPlan?.CarrierPlanCode || '',
    CarrierProductCode: coverageOption.selectedPlan?.CarrierProductCode || '',
    Duration: duration.duration.toString(),
    EffectiveDate: formatDate(duration.effectiveDate),
    ExpiryDate: formatDate(duration.expiryDate),
    IsCTPL: 'Y',
    PolicyCustomerList: [
      {
        AddrProvince: personalInfo.province,
        AddressLine1: personalInfo.addressLine1,
        AddressLine2: personalInfo.addressLine2 ?? '',
        City: personalInfo.city,
        CustomerType: 'INDIVIDUAL', // Individual
        DateOfBirth: formatDate(personalInfo.dateOfBirth),
        Email: personalInfo.email,
        FirstName: personalInfo.firstName,
        Gender: personalInfo.gender,
        IdNo: personalInfo.idNumber,
        IdTypeCode: personalInfo.idType,
        LastName: personalInfo.lastName,
        MiddleName: personalInfo.middleName ?? '',
        Mobile: `(+63)${personalInfo.mobileNumber}`,
        PostCode: Number(personalInfo.zipCode) || 0,
        Suffix: personalInfo.suffix === 'No Suffix' ? '' : personalInfo.suffix,
        Title: personalInfo.gender === 'M' ? 'Mister' : 'Miss',
      },
    ],
    PolicyLobList: [
      {
        PolicyRiskList: [
          {
            BodyType: vehicleRegistration.bodyType,
            ChassisNo: vehicleRegistration.chassisNumber,
            DateOfRegistration: formatDate(
              vehicleRegistration.dateOfRegistration
            ),
            EngineNo: vehicleRegistration.engineNumber,
            FieldOfficeCode: vehicleRegistration.fieldOfficeCode,
            IsPlateNoAvailable: vehicleRegistration.plateNumber ? 'Y' : 'N',
            LicensePlateNumber: vehicleRegistration.plateNumber,
            ModelYear: vehicleRegistration.modelYear,
            MvFileNumber: vehicleRegistration.mvFileNumber,
            ProductElementCode: 'R00004', // Optional, fill if available
            SubModel: vehicleRegistration.subModel,
            VehicleMake: vehicleRegistration.make,
            VehicleModel: vehicleRegistration.model,
            VehicleUsage: vehicleRegistration.typeOfUse,
          },
        ],
        ProductCode: 'MOTOR',
      },
    ],
    ProductCode: 'MOTOR',
    ProductType: selectedVehicle.code as CTPLProductType,
    ProductVersion: '1.0', // or set as needed
  } as FullQuoteCTPLRequest
}
