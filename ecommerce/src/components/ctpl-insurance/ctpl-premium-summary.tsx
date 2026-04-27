'use client'

import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { Card, CardContent } from '@/components/ui/card'
import { format, addYears } from 'date-fns'

export default function CtplPremiumSummary() {
  const { selectedVehicle } = useCtplInsuranceStateStore()

  // Mock price based on vehicle type
  const PRICES: Record<string, number> = {
    PRIVATECAR: 599,
    MOTORCYCLE: 290,
    TPMB: 1150,
    ACTC: 790,
    LMT: 660,
    HTPB: 1250,
    PTB: 1100,
  }

  const price = PRICES[selectedVehicle?.code ?? 'PRIVATECAR'] ?? 599
  const today = new Date()
  const expiry = addYears(today, 1)

  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-800 text-center">Gross Premium</h3>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Payment</p>
            <p className="text-4xl font-black text-gray-900">₱ {price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1">
            <p className="text-xs text-gray-400">Selected CTPL Plan</p>
            <p className="font-bold text-gray-900">{selectedVehicle?.title ?? 'Private Cars'}</p>
            <p className="text-xs text-gray-500">Ride Hailing Included</p>
            <div className="flex justify-between pt-1">
              <span className="text-sm text-gray-600">₱ {price.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-400 mb-1">Policy Period</p>
            <p className="text-sm font-semibold text-gray-800">
              {format(today, 'MMMM d, yyyy')} – {format(expiry, 'MMMM d, yyyy')}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <input
              placeholder="Get a Promo Code"
              className="flex-1 bg-transparent text-sm outline-none text-gray-600 placeholder:text-gray-400"
            />
            <button className="text-sm font-semibold text-orange-500 hover:text-orange-600">Apply</button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
