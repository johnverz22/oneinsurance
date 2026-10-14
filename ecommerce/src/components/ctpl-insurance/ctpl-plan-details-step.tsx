'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle, Car, Info } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useParams, useRouter } from 'next/navigation'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import Image from 'next/image'
import { format } from 'date-fns'

export default function CtplPlanDetailsStep() {
  const { insuranceType, duration, coverageOption, increaseStep } = useCtplInsuranceStateStore()

  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string

  const plan = coverageOption?.selectedPlan as any
  const carrier = COMPANIES.find(c => c.carrierCode === coverageOption?.carrierCode)

  const grossPremium = parseFloat(plan?.GrossPremium || plan?.BeforeVatPremium || '0')
  const duePremium = parseFloat(plan?.DuePremium || '0')
  const totalPremium = duePremium > 0 ? duePremium : grossPremium

  return (
    <div className="relative mx-auto flex max-w-7xl flex-col-reverse gap-8 px-1.5 lg:flex-row">

      {/* LEFT — 3/5 width, matches travel */}
      <div className="lg:w-3/5 space-y-4">

        {/* Your Plan Details card */}
        <Card className="bg-background overflow-hidden shadow-none">
          <CardHeader className="flex items-center justify-between -space-y-2 pb-2 pt-6">
            <h2 className="text-primary text-lg sm:text-2xl font-bold">Your Plan Details</h2>
            <CheckCircle className="text-primary" />
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            {/* Plan name + badge only (no logo — matching travel's "Your Travel Details" card) */}
            <div>
              <h3 className="text-xl font-bold text-foreground uppercase leading-snug">
                {plan?.CarrierProductName || plan?.CarrierPlanDesc || plan?.CarrierPlanCode}
              </h3>
              <span className="mt-1 inline-block rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                {insuranceType} Insurance
              </span>
            </div>

            {/* Coverage period */}
            {duration?.effectiveDate && (
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-xs font-semibold text-primary mb-1">Coverage Period</p>
                <p className="text-sm font-bold text-foreground">
                  {format(new Date(duration.effectiveDate), 'MMMM d, yyyy')} – {format(new Date(duration.expiryDate), 'MMMM d, yyyy')}
                </p>
                <p className="text-xs text-primary mt-0.5">{duration.duration} Year Coverage</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits card — matches travel review-coverage layout */}
        {plan?.MainBenefits?.length > 0 && (
          <Card className="bg-background overflow-hidden shadow-none">
            <CardHeader className="pb-2 pt-6">
              <h2 className="text-primary text-lg sm:text-2xl font-bold">Plan Details</h2>
            </CardHeader>
            <CardContent className="px-6 py-6">
              <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:divide-x">
                {/* Left: carrier logo + plan name (like travel - no provider name text) */}
                <div className="w-full space-y-2 lg:w-auto lg:shrink-0">
                  <div className="relative h-14 w-28 overflow-hidden rounded-md">
                    {(() => {
                      const brandColor = carrier ? (CARRIER_BRAND_COLORS[carrier.carrierCode] as any) : null
                      const logoSrc = brandColor?.planCardLogo || carrier?.image
                      return logoSrc ? (
                        <Image src={logoSrc} alt={carrier?.companyName || ''} width={112} height={56} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10">
                          <Car className="h-5 w-5 text-primary" />
                        </div>
                      )
                    })()}
                  </div>

                  <h3 className="text-foreground text-left text-xl font-bold tracking-wide uppercase">
                    {plan?.CarrierProductName || plan?.CarrierPlanDesc || plan?.CarrierPlanCode}
                  </h3>
                </div>

                {/* Right: benefits list */}
                <div className="flex w-full flex-col gap-4 lg:pl-8">
                  <h3 className="text-primary text-base font-bold lg:text-2xl">Benefits</h3>
                  <div className="space-y-2.5">
                    {plan.MainBenefits.map((benefit: any, i: number) => (
                      <div key={i} className="grid grid-cols-2 items-center gap-3">
                        <h4 className="text-sm">{benefit.BenefitDesc}</h4>
                        <small className="text-muted-foreground text-right text-xs">
                          {benefit.Silimit
                            ? `₱ ${parseInt(benefit.Silimit).toLocaleString('en-PH')}`
                            : benefit.DefaultLimitDesc || '—'}
                        </small>
                      </div>
                    ))}
                  </div>

                  {/* Price pill — green like travel */}
                  <div className="flex justify-end">
                    <span className="bg-tertiary rounded-full px-6 py-2 text-center text-base font-bold text-white">
                      PHP {totalPremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile-only: Premium summary (replaces sidebar on mobile) */}
        <div className="lg:hidden rounded-xl border border-border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Insurance Provider</span>
            <span className="text-sm font-semibold text-foreground">{carrier?.companyName || coverageOption?.carrierCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-semibold text-foreground uppercase text-right max-w-[60%]">{plan?.CarrierProductName || plan?.CarrierPlanDesc || plan?.CarrierPlanCode}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-bold text-foreground">Total Premium</span>
            <span className="text-lg font-black text-primary">₱{totalPremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            The total premium includes base cost and applicable taxes.
          </p>
        </div>

        {/* Buttons — Cancel left, Next right — exactly like travel */}
        <div className="hidden items-center justify-between pt-2 lg:flex">
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full px-10 font-medium text-foreground"
            onClick={() => router.push(`/${agentCode}/products/motor-insurance`)}
            data-mobile-action="back"
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="from-primary to-accent rounded-full bg-gradient-to-r px-10 font-semibold text-white"
            onClick={increaseStep}
            data-mobile-action="next"
          >
            Next
          </Button>
        </div>
      </div>

      {/* RIGHT — 2/5 width sticky sidebar, hidden on mobile */}
      <div className="hidden lg:block lg:w-2/5">
        <div className="sticky top-24 flex w-full flex-col space-y-6">
          <Card className="bg-background overflow-hidden shadow-none">
            <CardHeader className="pt-6 pb-4">
              <h2 className="text-center text-2xl font-black text-foreground">
                Total Premium
              </h2>
              <p className="mt-2 text-center text-3xl font-bold lg:text-4xl">
                ₱{totalPremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-8">
              {/* Insurance Provider */}
              <div className="rounded-lg border border-border px-4 py-3">
                <p className="mb-1 text-sm text-muted-foreground">Insurance Provider</p>
                <p className="font-semibold text-foreground">{carrier?.companyName || coverageOption?.carrierCode}</p>
              </div>

              {/* Plan */}
              <div className="rounded-lg border border-border px-4 py-3">
                <p className="mb-1 text-sm text-muted-foreground">Plan</p>
                <p className="font-semibold uppercase text-foreground">
                  {plan?.CarrierProductName || plan?.CarrierPlanDesc || plan?.CarrierPlanCode}
                </p>
              </div>

              {/* About this premium — matches travel info note */}
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
      </div>

    </div>
  )
}
