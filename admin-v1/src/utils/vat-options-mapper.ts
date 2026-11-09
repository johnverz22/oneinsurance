import { VatOptions } from '@/types/commission'

/**
 * Form data structure for VAT checkboxes
 */
export interface VatCheckboxState {
  isWithVAT: boolean
  returnVAT: boolean
  voidVAT: boolean
  applyGrossVAT: boolean
}

/**
 * Convert form checkbox states to vatOptions enum value
 * Only one checkbox should be true at a time
 */
export function getVatOptionFromCheckboxes(
  checkboxes: VatCheckboxState
): VatOptions {
  if (checkboxes.isWithVAT) return 'DEDUCT'
  if (checkboxes.returnVAT) return 'RETURN'
  if (checkboxes.voidVAT) return 'VOID'
  if (checkboxes.applyGrossVAT) return 'WITH_GROSS_VAT'
  
  // Default to DEDUCT if no option is selected
  return 'DEDUCT'
}

/**
 * Convert vatOptions enum value to checkbox states
 * Ensures only one checkbox is true
 */
export function getCheckboxesFromVatOption(
  vatOption?: VatOptions | null
): VatCheckboxState {
  const option = vatOption || 'DEDUCT'
  
  return {
    isWithVAT: option === 'DEDUCT',
    returnVAT: option === 'RETURN',
    voidVAT: option === 'VOID',
    applyGrossVAT: option === 'WITH_GROSS_VAT',
  }
}

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
    DEDUCT: 'VAT is deducted from the gross commission: net = (gross - VAT) - WHT',
    RETURN: 'VAT is returned to the agent/referral: net = (gross + VAT) - WHT',
    VOID: 'VAT is calculated but not applied: net = gross - WHT',
    WITH_GROSS_VAT: 'Gross VAT factor is applied: net = gross - WHT (with adjusted VAT calculation)',
  }
  
  return descriptions[vatOption]
}
