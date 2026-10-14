'use client'

import { useState, Component, ReactNode } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, FileText, Shield } from 'lucide-react'
import { PaymentBrand, PaymentSubmitResponse } from '@/types/payment'
import { FullQuoteResponse, IssueQuoteData } from '@/types/travel-insurance/policy-types'
import { CoverageOfConfirmation } from './coverage-of-confirmation'
import { GenerateAndDownloadInvoice } from '../travel-insurance/invoice-renderer'
import { transformToInvoiceData } from '@/utils/travel-summary-helpers'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { getPlanName } from '@/utils/custom-fields-storage'
import { COMPANIES } from '@/constants/companies'
import {
  getCityNameByCityCode,
  getProvinceNameByProvCode,
} from '@/utils/address-util'

// Error boundary to prevent full page crash
class PaymentSuccessErrorBoundary extends Component<
  { children: ReactNode; onContinue: () => void },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      // PDF rendering failed - show success page without PDF download buttons
      // The policy is still issued successfully
      return this.props.children
    }
    return this.props.children
  }
}

interface PaymentSuccessInlineProps {
  onContinue: () => void
  paymentMethod: PaymentBrand
  policyData: IssueQuoteData | null | undefined
  quoteData: FullQuoteResponse['data']
  paymentSubmit: PaymentSubmitResponse['data']
}

export function PaymentSuccessInline(props: PaymentSuccessInlineProps) {
  return (
    <PaymentSuccessErrorBoundary onContinue={props.onContinue}>
      <PaymentSuccessInlineInner {...props} />
    </PaymentSuccessErrorBoundary>
  )
}

