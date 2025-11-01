export function calculateInsuranceCost({
  grossPremium = 0,
  lgtAmount = 0,
  premiumTaxAmt = 0,
  stampDuty = 0,
  discountAmount = 0,
  taxAmount = 0,
  vatAmount = 0,
}: {
  grossPremium?: number | string
  lgtAmount?: number | string
  premiumTaxAmt?: number | string
  stampDuty?: number | string
  discountAmount?: number | string
  taxAmount?: number | string
  vatAmount?: number | string
}) {
  // Convert all to numbers, handle null/undefined
  const gross = parseFloat(grossPremium?.toString() || '0')
  const lgt = parseFloat(lgtAmount?.toString() || '0')
  const premiumTax = parseFloat(premiumTaxAmt?.toString() || '0')
  const stamp = parseFloat(stampDuty?.toString() || '0')
  const discount = parseFloat(discountAmount?.toString() || '0')
  const tax = parseFloat(taxAmount?.toString() || '0')
  const vat = parseFloat(vatAmount?.toString() || '0')

  const totalCalculated =
    gross + lgt + premiumTax + stamp - discount + tax + vat

  return totalCalculated.toFixed(2)
}
