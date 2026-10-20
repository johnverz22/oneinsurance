'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  Download,
  ShieldCheck,
  Ticket,
} from 'lucide-react'
import {
  useTravelInsuranceStore,
  useFullQuoteResponseStore,
} from '@/store/travel-insurance-store'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getIdNameByIdType } from '@/utils/travel-coverages-helpers'
import { useFullQuoteRequest } from '@/app/data/mutations/full-quote-request'
import { mapTravelInsuranceStoreToFullQuoteRequest } from '@/utils/travel-insurance-mapper'
import { FullQuoteResponseValidationErrorSchema } from '@/types/travel-insurance/error-travel-response'
import {
  FullQuoteResponse,
  FullQuoteResponseSchema,
} from '@/types/travel-insurance/policy-types'
import { useState, useEffect } from 'react'
import { PlanHeaderStrip } from './plan-header-strip'
import { TravelDetailsSummary } from './travel-details-summary'
import {
  getHighlightedBenefits,
  groupBenefits,
  groupPlanBenefits,
} from '@/utils/travel-benefits-helpers'
import { COMPANIES } from '@/constants/companies'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { useSignInStateStore } from '@/store/signin-store'
import { generateQuotePDF } from '@/utils/generate-quote-pdf'
import { toast } from 'sonner'


function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-muted/40 border-border min-w-0 rounded-xl border p-3', className)}>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <div className="text-foreground mt-0.5 text-sm font-semibold break-words">{children}</div>
    </div>
  )
}

function CollapsibleCard({
  title,
  icon,
  action,
  defaultOpen = true,
  children,
}: {
  title: string
  icon?: React.ReactNode
  action?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="bg-card gap-0 overflow-hidden p-0 shadow-none">
      <CardHeader
        className={cn(
          'flex cursor-pointer items-center justify-between px-5 sm:px-6',
          open ? 'pt-5 pb-3' : 'py-4 sm:py-5'
        )}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-primary text-lg font-semibold sm:text-xl">{title}</h2>
          {icon}
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {action}
          <button
            type="button"
            className="text-muted-foreground"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className={cn('px-5 pb-6 sm:px-6', { hidden: !open })}>{children}</CardContent>
    </Card>
  )
}

function BenefitRows({
  items,
}: {
  items: Array<{ BenefitDesc: string; DefaultLimitDesc?: string | null; Silimit?: string | null; LimitModeDesc?: string | null }>
}) {
  return (
    <div className="divide-border divide-y pr-4">
      {items.map((b, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5">
          <h4 className="text-foreground text-sm">{b.BenefitDesc}</h4>
          <small className="text-muted-foreground text-right text-xs sm:whitespace-nowrap">
            {b.DefaultLimitDesc && b.DefaultLimitDesc !== '0'
              ? b.DefaultLimitDesc
              : b.Silimit && b.Silimit !== '0'
                ? `Up to ₱${Number.parseFloat(b.Silimit).toLocaleString('en-PH')}`
                : '—'}
            {b.LimitModeDesc && ` · ${b.LimitModeDesc}`}
          </small>
        </div>
      ))}
    </div>
  )
}

