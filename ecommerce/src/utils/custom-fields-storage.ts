/**
 * Utility functions for managing CustomFields in localStorage
 * Used to store selected plan details that need to be passed to issue-quote request
 */

export interface CustomFields {
  PlanName?: string
  CarrierPlanDesc?: string
  CarrierProductName?: string
  [key: string]: any
}

const CUSTOM_FIELDS_KEY = 'travel-insurance-custom-fields'

/**
 * Store custom fields in localStorage
 */
export function storeCustomFields(fields: CustomFields): void {
  try {
    const existingFields = getCustomFields()
    const updatedFields = { ...existingFields, ...fields }
    localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(updatedFields))
    console.log('CustomFields stored:', updatedFields)
  } catch (error) {
    console.error('Failed to store CustomFields:', error)
  }
}

/**
 * Retrieve custom fields from localStorage
 */
export function getCustomFields(): CustomFields {
  try {
    const stored = localStorage.getItem(CUSTOM_FIELDS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      console.log('CustomFields retrieved:', parsed)
      return parsed
    }
  } catch (error) {
    console.error('Failed to retrieve CustomFields:', error)
  }
  return {}
}

/**
 * Clear custom fields from localStorage
 */
export function clearCustomFields(): void {
  try {
    localStorage.removeItem(CUSTOM_FIELDS_KEY)
    console.log('CustomFields cleared')
  } catch (error) {
    console.error('Failed to clear CustomFields:', error)
  }
}

/**
 * Store CarrierPlanDesc specifically (most common use case)
 */
export function storeCarrierPlanDesc(carrierPlanDesc: string): void {
  storeCustomFields({ CarrierPlanDesc: carrierPlanDesc })
}

/**
 * Get CarrierPlanDesc specifically
 */
export function getCarrierPlanDesc(): string | undefined {
  const fields = getCustomFields()
  return fields.CarrierPlanDesc
}

/**
 * Store PlanName specifically
 */
export function storePlanName(planName: string): void {
  storeCustomFields({ PlanName: planName })
}

/**
 * Get PlanName specifically
 */
export function getPlanName(): string | undefined {
  const fields = getCustomFields()
  return fields.PlanName
}

/**
 * Validate that required custom fields are present
 */
export function validateCustomFields(fields: CustomFields): boolean {
  // Check if PlanName exists and is not empty (primary requirement for issue-quote)
  return Boolean(fields.PlanName && fields.PlanName.trim().length > 0)
}