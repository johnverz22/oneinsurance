'use client'

/**
 * HostedCheckoutForm — Billing details form for DLT Hosted Checkout v4.0.
 *
 * Works for EVERY payment brand (card and e-wallet).  The payor enters their
 * billing information here; actual card entry / wallet auth happens on the
 * DLT-hosted page after redirect.  No card number, CVV, or expiry fields are
 * collected by this form.
 */

import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldInfo } from '@/components/ui/form'
import { ArrowRight, Shield } from 'lucide-react'
import { PaymentBrand } from '@/types/payment'
import { cn, toTitleCase } from '@/lib/utils'
import {
  mapToHostedCheckoutRequest,
  type BillingFormData,
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

const billingSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(7, 'Phone number is required')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'),
  addressLineOne: z
    .string()
    .min(1, 'Address Line 1 is required')
    .max(80, 'Address Line 1 must not exceed 80 characters'),
  addressLineTwo: z
    .string()
    .min(1, 'Address Line 2 is required')
    .max(80, 'Address Line 2 must not exceed 80 characters'),
  cityMunicipality: z
    .string()
    .min(2, 'City/Municipality is required')
    .max(60, 'City/Municipality must be at most 60 characters'),
  stateProvinceRegion: z
    .string()
    .min(2, 'State/Province/Region is required')
    .max(40, 'State/Province/Region must be at most 40 characters'),
  postalCode: z
    .string()
    .min(3, 'Postal code is required')
    .max(10, 'Postal code must be at most 10 characters')
    .regex(/^[0-9]+$/, 'Postal code must contain only numbers'),
  country: z.string({ message: 'Country is required' }),
})

interface HostedCheckoutFormProps {
  selectedBrand: PaymentBrand
  onSubmit: (paymentRequest: ReturnType<typeof mapToHostedCheckoutRequest>) => void
  isLoading?: boolean
  className?: string
  paymentConfig: PaymentRequestConfig
  fullQuoteResponse: FullQuoteResponse['data']
}

export function HostedCheckoutForm({
  selectedBrand,
  onSubmit,
  isLoading = false,
  className,
  paymentConfig,
  fullQuoteResponse,
}: HostedCheckoutFormProps) {
  const customer = fullQuoteResponse.PolicyCustomerList?.[0]
  const city = getCityNameByCityCode(customer?.City)
  const province = getProvinceNameByProvCode(customer?.AddrProvince)

  const form = useForm({
    defaultValues: {
      firstName: customer?.FirstName ?? '',
      lastName: customer?.LastName ?? '',
      email: customer?.Email ?? '',
      phone: '',
      addressLineOne: customer?.AddressLine1 ?? '',
      addressLineTwo: customer?.AddressLine2 || 'N/A',
      cityMunicipality: toTitleCase(city ?? ''),
      stateProvinceRegion: toTitleCase(province ?? ''),
      postalCode: customer?.PostCode ?? '',
      country: 'PH',
    } as BillingFormData,
    validators: { onChange: billingSchema },
    onSubmit: async ({ value }) => {
      onSubmit(mapToHostedCheckoutRequest(value as BillingFormData, selectedBrand, paymentConfig))
    },
  })

  return (
    <div className={cn('mx-auto max-w-4xl space-y-3 lg:space-y-6', className)}>
      {/* Selected brand header */}
      <Card className="border-primary/20 bg-primary/5 shadow-none hidden lg:block">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-8 w-12 items-center justify-center rounded border bg-white">
              <img src={selectedBrand.image} alt={selectedBrand.value} className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-bold">{selectedBrand.value}</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>You will be redirected to the secure DLT payment page</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <form
        onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}
        className="space-y-6"
      >
        {/* Personal Details */}
        <Card className="bg-background overflow-hidden shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-primary text-base font-bold">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field name="firstName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>First Name</Label>
                    <Input id={field.name} name={field.name} value={field.state.value}
                      onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="John" className="h-11 text-base" autoComplete="given-name" />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field name="lastName">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Last Name</Label>
                    <Input id={field.name} name={field.name} value={field.state.value}
                      onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Doe" className="h-11 text-base" autoComplete="family-name" />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email Address</Label>
                  <Input id={field.name} name={field.name} value={field.state.value}
                    onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                    type="email" placeholder="john.doe@example.com" className="h-11 text-base"
                    autoComplete="email" />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="phone">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Phone Number</Label>
                  <div className="relative">
                    <div className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">+63</div>
                    <Input id={field.name} name={field.name} value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, ''))}
                      placeholder="9XX XXX XXXX" className="h-11 pl-12 text-base" autoComplete="tel" />
                  </div>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card className="bg-background overflow-hidden shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-primary text-base font-bold">Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field name="country">
              {(field) => (
                <div className="w-full space-y-2">
                  <Label htmlFor={field.name}>Country</Label>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger className="h-11 w-full text-base">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field name="stateProvinceRegion">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>State/Province/Region</Label>
                    <Input id={field.name} name={field.name} value={field.state.value}
                      onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Metro Manila" className="h-11 text-base" autoComplete="address-level1" />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field name="cityMunicipality">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>City/Municipality</Label>
                    <Input id={field.name} name={field.name} value={field.state.value}
                      onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Manila" className="h-11 text-base" autoComplete="address-level2" />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="postalCode">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Postal Code</Label>
                  <Input id={field.name} name={field.name} value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, ''))}
                    placeholder="1000" className="h-11 text-base" autoComplete="postal-code"
                    inputMode="numeric" pattern="[0-9]*" />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="addressLineOne">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Address Line 1</Label>
                  <Input id={field.name} name={field.name} value={field.state.value}
                    onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="123 Main Street" className="h-11 text-base" autoComplete="address-line1" />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="addressLineTwo">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Address Line 2</Label>
                  <Input id={field.name} name={field.name} value={field.state.value ?? ''}
                    onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Apartment, suite, etc." className="h-11 text-base" autoComplete="address-line2" />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="from-primary to-accent h-12 w-full rounded-full bg-gradient-to-r font-semibold dark:text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Redirecting to payment...
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue to {selectedBrand.value} Payment
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

// Alias for backward compatibility — CTPL/health payment steps import CardPaymentForm
// and will be migrated to HostedCheckoutForm separately.
export { HostedCheckoutForm as CardPaymentForm }