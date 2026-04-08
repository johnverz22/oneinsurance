'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { useHealthCartStore } from '@/store/health-cart-store'

const CARRIER_LOGOS: Record<string, string> = {
  OONAPH: '/images/providers/1 Oona.svg',
  PACIFIC: '/images/providers/5 Pacific Cross.svg',
  MALAYAN: '/images/providers/2 Malayan.svg',
}

export function HealthPlanDetailsStep() {
  const { prevStep, nextStep } = useHealthAvailStore()
  const { items, insuredInfo } = useHealthCartStore()
  const item = items[0]

  if (!item) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-muted-foreground">No plan selected. Please go back and select a plan.</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={prevStep}>Back</Button>
      </div>
    )
  }

  const logo = item.providerLogo || CARRIER_LOGOS['OONAPH']
  const benefits = item.tierDescription ? item.tierDescription.split(', ') : []

  return (
    <div className="space-y-6">
      {/* Plan Details Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="from-primary to-accent mb-6 bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
          Your Plan Details
        </h2>

        {/* Provider + Plan */}
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-16 w-32 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-2">
            <img src={logo} alt={item.provider} className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <span className="mb-1 inline-block rounded-full border border-gray-200 px-3 py-0.5 text-xs text-gray-600">{item.provider}</span>
            <h3 className="text-lg font-black uppercase text-gray-900">{item.planName}</h3>
            <p className="text-sm text-gray-500">{item.tierSubtitle}</p>
          </div>
          <div className="ml-auto shrink-0">
            <span className="rounded-full bg-[#F5A623] px-4 py-2 text-sm font-bold text-white">
              ₱ {item.premium.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <hr className="mb-4" />

        {/* Insured Info */}
        {insuredInfo && (
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-400">Insured Name</p>
              <p className="font-semibold text-gray-800">{insuredInfo.insuredName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date of Birth</p>
              <p className="font-semibold text-gray-800">{insuredInfo.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Gender</p>
              <p className="font-semibold text-gray-800">{insuredInfo.genderCode === 'M' ? 'Male' : 'Female'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Smoker</p>
              <p className="font-semibold text-gray-800">{insuredInfo.isSmoker === 'Y' ? 'Yes' : 'No'}</p>
            </div>
            {insuredInfo.effectiveDate && (
              <div>
                <p className="text-xs text-gray-400">Coverage Start</p>
                <p className="font-semibold text-gray-800">
                  {new Date(insuredInfo.effectiveDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <>
            <hr className="mb-4" />
            <h4 className="mb-3 text-sm font-bold text-gray-700">Key Benefits</h4>
            <ul className="space-y-2">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="text-primary mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">{b}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-full px-8" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          className="from-primary to-accent rounded-full bg-gradient-to-r px-10 text-white"
          onClick={nextStep}
        >
          Continue to Personal Information
        </Button>
      </div>
    </div>
  )
}
