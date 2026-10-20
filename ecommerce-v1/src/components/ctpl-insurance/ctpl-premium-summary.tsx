'use client'

import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Info } from 'lucide-react'
import { COMPANIES } from '@/constants/companies'

export default function CtplPremiumSummary() {
  const { coverageOption, insuranceType } = useCtplInsuranceStateStore()

  const plan = coverageOption?.selectedPlan as any
  const carrier = COMPANIES.find(c => c.carrierCode === coverageOption?.carrierCode)

  const duePremium = parseFloat(plan?.DuePremium || '0')
  const grossPremium = parseFloat(plan?.GrossPremium || plan?.BeforeVatPremium || '0')
  const totalPremium = duePremium > 0 ? duePremium : grossPremium

  const providerName = carrier?.companyName || coverageOption?.carrierCode || '—'
  const planName = plan?.CarrierProductName || plan?.CarrierPlanDesc || plan?.CarrierPlanCode || '—'

  return (
    <div className="sticky top-24 flex w-full flex-col space-y-6">
      <Card className="bg-background overflow-hidden p-0 shadow-none">
        <CardHeader className="pt-6 pb-4">
          <h2 className="text-center text-2xl font-black text-foreground">
            Total Premium
          </h2>
          <p className="text-center text-lg sm:text-2xl font-bold md:text-3xl lg:text-4xl mt-2">
            {totalPremium > 0
              ? `₱${totalPremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : '—'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-8">
          {/* Insurance Provider */}
          <div className="rounded-lg border border-border px-4 py-3">
            <p className="mb-1 text-sm text-muted-foreground">Insurance Provider</p>
            <p className="font-semibold text-foreground">{providerName}</p>
          </div>

          {/* Plan */}
          <div className="rounded-lg border border-border px-4 py-3">
            <p className="mb-1 text-sm text-muted-foreground">Plan</p>
            <p className="font-semibold uppercase text-foreground">{planName}</p>
          </div>

          {/* About this premium */}
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Info className="h-4 w-4" />
              About this premium
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The total premium already includes the base insurance cost, applicable taxes and fees as determined by the insurance provider.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
