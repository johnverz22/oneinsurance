import { PaymentSubmitRequest, PaymentBrand, DeviceInfo } from '@/types/payment'

// Form data interfaces matching the forms
export interface CardPaymentFormData {
  cardNumber: string
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  ccv: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  addressLineOne: string
  addressLineTwo?: string
  cityMunicipality: string
  stateProvinceRegion: string
  postalCode: string
  country: string
}

export interface DigitalPaymentFormData {
  phoneNumber?: string
  firstName: string
  lastName: string
  email: string
  addressLineOne: string
  addressLineTwo?: string
  cityMunicipality: string
  stateProvinceRegion: string
  postalCode: string
  country: string
}

// Additional payment details needed for the request
export interface PaymentRequestConfig {
  merchantAccountId: string
  merchantTransactionId: string
  productReferenceId?: string
  productDescription: string
  amount: number
  currency: string
  description?: string
  callbackUrl: string
  other_reference_1: string
  other_reference_1_caption: string
}

// Device information utilities
const getDeviceInfo = (): DeviceInfo => {
  const screen = window.screen
  const navigator = window.navigator

  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    browser_color_depth: screen.colorDepth.toString(),
    browser_language: navigator.language,
    browser_screen_height: screen.height.toString(),
    browser_screen_width: screen.width.toString(),
    os: getOperatingSystem(),
    browser_accept_header:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    user_agent: navigator.userAgent,
    browser_javascript_enabled: true,
    browser_java_enabled: navigator.javaEnabled() || false,
    accept_content:
      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  }
}

const getOperatingSystem = (): string => {
  const userAgent = window.navigator.userAgent

  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS')) return 'iOS'

  return 'Unknown'
}

// Get formatted timezone offset like "+8:00" or "-5:00"
const getFormattedTimezoneOffset = (): string => {
  const offsetMinutes = new Date().getTimezoneOffset()
  const offsetHours = Math.abs(offsetMinutes) / 60
  const hours = Math.floor(offsetHours)
  const minutes = Math.abs(offsetMinutes) % 60

  // getTimezoneOffset returns positive for timezones behind UTC, so we flip the sign
  const sign = offsetMinutes <= 0 ? '+' : '-'

  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Generate unique transaction ID
export const generateTransactionId = (): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `TEST${timestamp}${random}`.toUpperCase()
}

// Card payment mapper
export const mapCardPaymentToRequest = (
  formData: CardPaymentFormData,
  selectedBrand: PaymentBrand,
  config: PaymentRequestConfig
): PaymentSubmitRequest => {
  const deviceInfo = getDeviceInfo()

  // Clean card number and convert to number
  const cleanCardNumber = formData.cardNumber.replace(/\s/g, '')

  return {
    merchant_account_id: config.merchantAccountId,
    merchant_transaction_id: config.merchantTransactionId,
    product_reference_id: config.productReferenceId,
    product_description: config.productDescription || 'Product Payment',
    other_reference_1: config.other_reference_1,
    other_reference_1_caption: config.other_reference_1_caption,
    other_reference_2: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
    other_reference_2_caption: 'customer',
    first_name: formData.firstName.trim(),
    last_name: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: `${formData.phone?.replace(/\s/g, '')}` || '',
    address_line_one: formData.addressLineOne.trim(),
    address_line_two: formData.addressLineTwo?.trim() || '',
    city_municipality: formData.cityMunicipality.trim(),
    state_province_region: formData.stateProvinceRegion.trim(),
    country_code: formData.country.trim() || 'PH',
    postal_code: formData.postalCode.trim(),
    is_card_payment: true,
    card_holder_name: formData.cardholderName.trim().toUpperCase(),
    card_number: cleanCardNumber, // Keep as string
    expiration_month: formData.expiryMonth.padStart(2, '0'),
    expiration_year: formData.expiryYear.slice(-2).padStart(2, '0'), // Last 2 digits
    ccv: parseInt(formData.ccv, 10),
    payment_brand_code: selectedBrand.code,
    payment_brand: selectedBrand.value,
    amount: config.amount,
    currency: config.currency,
    description: config.description,
    callback_url: config.callbackUrl,
    time_offset: getFormattedTimezoneOffset(),
    device: deviceInfo,
  }
}