function SeeMoreList({
  total,
  render,
}: {
  total: number
  render: (expanded: boolean) => React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div>
      {render(expanded)}
      {total > 3 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-primary mt-1 flex items-center gap-1 text-sm font-semibold"
        >
          {expanded ? (
            <>
              See less <ChevronUp className="size-4" />
            </>
          ) : (
            <>
              See {total - 3} more <ChevronDown className="size-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}

function ProposalNumberCard({ proposalNumber }: { proposalNumber: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(proposalNumber)
      setCopied(true)
      toast.success('Proposal number copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy proposal number')
    }
  }

  return (
    <Card className="bg-card border-primary/20 gap-0 overflow-hidden border-2 p-0 shadow-none">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
            <Ticket className="size-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">Proposal Number</p>
            <p className="text-primary text-xl font-black tracking-wider break-all sm:text-2xl">
              {proposalNumber}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">Keep this number to resume or track your application.</p>
          </div>
        </div>
        <Button type="button" variant="outline" className="rounded-full" onClick={copy}>
          {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function TravelInsuranceReviewPage() {
  const { travelersInfo, coverageOption, nextStep, prevStep, travelDetails, isLoadingProposal } =
    useTravelInsuranceStore()
  const { apiResponse } = useFullQuoteResponseStore()
  const { agentCode } = useAgentCodeStore()
  const [proceedingToPayment, setProceedingToPayment] = useState(false)
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false)

  // Check if we're in read-only mode (loaded from proposal search)
  useEffect(() => {
    const readOnlyMode = sessionStorage.getItem('proposal-readonly-mode')
    if (readOnlyMode === 'true') {
      setIsReadOnlyMode(true)
      console.log('📋 Review page loaded in read-only mode (from proposal search)')
      console.log('📋 Using data from load-quote API only')
    }
  }, [])

  const handleDownloadPDF = async () => {
    try {
      if (!apiResponse?.data) {
        toast.error('No quote data available')
        return
      }

      const destinations = apiResponse.data.TravelDetailList?.map((detail: any) => ({
        country: detail.TravelCountry,
        coverageArea: detail.TravelCoverageArea,
      })).filter(Boolean) || []

      // Get provider name
      const provider = COMPANIES.find(
        (c) => c.carrierCode === coverageOption.carrierCode
      )

      // Get plan name
      const planName = coverageOption.selectedPlan?.CarrierPlanDesc

      // Get addon names
      const addons = coverageOption.selectedAddonBenefits?.map((addonCode) => {
        const addon = coverageOption.selectedPlan?.AddonBenefits?.find(
          (benefit) => benefit.BenefitCode === addonCode
        )
        return addon?.BenefitDesc || addonCode
      })

      // Get main benefits
      const mainBenefits = coverageOption.selectedPlan?.MainBenefits || []

      // Get selected addon benefits (full objects)
      const selectedAddonBenefits = coverageOption.selectedAddonBenefits?.map((addonCode) => {
        return coverageOption.selectedPlan?.AddonBenefits?.find(
          (benefit) => benefit.BenefitCode === addonCode
        )
      }).filter(Boolean) || []

      await generateQuotePDF({
        travelDetails,
        travelersInfo,
        apiResponse,
        planName,
        providerName: provider?.companyName,
        addons,
        mainBenefits,
        addonBenefits: selectedAddonBenefits as any,
        agentCode: agentCode || undefined,
        taxes: {
          premiumTax: coverageOption.selectedPlan?.PremiumTaxAmt,
          stampDuty: coverageOption.selectedPlan?.StampDuty,
        },
      })

      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleProceedToPayment = async () => {
    nextStep()
  }

  const provider = COMPANIES.find(
    (c) => c.carrierCode === coverageOption.carrierCode
  )
  const plan = coverageOption.selectedPlan
  
  // Show loading state while proposal is being loaded from API
  if (isLoadingProposal || !plan) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading your quote details from backend...</p>
        </div>
      </div>
    )
  }
  
  // If provider is not found after loading, show error message with details
  if (!provider) {
    console.error('❌ Review page error:', {
      hasProvider: !!provider,
      hasPlan: !!plan,
      carrierCode: coverageOption.carrierCode,
      planData: plan,
      isReadOnlyMode,
      apiResponseExists: !!apiResponse?.data
    })
    
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">
            Provider not found. Please try searching for your proposal again.
          </p>
          <Button
            onClick={() => {
              // Clear all session storage and redirect to main page
              sessionStorage.clear()
              window.location.href = window.location.origin + window.location.pathname.split('/avail')[0]
            }}
            variant="outline"
          >
            Back to Search
          </Button>
        </div>
      </div>
    )
  }
  
  const group = groupBenefits(plan)
  // Show all benefits without limiting
  const allBenefits = group.flatMap((g) => g.benefits)

  // Get selected addon benefits details
  const { groupedAddonBenefits } = groupPlanBenefits(plan)
  const selectedAddonDetails = Object.entries(groupedAddonBenefits)
    .filter(([benefitCode]) =>
      coverageOption.selectedAddonBenefits?.includes(benefitCode)
    )
    .map(([_, benefitGroup]) => benefitGroup)

  const proposalNumber = apiResponse?.data?.ProposalNo

  return (
    <div className="relative space-y-4 lg:space-y-6">
      {proposalNumber && <ProposalNumberCard proposalNumber={proposalNumber} />}

      <TravelDetailsSummary />

      <CollapsibleCard
        title="Coverage & benefits"
        action={
          <Button
            type="button"
            onClick={handleDownloadPDF}
            variant="outline"
            size="sm"
            className="rounded-full font-semibold"
          >
            <Download className="mr-1.5 size-4" />
            <span className="hidden sm:inline">Download Quote PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        }
      >
        <div className="space-y-4">
          <PlanHeaderStrip
            provider={provider}
            planName={plan.CarrierPlanDesc}
          />

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-foreground flex items-center gap-2 text-base font-bold">
                <ShieldCheck className="text-primary size-5" />
                Benefits
              </h3>
              <SeeMoreList
                total={allBenefits.length}
                render={(expanded) => (
                  <BenefitRows items={expanded ? allBenefits : allBenefits.slice(0, 3)} />
                )}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-foreground flex items-center gap-2 text-base font-bold">
                <ShieldCheck className="text-primary size-5" />
                Travel Add-Ons
              </h3>
              {selectedAddonDetails.length > 0 ? (
                <SeeMoreList
                  total={selectedAddonDetails.length}
                  render={(expanded) => (
                    <div className="space-y-4">
                      {(expanded ? selectedAddonDetails : selectedAddonDetails.slice(0, 3)).map(
                        (addonGroup, groupIndex) => (
                          <div key={groupIndex}>
                            <h4 className="text-foreground text-sm font-semibold">
                              {addonGroup.parent.CoverageName}
                            </h4>
                            <BenefitRows items={addonGroup.children} />
                          </div>
                        )
                      )}
                    </div>
                  )}
                />
              ) : (
                <div className="bg-muted/40 border-border flex h-20 w-full items-center justify-center rounded-xl border">
                  <p className="text-muted-foreground text-sm font-medium">No add-on benefits</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Your Information"
        icon={<CheckCircle className="text-success h-4 w-4 sm:h-5 sm:w-5" />}
      >
        <div className="space-y-6">
          {travelersInfo.map((traveler, index) => (
            <div key={index} className="space-y-4">
              {travelersInfo.length > 1 && (
                <h3 className="text-primary border-border border-b pb-2 text-base font-bold">
                  Traveler {index + 1}
                </h3>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  {traveler.firstName} {traveler.middleName && `${traveler.middleName} `}
                  {traveler.lastName}
                  {traveler.suffix && traveler.suffix !== 'No Suffix' && `, ${traveler.suffix}`}
                </Field>
                <Field label="Date of Birth">
                  {traveler.dateOfBirth ? format(new Date(traveler.dateOfBirth), 'MMM d, yyyy') : 'Not specified'}
                </Field>
                <Field label="Gender">{traveler.gender === 'M' ? 'Male' : 'Female'}</Field>
                <Field label="Mobile Number">+63{traveler.mobileNumber}</Field>
                <Field label="Email Address">{traveler.email}</Field>
                <Field label="ID">
                  {getIdNameByIdType(traveler.idType)} · {traveler.idNumber}
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  {traveler.address.line1}
                  {traveler.address.line2 && `, ${traveler.address.line2}`}
                </Field>
              </div>

              {traveler.beneficiary?.firstName && (
                <div className="space-y-2">
                  <h4 className="text-foreground text-sm font-bold">Beneficiary</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Name">
                      {[traveler.beneficiary.firstName, traveler.beneficiary.middleName, traveler.beneficiary.lastName]
                        .filter(Boolean)
                        .join(' ')}
                    </Field>
                    <Field label="Date of Birth">
                      {traveler.beneficiary.dateOfBirth
                        ? format(new Date(traveler.beneficiary.dateOfBirth), 'MMM d, yyyy')
                        : 'N/A'}
                    </Field>
                    <Field label="Relationship">{traveler.beneficiary.relationship || 'N/A'}</Field>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleCard>

      <div className="hidden">
        {!isReadOnlyMode && (
          <Button type="button" size="lg" variant="outline" onClick={prevStep} data-mobile-action="back">
            Back
          </Button>
        )}
        <Button
          size="lg"
          onClick={async () => {
            setProceedingToPayment(true)
            await handleProceedToPayment()
          }}
          data-mobile-action="next"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {proceedingToPayment ? 'Processing...' : 'Proceed to Payment'}
        </Button>
      </div>
    </div>
  )
}

export default TravelInsuranceReviewPage
