'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckIcon, Loader2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import {
  InsurancePlan,
  InsuranceBenefit,
} from '@/types/ctpl-insurance/init-compare'
import { mapCptlStateToFullQuoteRequest } from '@/utils/mappers/cptl-insurance/ctpl-insurance'
import { useCtplFullQuoteRequest } from '@/app/data/mutations/ctpl/full-quote-request'
import { toast } from 'sonner'

interface BenefitGroup {
  parent: InsuranceBenefit
  children: InsuranceBenefit[]
}

interface GroupedBenefits {
  [parentCode: string]: BenefitGroup
}

export function groupBenefitsByParent(
  benefits: InsuranceBenefit[]
): GroupedBenefits {
  const grouped: GroupedBenefits = {}

  // First, identify all parent benefits (those with ParentBenefit: 'NA')
  const parents: InsuranceBenefit[] = benefits.filter(
    (benefit) => benefit.ParentBenefit === null
  )

  // Initialize each parent group
  parents.forEach((parent: InsuranceBenefit) => {
    grouped[parent.BenefitCode!] = {
      parent: parent,
      children: [],
    }
  })

  // Then, assign child benefits to their respective parents
  benefits.forEach((benefit: InsuranceBenefit) => {
    if (benefit.ParentBenefit !== 'NA' && grouped[benefit.ParentBenefit!]) {
      grouped[benefit.ParentBenefit!].children.push(benefit)
    }
  })

  return grouped
}