// Digital payment mapper
export const mapDigitalPaymentToRequest = (
  formData: DigitalPaymentFormData,
  selectedBrand: PaymentBrand,
  config: PaymentRequestConfig
): PaymentSubmitRequest => {
  const deviceInfo = getDeviceInfo()

  return {
    merchant_account_id: config.merchantAccountId,
    merchant_transaction_id: config.merchantTransactionId,
    product_reference_id: config.productReferenceId,
    product_description: config.productDescription || 'Product Payment',
    other_reference_1: config.other_reference_1,
    other_reference_1_caption: config.other_reference_1_caption,
    other_reference_2: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
    other_reference_2_caption: 'customer',
    first_name: formData.firstName.trim(),
    last_name: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: `${formData.phoneNumber?.replace(/\s/g, '')}` || '',
    address_line_one: formData.addressLineOne.trim(),
    address_line_two: formData.addressLineTwo?.trim() || '',
    city_municipality: formData.cityMunicipality.trim(),
    state_province_region: formData.stateProvinceRegion.trim(),
    country_code: formData.country.trim() || 'PH',
    postal_code: formData.postalCode.trim(),
    is_card_payment: false,
    // Card fields are undefined for digital payments
    payment_brand_code: selectedBrand.code,
    payment_brand: selectedBrand.value,
    amount: config.amount,
    currency: config.currency,
    description: config.description,
    callback_url: config.callbackUrl,
    time_offset: getFormattedTimezoneOffset(),
    device: deviceInfo,
  }
}

// Validation helpers
export const validateCardPaymentForm = (
  formData: CardPaymentFormData
): string[] => {
  const errors: string[] = []

  // Required field validation
  if (!formData.firstName.trim()) errors.push('First name is required')
  if (!formData.lastName.trim()) errors.push('Last name is required')
  if (!formData.email.trim()) errors.push('Email is required')
  if (!formData.addressLineOne.trim()) errors.push('Address is required')
  if (!formData.cityMunicipality.trim())
    errors.push('City/Municipality is required')
  if (!formData.stateProvinceRegion.trim())
    errors.push('State/Province/Region is required')
  if (!formData.postalCode.trim()) errors.push('Postal code is required')

  // Card specific validation
  if (!formData.cardNumber.replace(/\s/g, ''))
    errors.push('Card number is required')
  if (!formData.cardholderName.trim())
    errors.push('Cardholder name is required')
  if (!formData.expiryMonth) errors.push('Expiry month is required')
  if (!formData.expiryYear) errors.push('Expiry year is required')
  if (!formData.ccv) errors.push('CVV is required')

  // Expiration format validation
  if (formData.expiryMonth) {
    const month = parseInt(formData.expiryMonth, 10)
    if (month < 1 || month > 12) {
      errors.push('Please enter a valid month (01-12)')
    }
  }
  if (formData.expiryYear) {
    const year = parseInt(formData.expiryYear, 10)
    const currentYear = new Date().getFullYear()
    const fullYear = year < 100 ? 2000 + year : year
    if (fullYear < currentYear) {
      errors.push('Card expiration year cannot be in the past')
    }
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (formData.email && !emailRegex.test(formData.email)) {
    errors.push('Please enter a valid email address')
  }

  return errors
}

export const validateDigitalPaymentForm = (
  formData: DigitalPaymentFormData
): string[] => {
  const errors: string[] = []

  // Required field validation
  if (!formData.firstName.trim()) errors.push('First name is required')
  if (!formData.lastName.trim()) errors.push('Last name is required')
  if (!formData.email.trim()) errors.push('Email is required')
  if (!formData.addressLineOne.trim()) errors.push('Address is required')
  if (!formData.cityMunicipality.trim())
    errors.push('City/Municipality is required')
  if (!formData.stateProvinceRegion.trim())
    errors.push('State/Province/Region is required')
  if (!formData.postalCode.trim()) errors.push('Postal code is required')

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (formData.email && !emailRegex.test(formData.email)) {
    errors.push('Please enter a valid email address')
  }

  return errors
}
