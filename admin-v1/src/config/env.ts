// Environment configuration with fallbacks
export const config = {
  BASE_URL: process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://dev-one-insurance.intel-soln.com.ph/api/v1',
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://dev-one-insurance.intel-soln.com.ph/api/v1',
  NEXT_PUBLIC_TOKEN: process.env.NEXT_PUBLIC_TOKEN || '184|EJekCImxy2PbTcJjFB1Vy2EZsyF8edp7MIvijCQ920b183f9',
  NEXT_PUBLIC_STORAGE_SECRET: process.env.NEXT_PUBLIC_STORAGE_SECRET || '047263bcd10f01d011687883df41a5ac07efd0890e4cf3be01f52af971137b48'
}