/**
 * Maps IGW insurer identities to the internal carrier codes used by the
 * COMPANIES constant and CARRIER_BRAND_COLORS.
 *
 * The backend identifies insurers two ways depending on the endpoint:
 *  - a short code, e.g. "MIC" (compare-quote `insurer.code`, proposal number prefix)
 *  - a display name, e.g. "Malayan Insurance" (quote resumption `quote.insurer`)
 *
 * Add entries here as new insurers are onboarded via IGW.
 */

const INSURER_NAME_TO_CARRIER_CODE: Record<string, string> = {
  'malayan insurance': 'MALAYAN',
  'oona insurance': 'OONAPH',
  'oona': 'OONAPH',
  'pacific cross': 'PACIFIC',
  'standard insurance': 'STANDARD',
  'pioneer insurance': 'PIONEER',
  'paramount': 'PARAMOUNT',
  'axa': 'AXAPH',
  'philcare': 'PHILCARE',
  'maxicare': 'MAXICARE',
}

const INSURER_CODE_TO_CARRIER_CODE: Record<string, string> = {
  MIC: 'MALAYAN',
  OONA: 'OONAPH',
}

export function insurerNameToCarrierCode(insurerName: string): string {
  const key = insurerName.toLowerCase()
  // Try exact match first, then prefix match
  if (INSURER_NAME_TO_CARRIER_CODE[key]) return INSURER_NAME_TO_CARRIER_CODE[key]
  for (const [pattern, code] of Object.entries(INSURER_NAME_TO_CARRIER_CODE)) {
    if (key.includes(pattern)) return code
  }
  // Fallback: uppercase first word of insurer name
  return insurerName.split(' ')[0].toUpperCase()
}

/**
 * Resolve a carrier code from whichever insurer shape an endpoint returns —
 * a bare name string ("Malayan Insurance") or an object ({ code, name }).
 * Falls back to the raw code/name uppercased so unknown insurers still get
 * a stable identifier for display.
 */
export function carrierCodeForInsurer(
  insurer: string | { code?: string; name?: string } | null | undefined
): string {
  if (!insurer) return ''
  if (typeof insurer === 'string') return insurerNameToCarrierCode(insurer)

  const code = insurer.code?.toUpperCase()
  if (code && INSURER_CODE_TO_CARRIER_CODE[code]) return INSURER_CODE_TO_CARRIER_CODE[code]
  if (insurer.name) return insurerNameToCarrierCode(insurer.name)
  return code ?? ''
}

/** Display name for whichever insurer shape an endpoint returns. */
export function insurerDisplayName(
  insurer: string | { code?: string; name?: string } | null | undefined
): string {
  if (!insurer) return ''
  return typeof insurer === 'string' ? insurer : (insurer.name ?? insurer.code ?? '')
}
