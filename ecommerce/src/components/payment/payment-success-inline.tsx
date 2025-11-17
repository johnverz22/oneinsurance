'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, FileText, Shield } from 'lucide-react'
import { PaymentBrand, PaymentSubmitResponse } from '@/types/payment'
import { IssueQuoteResponse } from '@/types/travel-insurance/policy-types'
import { FullQuoteResponse } from '@/types/travel-insurance/policy-types'
import { CoverageOfConfirmation } from './coverage-of-confirmation'
import { GenerateAndDownloadInvoice } from '../travel-insurance/invoice-renderer'
import { transformToInvoiceData } from '@/utils/travel-summary-helpers'
import Image from 'next/image'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import {
  getCityNameByCityCode,
  getProvinceNameByProvCode,
} from '@/utils/address-util'

interface PaymentSuccessInlineProps {
  onContinue: () => void
  paymentMethod: PaymentBrand
  policyData: IssueQuoteResponse['data']
  quoteData: FullQuoteResponse['data']
  paymentSubmit: PaymentSubmitResponse['data']
}

export function PaymentSuccessInline({
  onContinue,
  paymentMethod,
  policyData,
  quoteData,
  paymentSubmit,
}: PaymentSuccessInlineProps) {
  const [showCovernote, setShowCoverNote] = useState(false)
  const { travelersInfo, paymentBillingDetails } = useTravelInsuranceStore()

  const INVOICE_DATA = transformToInvoiceData(
    policyData,
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
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-primary text-3xl font-bold">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600">
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
          Confirmation of Coverage
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
        <CoverageOfConfirmation policyData={policyData} quoteData={quoteData} />
      ) : (
        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-start justify-between border-b p-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Invoice</h1>
                  <p className="text-sm text-gray-600">
                    #{policyData.PolicyNo}
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

              <div className="grid gap-8 border-b p-8 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Policy Number
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {policyData.PolicyNo}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Payment Method
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {paymentMethod.value}
                  </p>
                </div>
              </div>

              <div className="grid gap-8 border-b p-8 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs font-medium text-gray-500">From</p>
                  <div className="text-sm">
                    <p className="font-bold text-gray-800">
                      IFRC Digitech Online Payment Gateway
                    </p>
                    <p className="text-gray-600">6th Floor Padilla Building</p>
                    <p className="text-gray-600">
                      F. Ortigas Jr. Road, Ortigas Center, Pasig City
                    </p>
                    <p className="text-gray-600">TEL: +632 8633 5681</p>
                    <p className="text-gray-600">concierge@ifrcinsurance.com</p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-medium text-gray-500">To</p>
                  <div className="text-sm">
                    <p className="font-bold text-gray-800">
                      {paymentBillingDetails?.first_name}{' '}
                      {paymentBillingDetails?.last_name}
                    </p>
                    <p className="text-gray-600">
                      {paymentBillingDetails?.address_line_one},{' '}
                      {paymentBillingDetails?.address_line_two}
                    </p>
                    <p className="text-gray-600">
                      {paymentBillingDetails?.email}
                    </p>
                    <p className="text-gray-600">
                      {paymentBillingDetails?.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="pb-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-4">
                        <p className="text-sm font-medium text-gray-800">
                          {quoteData.CarrierPlanCode}
                        </p>
                        <p className="text-xs text-gray-500">{destinations}</p>
                        <p className="text-xs text-gray-500">
                          {quoteData.TravelDays ||
                            calculateTravelDays(
                              quoteData.ExpiryDate,
                              quoteData.EffectiveDate
                            )}{' '}
                          Days • {quoteData.TravelType}
                        </p>
                      </td>
                      <td className="py-4 text-right text-sm text-gray-600">
                        PHP{' '}
                        {INVOICE_DATA.payment.basePremium
                          .toFixed(2)
                          .toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6 flex justify-end">
                  <div className="flex items-center justify-between gap-12">
                    <span className="text-base font-bold text-gray-800">
                      Total Amount
                    </span>
                    <span className="text-base font-bold text-gray-800">
                      PHP{' '}
                      {INVOICE_DATA.payment.basePremium
                        .toFixed(2)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-500 italic">
                  Note: Policy coverage begins on the effective date. Please
                  ensure payment is completed before departure. VAT inclusive
                </p>
              </div>

              <div className="bg-gray-50 p-8">
                <h3 className="mb-4 text-xs font-bold tracking-wide text-gray-700 uppercase">
                  Policy Status
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Status</p>
                    <p className="mt-1 text-sm text-gray-800">Active</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Issue Date
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {format(new Date(), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Coverage Period
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {format(
                        new Date(quoteData.EffectiveDate),
                        'MMM dd, yyyy'
                      )}{' '}
                      - {format(new Date(quoteData.ExpiryDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-600 italic">
                  Thank you for choosing One Insurance. Have a safe and
                  wonderful journey!
                </p>
              </div>

              <div className="flex gap-4 border-t bg-gray-50 p-8">
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
