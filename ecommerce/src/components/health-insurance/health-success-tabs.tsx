'use client'

import { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Shield } from 'lucide-react'
import { useHealthCartStore } from '@/store/health-cart-store'

interface HealthSuccessTabsProps {
  proposalNo: string
  policyNo: string | null
  insuredName: string
  email: string
  provider: string
  planName: string
  grandTotal: number
}

export function HealthSuccessTabs({
  proposalNo,
  policyNo,
  insuredName,
  email,
  provider,
  planName,
  grandTotal,
}: HealthSuccessTabsProps) {
  const [showCoverNote, setShowCoverNote] = useState(false)
  const { items, insuredInfo } = useHealthCartStore()
  const firstItem = items[0]

  // Get benefits from compareQuotePlans if available
  const { compareQuotePlans } = useHealthCartStore()
  const matchedPlan = compareQuotePlans.find(
    (p) => p.CarrierPlanCode === firstItem?.carrierPlanCode
  )
  const benefits = matchedPlan?.MainBenefits || []

  return (
    <>
      {/* Toggle Buttons — matching travel's style */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variant={showCoverNote ? 'default' : 'outline'}
          onClick={() => setShowCoverNote(true)}
          className={`flex items-center gap-2 rounded-full py-3 ${showCoverNote ? 'from-primary to-lilac bg-gradient-to-r text-white' : ''}`}
        >
          <FileText className="h-4 w-4" />
          Cover Note
        </Button>
        <Button
          variant={!showCoverNote ? 'default' : 'outline'}
          onClick={() => setShowCoverNote(false)}
          className={`flex items-center gap-2 rounded-full py-3 ${!showCoverNote ? 'from-primary to-lilac bg-gradient-to-r text-white' : ''}`}
        >
          <Shield className="h-4 w-4" />
          Invoice Details
        </Button>
      </div>

      {showCoverNote ? (
        /* Cover Note Tab */
        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-start justify-between border-b p-8">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Cover Note</h1>
                  <p className="text-sm text-muted-foreground">#{policyNo || 'N/A'}</p>
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

              {/* Policy Info */}
              <div className="grid gap-8 border-b p-8 md:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Policy Number</p>
                  <p className="mt-1 text-sm text-foreground">{policyNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Insurance Provider</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{provider}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Plan Name</p>
                  <p className="mt-1 text-sm text-foreground">{planName}</p>
                </div>
              </div>

              {/* Issued To */}
              <div className="grid gap-8 border-b p-8 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs font-medium text-muted-foreground">Issued To</p>
                  <div className="text-sm">
                    <p className="font-bold text-foreground">{insuredName.toUpperCase()}</p>
                    <p className="text-muted-foreground">{email}</p>
                    {insuredInfo?.mobile && (
                      <p className="text-muted-foreground">(+63) {insuredInfo.mobile}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-xs font-medium text-muted-foreground">Policy Details</p>
                  <div className="text-sm text-foreground">
                    <p>
                      <span className="font-semibold">Type:</span> Health Insurance
                    </p>
                    {insuredInfo?.effectiveDate && (
                      <p>
                        <span className="font-semibold">Effective Date:</span>{' '}
                        {format(new Date(insuredInfo.effectiveDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                    {insuredInfo?.expiryDate && (
                      <p>
                        <span className="font-semibold">Expiry Date:</span>{' '}
                        {format(new Date(insuredInfo.expiryDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Coverage / Benefits Table */}
              {benefits.length > 0 && (
                <div className="p-8">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Coverage Name
                        </th>
                        <th className="pb-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Limit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {benefits.map((benefit, index) => (
                        <tr key={index} className="border-b border-border last:border-b-0">
                          <td className="py-4 text-sm font-medium text-foreground">
                            {benefit.BenefitDesc || benefit.CoverageName}
                          </td>
                          <td className="py-4 text-right text-sm text-muted-foreground">
                            {benefit.DefaultLimitDesc || 'Included'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="mt-4 text-xs text-muted-foreground italic">
                    Note: Benefits are subject to the terms and conditions of the policy.
                  </p>
                </div>
              )}

              {/* Policy Status */}
              <div className="bg-muted/50 p-8">
                <h3 className="mb-4 text-xs font-bold tracking-wide text-foreground uppercase">
                  Policy Status
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600">Active</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Issue Date</p>
                    <p className="mt-1 text-sm text-foreground">
                      {format(new Date(), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {insuredInfo?.effectiveDate && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Effective Date</p>
                      <p className="mt-1 text-sm text-foreground">
                        {format(new Date(insuredInfo.effectiveDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  {insuredInfo?.expiryDate && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Expiry Date</p>
                      <p className="mt-1 text-sm text-foreground">
                        {format(new Date(insuredInfo.expiryDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t bg-muted/50 p-6 text-center">
                <p className="text-sm text-muted-foreground italic">
                  Thank you for choosing One Insurance. Stay protected and healthy!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Invoice Details Tab */
        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-start justify-between border-b p-8">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Invoice</h1>
                  <p className="text-sm text-muted-foreground">#{policyNo || 'N/A'}</p>
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

              {/* Policy / Provider / Payment */}
              <div className="grid gap-8 border-b p-8 md:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Policy Number</p>
                  <p className="mt-1 text-sm text-foreground">{policyNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Insurance Provider</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{provider}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Plan Name</p>
                  <p className="mt-1 text-sm text-foreground">{planName}</p>
                </div>
              </div>

              {/* From / To */}
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
                    <p className="font-bold text-foreground">{insuredName.toUpperCase()}</p>
                    <p className="text-muted-foreground">{email}</p>
                    {insuredInfo?.mobile && (
                      <p className="text-muted-foreground">(+63) {insuredInfo.mobile}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items */}
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
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-4">
                          <p className="text-sm font-medium text-foreground">
                            {item.planName} - {item.tierName}
                          </p>
                          <p className="text-xs font-semibold text-muted-foreground">{item.provider}</p>
                          <p className="text-xs text-muted-foreground">Health Insurance</p>
                        </td>
                        <td className="py-4 text-right text-sm text-muted-foreground">
                          PHP {(item.premium * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total */}
                <div className="mt-6 flex justify-end">
                  <div className="flex items-center justify-between gap-12">
                    <span className="text-base font-bold text-foreground">Total Amount</span>
                    <span className="text-base font-bold text-foreground">
                      PHP {grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground italic">
                  Note: Policy coverage begins on the effective date. VAT inclusive.
                </p>
              </div>

              {/* Policy Status */}
              <div className="bg-muted/50 p-8">
                <h3 className="mb-4 text-xs font-bold tracking-wide text-foreground uppercase">
                  Policy Status
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600">Active</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Issue Date</p>
                    <p className="mt-1 text-sm text-foreground">
                      {format(new Date(), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {insuredInfo?.effectiveDate && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Effective Date</p>
                      <p className="mt-1 text-sm text-foreground">
                        {format(new Date(insuredInfo.effectiveDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  {insuredInfo?.expiryDate && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Expiry Date</p>
                      <p className="mt-1 text-sm text-foreground">
                        {format(new Date(insuredInfo.expiryDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t bg-muted/50 p-6 text-center">
                <p className="text-sm text-muted-foreground italic">
                  Thank you for choosing One Insurance. Stay protected and healthy!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
