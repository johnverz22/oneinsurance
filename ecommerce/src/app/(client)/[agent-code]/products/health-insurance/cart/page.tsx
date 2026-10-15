'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHealthCartStore } from '@/store/health-cart-store'

export default function CartPage() {
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { items, removeItem, updateQuantity } = useHealthCartStore()
  const [search, setSearch] = useState('')
  const [coupon, setCoupon] = useState('')
  const [agent, setAgent] = useState('')

  const filtered = items.filter(
    (i) =>
      i.planName.toLowerCase().includes(search.toLowerCase()) ||
      i.provider.toLowerCase().includes(search.toLowerCase())
  )

  const grandTotal = items.reduce((sum, i) => sum + i.premium * i.quantity, 0)

  return (
    <div className="min-h-screen bg-section">
      {/* Header */}
      <div className="bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/${agentCode}`} className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">Cart</span>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="One Insurance" width={2172} height={724} className="h-8 w-auto" />
            <Image src="/images/IFRC.png" alt="IFRC" width={1290} height={800} className="h-10 w-auto" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search */}
        <div className="relative mb-6 max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Plan..."
            className="rounded-full bg-white pl-9"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Cart items */}
          <div className="space-y-4">
            {filtered.length === 0 && (
              <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                <p className="text-muted-foreground">Your cart is empty.</p>
                <Button
                  className="from-primary to-accent mt-4 rounded-full bg-gradient-to-r text-white"
                  onClick={() => router.push(`/${agentCode}/products/health-insurance`)}
                >
                  Browse Plans
                </Button>
              </div>
            )}
            {filtered.map((item) => (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Check */}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-success">
                    <div className="h-3 w-3 rounded-full bg-success" />
                  </div>

                  {/* Image */}
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl">
                    <img src={item.image} alt={item.planName} className="h-full w-full object-cover" />
                  </div>

                  {/* Provider logo */}
                  <div className="shrink-0">
                    <Image src={item.providerLogo} alt={item.provider} width={60} height={24} className="h-6 w-auto object-contain" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">{item.planName}</h3>
                    <p className="text-xs text-muted-foreground">{item.tierName}: {item.tierSubtitle}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs line-clamp-2">{item.tierDescription}</p>
                  </div>

                  {/* Premium badge */}
                  <div className="shrink-0">
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-foreground">
                      ₱ {item.premium.toLocaleString()}.00
                    </span>
                  </div>

                  {/* Quantity */}
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">Quantity</span>
                    <div className="flex items-center gap-1 rounded-full border px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-muted-foreground hover:text-foreground">−</button>
                      <span className="w-5 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-muted-foreground hover:text-foreground">+</button>
                    </div>
                  </div>

                  {/* Remove (swipe reveal) */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-center text-xl font-bold text-foreground">Gross Premium</h2>
              <hr className="mb-4" />
              <p className="text-muted-foreground mb-1 text-center text-sm">Total Payment</p>
              <p className="mb-6 text-center text-3xl font-black text-foreground">
                ₱ {grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>

              {/* Line items */}
              <div className="rounded-xl border p-4 text-xs">
                <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-2 text-muted-foreground">
                  <span>Item</span>
                  <span>Quantity</span>
                  <span>Amount</span>
                </div>
                {items.map((item) => (
                  <div key={item.id} className="mb-3 grid grid-cols-[1fr_auto_auto] gap-2 text-foreground">
                    <div>
                      <p className="font-bold">{item.provider}</p>
                      <p>{item.planName}</p>
                      <p className="text-muted-foreground">{item.tierName}: {item.tierSubtitle}</p>
                    </div>
                    <span className="text-center">{item.quantity}</span>
                    <span>₱ {(item.premium * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mt-4 flex items-center rounded-xl border px-3 py-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Get a Coupon Code"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button className="text-sm font-semibold text-orange-500">Apply</button>
              </div>

              {/* Agent */}
              <div className="mt-2 flex items-center rounded-xl border px-3 py-2">
                <input
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                  placeholder="Agent"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button className="text-sm font-semibold text-orange-500">Apply</button>
              </div>

              {/* Wavy divider */}
              <div className="my-4 overflow-hidden">
                <svg viewBox="0 0 400 12" className="w-full text-muted-foreground">
                  <path d="M0,6 C50,0 100,12 150,6 C200,0 250,12 300,6 C350,0 400,12 400,6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>

            <Button
              className="from-primary to-accent w-full rounded-full bg-gradient-to-r py-3 text-white"
              disabled={items.length === 0}
              onClick={() => router.push(`/${agentCode}/products/health-insurance/checkout`)}
            >
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
