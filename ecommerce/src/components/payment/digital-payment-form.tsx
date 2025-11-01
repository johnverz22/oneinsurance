'use client'

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldInfo } from '@/components/ui/form'
import { Smartphone, Shield, ArrowRight } from 'lucide-react'
import { PaymentBrand } from '@/types/payment'
import { cn, toTitleCase } from '@/lib/utils'
import {
  mapDigitalPaymentToRequest,
  validateDigitalPaymentForm,
  generateTransactionId,
  type DigitalPaymentFormData,
  type PaymentRequestConfig,
} from '@/utils/payment-mappers'
import { FullQuoteResponse } from '@/types/travel-insurance/policy-types'
import {
  getCityNameByCityCode,
  getProvinceNameByProvCode,
} from '@/utils/address-util'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COUNTRIES } from '@/constants/countries'

// Digital Payment Schema
const digitalPaymentSchema = z.object({
  // Digital wallet specific fields
  phoneNumber: z
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
    .max(4, 'Postal code must be at most 4 characters')
    .regex(/^[0-9]+$/, 'Postal code must contain only numbers'),
  country: z.string({ message: 'Country is required' }),
})

interface DigitalPaymentFormProps {
  selectedBrand: PaymentBrand
  onSubmit: (
    paymentRequest: ReturnType<typeof mapDigitalPaymentToRequest>
  ) => void
  onBack: () => void
  isLoading?: boolean
  className?: string
  paymentConfig: PaymentRequestConfig
  fullQuoteResponse: FullQuoteResponse['data']
}

export function DigitalPaymentForm({
  selectedBrand,
  onSubmit,
  onBack,
  isLoading = false,
  className,
  paymentConfig,
  fullQuoteResponse,
}: DigitalPaymentFormProps) {
  const city = getCityNameByCityCode(
    fullQuoteResponse.PolicyCustomerList[0].City
  )
  const province = getProvinceNameByProvCode(
    fullQuoteResponse.PolicyCustomerList[0].AddrProvince
  )

  const form = useForm({
    defaultValues: {
      phoneNumber: '',
      firstName: fullQuoteResponse.PolicyCustomerList[0]?.FirstName || '',
      lastName: fullQuoteResponse.PolicyCustomerList[0]?.LastName || '',
      email: fullQuoteResponse.PolicyCustomerList[0]?.Email || '',
      addressLineOne:
        fullQuoteResponse.PolicyCustomerList[0].AddressLine1 || '',
      addressLineTwo:
        fullQuoteResponse.PolicyCustomerList[0].AddressLine2 || '',
      cityMunicipality: toTitleCase(city ?? ''),
      stateProvinceRegion: toTitleCase(province ?? ''),
      postalCode: fullQuoteResponse.PolicyCustomerList[0]?.PostCode || '',
      country: 'PH',
    } as DigitalPaymentFormData,
    onSubmit: async ({ value }) => {
      // Validate form data
      const errors = validateDigitalPaymentForm(value as DigitalPaymentFormData)
      if (errors.length > 0) {
        // Handle validation errors - could show toast or set form errors
        return
      }

      // Map form data to payment request
      const paymentRequest = mapDigitalPaymentToRequest(
        value as DigitalPaymentFormData,
        selectedBrand,
        paymentConfig
      )

      // Call the onSubmit callback with the mapped data
      onSubmit(paymentRequest)
    },
    validators: {
      onChange: digitalPaymentSchema,
    },
  })

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Format as XXX XXX XXXX
    if (digits.length >= 7) {
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
    } else if (digits.length >= 4) {
      return digits.replace(/(\d{3})(\d{1,3})/, '$1 $2')
    }
    return digits
  }

  return (
    <div className={cn('mx-auto max-w-4xl space-y-6', className)}>
      {/* Header */}
      <Card className="border-primary/20 bg-primary/5">
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
                <Smartphone className="h-4 w-4" />
                <span>Digital wallet payment</span>
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
          {/* Payment Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone Number */}
              <form.Field name="phoneNumber">
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
                    <p className="text-xs text-gray-500">
                      Phone number linked to your {selectedBrand.value} account
                    </p>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
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
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
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
            type="button"
            variant="outline"
            size="lg"
            className="h-12 flex-1 rounded-full"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            type="submit"
            size="lg"
            className="from-primary to-lilac h-12 flex-1 rounded-full bg-gradient-to-r text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Pay with {selectedBrand.value}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
