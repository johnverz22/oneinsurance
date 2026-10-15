'use client'

import { useState, Component, ReactNode } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, CheckCircle2, FileText, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReferenceTile } from './payment-finalizing'
import { DocumentPanel, DocSection, DocField, DocFieldGrid } from './document-preview'
import { PaymentBrand, PaymentSubmitResponse } from '@/types/payment'
import { FullQuoteResponse, IssueQuoteData } from '@/types/travel-insurance/policy-types'
import { CoverageOfConfirmation } from './coverage-of-confirmation'
import { GenerateAndDownloadInvoice } from '../travel-insurance/invoice-renderer'
import { transformToInvoiceData } from '@/utils/travel-summary-helpers'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { getPlanName } from '@/utils/custom-fields-storage'
import { COMPANIES } from '@/constants/companies'

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
  hideContinueOnDesktop?: boolean
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
  hideContinueOnDesktop,
  paymentMethod,
  policyData,
  quoteData,
  paymentSubmit,
}: PaymentSuccessInlineProps) {
  const [showCovernote, setShowCoverNote] = useState(true)
  const { travelersInfo, paymentBillingDetails } = useTravelInsuranceStore()
  const carrierName = COMPANIES.find((c) => c.carrierCode === quoteData?.CarrierCode)?.companyName || quoteData?.CarrierCode || ''
  const paymentReference = paymentSubmit?.merchant_transaction_id || ''

  const continueButton = (
    <div className={cn('flex gap-3', hideContinueOnDesktop && 'lg:hidden')}>
      <Button onClick={onContinue} variant="outline" size="lg" className="flex-1 rounded-full bg-transparent font-semibold">
        <ArrowLeft className="mr-2 size-4" />
        Buy new Travel Insurance
      </Button>
    </div>
  )

  if (!quoteData) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <Card className="bg-card gap-0 overflow-hidden p-0 shadow-none">
          <CardHeader className="px-5 pt-5 pb-6 sm:px-6">
            <SuccessTitle subtitle="Your travel insurance policy has been successfully issued. Policy details have been sent to your email." />
          </CardHeader>
        </Card>
        {continueButton}
      </div>
    )
  }

  const INVOICE_DATA = transformToInvoiceData(null, quoteData, paymentMethod, paymentBillingDetails!)
  const destinations =
    quoteData.TravelDetailList?.map((travel) =>
      travel.PlaceOfOrgin && travel.TravelCountry ? `${travel.PlaceOfOrgin} → ${travel.TravelCountry}` : travel.TravelCountry || 'Not specified'
    ).join(', ') || 'Not specified'
  const days = quoteData.TravelDays || calculateTravelDays(quoteData.ExpiryDate, quoteData.EffectiveDate)
  const total = INVOICE_DATA.payment.basePremium
  const fmt = (n: number) => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const br = INVOICE_DATA.payment.breakdown
  const taxes = br && br.base > 0 ? total - br.base - br.lgt : 0

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card className="bg-card gap-0 overflow-hidden p-0 shadow-none">
        <CardHeader className="px-5 pt-5 pb-3 sm:px-6">
          <SuccessTitle subtitle="Your travel insurance policy has been successfully issued." />
        </CardHeader>
        <CardContent className="space-y-3 px-5 pt-3 pb-6 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <ReferenceTile label="Policy Number" value={policyData?.policy_no || 'Pending'} highlight />
            <ReferenceTile label="Proposal Number" value={quoteData.ProposalNo || 'N/A'} />
            {paymentReference && <ReferenceTile label="Payment Reference" value={paymentReference} />}
          </div>
          <p className="text-muted-foreground text-xs">Keep these numbers for your records and when contacting support.</p>
        </CardContent>
      </Card>

      <Card className="bg-card gap-0 overflow-hidden p-0 shadow-none">
        <CardHeader className="px-5 pt-5 pb-3 sm:px-6">
          <h2 className="text-primary text-lg font-bold sm:text-2xl">Your Documents</h2>
          <p className="text-muted-foreground text-sm">Download your Certificate of Coverage and Invoice.</p>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pt-3 pb-6 sm:px-6">
          <div className="grid grid-cols-2 gap-2" role="tablist">
            {[
              { cover: true, label: 'Certificate of Coverage', icon: FileText },
              { cover: false, label: 'Invoice', icon: Receipt },
            ].map(({ cover, label, icon: Icon }) => (
              <Button
                key={label}
                role="tab"
                aria-selected={showCovernote === cover}
                variant={showCovernote === cover ? 'default' : 'outline'}
                onClick={() => setShowCoverNote(cover)}
                className={cn(
                  'rounded-full font-semibold',
                  showCovernote === cover ? 'from-primary to-lilac text-primary-foreground bg-gradient-to-r' : 'bg-transparent'
                )}
              >
                <Icon className="mr-2 size-4" />
                {label}
              </Button>
            ))}
          </div>

          {showCovernote ? (
            <CoverageOfConfirmation policyData={null} quoteData={quoteData} paymentReference={paymentReference} />
          ) : (
            <div className="space-y-4">
              <DocumentPanel>
                <DocSection title="Invoice">
                  <DocFieldGrid>
                    <DocField label="Invoice No.">{paymentReference || policyData?.policy_no || 'N/A'}</DocField>
                    <DocField label="Policy Number">{policyData?.policy_no || 'Pending'}</DocField>
                    <DocField label="Insurance Provider">{carrierName}</DocField>
                    <DocField label="Payment Method">{paymentMethod.value}</DocField>
                  </DocFieldGrid>
                </DocSection>

                <DocSection title="Billing">
                  <DocFieldGrid>
                    <DocField label="From">
                      <p>IFRC Digitech Online Payment Gateway</p>
                      <p className="text-muted-foreground font-normal">6th Floor Padilla Building</p>
                      <p className="text-muted-foreground font-normal">F. Ortigas Jr. Road, Ortigas Center, Pasig City</p>
                      <p className="text-muted-foreground font-normal">TEL: +632 8633 5681</p>
                      <p className="text-muted-foreground font-normal">concierge@ifrcinsurance.com</p>
                    </DocField>
                    <DocField label="Billed to">
                      <p>{`${paymentBillingDetails?.first_name ?? ''} ${paymentBillingDetails?.last_name ?? ''}`.trim().toUpperCase()}</p>
                      <p className="text-muted-foreground font-normal">
                        {[paymentBillingDetails?.address_line_one, paymentBillingDetails?.address_line_two].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-muted-foreground font-normal break-all">{paymentBillingDetails?.email}</p>
                      <p className="text-muted-foreground font-normal">{paymentBillingDetails?.phone}</p>
                    </DocField>
                  </DocFieldGrid>
                </DocSection>

                <DocSection title="Charges">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-border text-muted-foreground border-b text-xs">
                        <th className="pb-2 text-left font-medium">Description</th>
                        <th className="pb-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-border border-b">
                        <td className="py-3 pr-4">
                          <p className="text-foreground font-medium">{getPlanName() || quoteData.CarrierPlanCode}</p>
                          <p className="text-muted-foreground text-xs">{[carrierName, destinations].filter(Boolean).join(' · ')}</p>
                          <p className="text-muted-foreground text-xs">
                            {days} Days • {quoteData.TravelType}
                          </p>
                        </td>
                        <td className="text-muted-foreground py-3 text-right whitespace-nowrap">
                          PHP {fmt(br && br.base > 0 ? br.base : total)}
                        </td>
                      </tr>
                      {br && br.base > 0 && br.lgt > 0.005 && (
                        <tr className="border-border border-b">
                          <td className="text-foreground py-2.5">Local government tax</td>
                          <td className="text-muted-foreground py-2.5 text-right whitespace-nowrap">PHP {fmt(br.lgt)}</td>
                        </tr>
                      )}
                      {br && br.base > 0 && (
                        <tr className="border-border border-b">
                          <td className="text-foreground py-2.5">Taxes &amp; fees</td>
                          <td className="text-muted-foreground py-2.5 text-right whitespace-nowrap">
                            {taxes > 0.005 ? `PHP ${fmt(taxes)}` : 'Included in premium'}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-foreground pt-3 font-bold">Total Amount</td>
                        <td className="text-primary pt-3 text-right font-bold whitespace-nowrap">PHP {fmt(total)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-muted-foreground text-xs">
                    Policy coverage begins on the effective date. Premium is VAT inclusive.
                  </p>
                </DocSection>

                <DocSection title="Policy Status">
                  <DocFieldGrid>
                    <DocField label="Status">
                      <span className="text-success">Active</span>
                    </DocField>
                    <DocField label="Issue Date">{format(new Date(), 'MMM dd, yyyy')}</DocField>
                    <DocField label="Coverage Period" className="sm:col-span-2">
                      {format(new Date(quoteData.EffectiveDate), 'MMM dd, yyyy')} – {format(new Date(quoteData.ExpiryDate), 'MMM dd, yyyy')}
                    </DocField>
                  </DocFieldGrid>
                </DocSection>
              </DocumentPanel>

              <GenerateAndDownloadInvoice
                paymentReference={paymentReference}
                invoiceData={{
                  ...INVOICE_DATA,
                  customer: { ...INVOICE_DATA.customer, phone: `+63${travelersInfo[0]?.mobileNumber ?? ''}` },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {continueButton}
    </div>
  )
}

function SuccessTitle({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-success/10 flex size-10 shrink-0 items-center justify-center rounded-full">
        <CheckCircle2 className="text-success size-5" />
      </div>
      <div>
        <h2 className="text-primary text-lg font-bold sm:text-2xl">Policy Issued</h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
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
