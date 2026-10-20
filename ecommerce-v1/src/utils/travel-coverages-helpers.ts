import { createElement } from 'react'
import { TravelCoverage } from '@/types/travel-insurance/travel-insurance-request'
import { PH_ID_TYPES } from '@/types/travel-insurance/travel-insurance-request'
import { CountryFlag } from '@/components/ui/country-flag'

// Stable component identity per flag so React doesn't remount icons every render
const flagIconCache = new Map<string, React.ComponentType<{ className?: string }>>()
const flagIconFor = (flag: string) => {
  let C = flagIconCache.get(flag)
  if (!C) {
    C = (props: { className?: string }) => createElement(CountryFlag, { flag, ...props })
    flagIconCache.set(flag, C)
  }
  return C
}

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
    // Flag emoji renders as letter pairs on Windows — the flag is shown via
    // the option icon (CountryFlag SVG) and kept out of the text label.
    label: country.name,
    icon: flagIconFor(country.flag),
    value: country.code,
  }))

  return options
}

export const getIdNameByIdType = (idType: string) => {
  return PH_ID_TYPES[idType as keyof typeof PH_ID_TYPES] || idType
}