export default function ReviewCoverage() {
  const router = useRouter()
  const {
    vehicleRegistration,
    clientRequestId,
    personalInfo,
    selectedVehicle,
    coverageOption,
    decreaseStep,
    increaseStep,
    updateCoverageOption,
  } = useCtplInsuranceStateStore()
  const { mutateAsync } = useCtplFullQuoteRequest()

  const [localSelectedAddons, setLocalSelectedAddons] = useState<string[]>(
    coverageOption.selectedAddonBenefits || []
  )

  if (!coverageOption.selectedPlan) {
    return (
      <div className="px-4 sm:px-10 md:px-[10%] lg:px-[20%]">
        <div className="flex min-h-screen w-full items-center justify-center">
          <Loader2Icon className="h-lg w-lg animate-spin" />
        </div>
      </div>
    )
  }

  const groupedAddonBenefits = groupBenefitsByParent(
    coverageOption.selectedPlan.AddonBenefits || []
  )

  // Handle checkbox change
  const handleAddonChange = (benefitCode: string, checked: boolean) => {
    let updated: string[]
    if (checked) {
      updated = [...localSelectedAddons, benefitCode]
    } else {
      updated = localSelectedAddons.filter((code) => code !== benefitCode)
    }
    setLocalSelectedAddons(updated)
  }

  // --- Breakdown values ---
  const plan = coverageOption.selectedPlan
  const breakdown = [
    { label: 'Gross Premium', value: plan.GrossPremium },
    { label: 'LGT Amount', value: plan.LGTAmount },
    { label: 'Premium Tax', value: plan.PremiumTaxAmt },
    { label: 'Stamp Duty', value: plan.StampDuty },
    { label: 'Tax Amount', value: plan.TaxAmount },
    { label: 'VAT Amount', value: plan.VatAmount },
    { label: 'Discount', value: plan.DiscountAmount, negative: true },
  ]

  // When Accept is clicked, update the store with selected add-ons
  const handleAccept = async () => {
    updateCoverageOption({
      ...coverageOption,
      selectedAddonBenefits: localSelectedAddons,
    })

    const fullQuoteRequest = mapCptlStateToFullQuoteRequest(
      useCtplInsuranceStateStore.getState()
    )

    console.log('full quore request', fullQuoteRequest)

    const fullQuoteResponse = await mutateAsync({
      data: fullQuoteRequest,
      productType: selectedVehicle.code,
    })

    console.log('fullQuoteResponse', fullQuoteResponse)

    toast.info(`ProposalNo ${fullQuoteResponse.data.ProposalNo}`)

    // increaseStep()
  }

  return (
    <div className="relative w-full space-y-4 border-0">
      <div className="bg-primary flex w-full items-center">
        <div className="mx-auto flex h-fit w-full max-w-7xl flex-col items-center justify-between gap-2 p-8 py-10 lg:flex-row">
          <h1 className="text-lg font-bold text-white md:text-2xl lg:text-3xl xl:text-4xl">
            Your Insurance Plan
          </h1>
          <p className="text-sm text-muted-foreground lg:max-w-2/5 lg:text-right">
            Take a moment to check the details of your selected coverage.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card className="overflow-hidden p-0 shadow-none">
            <CardHeader className="bg-primary/10 dark:bg-primary/30 -space-y-2 border-b pt-6">
              <h2 className="text-lg sm:text-2xl font-black text-foreground dark:text-muted-foreground">
                Main Benefits
              </h2>
              <p className="text-muted-foreground text-sm">
                See the essential benefits and services included in your policy.
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-6">
                {(coverageOption.selectedPlan.MainBenefits || []).map(
                  (benefit, index) => (
                    <div
                      key={`${benefit.SubCoverageName}-${index}`}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <h3 className="font-bold text-foreground dark:text-muted-foreground">
                        {benefit.CoverageName ||
                          benefit.SubCoverageName ||
                          benefit.BenefitDesc}
                      </h3>
                      <span>
                        ₱{parseFloat(benefit.Silimit ?? '0').toLocaleString()}
                      </span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {groupedAddonBenefits &&
            Object.keys(groupedAddonBenefits).length > 0 && (
              <Card className="overflow-hidden p-0 shadow-none">
                <CardHeader className="bg-primary/10 dark:bg-primary/30 -space-y-2 border-b pt-6">
                  <h2 className="text-lg sm:text-2xl font-black text-foreground dark:text-muted-foreground">
                    Select Add-on Benefits
                  </h2>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-6">
                    {Object.entries(groupedAddonBenefits).map(
                      ([benefitCode, benefitGroup]) => (
                        <div key={benefitCode} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={localSelectedAddons.includes(
                                benefitCode
                              )}
                              onChange={(e) =>
                                handleAddonChange(benefitCode, e.target.checked)
                              }
                              className="text-primary focus:ring-primary h-4 w-4 rounded border-border"
                              id={`addon-checkbox-${benefitCode}`}
                            />
                            <label
                              htmlFor={`addon-checkbox-${benefitCode}`}
                              className="cursor-pointer font-bold text-foreground dark:text-muted-foreground"
                            >
                              {benefitGroup.parent.CoverageName}
                            </label>
                          </div>
                          <div className="ml-7 space-y-2">
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
                                <div className="text-sm text-muted-foreground">
                                  <p className="font-medium">
                                    {benefit.BenefitDesc}
                                  </p>
                                  <p className="text-primary font-semibold">
                                    {benefit.Silimit
                                      ? `Up to ₱${Number.parseFloat(benefit.Silimit).toLocaleString()}`
                                      : benefit.DefaultLimitDesc}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* <PDFDownloadLink
              document={<TravelPolicyPDF data={travelPolicy} />}
              fileName="travel-policy.pdf"
            >
              {({ loading }) => (
                <Button
                  className="w-full font-bold"
                  variant="outline"
                  size="lg"
                >
                  {loading
                    ? 'Generating PDF...'
                    : 'View and Download Travel Policy'}
                </Button>
              )}
            </PDFDownloadLink> */}

            <Card className="mt-4 overflow-hidden p-0 shadow-none">
              <CardHeader className="bg-primary/10 dark:bg-primary/30 -space-y-2 border-b pt-6">
                <h2 className="text-lg sm:text-2xl font-black text-foreground dark:text-muted-foreground">
                  Plan Summary
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.CarrierProductName} - {plan.CarrierPlanDesc}
                </p>
              </CardHeader>
              <CardContent className="space-y-6 px-6 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Carrier Code
                  </span>
                  <span className="rounded-md bg-muted px-3 py-1 font-mono text-sm font-semibold dark:bg-gray-800">
                    {coverageOption.carrierCode}
                  </span>
                </div>

                <div>
                  <h3 className="mb-4 text-base font-bold text-foreground dark:text-muted-foreground">
                    Cost Breakdown
                  </h3>
                  <div className="space-y-2">
                    {breakdown.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                        <span
                          className={`text-sm font-semibold ${item.negative ? 'text-destructive' : 'text-foreground dark:text-muted-foreground'}`}
                        >
                          {item.negative ? '-' : ''}₱
                          {Number.parseFloat(
                            item.value?.toString() || '0'
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground dark:text-muted-foreground">
                      Total Premium
                    </span>
                    <span className="text-primary text-lg sm:text-2xl font-bold">
                      ₱ {plan.GrossPremium.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="hidden space-y-3 py-2 lg:block">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 w-full rounded-lg py-3 font-semibold text-white"
                    onClick={handleAccept}
                    data-mobile-action="next"
                  >
                    Accept
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-destructive/50 bg-transparent font-semibold"
                    onClick={() => decreaseStep()}
                    data-mobile-action="back"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
