'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useParams, useRouter } from 'next/navigation'
import { format, addYears } from 'date-fns'
import { cn } from '@/lib/utils'
import { popup } from '@/store/use-popup-store'

const PRICES: Record<string, number> = {
  PRIVATECAR: 599, MOTORCYCLE: 290, TPMB: 1150, ACTC: 790, LMT: 660, HTPB: 1250, PTB: 1100,
}

type PaymentBrand = { label: string; type: 'Card' | 'Digital'; logo: string }

const PAYMENT_BRANDS: PaymentBrand[] = [
  { label: 'Discover', type: 'Card', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Discover_Card_logo.svg/200px-Discover_Card_logo.svg.png' },
  { label: 'Diners', type: 'Card', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Diners_Club_Logo3.svg/200px-Diners_Club_Logo3.svg.png' },
  { label: 'Mastercard', type: 'Card', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png' },
  { label: 'Visa', type: 'Card', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png' },
  { label: 'QR Ph', type: 'Card', logo: 'https://www.bsp.gov.ph/Media/QR-Ph-Logo.png' },
  { label: 'GrabPay', type: 'Digital', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/GrabPay_logo.svg/200px-GrabPay_logo.svg.png' },
  { label: 'UnionPay', type: 'Digital', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/UnionPay_logo.svg/200px-UnionPay_logo.svg.png' },
  { label: 'GCash', type: 'Digital', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/GCash_logo.svg/200px-GCash_logo.svg.png' },
  { label: 'Maya', type: 'Digital', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Maya_logo.svg/200px-Maya_logo.svg.png' },
]

export default function CtplPaymentStep() {
  const { selectedVehicle, personalInfo, decreaseStep } = useCtplInsuranceStateStore()
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string

  const [filter, setFilter] = useState<'all' | 'cards' | 'digital'>('all')
  const [selectedBrand, setSelectedBrand] = useState<PaymentBrand | null>(null)
  const [showDone, setShowDone] = useState(false)

  // Card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardFirstName, setCardFirstName] = useState(personalInfo.firstName ?? '')
  const [cardLastName, setCardLastName] = useState(personalInfo.lastName ?? '')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvv, setCvv] = useState('')

  // Personal details
  const [email, setEmail] = useState(personalInfo.email ?? '')
  const [phone, setPhone] = useState(personalInfo.mobileNumber ?? '')

  // Billing address
  const [country] = useState('Philippines')
  const [province, setProvince] = useState(personalInfo.province ?? '')
  const [city, setCity] = useState(personalInfo.city ?? '')
  const [postCode, setPostCode] = useState(personalInfo.zipCode ?? '')
  const [address1, setAddress1] = useState(personalInfo.addressLine1 ?? '')
  const [address2, setAddress2] = useState(personalInfo.addressLine2 ?? '')

  const price = PRICES[selectedVehicle?.code ?? 'PRIVATECAR'] ?? 599
  const today = new Date()
  const policyExpiry = addYears(today, 1)

  const filteredBrands = PAYMENT_BRANDS.filter(b => {
    if (filter === 'cards') return b.type === 'Card'
    if (filter === 'digital') return b.type === 'Digital'
    return true
  })

  if (showDone) {
    // Navigate immediately — this block should not render
    router.push(`/${agentCode}/products/ctpl-insurance/invoice`)
    return null
  }

  return (
    <div className="space-y-0">
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
            Choose Your Payment Method
          </h2>
          <p className="text-sm text-gray-500">Select which payment you will use</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total Amount</p>
          <p className="text-2xl font-black text-gray-900">₱{price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — Payment brands */}
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2 rounded-xl border border-gray-200 p-1">
            {(['all', 'cards', 'digital'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setSelectedBrand(null) }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all',
                  filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {f === 'all' ? '🛒 All Methods' : f === 'cards' ? '💳 Cards' : '📱 Digital Wallets'}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">All Payment Options</p>
            <p className="mb-1 text-center text-sm font-semibold text-gray-800">Choose Your Payment Method</p>
            <p className="mb-4 text-center text-xs text-gray-500">Secure and encrypted payment options</p>

            <div className="grid grid-cols-3 gap-3">
              {filteredBrands.map(brand => (
                <button
                  key={brand.label}
                  onClick={() => setSelectedBrand(brand)}
                  className={cn(
                    'relative flex flex-col items-center justify-between gap-2 rounded-xl border p-3 transition-all',
                    selectedBrand?.label === brand.label
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {selectedBrand?.label === brand.label && (
                    <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="flex h-10 w-full items-center justify-center">
                    <img
                      src={brand.logo}
                      alt={brand.label}
                      className="h-8 w-auto max-w-[80px] object-contain"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement
                        t.style.display = 'none'
                        t.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <span className="hidden text-sm font-bold text-gray-700">{brand.label}</span>
                  </div>
                  <span className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white',
                    brand.type === 'Card' ? 'bg-primary' : 'bg-gray-500'
                  )}>
                    {brand.type === 'Card' ? '💳' : '📱'} {brand.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Card info + personal details + billing */}
        <div className="space-y-4">
          {/* Selected brand preview */}
          {selectedBrand && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs text-gray-400">Complete your payment securely</p>
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <img src={selectedBrand.logo} alt={selectedBrand.label} className="h-8 w-auto max-w-[60px] object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div>
                  <p className="text-sm font-semibold">Pay with {selectedBrand.label}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-500"><Lock className="h-3 w-3" /> Secure payment processing</p>
                </div>
              </div>
            </div>
          )}

          {/* Card Information */}
          {selectedBrand?.type === 'Card' && (
            <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                <span>💳</span> Card Information
              </h3>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">Card Number</Label>
                <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" className="h-11 rounded-xl" maxLength={19} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-600">MM</Label>
                  <Input value={expiryMonth} onChange={e => setExpiryMonth(e.target.value)} placeholder="MM" className="h-11 rounded-xl" maxLength={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-600">YYYY</Label>
                  <Input value={expiryYear} onChange={e => setExpiryYear(e.target.value)} placeholder="YYYY" className="h-11 rounded-xl" maxLength={4} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-600">123</Label>
                  <Input value={cvv} onChange={e => setCvv(e.target.value)} placeholder="CVV" className="h-11 rounded-xl" maxLength={4} type="password" />
                </div>
              </div>
            </div>
          )}

          {/* Personal Details */}
          <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Personal Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">First Name</Label>
                <Input value={cardFirstName} onChange={e => setCardFirstName(e.target.value)} placeholder="First Name" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">Last Name</Label>
                <Input value={cardLastName} onChange={e => setCardLastName(e.target.value)} placeholder="Last Name" className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">Phone Number (Optional)</Label>
              <div className="flex h-11 items-center overflow-hidden rounded-xl border bg-white">
                <span className="border-r px-3 text-sm text-gray-500">+63</span>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9XX XXX XXXX" className="h-full flex-1 border-0 shadow-none focus-visible:ring-0" />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Billing Address</h3>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">Country</Label>
              <div className="flex h-11 items-center rounded-xl border bg-gray-50 px-3">
                <span className="text-sm text-gray-700">Philippines</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">State/Province/Region</Label>
                <Input value={province} onChange={e => setProvince(e.target.value)} placeholder="Province" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">City/Municipality</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">Postal Code</Label>
              <Input value={postCode} onChange={e => setPostCode(e.target.value)} placeholder="Postal Code" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">Address Line 1</Label>
              <Input value={address1} onChange={e => setAddress1(e.target.value)} placeholder="Address Line 1" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">Address Line 2</Label>
              <Input value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Address Line 2" className="h-11 rounded-xl" />
            </div>

            <Button
              className="from-primary to-accent w-full rounded-full bg-gradient-to-r py-3 font-semibold text-white disabled:opacity-50"
              disabled={!selectedBrand}
              onClick={() => {
                popup.show({
                  title: 'Payment Successful!',
                  description: 'Your policy details have been confirmed and recorded in our system.',
                  note: 'Please note that this serves as a cover note only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and be made available to you shortly.',
                  confirmText: 'Done',
                  variant: 'success',
                  onConfirm: () => router.push(`/${agentCode}/products/ctpl-insurance/invoice`),
                })
              }}
            >
              <Lock className="mr-2 h-4 w-4" />
              Complete Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Back to Review */}
      <div className="pt-4">
        <Button variant="outline" className="rounded-full px-8" onClick={decreaseStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Review
        </Button>
      </div>
    </div>
  )
}
