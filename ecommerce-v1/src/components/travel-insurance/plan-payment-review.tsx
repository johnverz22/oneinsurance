'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useTravelInsuranceStore, useFullQuoteResponseStore } from '@/store/travel-insurance-store'
import { groupPlanBenefits } from '@/utils/travel-benefits-helpers'
import { COMPANIES } from '@/constants/companies'
import { Info } from 'lucide-react'
import { formatDays, formatTravelers, formatTripRange, getTripDays, titleCase } from '@/utils/trip-summary'

type PlanPaymentReviewProps = {
  stage: 'initial' | 'final'
  grossPremium: number
  children?: React.ReactNode
}

export const PlanPaymentReview = ({
  stage,
  grossPremium,
  children,
}: PlanPaymentReviewProps) => {
  const { coverageOption, travelDetails } = useTravelInsuranceStore()

  if (!coverageOption.selectedPlan) {
    return null
  }

  const provider = COMPANIES.find(
    (c) => c.carrierCode === coverageOption.carrierCode
  )

  const plan = coverageOption.selectedPlan
  
  // If provider or plan not found, show error state
  if (!provider || !plan) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Unable to load plan details. Please try again.</p>
      </div>
    )
  }
  
  const { groupedAddonBenefits } = groupPlanBenefits(plan)

  const addedAddonBenefits = Object.entries(groupedAddonBenefits)
    .filter(([benefitCode, _]) =>
      coverageOption.selectedAddonBenefits?.some(
        (addonCode) => addonCode === benefitCode
      )
    )
    .map(([_, benefitGroup]) => benefitGroup.parent)

  return (
    <div className="sticky top-6 flex w-full flex-col gap-4">
      <div className="drop-shadow-md">
      <Card className="ticket-edge bg-card overflow-hidden rounded-b-none border-b-0 p-0 shadow-none">
        <CardHeader className="px-5 pt-5 pb-3">
          <h2 className="text-muted-foreground text-center text-sm font-semibold">
            Total premium
          </h2>
          <p className="text-primary mt-1 text-center text-3xl font-black">
            ₱{grossPremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-3 px-5 pb-9">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Trip</dt>
              <dd className="text-foreground text-right font-medium">
                {titleCase(travelDetails.travelDetailList[0]?.PlaceOfOrgin)} →{' '}
                {travelDetails.travelDetailList.map((d) => titleCase(d.TravelCountry)).join(', ')}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Dates</dt>
              <dd className="text-foreground text-right font-medium">
                {formatTripRange(travelDetails.departureDate, travelDetails.returnDate, true)} ·{' '}
                {formatDays(getTripDays(travelDetails.departureDate, travelDetails.returnDate))}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Travelers</dt>
              <dd className="text-foreground text-right font-medium">
                {formatTravelers(travelDetails.noOfAdults, travelDetails.noOfChildren)}
              </dd>
            </div>
          </dl>

          {/* Add-Ons Section */}
          {addedAddonBenefits && addedAddonBenefits.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
              <div className="text-xs text-muted-foreground mb-0.5">Add-Ons selected</div>
              <div className="space-y-1">
                {addedAddonBenefits.map((addon, index) => (
                  <div
                    key={index}
                    className="font-semibold text-foreground dark:text-muted-foreground uppercase"
                  >
                    {addon.BenefitDesc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Info className="h-4 w-4" />
              About this premium
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {stage === 'initial' && addedAddonBenefits && addedAddonBenefits.length > 0
                ? 'The premium shown reflects the base plan — your total is updated to include selected add-ons when your quote is created.'
                : 'The total premium already includes the base insurance cost, selected add-ons, carrier pricing adjustments, and applicable taxes and fees as determined by the insurance provider.'}
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
      {children}
    </div>
  )
}
