'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHealthCartStore } from '@/store/health-cart-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { items, clearCart } = useHealthCartStore()
  const [paymentTab, setPaymentTab] = useState<'card' | 'ewallet'>('card')
  const [showSuccess, setShowSuccess] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [agent, setAgent] = useState('')

  // Billing
  const [fullName, setFullName] = useState('')
  const [tin, setTin] = useState('')
  const [address, setAddress] = useState('')

  // Card
  const [cardFirst, setCardFirst] = useState('')
  const [cardLast, setCardLast] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  // E-Wallet
  const [walletFirst, setWalletFirst] = useState('')
  const [walletLast, setWalletLast] = useState('')
  const [walletNumber, setWalletNumber] = useState('')

  const grandTotal = items.reduce((sum, i) => sum + i.premium * i.quantity, 0)

  const handlePayNow = () => {
    setShowSuccess(true)
  }

  const handleViewInvoice = () => {
    setShowSuccess(false)
    clearCart()
    router.push(`/${agentCode}/products/health-insurance/invoice?name=${encodeURIComponent(fullName)}&total=${grandTotal}`)
  }

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      {/* Header */}
      <div className="bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href={`/${agentCode}`} className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-gray-900">Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="One Insurance" width={100} height={32} className="h-8 w-auto" />
            <Image src="/images/IFRC.png" alt="IFRC" width={60} height={40} className="h-10 w-auto" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left — Gross Premium summary */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-center text-xl font-bold text-gray-900">Gross Premium</h2>
            <hr className="mb-4" />
            <p className="text-muted-foreground mb-1 text-center text-sm">Total Payment</p>
            <p className="mb-6 text-center text-3xl font-black text-gray-900">
              ₱ {grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>

            <div className="rounded-xl border p-4 text-xs">
              <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-2 text-gray-400">
                <span>Item</span><span>Quantity</span><span>Amount</span>
              </div>
              {items.map((item) => (
                <div key={item.id} className="mb-3 grid grid-cols-[1fr_auto_auto] gap-2 text-gray-700">
                  <div>
                    <p className="font-bold">{item.provider}</p>
                    <p>{item.planName}</p>
                    <p className="text-gray-400">{item.tierName}: {item.tierSubtitle}</p>
                  </div>
                  <span className="text-center">{item.quantity}</span>
                  <span>₱ {(item.premium * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center rounded-xl border px-3 py-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Get a Coupon Code" className="flex-1 bg-transparent text-sm outline-none" />
              <button className="text-sm font-semibold text-orange-500">Apply</button>
            </div>
            <div className="mt-2 flex items-center rounded-xl border px-3 py-2">
              <input value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Agent" className="flex-1 bg-transparent text-sm outline-none" />
              <button className="text-sm font-semibold text-orange-500">Apply</button>
            </div>

            <div className="my-4 overflow-hidden">
              <svg viewBox="0 0 400 12" className="w-full text-gray-200">
                <path d="M0,6 C50,0 100,12 150,6 C200,0 250,12 300,6 C350,0 400,12 400,6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>

          {/* Right — Billing + Payment */}
          <div className="space-y-6">
            {/* Billing */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="from-primary to-accent mb-4 bg-gradient-to-r bg-clip-text text-xl font-black text-transparent">
                Billing Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter Full Name" className="rounded-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">TIN (Tax Identification Number)</label>
                  <Input value={tin} onChange={(e) => setTin(e.target.value)} placeholder="0000 0000 0000 0000" className="rounded-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Address (Optional)</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter Full Address" className="rounded-full" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="from-primary to-accent mb-4 bg-gradient-to-r bg-clip-text text-xl font-black text-transparent">
                Payment Method
              </h2>

              {/* Tab toggle */}
              <div className="mb-5 flex rounded-full border p-0.5">
                <button
                  onClick={() => setPaymentTab('card')}
                  className={`flex-1 rounded-full py-2 text-sm font-medium transition ${paymentTab === 'card' ? 'from-primary to-accent bg-gradient-to-r text-white' : 'text-gray-500'}`}
                >
                  Card
                </button>
                <button
                  onClick={() => setPaymentTab('ewallet')}
                  className={`flex-1 rounded-full py-2 text-sm font-medium transition ${paymentTab === 'ewallet' ? 'from-primary to-accent bg-gradient-to-r text-white' : 'text-gray-500'}`}
                >
                  E-Wallet
                </button>
              </div>

              {paymentTab === 'card' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Name on Card</label>
                      <Input value={cardFirst} onChange={(e) => setCardFirst(e.target.value)} placeholder="First Name" className="rounded-full" />
                    </div>
                    <div className="mt-5">
                      <Input value={cardLast} onChange={(e) => setCardLast(e.target.value)} placeholder="Last Name" className="rounded-full" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Card Number</label>
                    <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" className="rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Expiry</label>
                      <Input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YYYY" className="rounded-full" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">CVV</label>
                      <Input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="CVV" className="rounded-full" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={walletFirst} onChange={(e) => setWalletFirst(e.target.value)} placeholder="First Name" className="rounded-full" />
                    <Input value={walletLast} onChange={(e) => setWalletLast(e.target.value)} placeholder="Last Name" className="rounded-full" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Number</label>
                    <Input value={walletNumber} onChange={(e) => setWalletNumber(e.target.value)} placeholder="0000 0000 0000 0000" className="rounded-full" />
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-gray-400">OR</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-semibold text-gray-700">Scan QR Code</p>
                    <div className="rounded-xl border p-3">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=OneInsurancePayment"
                        alt="QR Code"
                        className="h-28 w-28"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3">
              <Button variant="outline" className="rounded-full px-8" onClick={() => router.back()}>
                Back
              </Button>
              <Button
                className="from-primary to-accent rounded-full bg-gradient-to-r px-8 text-white"
                onClick={handlePayNow}
              >
                Pay Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-md text-center"
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="items-center">
            <div className="mb-2 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="from-primary to-accent bg-gradient-to-r bg-clip-text text-2xl font-black text-transparent">
              Payment Successful!
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Your policy details have been confirmed and recorded in our system. Please note that this serves as a confirmation of coverage only. The official policy document, which is the legally binding proof of coverage, will be issued directly by the insurance carrier and made available to you shortly.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" className="mt-4 w-full rounded-full" onClick={handleViewInvoice}>
            View Invoice
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