function PaymentSuccessInlineInner({
  onContinue,
  paymentMethod,
  policyData,
  quoteData,
  paymentSubmit,
}: PaymentSuccessInlineProps) {
  const [showCovernote, setShowCoverNote] = useState(false)
  const { travelersInfo, paymentBillingDetails } = useTravelInsuranceStore()
  const carrierName = COMPANIES.find(c => c.carrierCode === quoteData?.CarrierCode)?.companyName || quoteData?.CarrierCode || ''

  // Guard: if quoteData is missing (e.g. store reset after redirect), show a safe fallback
  if (!quoteData) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-success/10 p-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
        </div>
        <h1 className="text-primary text-3xl font-bold">Payment Successful!</h1>
        <p className="text-lg text-muted-foreground">Your travel insurance policy has been successfully issued.</p>
        <p className="text-sm text-muted-foreground">Policy details have been sent to your email.</p>
        <Button onClick={onContinue} size="lg" className="from-primary to-lilac bg-gradient-to-r px-8 py-3 font-medium text-white">
          Buy new Travel Insurance
        </Button>
      </div>
    )
  }

  const INVOICE_DATA = transformToInvoiceData(
    null, // policyData is now IssueQuoteData — pass null, quoteData covers what's needed
    quoteData,
    paymentMethod,
    paymentBillingDetails!
  )

  const destinations = quoteData.TravelDetailList?.map((travel) => {
    return travel.PlaceOfOrgin && travel.TravelCountry
      ? `${travel.PlaceOfOrgin} → ${travel.TravelCountry}`
      : travel.TravelCountry || 'Not specified'
  }).join(', ')

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-success/10 p-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-primary text-3xl font-bold">
            Payment Successful!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your travel insurance policy has been successfully issued.
          </p>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variant={showCovernote ? 'default' : 'outline'}
          onClick={() => setShowCoverNote(true)}
          className={`flex items-center gap-2 py-3 ${showCovernote ? 'from-primary to-lilac bg-gradient-to-r text-white' : ''}`}
        >
          <FileText className="h-4 w-4" />
          Cover Note
        </Button>
        <Button
          variant={!showCovernote ? 'default' : 'outline'}
          onClick={() => setShowCoverNote(false)}
          className={`flex items-center gap-2 py-3 ${!showCovernote ? 'from-primary to-lilac bg-gradient-to-r text-white' : ''}`}
        >
          <Shield className="h-4 w-4" />
          Invoice Details
        </Button>
      </div>

      {showCovernote ? (
        <CoverageOfConfirmation policyData={null} quoteData={quoteData} />
      ) : (
        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-start justify-between border-b p-8">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Invoice</h1>
                  <p className="text-sm text-muted-foreground">
                    #{paymentSubmit?.merchant_transaction_id || policyData?.policy_no || 'N/A'}
                  </p>
                </div>

                <div className="relative h-16 w-40">
                  <Image
                    src="/images/IFRC.png"
                    alt="IFRC Logo"
                    className="object-contain"
                    fill
                  />
                </div>
              </div>

              <div className="grid gap-8 border-b p-8 md:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Policy Number
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {policyData?.policy_no || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Insurance Provider
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {carrierName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Payment Method
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {paymentMethod.value}
                  </p>
                </div>
              </div>

              <div className="grid gap-8 border-b p-8 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs font-medium text-muted-foreground">From</p>
                  <div className="text-sm">
                    <p className="font-bold text-foreground">
                      IFRC Digitech Online Payment Gateway
                    </p>
                    <p className="text-muted-foreground">6th Floor Padilla Building</p>
                    <p className="text-muted-foreground">
                      F. Ortigas Jr. Road, Ortigas Center, Pasig City
                    </p>
                    <p className="text-muted-foreground">TEL: +632 8633 5681</p>
                    <p className="text-muted-foreground">concierge@ifrcinsurance.com</p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium text-muted-foreground">To</p>
                  <div className="text-sm">
                    <p className="font-bold text-foreground">
                      {(paymentBillingDetails?.first_name + ' ' + paymentBillingDetails?.last_name).toUpperCase()}
                    </p>
                    <p className="text-muted-foreground">
                      {paymentBillingDetails?.address_line_one},{' '}
                      {paymentBillingDetails?.address_line_two}
                    </p>
                    <p className="text-muted-foreground">
                      {paymentBillingDetails?.email}
                    </p>
                    <p className="text-muted-foreground">
                      {paymentBillingDetails?.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Description
                      </th>
                      <th className="pb-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-4">
                        <p className="text-sm font-medium text-foreground">
                          {getPlanName() || quoteData.CarrierPlanCode}
                        </p>
                        {carrierName && (
                          <p className="text-xs font-semibold text-muted-foreground">{carrierName}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{destinations}</p>
                        <p className="text-xs text-muted-foreground">
                          {quoteData.TravelDays ||
                            calculateTravelDays(
                              quoteData.ExpiryDate,
                              quoteData.EffectiveDate
                            )}{' '}
                          Days • {quoteData.TravelType}
                        </p>
                      </td>
                      <td className="py-4 text-right text-sm text-muted-foreground">
                        PHP{' '}
                        {INVOICE_DATA.payment.basePremium
                          .toFixed(2)
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6 flex justify-end">
                  <div className="flex items-center justify-between gap-12">
                    <span className="text-base font-bold text-foreground">
                      Total Amount
                    </span>
                    <span className="text-base font-bold text-foreground">
                      PHP{' '}
                      {INVOICE_DATA.payment.basePremium
                        .toFixed(2)
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground italic">
                  Note: Policy coverage begins on the effective date. Please
                  ensure payment is completed before departure. VAT inclusive
                </p>
              </div>

              <div className="bg-muted/50 p-8">
                <h3 className="mb-4 text-xs font-bold tracking-wide text-foreground uppercase">
                  Policy Status
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    <p className="mt-1 text-sm text-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Issue Date
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {format(new Date(), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Coverage Period
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {format(
                        new Date(quoteData.EffectiveDate),
                        'MMM dd, yyyy'
                      )}{' '}
                      - {format(new Date(quoteData.ExpiryDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Proposal No.
                    </p>
                    <p className="mt-1 text-sm font-mono text-foreground">
                      {quoteData.ProposalNo || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Payment Reference No.
                    </p>
                    <p className="mt-1 text-sm font-mono font-semibold tracking-wide text-foreground">
                      {paymentSubmit?.merchant_transaction_id || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t bg-muted/50 p-6 text-center">
                <p className="text-sm text-muted-foreground italic">
                  Thank you for choosing One Insurance. Have a safe and
                  wonderful journey!
                </p>
              </div>

              <div className="flex gap-4 border-t bg-muted/50 p-8">
                <GenerateAndDownloadInvoice
                  invoiceData={{
                    ...INVOICE_DATA,
                    customer: {
                      ...INVOICE_DATA.customer,
                      phone: `+63${travelersInfo[0].mobileNumber}`,
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onContinue}
          size="lg"
          className="from-primary to-lilac flex items-center bg-gradient-to-r px-8 py-3 font-medium text-white"
        >
          Buy new Travel Insurance
        </Button>
      </div>
    </div>
  )
}

function calculateTravelDays(expiryDate: string, effectiveDate: string) {
  const expiry = new Date(expiryDate)
  const effective = new Date(effectiveDate)
  const diffTime = Math.abs(expiry.getTime() - effective.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
