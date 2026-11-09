// Product code to name mappings - based on API data
export const PRODUCT_CODE_MAPPINGS: Record<string, string> = {
  'TRAVEL': 'Travel Insurance',
  // Add other product codes as they appear in real API data
}

/**
 * Get readable product name from product code
 */
export function getProductName(productCode?: string): string {
  if (!productCode) return 'N/A'
  return PRODUCT_CODE_MAPPINGS[productCode.toUpperCase()] || productCode
}

/**
 * Parse policy details JSON safely
 */
export function parsePolicyDetails(policyDetails?: string): any {
  if (!policyDetails) return null
  
  try {
    return typeof policyDetails === 'string' 
      ? JSON.parse(policyDetails) 
      : policyDetails
  } catch (e) {
    console.log('Failed to parse policy_details:', e)
    return null
  }
}