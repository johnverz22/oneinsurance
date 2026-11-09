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
