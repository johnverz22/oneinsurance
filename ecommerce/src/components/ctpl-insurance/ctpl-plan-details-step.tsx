'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useParams, useRouter } from 'next/navigation'
import { COMPANIES } from '@/constants/companies'
import Image from 'next/image'
import { format } from 'date-fns'

export default function CtplPlanDetailsStep() {
  const {
    insuranceType,
    duration,
    coverageOption,
    increaseStep,
  } = useCtplInsuranceStateStore()

  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string

  const plan = coverageOption?.selectedPlan as any
  const carrier = COMPANIES.find(c => c.carrierCode === coverageOption?.carrierCode)

  // Premium values from the plan
  const grossPremium = parseFloat(plan?.GrossPremium || plan?.BeforeVatPremium || '0')
  const duePremium = parseFloat(plan?.DuePremium || '0')
  const vatAmount = parseFloat(plan?.VatAmount || '0')
  const stampDuty = parseFloat(plan?.StampDuty || '0')
  const lgtAmount = parseFloat(plan?.LGTAmount || '0')
  const premiumTax = parseFloat(plan?.PremiumTaxAmt || '0')

  const row = (label: string, value: string) => (
    <div className="flex justify-between border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="from-primary to-accent mb-6 bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
          Your Selected Plan
        </h2>

        {/* Carrier & Plan Info */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-5">
          <div className="flex items-center gap-4">
            {carrier?.image ? (
              <div className="flex h-16 w-24 items-center justify-center">
                <Image src={carrier.image} alt={carrier.companyName} width={96} height={48} className="object-contain" />
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">🚗</div>
            )}
            <div>
              <span className="mb-1 inline-block rounded-full border border-gray-200 bg-white px-3 py-0.5 text-xs text-gray-600">
                {insuranceType} Insurance
              </span>
              <h3 className="text-lg font-black text-gray-900">
                {plan?.CarrierProductName || plan?.CarrierPlanDesc || plan?.CarrierPlanCode}
              </h3>
              <p className="text-sm text-gray-500">{carrier?.companyName || coverageOption?.carrierCode}</p>
            </div>
          </div>
        </div>

        {/* Coverage Period */}
        {duration?.effectiveDate && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-600 mb-1">Coverage Period</p>
            <p className="text-sm font-bold text-blue-900">
              {format(new Date(duration.effectiveDate), 'MMMM d, yyyy')} – {format(new Date(duration.expiryDate), 'MMMM d, yyyy')}
            </p>
            <p className="text-xs text-blue-600 mt-1">{duration.duration} Year Coverage</p>
          </div>
        )}

        {/* Premium Breakdown */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4">
          <p className="mb-3 text-sm font-bold text-gray-700">Premium Breakdown</p>
          {row('Base Premium', `₱ ${grossPremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)}
          {vatAmount > 0 && row('VAT', `₱ ${vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)}
          {stampDuty > 0 && row('Stamp Duty', `₱ ${stampDuty.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)}
          {lgtAmount > 0 && row('LGT', `₱ ${lgtAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)}
          {premiumTax > 0 && row('Premium Tax', `₱ ${premiumTax.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
            <span className="font-bold text-gray-800">Total Premium</span>
            <span className="text-lg font-black text-primary">
              ₱ {duePremium > 0
                ? duePremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                : grossPremium.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Main Benefits */}
        {plan?.MainBenefits?.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="mb-3 text-sm font-bold text-gray-700">Coverage Benefits</p>
            <div className="space-y-2">
              {plan.MainBenefits.map((benefit: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{benefit.BenefitDesc}</p>
                    {benefit.Silimit && (
                      <p className="text-xs text-gray-500">
                        Coverage: ₱ {parseInt(benefit.Silimit).toLocaleString('en-PH')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-full px-8"
          onClick={() => router.push(`/${agentCode}/products/motor-insurance`)}
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
