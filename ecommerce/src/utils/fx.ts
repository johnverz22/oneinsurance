/**
 * FX normalization for plan comparison.
 *
 * There is no live FX source in the app, so we normalize to PHP with a
 * constant map. Rates are indicative mid-market PHP-per-unit values —
 * update them together and keep them conservative (slightly high) so
 * converted prices never understate the foreign premium.
 */
import { formatAmount } from '@/utils/currency'

export const PHP_PER_UNIT: Record<string, number> = {
  PHP: 1,
  USD: 59,
  EUR: 64,
}

/** Convert an amount in `currency` to PHP. Unknown currencies pass through. */
export function toPHP(amount: number, currency?: string | null): number {
  const rate = PHP_PER_UNIT[(currency ?? 'PHP').toUpperCase()]
  return amount * (rate ?? 1)
}

const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** "₱2,548.00" — primary price display, always PHP. */
export function formatPHP(amount: number): string {
  return Number.isFinite(amount) ? phpFormatter.format(amount) : '—'
}

/** "₱2.5M" / "₱950K" / "₱480" — compact PHP for coverage chips. */
export function formatPHPCompact(amount: number): string {
  if (!Number.isFinite(amount)) return '—'
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000
    return `₱${Number(m.toFixed(1))}M`
  }
  if (amount >= 1_000) {
    const k = amount / 1_000
    return `₱${Number(k.toFixed(1))}K`
  }
  return `₱${Math.round(amount)}`
}

/** Format an amount in its own currency ("USD 41.00", "EUR 45.00", "PHP 1,084.00"). */
export function formatForeign(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${formatAmount(amount)}`
  }
}

/**
 * Some insurers (e.g. Oona) send free-text limit notes with a bare number
 * instead of a structured amount ("Up to 1,000,000"), or a tagged amount
 * without decimals ("PHP 500,000"). Normalize every monetary value to two
 * decimals: tagged amounts keep their marker ("PHP 500,000.00",
 * "Php 5,000.00/day"), while bare 4+ digit numbers get a ₱ prefix
 * ("Up to ₱1,000,000.00"). Bare numbers followed by a unit (%, /, days,
 * hrs) are left untouched.
 */
export function formatFreeTextMoney(text: string): string {
  const tagged = text.replace(
    /(₱|\$|€|\bPHP\b|\bPhp\b|\bUSD\b|\bEUR\b)(\s*)(\d[\d,]*(?:\.\d+)?)/g,
    (_m, marker: string, space: string, num: string) => {
      const n = Number(num.replace(/,/g, ''))
      return Number.isFinite(n) ? `${marker}${space}${formatAmount(n)}` : _m
    }
  )
  return tagged.replace(
    /(?<![₱$€\d,]|(?:PHP|Php|USD|EUR)\s?)\b(\d{1,3}(?:,\d{3})+|\d{4,})(?:\.\d+)?\b(?!\s*(?:%|\/|days?|hrs?|hours?))/g,
    (match) => {
      const n = Number(match.replace(/,/g, ''))
      return Number.isFinite(n) ? `₱${formatAmount(n)}` : match
    }
  )
}
