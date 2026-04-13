'use client'

import { useHealthCartStore } from '@/store/health-cart-store'
import { COMPANIES } from '@/constants/companies'

export function HealthPremiumSummary() {
  const { items } = useHealthCartStore()
  const item = items[0]
  const total = items.reduce((sum, i) => sum + i.premium * i.quantity, 0)

  if (!item) return null

  const provider = COMPANIES.find(c => c.carrierCode === item.carrierCode) ?? null
  const providerName = provider?.companyName ?? item.provider

  return (
    <div className="sticky top-6 rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-center text-lg font-black text-gray-900">Total Premium</h3>
      <p className="mb-6 text-center text-4xl font-black text-gray-900">
        ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
      </p>

      <div className="space-y-3 rounded-xl border p-4 text-sm">
        <div>
          <p className="text-xs text-gray-400">Insurance Provider</p>
          <p className="font-semibold text-gray-800">{providerName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Plan</p>
          <p className="font-semibold text-gray-800">{item.planName}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        The total premium already includes the base insurance cost and applicable taxes as determined by the insurance provider.
      </p>
    </div>
  )
}
