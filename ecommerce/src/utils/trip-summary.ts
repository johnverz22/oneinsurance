import { differenceInCalendarDays, format, isSameMonth, isSameYear } from 'date-fns'

export const titleCase = (value?: string) =>
  (value ?? '')
    .toLowerCase()
    .replace(/(^|[\s(-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())

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
