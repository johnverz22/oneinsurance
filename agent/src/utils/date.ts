import { format, isDate } from 'date-fns'
import type { DateRange } from 'react-day-picker'

export function formatSelection(
  date: Date | Date[] | DateRange | undefined,
  mode: 'single' | 'multiple' | 'range',
  dateFormat: string
) {
  if (!date) return undefined

  if (mode === 'single') {
    return date instanceof Date && isDate(date)
      ? format(date, dateFormat)
      : undefined
  }

  if (mode === 'multiple') {
    return Array.isArray(date) && date.length > 0
      ? date.map((d) => (d ? format(d, dateFormat) : '')).join(', ')
      : undefined
  }

  if (mode === 'range') {
    const range = date as DateRange
    if (range?.from && range?.to) {
      return `${format(range.from, dateFormat)} – ${format(range.to, dateFormat)}`
    }
    if (range?.from) {
      return format(range.from, dateFormat)
    }
    return undefined
  }
}

export function isValidSelection(
  date: Date | Date[] | DateRange | undefined,
  mode: 'single' | 'multiple' | 'range'
): boolean {
  if (!date) return false

  if (mode === 'single') {
    return date instanceof Date && isDate(date)
  }

  if (mode === 'multiple') {
    return (
      Array.isArray(date) &&
      date.length > 0 &&
      date.every((d) => d && isDate(d))
    )
  }

  if (mode === 'range') {
    const range = date as DateRange
    return !!(range?.from && isDate(range.from))
  }

  return false
}

export function getDateFormat(
  variant: 'date' | 'dateTime' = 'dateTime',
  mode: 'single' | 'multiple' | 'range' = 'single'
): string {
  if (variant === 'dateTime' && mode === 'single') {
    return 'MM/dd/yyyy hh:mm aa'
  }

  return 'MM/dd/yyyy'
}

export function getDatePlaceholderFormat(
  variant: 'date' | 'dateTime' = 'dateTime',
  mode: 'single' | 'multiple' | 'range' = 'single'
): string {
  const base =
    variant === 'dateTime' && mode === 'single'
      ? 'MM/dd/yyyy hh:mm aa'
      : 'MM/dd/yyyy'

  if (mode === 'range') {
    return `${base} - ${base}`
  }

  if (mode === 'multiple') {
    return `${base}, ${base}, ...`
  }

  return base
}

export const getCurrentMonthRange = () => {
  const now = new Date()

  const firstDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const format = (date: Date) => date.toISOString().split('T')[0]

  return {
    currentFirstDate: format(firstDate),
    currentLastDate: format(lastDate),
  }
}
