import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Public storefront (ecommerce app) base URL used for agent referral links */
export const STOREFRONT_BASE_URL =
  process.env.NEXT_PUBLIC_ECOMMERCE_URL ?? 'https://oneinsurance.shop'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a Date or ISO string to YYYY-MM-DD
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  if (typeof date === 'string') return date.split('T')[0]
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }
  return ''
}

/**
 * Format a number as Philippine Peso currency
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'PHP'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

/**
 * Normalize a person's name to per-word capitalization.
 * Words already containing mixed case (e.g. "McDonald") are preserved.
 */
export function formatPersonName(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      const hasUpper = /[A-Z]/.test(word)
      const hasLower = /[a-z]/.test(word)
      if (hasUpper && hasLower) return word
      return word
        .split(/([-'])/)
        .map((seg) =>
          seg === '-' || seg === "'"
            ? seg
            : seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()
        )
        .join('')
    })
    .join(' ')
}

/**
 * Format a phone number for display, grouping digits for readability.
 * PH mobile numbers (09XX or +639XX) become "0912 345 6789" / "+63 912 345 6789".
 * Other formats are returned unchanged.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (/^09\d{9}$/.test(digits)) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  if (/^639\d{9}$/.test(digits)) {
    return `+63 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  return phone.trim()
}

/**
 * Get initials from a full name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate a string to a max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}
