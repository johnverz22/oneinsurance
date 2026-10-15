'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { COMPANIES } from '@/constants/companies'
import { ChevronDown, ChevronUp, Info, Loader2Icon, ShieldCheck } from 'lucide-react'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DownloadPDFButton } from './travel-policy-pdf'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getHighlightedBenefits,
  groupBenefits,
  groupPlanBenefits,
  parseLimit,
} from '@/utils/travel-benefits-helpers'
import { PlanHeaderStrip } from './plan-header-strip'
import { TravelAddonsSection, AddonGroup } from './travel-addons-section'
import { TravelDetailsSummary } from './travel-details-summary'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { cn } from '@/lib/utils'

export function ReviewCoverage() {
  const router = useRouter()
  const {
    travelDetails,
    clientRequest,
    travelersInfo,
    coverageOption,
    nextStep,
    updateCoverageOption,
    resetAvailForm,
  } = useTravelInsuranceStore()
  const { agentCode } = useAgentCodeStore()

  const [localSelectedAddons, setLocalSelectedAddons] = useState<string[]>(
    coverageOption.selectedAddonBenefits || []
  )
  const [isPlanExpanded, setIsPlanExpanded] = useState(true)

  const provider = COMPANIES.find(
    (c) => c.carrierCode === coverageOption.carrierCode
  ) ?? {
    carrierCode: coverageOption.carrierCode,
    companyName: coverageOption.carrierCode,
    image: '',
  }

  const plan = coverageOption.selectedPlan!
  const { groupedAddonBenefits } = groupPlanBenefits(plan)

  const addonGroups: AddonGroup[] = useMemo(
    () =>
      Object.entries(groupedAddonBenefits)
        .filter(([, group]) => group.children.length > 0)
        .map(([code, group]) => ({
          code,
          category: group.parent.CoverageName || group.parent.BenefitDesc,
          benefits: group.children,
        })),
    [groupedAddonBenefits]
  )

  const group = groupBenefits(plan)
  const { benefits, hasMore } = getHighlightedBenefits(group, true)

  const handleAddonChange = (benefitCode: string, checked: boolean) => {
    let updated: string[]
    if (checked) {
      updated = [...localSelectedAddons, benefitCode]
    } else {
      updated = localSelectedAddons.filter((code) => code !== benefitCode)
    }
    setLocalSelectedAddons(updated)
    updateCoverageOption({ selectedAddonBenefits: updated })
  }

  // When Accept is clicked, update the store with selected add-ons
  const handleAccept = () => {
    updateCoverageOption({
      ...coverageOption,
      selectedAddonBenefits: localSelectedAddons,
    })
    nextStep()
  }

  if (!coverageOption.selectedPlan) {
    return (
      <div className="px-4 sm:px-10 md:px-[10%] lg:px-[20%]">
        <div className="flex min-h-screen w-full items-center justify-center">
          <Loader2Icon className="h-lg w-lg animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full space-y-4 border-0">
      <div className="space-y-4 lg:space-y-8">
        <TravelDetailsSummary />

        <Card className="bg-card gap-0 overflow-hidden p-0 shadow-none">
          <CardHeader
            className={cn(
              'flex cursor-pointer items-center justify-between px-5 sm:px-6',
              isPlanExpanded ? 'pt-5 pb-3' : 'py-4 sm:py-5'
            )}
            onClick={() => setIsPlanExpanded(!isPlanExpanded)}
          >
            <div className="min-w-0">
              <h2 className="text-primary text-lg font-semibold sm:text-xl">Coverage &amp; benefits</h2>
              {!isPlanExpanded && (
                <p className="text-muted-foreground mt-1 truncate text-sm">
                  {provider.companyName} · {plan.CarrierPlanDesc}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!isPlanExpanded && (
                <span className="text-primary text-sm font-semibold">Edit</span>
              )}
              <button className="text-muted-foreground" type="button" aria-label={isPlanExpanded ? 'Collapse' : 'Expand'}>
                {isPlanExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </CardHeader>
          <CardContent className={cn('space-y-4 px-5 pb-6 sm:px-6', { 'hidden': !isPlanExpanded })}>
            <PlanHeaderStrip
              provider={provider}
              planName={plan.CarrierPlanDesc}
            />

            <div className="space-y-3">
              <h3 className="text-foreground flex items-center gap-2 text-base font-bold sm:text-lg">
                <ShieldCheck className="text-primary size-5" />
                Benefits
              </h3>
              <div className="relative">
                <ScrollArea className="h-[320px] w-full">
                  <div className="divide-border divide-y pr-4">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5">
                        <h4 className="text-foreground text-sm">{benefit.BenefitDesc}</h4>
                        <small className="text-muted-foreground text-right text-xs sm:whitespace-nowrap">
                          {benefit.DefaultLimitDesc !== '0'
                            ? benefit.DefaultLimitDesc
                            : `Up to ₱${Number.parseFloat(benefit.Silimit ?? '0').toLocaleString('en-PH')}`}
                          {benefit.LimitModeDesc && ` · ${benefit.LimitModeDesc}`}
                        </small>
                      </div>
                    ))}
                    {hasMore && (
                      <small className="text-muted-foreground block py-2.5 italic">
                        and many more...
                      </small>
                    )}
                  </div>
                </ScrollArea>
                <div className="from-card pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-t to-transparent" />
              </div>
            </div>
          </CardContent>

          <TravelAddonsSection
            groups={addonGroups}
            selected={localSelectedAddons}
            onToggle={handleAddonChange}
            currency={plan.Currency}
          />
        </Card>

        {/* Mobile-only: Premium summary (replaces sidebar on mobile) */}
        <div className="lg:hidden rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total premium</span>
            <span className="text-lg font-black text-primary">₱{Number(plan.DuePremium).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            {addonGroups.length > 0
              ? 'Premium reflects the base plan — selected add-ons are priced in when your quote is created.'
              : 'The total premium includes base cost and applicable taxes.'}
          </p>
        </div>

        <div className="hidden">
          <Button
            size="lg"
            variant="outline"
            className="w-1/2 rounded-full bg-transparent px-12 font-semibold lg:w-max"
            onClick={() => {
              resetAvailForm()
              router.push(`/${agentCode}/products/travel-insurance`)
            }}
            data-mobile-action="back"
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="from-primary to-accent w-1/2 rounded-full bg-gradient-to-r via-90% px-14 lg:w-max dark:text-white"
            onClick={handleAccept}
            data-mobile-action="next"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
