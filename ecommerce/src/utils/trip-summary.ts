import { differenceInCalendarDays, format, isSameMonth, isSameYear } from 'date-fns'
import { TravelCoverageMap } from '@/constants/travel-coverage'
import type { TravelCoverageArea } from '@/types/travel-insurance/travel-insurance-request'

export const titleCase = (value?: string) =>
  (value ?? '')
    .toLowerCase()
    .replace(/(^|[\s(-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())

const normKey = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

let coverageIndex: Map<string, { code: string; name: string; area: TravelCoverageArea }> | null = null
const getCoverageIndex = () => {
  if (coverageIndex) return coverageIndex
  coverageIndex = new Map()
  for (const area of Object.keys(TravelCoverageMap) as TravelCoverageArea[]) {
    for (const c of TravelCoverageMap[area]) {
      const entry = { code: c.code, name: c.name, area }
      if (!coverageIndex.has(c.code)) coverageIndex.set(c.code, entry)
      const nameKey = normKey(c.name)
      if (!coverageIndex.has(nameKey)) coverageIndex.set(nameKey, entry)
    }
  }
  return coverageIndex
}

/** Finds a coverage entry by internal code or display name. */
export const findCountry = (value?: string | null) =>
  value ? getCoverageIndex().get(normKey(value)) : undefined

/** Display name for a stored country code (e.g. KOREASOUTH -> "Korea (South)"). */
export const countryLabel = (code?: string | null) =>
  findCountry(code)?.name ?? titleCase(code ?? '')

export const getTripDays = (departure: Date, returning?: Date | null) =>
  Math.max(1, differenceInCalendarDays(returning ?? departure, departure) + 1)

export const formatDays = (days: number) =>
  `${days} ${days === 1 ? 'day' : 'days'}`

export const formatTravelers = (adults: number, children: number) => {
  const total = adults + children
  return `${total} ${total === 1 ? 'traveler' : 'travelers'}`
}

export const formatTripRange = (
  departure: Date,
  returning?: Date | null,
  compact = false
) => {
  const end = returning ?? departure
  if (!compact || !isSameYear(departure, end))
    return `${format(departure, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  if (isSameMonth(departure, end))
    return `${format(departure, 'MMM d')}–${format(end, 'd, yyyy')}`
  return `${format(departure, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}
