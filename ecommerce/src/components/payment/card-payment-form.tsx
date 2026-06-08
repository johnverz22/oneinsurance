'use client'

import { useState } from 'react'
import { useForm, Field } from '@tanstack/react-form'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldInfo } from '@/components/ui/form'
import { CreditCard, Lock, Shield, Eye, EyeOff } from 'lucide-react'
import { PaymentBrand } from '@/types/payment'
import { cn, toTitleCase } from '@/lib/utils'
import {
  mapCardPaymentToRequest,
  validateCardPaymentForm,
  generateTransactionId,
  type CardPaymentFormData,
  type PaymentRequestConfig,
} from '@/utils/payment-mappers'
import { FullQuoteResponse } from '@/types/travel-insurance/policy-types'
import { fullQuoteResponse } from '@/constants/travel-insurance/full-quote-response'
import { COUNTRIES } from '@/constants/countries'
import {
  getCityNameByCityCode,
  getProvinceNameByProvCode,
} from '@/utils/address-util'

// Card Payment Schema
const cardPaymentSchema = z.object({
  // Card specific fields
  cardNumber: z
    .string()
    .min(15, 'Card number must be at least 15 digits')
    .max(19, 'Card number must be at most 19 digits')
    .regex(/^[0-9\s]+$/, 'Card number must contain only numbers'),
  cardholderName: z
    .string()
    .min(2, 'Cardholder name must be at least 2 characters')
    .max(50, 'Cardholder name must be at most 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Cardholder name must contain only letters'),
  expiryMonth: z.string().min(1, 'Please select expiry month'),
  expiryYear: z.string().min(1, 'Please select expiry year'),
  ccv: z
    .string()
    .min(3, 'CVV must be at least 3 digits')
    .max(4, 'CVV must be at most 4 digits')
    .regex(/^[0-9]+$/, 'CVV must contain only numbers'),

  // Customer details
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name must contain only letters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name must contain only letters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        // If empty or undefined, it's valid (optional)
        if (!val || val.trim().length === 0) return true
        // If provided, validate it
        return (
          val.length >= 10 && val.length <= 15 && /^[0-9+\-\s()]+$/.test(val)
        )
      },
      {
        message: 'Please enter a valid phone number (10-15 digits)',
      }
    ),

  // Address
  addressLineOne: z
    .string()
    .min(1, 'Address Line 1 is required')
    .max(40, 'Address Line 1 must not exceed 40 characters'),

  addressLineTwo: z
    .string()
    .min(1, 'Address Line 2 is required')
    .max(40, 'Address Line 2 must not exceed 40 characters'),
  cityMunicipality: z
    .string()
    .min(2, 'City/Municipality must be at least 2 characters')
    .max(50, 'City/Municipality must be at most 50 characters'),
  stateProvinceRegion: z
    .string()
    .min(2, 'State/Province/Region must be at least 2 characters')
    .max(50, 'State/Province/Region must be at most 50 characters'),
  postalCode: z
    .string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(10, 'Postal code must be at most 10 characters')
    .regex(/^[0-9]+$/, 'Postal code must contain only numbers'),
  country: z.string({ message: 'Country is required' }),
})

interface CardPaymentFormProps {
  selectedBrand: PaymentBrand
  onSubmit: (paymentRequest: ReturnType<typeof mapCardPaymentToRequest>) => void
  isLoading?: boolean
  className?: string
  paymentConfig: PaymentRequestConfig
  fullQuoteResponse: FullQuoteResponse['data']
}

