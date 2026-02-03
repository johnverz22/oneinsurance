/**
 * Utility functions for managing CustomFields in localStorage
 * Used to store selected plan details that need to be passed to issue-quote request
 */

export interface CustomFields {
  CarrierPlanDesc?: string
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
 * Validate that required custom fields are present
 */
export function validateCustomFields(fields: CustomFields): boolean {
  // Add validation logic here if needed
  // For now, we just check if CarrierPlanDesc exists and is not empty
  return Boolean(fields.CarrierPlanDesc && fields.CarrierPlanDesc.trim().length > 0)
}