export const SUPPORT = {
  phone: '+63 (2) 8123-4567',
  phoneHref: 'tel:+63281234567',
  email: 'support@oneinsurance.ph',
  hours: 'Mon–Fri, 8:00 AM–6:00 PM PHT',
  responseSlaHours: 24,
  /** Business rule: coverage starts only once the policy is issued. */
  coverageStartsOnIssuance: true,
  /** Show an urgency note when the trip departs within this many hours. */
  urgentTripWithinHours: 24,
  /** Failed retries (after the first failure) before support becomes the primary action. */
  escalateAfterRetries: 2,
} as const
