'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useTravelInsuranceStore, useFullQuoteResponseStore } from '@/store/travel-insurance-store'
import { groupPlanBenefits } from '@/utils/travel-benefits-helpers'
import { COMPANIES } from '@/constants/companies'
import { Info } from 'lucide-react'

type PlanPaymentReviewProps = {
  stage: 'initial' | 'final'
  grossPremium: number
}

export const PlanPaymentReview = ({
  stage,
  grossPremium,
}: PlanPaymentReviewProps) => {
  const { coverageOption } = useTravelInsuranceStore()

  if (!coverageOption.selectedPlan) {
    return null
  }

  const provider = COMPANIES.find(
    (c) => c.carrierCode === coverageOption.carrierCode
  )!

  const plan = coverageOption.selectedPlan
  const { groupedAddonBenefits } = groupPlanBenefits(plan)

  const addedAddonBenefits = Object.entries(groupedAddonBenefits)
    .filter(([benefitCode, _]) =>
      coverageOption.selectedAddonBenefits?.some(
        (addonCode) => addonCode === benefitCode
      )
    )
    .map(([_, benefitGroup]) => benefitGroup.parent)

  return (
    <div className="sticky top-24 flex w-full flex-col space-y-6">
      <Card className="bg-background overflow-hidden p-0 shadow-none">
        <CardHeader className="pt-6 pb-4">
          <h2 className="text-center text-2xl font-black text-gray-900 dark:text-gray-100">
            Total Premium
          </h2>
          <p className="text-center text-2xl font-bold md:text-3xl lg:text-4xl mt-2">
            ₱{grossPremium.toLocaleString()}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4 px-6 pb-8">
          {/* Insurance Provider Section */}
          <div className="rounded-lg border border-gray-300 px-4 py-3">
            <div className="text-sm text-gray-600 mb-1">Insurance Provider</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {provider.companyName}
            </div>
          </div>

          {/* Plan Section */}
          <div className="rounded-lg border border-gray-300 px-4 py-3">
            <div className="text-sm text-gray-600 mb-1">Plan</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 uppercase">
              {plan.CarrierPlanDesc}
            </div>
          </div>

          {/* Add-Ons Section */}
          {addedAddonBenefits && addedAddonBenefits.length > 0 && (
            <div className="rounded-lg border border-gray-300 px-4 py-3">
              <div className="text-sm text-gray-600 mb-1">Add-Ons</div>
              <div className="space-y-1">
                {addedAddonBenefits.map((addon, index) => (
                  <div
                    key={index}
                    className="font-semibold text-gray-900 dark:text-gray-100 uppercase"
                  >
                    {addon.BenefitDesc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Info className="h-4 w-4" />
              About this premium
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              The total premium already includes the base insurance cost, selected add-ons, carrier pricing adjustments, and applicable taxes and fees as determined by the insurance provider.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
