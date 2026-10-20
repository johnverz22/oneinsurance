'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { useHealthCartStore } from '@/store/health-cart-store'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import { useParams, useRouter } from 'next/navigation'

export function HealthPlanDetailsStep() {
  const { nextStep } = useHealthAvailStore()
  const { items, insuredInfo } = useHealthCartStore()
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const item = items[0]

  if (!item) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-muted-foreground">No plan selected. Please go back and select a plan.</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => router.push(`/${agentCode}/products/health-insurance`)}>Back</Button>
      </div>
    )
  }

  const provider = COMPANIES.find(c => c.carrierCode === item.carrierCode) ?? null
  const brandColor = provider ? (CARRIER_BRAND_COLORS[provider.carrierCode] || null) : null
  const logo = (brandColor as any)?.planCardLogo || (provider?.image ?? item.providerLogo ?? null)
  const providerName = provider?.companyName ?? item.provider
  const benefits = item.tierDescription ? item.tierDescription.split(', ') : []

  return (
    <div className="space-y-6">
      {/* Plan Details Card */}
      <Card className="overflow-hidden shadow-none">
        <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-primary text-lg sm:text-2xl font-bold">
            Your Plan Details
          </h2>
          <CheckCircle className="text-primary h-6 w-6" />
        </div>

        {/* Provider + Plan */}
        <div className="mb-6 flex items-start gap-4">
          <div className="h-14 w-28 shrink-0 overflow-hidden rounded-md">
            {logo ? (
              <img src={logo} alt={providerName} className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : null}
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-foreground">{item.planName}</h3>
          </div>
          <div className="ml-auto shrink-0">
            <span className="rounded-full bg-orange-400 px-4 py-2 text-sm font-bold text-white">
              ₱ {item.premium.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <hr className="mb-4" />

        {/* Insured Info */}
        {insuredInfo && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium text-foreground dark:text-muted-foreground">Insured Name</p>
              <p className="text-primary dark:text-accent text-base font-bold uppercase">{insuredInfo.insuredName}</p>
            </div>
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium text-foreground dark:text-muted-foreground">Date of Birth</p>
              <p className="text-primary dark:text-accent text-base font-bold">{insuredInfo.dateOfBirth}</p>
            </div>
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium text-foreground dark:text-muted-foreground">Gender</p>
              <p className="text-primary dark:text-accent text-base font-bold">{insuredInfo.genderCode === 'M' ? 'Male' : 'Female'}</p>
            </div>
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium text-foreground dark:text-muted-foreground">Smoker</p>
              <p className="text-primary dark:text-accent text-base font-bold">{insuredInfo.isSmoker === 'Y' ? 'Yes' : 'No'}</p>
            </div>
            {insuredInfo.effectiveDate && (
              <div className="space-y-2 py-1">
                <p className="text-sm font-medium text-foreground dark:text-muted-foreground">Coverage Start</p>
                <p className="text-primary dark:text-accent text-base font-bold">
                  {new Date(insuredInfo.effectiveDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            )}
            {insuredInfo.effectiveDate && (
              <div className="space-y-2 py-1">
                <p className="text-sm font-medium text-foreground dark:text-muted-foreground">Expiration Date</p>
                <p className="text-primary dark:text-accent text-base font-bold">
                  {insuredInfo.expiryDate
                    ? new Date(insuredInfo.expiryDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '—'}
                </p>
              </div>
            )}
            {insuredInfo.effectiveDate && insuredInfo.expiryDate && (
              <div className="space-y-2 py-1">
                <p className="text-sm font-medium text-foreground dark:text-muted-foreground">Duration</p>
                <p className="text-primary dark:text-accent text-base font-bold">
                  {(() => {
                    const days = Math.round((new Date(insuredInfo.expiryDate).getTime() - new Date(insuredInfo.effectiveDate).getTime()) / (1000 * 60 * 60 * 24))
                    return `${days} days`
                  })()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <>
            <hr className="mb-4" />
            <h4 className="mb-3 text-sm font-bold text-foreground">Key Benefits</h4>
            <ul className="space-y-2">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="text-primary mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        </CardContent>
      </Card>

      <div className="hidden items-center justify-between lg:flex">
        <Button variant="outline" size="lg" className="w-1/2 rounded-full bg-transparent px-12 font-semibold lg:w-max" onClick={() => router.push(`/${agentCode}/products/health-insurance`)} data-mobile-action="back">
          Cancel
        </Button>
        <Button
          size="lg"
          className="from-primary to-accent w-1/2 rounded-full bg-gradient-to-r via-90% px-14 text-sm font-medium text-white shadow-lg lg:w-max dark:text-white"
          onClick={nextStep}
          data-mobile-action="next"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
