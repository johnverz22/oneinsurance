'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useParams, useRouter } from 'next/navigation'
import { COMPANIES } from '@/constants/companies'

const PRICES: Record<string, number> = {
  PRIVATECAR: 599, MOTORCYCLE: 290, TPMB: 1150, ACTC: 790, LMT: 660, HTPB: 1250, PTB: 1100,
}

const PLAN_BENEFITS: Record<string, string[]> = {
  PRIVATECAR: ['Third-party bodily injury coverage', 'Third-party property damage', 'Legal liability coverage', 'Ride hailing included'],
  MOTORCYCLE: ['Third-party bodily injury coverage', 'Third-party property damage', 'Legal liability coverage', 'Ride hailing included'],
  TPMB: ['Third-party bodily injury coverage', 'Third-party property damage', 'Public utility vehicle coverage', 'Passenger liability'],
  ACTC: ['Third-party bodily injury coverage', 'Third-party property damage', 'Tourist car coverage', 'AC vehicle included'],
  LMT: ['Third-party bodily injury coverage', 'Third-party property damage', 'Cargo vehicle coverage', 'Delivery vehicle included'],
  HTPB: ['Third-party bodily injury coverage', 'Third-party property damage', 'Heavy vehicle coverage', 'Private bus included'],
  PTB: ['Third-party bodily injury coverage', 'Third-party property damage', 'Public bus coverage', 'Tourist bus included'],
}

export default function CtplPlanDetailsStep() {
  const { selectedVehicle, increaseStep } = useCtplInsuranceStateStore()
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string

  const price = PRICES[selectedVehicle?.code ?? 'PRIVATECAR'] ?? 599
  const benefits = PLAN_BENEFITS[selectedVehicle?.code ?? 'PRIVATECAR'] ?? []

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="from-primary to-accent mb-6 bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
          Your Plan Details
        </h2>

        {/* Plan Card */}
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-16 w-32 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-2">
            <span className="text-2xl">🚗</span>
          </div>
          <div className="flex-1">
            <span className="mb-1 inline-block rounded-full border border-gray-200 px-3 py-0.5 text-xs text-gray-600">CTPL Insurance</span>
            <h3 className="text-lg font-black uppercase text-gray-900">{selectedVehicle?.title}</h3>
            <p className="text-sm text-gray-500">Ride Hailing Included</p>
          </div>
          <div className="shrink-0">
            <span className="rounded-full bg-[#F5A623] px-4 py-2 text-sm font-bold text-white">
              ₱ {price.toLocaleString()}
            </span>
          </div>
        </div>

        <hr className="mb-4" />

        {/* Benefits */}
        <ul className="mb-6 space-y-2.5">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <svg className="text-primary mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">{b}</span>
            </li>
          ))}
        </ul>

        <hr className="mb-4" />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Vehicle Type</p>
            <p className="font-semibold text-gray-800">{selectedVehicle?.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Premium</p>
            <p className="font-semibold text-gray-800">₱ {price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Coverage Period</p>
            <p className="font-semibold text-gray-800">1 Year</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Product Code</p>
            <p className="font-semibold text-gray-800">CTPL</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-full px-8"
          onClick={() => router.push(`/${agentCode}/products/ctpl-insurance`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          className="from-primary to-accent rounded-full bg-gradient-to-r px-10 font-semibold text-white"
          onClick={increaseStep}
        >
          Continue to Vehicle Details
        </Button>
      </div>
    </div>
  )
}
