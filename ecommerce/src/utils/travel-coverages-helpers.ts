import { TravelCoverage } from '@/types/travel-insurance/travel-insurance-request'
import { PH_ID_TYPES } from '@/types/travel-insurance/travel-insurance-request'

export const getNormalizedTravelCoverages = (coverageMap: TravelCoverage) => {
  const allCountries = [
    ...coverageMap.DOMESTIC,
    ...coverageMap.APAC,
    ...coverageMap.SCHENGEN,
    ...coverageMap.WORLD,
  ]

  // Remove duplicates by code
  const uniqueCountries = Array.from(
    new Map(allCountries.map((c: any) => [c.code, c])).values()
  )

  const options = uniqueCountries.map((country: any) => ({
    ...country,
    label: `${country.flag} ${country.name}`,
    value: country.code,
  }))

  return options
}

export const getIdNameByIdType = (idType: string) => {
  return PH_ID_TYPES[idType as keyof typeof PH_ID_TYPES] || idType
}
