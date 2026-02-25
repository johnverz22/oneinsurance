import { VatOptions } from '@/types/commission-configuration'

/**
 * Get human-readable label for VAT option
 */
export function getVatOptionLabel(vatOption: VatOptions): string {
  const labels: Record<VatOptions, string> = {
    DEDUCT: 'Deduct VAT',
    RETURN: 'Return VAT',
    VOID: 'Void',
    WITH_GROSS_VAT: 'Apply Gross VAT',
  }
  
  return labels[vatOption]
}

/**
 * Get description for VAT option
 */
export function getVatOptionDescription(vatOption: VatOptions): string {
  const descriptions: Record<VatOptions, string> = {
    DEDUCT: 'VAT is deducted from the gross commission',
    RETURN: 'VAT is returned to the agent/referral',
    VOID: 'VAT is calculated but not applied',
    WITH_GROSS_VAT: 'Gross VAT factor is applied',
  }
  
  return descriptions[vatOption]
}

/**
 * Calculate net commission based on VAT option
 */
export function calculateNetCommission(params: {
  grossCommission: number
  vatRate: number
  whtRate: number
  vatOption: VatOptions
  grossVatRate?: number
}): {
  vatAmount: number
  whtAmount: number
  netCommission: number
  grossAfterVatFactor?: number
} {
  const { grossCommission, vatRate, whtRate, vatOption, grossVatRate = 0 } = params
  
  let vatAmount = 0
  let whtAmount = 0
  let netCommission = 0
  let grossAfterVatFactor: number | undefined
  
  switch (vatOption) {
    case 'DEDUCT':
      // DEDUCT: net = (gross - VAT) - WHT
      vatAmount = grossCommission * (vatRate / 100)
      whtAmount = grossCommission * (whtRate / 100)
      netCommission = (grossCommission - vatAmount) - whtAmount
      break
      
    case 'RETURN':
      // RETURN: net = (gross + VAT) - WHT
      vatAmount = grossCommission * (vatRate / 100)
      whtAmount = grossCommission * (whtRate / 100)
      netCommission = (grossCommission + vatAmount) - whtAmount
      break
      
    case 'VOID':
      // VOID: net = gross - WHT (VAT is voided/ignored, displayed with strikethrough in UI)
      vatAmount = grossCommission * (vatRate / 100)
      whtAmount = grossCommission * (whtRate / 100)
      netCommission = grossCommission - whtAmount
      break
      
    case 'WITH_GROSS_VAT':
      // WITH_GROSS_VAT: 
      // 1. grossAfterVatFactor = gross / (1 + grossVatRate%)
      // 2. VAT = grossAfterVatFactor * vatRate%
      // 3. WHT = grossAfterVatFactor * whtRate%
      // 4. net = gross - WHT
      if (grossVatRate > 0) {
        const vatFactor = 1 + (grossVatRate / 100)
        grossAfterVatFactor = grossCommission / vatFactor
        vatAmount = grossAfterVatFactor * (vatRate / 100)
        whtAmount = grossAfterVatFactor * (whtRate / 100)
        netCommission = grossCommission - whtAmount
      } else {
        // Fallback to VOID if grossVatRate is not provided
        vatAmount = grossCommission * (vatRate / 100)
        whtAmount = grossCommission * (whtRate / 100)
        netCommission = grossCommission - whtAmount
      }
      break
  }
  
  return {
    vatAmount,
    whtAmount,
    netCommission,
    grossAfterVatFactor,
  }
}
