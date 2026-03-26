'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ChevronRight, ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HEALTH_PLANS, HEALTH_PROVIDERS } from '@/constants/health-insurance-plans'
import { useHealthCartStore } from '@/store/health-cart-store'
import { toast } from 'sonner'

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const providerSlug = params['provider'] as string
  const planSlug = params['plan'] as string
  const [quantities, setQuantities] = useState<number[]>([0, 0, 0])
  const [selectedImage, setSelectedImage] = useState(0)
  const { addItem, items } = useHealthCartStore()

  const plan = HEALTH_PLANS.find((p) => p.slug === planSlug && p.providerSlug === providerSlug)
  const provider = HEALTH_PROVIDERS.find((p) => p.slug === providerSlug)

  if (!plan || !provider) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Plan not found.</p>
      </div>
    )
  }

  const allImages = [plan.image, ...plan.gallery]
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  const buildItem = (tierIndex: number) => {
    const tier = plan.tiers[tierIndex]
    const qty = quantities[tierIndex] > 0 ? quantities[tierIndex] : 1
    return {
      item: {
        id: `${plan.id}-tier-${tierIndex}`,
        planId: plan.id,
        planName: plan.name,
        planSlug: plan.slug,
        tierName: tier.name,
        tierSubtitle: tier.subtitle,
        tierDescription: tier.description,
        provider: plan.provider,
        providerSlug: plan.providerSlug,
        providerLogo: plan.providerLogo,
        image: plan.image,
        premium: tier.premium,
      },
      qty,
      tierName: tier.name,
    }
  }

  const handleAddToCart = (tierIndex: number) => {
    const { item, qty, tierName } = buildItem(tierIndex)
    addItem(item, qty)
    setQuantities((q) => { const n = [...q]; n[tierIndex] = 0; return n })
    toast.success(`${plan.name} ${tierName} (x${qty}) added to cart`)
  }

  const handleBuyNow = (tierIndex: number) => {
    const { item, qty } = buildItem(tierIndex)
    addItem(item, qty)
    setQuantities((q) => { const n = [...q]; n[tierIndex] = 0; return n })
    router.push(`/${agentCode}/products/health-insurance/checkout`)
  }

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      {/* Header bar */}
      <div className="bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href={`/${agentCode}`} className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Providers</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/${agentCode}/products/health-insurance/providers/${providerSlug}`} className="hover:text-primary">
              {provider.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-gray-900">{plan.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="from-primary to-accent relative rounded-full bg-gradient-to-r text-white gap-1.5"
              onClick={() => router.push(`/${agentCode}/products/health-insurance/cart`)}
            >
              <ShoppingCart className="h-4 w-4" /> View Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Button>
            <Image src="/images/IFRC.png" alt="IFRC" width={60} height={40} className="h-10 w-auto" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {/* Plan hero */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="relative h-56 overflow-hidden rounded-xl">
                <img src={allImages[selectedImage]} alt={plan.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex gap-2">
                {plan.gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i + 1)}
                    className={`relative h-20 w-28 overflow-hidden rounded-lg border-2 transition ${selectedImage === i + 1 ? 'border-primary' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <Image src={plan.providerLogo} alt={plan.provider} width={100} height={40} className="h-10 w-auto object-contain object-left" />
              <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">{plan.fullDescription}</p>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Issue Age:</span> {plan.issueAge}</p>
                <p><span className="font-medium">Waiting Period:</span> {plan.waitingPeriod}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="rounded-2xl bg-white px-6 py-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">{plan.tagline}</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {plan.name} provides essential healthcare protection for common medical needs, offering practical benefits, convenient coverage, and dependable support to keep you healthy through life's everyday moments.
          </p>
        </div>

        {/* Pricing tiers */}
        <div className="grid gap-6 md:grid-cols-3">
          {plan.tiers.map((tier, i) => (
            <div key={i} className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex justify-center">
                <Image src={plan.providerLogo} alt={plan.provider} width={80} height={32} className="h-8 w-auto object-contain" />
              </div>
              <h3 className="from-primary to-accent mb-1 bg-gradient-to-r bg-clip-text text-center text-2xl font-black text-transparent">
                {tier.name}
              </h3>
              <p className="mb-1 text-center text-base font-bold text-gray-900">{tier.subtitle}</p>
              <p className="text-muted-foreground mb-4 text-center text-xs">{tier.description}</p>
              <div className="mb-2 flex items-center justify-between rounded-lg bg-yellow-400 px-4 py-2">
                <span className="text-sm font-medium text-gray-800">Premium</span>
                <span className="font-bold text-gray-900">₱ {tier.premium.toLocaleString()}.00</span>
              </div>
              <div className="mb-5 flex items-center justify-between rounded-lg bg-green-500 px-4 py-2">
                <span className="text-sm font-medium text-white">Maximum Benefit Limit</span>
                <span className="font-bold text-white">₱ {tier.maxBenefit.toLocaleString()}.00</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {tier.benefits.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Qty</span>
                  <div className="flex items-center gap-1 rounded-full border px-2 py-1">
                    <button
                      onClick={() => setQuantities((q) => { const n = [...q]; n[i] = Math.max(0, n[i] - 1); return n })}
                      className="text-gray-500 hover:text-gray-800"
                    >−</button>
                    <span className="w-5 text-center text-sm">{quantities[i]}</span>
                    <button
                      onClick={() => setQuantities((q) => { const n = [...q]; n[i] = n[i] + 1; return n })}
                      className="text-gray-500 hover:text-gray-800"
                    >+</button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleBuyNow(i)}
                >
                  Buy Now
                </Button>
                <Button
                  size="sm"
                  className="from-primary to-accent rounded-full bg-gradient-to-r text-white"
                  onClick={() => handleAddToCart(i)}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
