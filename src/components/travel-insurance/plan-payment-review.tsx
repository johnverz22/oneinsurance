'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { groupPlanBenefits } from '@/utils/travel-benefits-helpers'
import { COMPANIES } from '@/constants/companies'

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
      {/* <DownloadPDFButton travelPolicy={travelPolicy} /> */}

      <Card className="bg-background overflow-hidden p-0 shadow-none">
        <CardHeader className="-space-y-2 border-b pt-6">
          <h2 className="text-center text-2xl font-black text-gray-900 dark:text-gray-100">
            {stage === 'initial' ? 'Premium Breakdown' : 'Gross Premium'}
          </h2>
        </CardHeader>
        <CardContent className="space-y-6 px-6 py-2 pb-8">
          <div className="space-y-2 text-center">
            <h3 className="text-muted-foreground text-base">
              {stage === 'initial' ? 'Initial Premium' : 'Total Premium'}
            </h3>
            <p className="text-2xl font-bold md:text-3xl lg:text-4xl">
              ₱&nbsp;
              {grossPremium.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border px-3 py-1.5 pb-3">
            <span className="text-muted-foreground text-sm">
              Selected Insurance Plan
            </span>

            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-bold">{provider.companyName}</h3>
                <p className="text-primary dark:text-accent text-left text-base font-bold tracking-wide text-wrap uppercase">
                  {plan.CarrierPlanDesc}
                </p>
              </div>
              <p>₱&nbsp;{grossPremium.toLocaleString()}</p>
            </div>
          </div>

          {addedAddonBenefits && addedAddonBenefits.length > 0 && (
            <div className="rounded-lg border px-3 py-1.5 pb-3">
              <span className="text-muted-foreground text-sm">
                Travel Add-Ons
              </span>
              {stage === 'initial' && (
                <p className="text-muted-foreground text-xs">
                  Add-on costs will be included upon requesting the full quote.
                </p>
              )}

              <div className="space-y-2">
                {addedAddonBenefits.map((addon, index) => (
                  <p
                    key={index}
                    className="text-primary dark:text-accent text-left text-base font-bold tracking-wide text-wrap uppercase"
                  >
                    {addon.BenefitDesc}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
