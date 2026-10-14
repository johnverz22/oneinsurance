'use client'

import Image from 'next/image'
import { useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { format, addYears } from 'date-fns'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRICES: Record<string, number> = {
  PRIVATECAR: 599, MOTORCYCLE: 290, TPMB: 1150, ACTC: 790, LMT: 660, HTPB: 1250, PTB: 1100,
}

type PaymentBrand = { label: string; image: string; isCard: boolean }

const PAYMENT_BRANDS: PaymentBrand[] = [
  { label: 'Visa', image: '/payment-brands/visa.png', isCard: true },
  { label: 'Mastercard', image: '/payment-brands/mastercard.png', isCard: true },
  { label: 'GCash', image: '/payment-brands/gcash.png', isCard: false },
  { label: 'Maya', image: '/payment-brands/maya.png', isCard: false },
  { label: 'ShopeePay', image: '/payment-brands/shopeepay.png', isCard: false },
  { label: 'GrabPay', image: '/payment-brands/grabpay.png', isCard: false },
]

function CtplPaymentContent() {
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { selectedVehicle, personalInfo } = useCtplInsuranceStateStore()
  const [selectedBrand, setSelectedBrand] = useState<PaymentBrand | null>(null)
  const [filter, setFilter] = useState<'all' | 'cards' | 'digital'>('all')
  const [showSuccess, setShowSuccess] = useState(false)

  // Card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardFirstName, setCardFirstName] = useState(personalInfo.firstName ?? '')
  const [cardLastName, setCardLastName] = useState(personalInfo.lastName ?? '')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const price = PRICES[selectedVehicle?.code ?? 'PRIVATECAR'] ?? 599
  const today = new Date()
  const policyExpiry = addYears(today, 1)

  const filteredBrands = PAYMENT_BRANDS.filter(b => {
    if (filter === 'cards') return b.isCard
    if (filter === 'digital') return !b.isCard
    return true
  })

  const handlePay = () => setShowSuccess(true)

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-black text-foreground">Payment Successful!</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Your policy details have been confirmed and recorded in our system. Please note that this serves as a confirmation of coverage only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and made available to you shortly.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => router.push(`/${agentCode}/products/motor-insurance/invoice`)}>
              View Invoice
            </Button>
            <Button className="from-primary to-accent flex-1 rounded-full bg-gradient-to-r text-white" onClick={() => router.push(`/${agentCode}/products/motor-insurance/certificate`)}>
              View Cover Note
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full bg-section min-h-screen pb-10">
      {/* Header */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div role="button" tabIndex={0} onClick={() => router.push(`/${agentCode}`)} className="inline-flex cursor-pointer items-center gap-3 rounded-tl-full rounded-br-full bg-white px-13 py-1 shadow-lg">
          <Image src="/images/logo.png" alt="One Insurance" width={256} height={63} className="h-10 w-auto" priority />
        </div>
        <Image src="/images/IFRC.png" alt="IFRC" width={1290} height={800} className="h-8 w-auto sm:h-10" priority />
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left — Premium Summary */}
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-foreground text-center">Gross Premium</h3>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Payment</p>
              <p className="text-4xl font-black text-foreground">₱ {price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Selected CTPL Plan</p>
              <p className="font-bold text-foreground">{selectedVehicle?.title}</p>
              <p className="text-xs text-muted-foreground">Ride Hailing Included</p>
              <p className="text-sm text-muted-foreground pt-1">₱ {price.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Policy Period</p>
              <p className="text-sm font-semibold text-foreground">
                {format(today, 'MMMM d, yyyy')} – {format(policyExpiry, 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3">
              <input placeholder="Get a Promo Code" className="flex-1 bg-transparent text-sm outline-none text-muted-foreground placeholder:text-muted-foreground" />
              <button className="text-sm font-semibold text-orange-500">Apply</button>
            </div>
          </div>

          {/* Right — Payment Method */}
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-xl font-bold text-foreground">Payment Method</h3>

            {/* Filter tabs */}
            <div className="flex gap-2">
              {(['all', 'cards', 'digital'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setSelectedBrand(null) }}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                    filter === f
                      ? 'from-primary to-accent border-transparent bg-gradient-to-r text-white'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {f === 'all' ? 'All' : f === 'cards' ? 'Cards' : 'E-Wallet'}
                </button>
              ))}
            </div>

            {/* Payment brand grid */}
            <div className="grid grid-cols-3 gap-3">
              {filteredBrands.map(brand => (
                <button
                  key={brand.label}
                  onClick={() => setSelectedBrand(brand)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all',
                    selectedBrand?.label === brand.label
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <div className="flex h-8 w-16 items-center justify-center">
                    <span className="text-xs font-bold text-foreground">{brand.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Card fields — show when card brand selected */}
            {selectedBrand?.isCard && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">First Name</Label>
                    <Input value={cardFirstName} onChange={e => setCardFirstName(e.target.value)} placeholder="First Name" className="h-11 rounded-full" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">Last Name</Label>
                    <Input value={cardLastName} onChange={e => setCardLastName(e.target.value)} placeholder="Last Name" className="h-11 rounded-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">Card Number</Label>
                  <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" className="h-11 rounded-full" maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">Expiry</Label>
                    <Input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" className="h-11 rounded-full" maxLength={5} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">CVV</Label>
                    <Input value={cvv} onChange={e => setCvv(e.target.value)} placeholder="CVV" className="h-11 rounded-full" maxLength={4} type="password" />
                  </div>
                </div>
              </div>
            )}

            {/* E-wallet fields */}
            {selectedBrand && !selectedBrand.isCard && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm text-muted-foreground">You will be redirected to <span className="font-semibold">{selectedBrand.label}</span> to complete your payment.</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => router.back()}>Back</Button>
              <Button
                className="from-primary to-accent flex-1 rounded-full bg-gradient-to-r text-white disabled:opacity-50"
                onClick={handlePay}
                disabled={!selectedBrand}
              >
                Pay Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CtplPaymentPage() {
  return <Suspense fallback={<PageLoader />}><CtplPaymentContent /></Suspense>
}
