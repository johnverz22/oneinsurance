'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { COMPANIES } from '@/constants/companies'
import { CheckIcon, Loader2Icon, ShieldCheck } from 'lucide-react'
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
import { TravelDetailsSummary } from './travel-details-summary'
import { useAgentCodeStore } from '@/store/agent-code-store'

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

  const provider = COMPANIES.find(
    (c) => c.carrierCode === coverageOption.carrierCode
  )!

  const plan = coverageOption.selectedPlan!
  const groupedMainBenefits = groupBenefits(plan)
  const { groupedAddonBenefits } = groupPlanBenefits(plan)

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
      <div className="space-y-8">
        <TravelDetailsSummary />

        <Card className="bg-background overflow-hidden p-0 pb-8 shadow-none">
          <CardHeader className="flex items-center justify-between -space-y-2 pt-6">
            <h2 className="text-primary text-2xl font-bold">Plan Details</h2>
          </CardHeader>
          <CardContent className="h-full w-full space-y-3">
            <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:divide-x">
              <div className="w-full space-y-2">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl">
                  <Image
                    src={provider.image}
                    alt={provider.companyName}
                    className="h-full w-full object-cover"
                    width={96}
                    height={96}
                  />
                </div>

                <Badge variant="outline">{provider?.companyName}</Badge>
                <h3 className="text-foreground text-left text-xl font-bold tracking-wide text-wrap uppercase">
                  {plan.CarrierPlanDesc}
                </h3>
              </div>

              <div className="flex w-full flex-col gap-4 lg:pl-8">
                <div className="space-y-3">
                  <h2 className="text-primary text-md font-bold lg:text-2xl">
                    Benefits
                  </h2>
                  <div className="relative">
                    <ScrollArea className="h-[300px] w-full p-4">
                      <div className="grid gap-2">
                        {benefits.map((benefit, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-2 items-center gap-3"
                          >
                            <h4 className="text-sm">{benefit.BenefitDesc}</h4>
                            <small className="text-muted-foreground text-right text-xs">
                              {benefit.DefaultLimitDesc !== '0'
                                ? benefit.DefaultLimitDesc
                                : `Up to ₱${Number.parseFloat(benefit.Silimit ?? '0').toLocaleString('en-PH')}`}
                              <br />
                              {benefit.LimitModeDesc}
                            </small>
                          </div>
                        ))}
                        {hasMore && (
                          <small className="text-muted-foreground italic">
                            and many more...
                          </small>
                        )}
                      </div>
                    </ScrollArea>
                    {/* Bottom gradient fade indicator */}
                    <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-12 bg-gradient-to-t from-gray-100 to-transparent" />
                  </div>
                </div>
                <div className="bg-tertiary w-max self-end rounded-full px-6 py-2 text-center text-base font-bold text-white">
                  PHP {Number(plan.DuePremium).toLocaleString('en-PH')}
                </div>
              </div>
            </div>
          </CardContent>

          {groupedAddonBenefits &&
            Object.keys(groupedAddonBenefits).length > 0 && (
              <div className="border-t-muted-foreground/10 space-y-6 border-t px-6 py-6">
                <h2 className="text-primary text-2xl font-bold">
                  Travel Add-Ons
                </h2>
                <div className="grid gap-3 lg:grid-cols-2">
                  {Object.entries(groupedAddonBenefits).map(
                    ([benefitCode, benefitGroup]) => (
                      <Card key={benefitCode} className="space-y-3">
                        <CardHeader className="flex items-center gap-3">
                          <div className="bg-primary from-primary to-accent relative flex h-12 w-12 items-center justify-center self-end rounded-full bg-gradient-to-r via-90% text-center text-white">
                            <ShieldCheck />
                          </div>
                          <label
                            htmlFor={`addon-checkbox-${benefitCode}`}
                            className="cursor-pointer font-bold text-gray-900 dark:text-gray-100"
                          >
                            {benefitGroup.parent.CoverageName}
                          </label>
                        </CardHeader>
                        <CardContent className="flex h-full flex-col">
                          <div className="h-full space-y-2 pb-6">
                            {benefitGroup.children.map((benefit, index) => (
                              <div
                                className="flex items-start gap-2"
                                key={`${benefit.BenefitCode}-${index}`}
                              >
                                <CheckIcon
                                  width={16}
                                  height={16}
                                  className="text-primary mt-0.5 shrink-0"
                                />
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  <p className="font-medium">
                                    {benefit.BenefitDesc}
                                  </p>
                                  <p className="text-primary font-semibold">
                                    {benefit.DefaultLimitDesc !== '0'
                                      ? benefit.DefaultLimitDesc
                                      : `Up to ₱${Number.parseFloat(benefit.Silimit ?? '0').toLocaleString('en-PH')}`}
                                    <br />
                                    {benefit.LimitModeDesc}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleAddonChange(
                                benefitCode,
                                !localSelectedAddons.includes(benefitCode)
                              )
                            }
                            className={`flex items-center gap-2 self-end rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                              localSelectedAddons.includes(benefitCode)
                                ? 'bg-primary !border-primary from-primary to-accent relative flex items-center justify-center self-end rounded-full bg-gradient-to-r via-90% text-white'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            } `}
                          >
                            {localSelectedAddons.includes(benefitCode)
                              ? '✓'
                              : '+'}
                            &nbsp;Add to Trip
                          </button>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </div>
            )}
        </Card>

        <div className="relative flex w-full items-center justify-center gap-3 px-1.5 lg:justify-start lg:px-0">
          <Button
            size="lg"
            variant="outline"
            className="w-1/2 rounded-full bg-transparent px-12 font-semibold lg:w-max"
            onClick={() => {
              resetAvailForm()
              router.push(`/${agentCode}/products/travel-insurance`)
            }}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="from-primary to-accent w-1/2 rounded-full bg-gradient-to-r via-90% px-14 lg:w-max dark:text-white"
            onClick={handleAccept}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
