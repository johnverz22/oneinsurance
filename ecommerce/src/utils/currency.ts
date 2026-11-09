/**
 * Display formatting for monetary amounts.
 *
 * API payloads frequently deliver amounts as strings ("1234.56" or
 * "1,234.56"), so every entry point accepts `number | string` and coerces
 * before formatting. Display always uses two decimals ("1,234.56").
 */

const AMOUNT_FORMATTER = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Coerce an API amount (number or numeric string, commas allowed) to a finite number. */
export function toAmount(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'string' ? Number(value.replace(/,/g, '')) : value
  return Number.isFinite(n) ? n : 0
}

/** "1,234.56" — bare grouped amount with exactly two decimals. */
export function formatAmount(value: number | string | null | undefined): string {
  return AMOUNT_FORMATTER.format(toAmount(value))
}

/** "PHP 1,234.56". */
export function formatPHPAmount(value: number | string | null | undefined): string {
  return `PHP ${formatAmount(value)}`
}
