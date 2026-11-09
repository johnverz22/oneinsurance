/**
 * Feature flags — read from NEXT_PUBLIC_ env vars so they are inlined at
 * build time and available on both server and client.
 *
 * Convention:
 *   - Default to `true` (feature on) unless the var is explicitly "false".
 *   - Set the env var to "false" to disable a flag without redeploying code.
 */

const flag = (envVar: string, defaultOn = true): boolean => {
  const val = process.env[envVar]
  if (val === undefined || val === '') return defaultOn
  return val !== 'false' && val !== '0'
}

/**
 * Show the locally-hardcoded Pacific Cross travel plans alongside API results.
 * Defaults to OFF. Set NEXT_PUBLIC_PACIFIC_CROSS_STATIC_PLANS=true to re-enable.
 */
export const PACIFIC_CROSS_STATIC_PLANS = flag('NEXT_PUBLIC_PACIFIC_CROSS_STATIC_PLANS', false)
