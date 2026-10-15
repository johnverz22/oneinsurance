/**
 * FX normalization for plan comparison.
 *
 * There is no live FX source in the app, so we normalize to PHP with a
 * constant map. Rates are indicative mid-market PHP-per-unit values —
 * update them together and keep them conservative (slightly high) so
 * converted prices never understate the foreign premium.
 */
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
  maximumFractionDigits: 0,
})

/** "₱2,548" — primary price display, always PHP. */
export function formatPHP(amount: number): string {
  return phpFormatter.format(amount)
}

/** "₱2.5M" / "₱950K" / "₱480" — compact PHP for coverage chips. */
export function formatPHPCompact(amount: number): string {
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

/** Format an amount in its own currency ("USD 41", "EUR 45", "PHP 1,084"). */
export function formatForeign(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString('en-PH')}`
  }
}

/**
 * Some insurers (e.g. Oona) send free-text limit notes with a bare number
 * instead of a structured amount ("Up to 1,000,000"). Reformat any bare
 * (no existing currency marker) 4+ digit number in the string through the
 * same PHP formatter so every monetary value on the card reads consistently
 * ("Up to ₱1,000,000"). Numbers already tagged with a currency marker
 * (₱, Php, PHP, USD, $, EUR) or followed by a unit (%, /day, hrs) are left
 * untouched so qualifiers like "Php 5,000/day" aren't double-prefixed.
 */
export function formatFreeTextMoney(text: string): string {
  return text.replace(
    /(?<![₱$]|(?:PHP|Php|USD|EUR)\s?)\b(\d{1,3}(?:,\d{3})+|\d{4,})\b(?!\s*(?:%|\/|days?|hrs?|hours?))/g,
    (match) => {
      const n = Number(match.replace(/,/g, ''))
      return Number.isFinite(n) ? `₱${n.toLocaleString('en-PH')}` : match
    }
  )
}
