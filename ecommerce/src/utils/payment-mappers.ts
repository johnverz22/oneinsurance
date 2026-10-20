// ---------------------------------------------------------------------------
// Payment mappers — DLT Hosted Checkout v4.0
//
// All payment types (card and e-wallet) go through exactly the same submit
// flow.  The browser collects billing details only — no card number, no CVV,
// no 3DS device block.  Card entry happens on the DLT-hosted page.
// ---------------------------------------------------------------------------

import { PaymentSubmitRequest, PaymentBrand } from '@/types/payment'

// ---------------------------------------------------------------------------
// Billing-details form data (collected by HostedCheckoutForm for all brands)
// ---------------------------------------------------------------------------
export interface BillingFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  addressLineOne: string
  addressLineTwo: string
  cityMunicipality: string
  stateProvinceRegion: string
  postalCode: string
  country: string
}

// ---------------------------------------------------------------------------
// Payment configuration passed in from the parent component.
// merchant_account_id, service_code, channel, and time_offset are all
// injected server-side by the BFF — never included here.
// ---------------------------------------------------------------------------
export interface PaymentRequestConfig {
  merchantTransactionId: string
  productReferenceId?: string
  /** Short label, max 80 chars */
  productName?: string
  /** Concise description, max 120 chars. Treat as required — DLT 500s without it. */
  productDescription: string
  /**
   * Decimal string e.g. "1299.00", or a number (pesos) which will be coerced.
   * Use pesosToDltString() to build the canonical string form.
   */
  amount: string | number
  currency?: string
  /** Full URL, e.g. https://app.example.com/[agent]/products/travel-insurance/avail?status=success */
  successUrl?: string
  failureUrl?: string
}

// ---------------------------------------------------------------------------
// Money helpers
//
// Amount travels as a decimal string throughout.  Never use parseFloat on it.
// ---------------------------------------------------------------------------

/**
 * Convert a PHP peso integer (e.g. 1 299 pesos) to the DLT decimal string
 * format: "1299.00".  Input is integer pesos (not cents).
 */
export function pesosToDltString(pesos: number): string {
  if (!Number.isFinite(pesos) || pesos < 0) return '0.00'
  // Use integer arithmetic to avoid floating-point drift
  const cents = Math.round(pesos * 100)
  return (cents / 100).toFixed(2)
}

/**
 * Convert an integer-cents value to DLT decimal string.
 */
export function centsToDltString(cents: number): string {
  if (!Number.isFinite(cents) || cents < 0) return '0.00'
  return (Math.round(cents) / 100).toFixed(2)
}

// ---------------------------------------------------------------------------
// Unified Hosted Checkout request mapper
//
// Works for every brand (card or e-wallet) — there is no branching.
// ---------------------------------------------------------------------------
export function mapToHostedCheckoutRequest(
  formData: BillingFormData,
  selectedBrand: PaymentBrand,
  config: PaymentRequestConfig
): PaymentSubmitRequest {
  // Coerce number to decimal string (peso value → "1299.00")
  const amount =
    typeof config.amount === 'number'
      ? pesosToDltString(config.amount)
      : config.amount

  return {
    merchant_transaction_id: config.merchantTransactionId,
    amount,
    currency: config.currency ?? 'PHP',

    payment_brand: selectedBrand.value,
    payment_brand_code: selectedBrand.code,

    product_name: (config.productName ?? config.productDescription).substring(0, 80) || 'Insurance',
    product_description: config.productDescription.substring(0, 120) || 'Product Payment',
    product_reference_id: config.productReferenceId,

    first_name: formData.firstName.trim(),
    last_name: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone.replace(/\s/g, ''),

    address_line_one: formData.addressLineOne.trim(),
    address_line_two: formData.addressLineTwo.trim() || 'N/A',
    city_municipality: formData.cityMunicipality.trim(),
    state_province_region: formData.stateProvinceRegion.trim(),
    country_code: (formData.country || 'PH').toUpperCase(),
    postal_code: formData.postalCode.trim(),

    success_url: config.successUrl,
    failure_url: config.failureUrl,
  }
}