export function CardPaymentForm({
  selectedBrand,
  onSubmit,
  isLoading = false,
  className,
  paymentConfig,
  fullQuoteResponse,
}: CardPaymentFormProps) {
  const [showCcv, setShowCcv] = useState(false)

  const city = getCityNameByCityCode(
    fullQuoteResponse.PolicyCustomerList[0].City
  )
  const province = getProvinceNameByProvCode(
    fullQuoteResponse.PolicyCustomerList[0].AddrProvince
  )

  const form = useForm({
    defaultValues: {
      cardNumber: '',
      cardholderName: `${fullQuoteResponse.PolicyCustomerList[0].FirstName} ${fullQuoteResponse.PolicyCustomerList[0].LastName}`,
      expiryMonth: '',
      expiryYear: '',
      ccv: '',
      firstName: fullQuoteResponse.PolicyCustomerList[0].FirstName || '',
      lastName: fullQuoteResponse.PolicyCustomerList[0].LastName || '',
      email: fullQuoteResponse.PolicyCustomerList[0].Email || '',
      phone: '',
      addressLineOne:
        fullQuoteResponse.PolicyCustomerList[0].AddressLine1 || '',
      addressLineTwo:
        fullQuoteResponse.PolicyCustomerList[0].AddressLine2 || '',
      cityMunicipality: toTitleCase(city ?? ''),
      stateProvinceRegion: toTitleCase(province ?? ''),
      postalCode: fullQuoteResponse.PolicyCustomerList[0].PostCode || '',
      country: 'PH',
    } as CardPaymentFormData,
    validators: {
      onChange: cardPaymentSchema,
    },
    onSubmit: async ({ value }) => {
      // Validate form data
      const errors = validateCardPaymentForm(value as CardPaymentFormData)
      if (errors.length > 0) {
        // Handle validation errors - could show toast or set form errors
        return
      }

      // Map form data to payment request
      const paymentRequest = mapCardPaymentToRequest(
        value as CardPaymentFormData,
        selectedBrand,
        paymentConfig
      )

      // Call the onSubmit callback with the mapped data
      onSubmit(paymentRequest)
    },
  })

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits and format as +63 XXX XXX XXXX
    const digits = value.replace(/\D/g, '')
    if (digits.length >= 10) {
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
    } else if (digits.length >= 6) {
      return digits.replace(/(\d{3})(\d{1,3})/, '$1 $2')
    }
    return digits
  }

  const getCardType = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, '')
    if (number.startsWith('4')) return 'visa'
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard'
    if (number.startsWith('3')) return 'amex'
    return 'unknown'
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i)
  const months = [
    { value: '01', label: '01' },
    { value: '02', label: '02' },
    { value: '03', label: '03' },
    { value: '04', label: '04' },
    { value: '05', label: '05' },
    { value: '06', label: '06' },
    { value: '07', label: '07' },
    { value: '08', label: '08' },
    { value: '09', label: '09' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
    { value: '12', label: '12' },
  ]

  return (
    <div className={cn('mx-auto max-w-4xl space-y-3 lg:space-y-6', className)}>
      {/* Header */}
      <Card className="border-primary/20 bg-primary/5 shadow-none hidden lg:block">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-8 w-12 items-center justify-center rounded border bg-white">
              <img
                src={selectedBrand.image}
                alt={selectedBrand.value}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="text-lg">Pay with {selectedBrand.value}</span>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Secure payment processing</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6"
      >
        <div className="space-y-6">
          {/* Card Information */}
          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" />
                Card Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Card Number */}
              <form.Field name="cardNumber">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Card Number</Label>
                    <div className="relative">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value)
                          field.handleChange(formatted)
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="h-11 pr-12 text-base"
                        autoComplete="cc-number"
                      />
                      <div className="absolute top-1/2 right-3 -translate-y-1/2">
                        {getCardType(field.state.value) === 'visa' && (
                          <div className="text-xs font-bold text-blue-600">
                            VISA
                          </div>
                        )}
                        {getCardType(field.state.value) === 'mastercard' && (
                          <div className="text-xs font-bold text-red-600">
                            MC
                          </div>
                        )}
                        {getCardType(field.state.value) === 'amex' && (
                          <div className="text-xs font-bold text-green-600">
                            AMEX
                          </div>
                        )}
                      </div>
                    </div>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Cardholder Name */}
              <form.Field name="cardholderName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Card Holder Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.value.toUpperCase())
                      }
                      placeholder="JOHN DOE"
                      className="h-11 text-base uppercase placeholder:normal-case"
                      autoComplete="cc-name"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label>Expires On</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <form.Field name="expiryMonth">
                      {(field) => (
                        <div className="space-y-1">
                          <Select
                            value={field.state.value}
                            onValueChange={field.handleChange}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem
                                  key={month.value}
                                  value={month.value}
                                >
                                  {month.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="expiryYear">
                      {(field) => (
                        <div className="space-y-1">
                          <Select
                            value={field.state.value}
                            onValueChange={field.handleChange}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="YYYY" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>

                {/* CVV Field */}
                <form.Field name="ccv">
                  {(field) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor={field.name}
                        className="flex items-center gap-2"
                      >
                        CVV
                        <div className="group relative">
                          <Shield className="h-3 w-3 cursor-help text-gray-400" />
                          <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 group-hover:block">
                            <div className="rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white">
                              3-4 digit code on back of card
                            </div>
                          </div>
                        </div>
                      </Label>
                      <div className="relative">
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type={showCcv ? 'text' : 'password'}
                          placeholder="123"
                          maxLength={4}
                          className="h-11 pr-10 text-base"
                          autoComplete="cc-csc"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3"
                          onClick={() => setShowCcv(!showCcv)}
                        >
                          {showCcv ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* First and Last Name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="firstName">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>First Name</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="John"
                        className="h-11 text-base"
                        autoComplete="given-name"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="lastName">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Last Name</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Doe"
                        className="h-11 text-base"
                        autoComplete="family-name"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Email */}
              <form.Field name="email">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Email Address</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="john.doe@example.com"
                      type="email"
                      className="h-11 text-base"
                      autoComplete="email"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Phone Number */}
              <form.Field name="phone">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Phone Number (Optional)</Label>
                    <div className="relative">
                      <div className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500">
                        +63
                      </div>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value)
                          field.handleChange(formatted)
                        }}
                        placeholder="9XX XXX XXXX"
                        className="h-11 pl-12 text-base"
                        autoComplete="tel"
                      />
                    </div>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Country */}
              <form.Field name="country">
                {(field) => (
                  <div className="w-full space-y-2">
                    <Label htmlFor={field.name}>Country</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger className="h-11 w-full text-base">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* State and City */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="stateProvinceRegion">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>State/Province/Region</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Metro Manila"
                        className="h-11 text-base"
                        autoComplete="address-level1"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="cityMunicipality">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>City/Municipality</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Manila"
                        className="h-11 text-base"
                        autoComplete="address-level2"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Postal Code */}
              <form.Field name="postalCode">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Postal Code</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        field.handleChange(value)
                      }}
                      placeholder="1000"
                      className="h-11 text-base"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Address Line 1 */}
              <form.Field name="addressLineOne">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Address Line 1</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="123 Main Street"
                      className="h-11 text-base"
                      autoComplete="address-line1"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Address Line 2 */}
              <form.Field name="addressLineTwo">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Address Line 2</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Apartment, suite, etc."
                      className="h-11 text-base"
                      autoComplete="address-line2"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            type="submit"
            size="lg"
            className="from-primary to-lilac h-12 w-full rounded-full bg-gradient-to-r text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Complete Payment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
