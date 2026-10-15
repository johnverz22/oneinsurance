'use client'

import { PaymentBrand } from '@/types/payment'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Smartphone, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useGetPaymentBrands } from '@/app/data/queries/payment'

interface PaymentBrandsProps {
  onBrandSelect?: (brand: PaymentBrand) => void
  selectedBrand?: PaymentBrand | null
  className?: string
  showCardBadge?: boolean
  variant?: 'default' | 'compact'
  filterByCardType?: boolean | null // null = all, true = cards only, false = non-cards only
}

export default function PaymentBrands({
  onBrandSelect,
  selectedBrand,
  className,
  showCardBadge = true,
  filterByCardType = null,
  variant = 'default',
}: PaymentBrandsProps) {
  const { data: response, isLoading, error, refetch } = useGetPaymentBrands()

  const brands = response?.success ? response.data : []

  const filteredBrands = brands.filter((brand: PaymentBrand) => {
    if (filterByCardType === null) return true
    return brand.is_card === filterByCardType
  })

  const handleBrandClick = (brand: PaymentBrand) => {
    if (onBrandSelect) {
      onBrandSelect(brand)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
        <div className="text-center">
          <p className="text-lg font-medium">Loading payment options</p>
          <p className="text-muted-foreground text-sm">Please wait...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-4 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
        <h3 className="mb-2 text-lg font-semibold text-destructive">
          Oops! Something went wrong
        </h3>
        <p className="mb-4 text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : 'Failed to load payment options. Please try again.'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:outline-none"
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Try Again
        </button>
      </div>
    )
  }

  if (filteredBrands.length === 0) {
    return (
      <div className="mx-4 rounded-lg border border-border bg-muted/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <CreditCard className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          No payment options available
        </h3>
        <p className="text-sm text-muted-foreground">
          Please check back later or contact support if this persists.
        </p>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('grid grid-cols-3 gap-2 sm:flex sm:flex-wrap', className)} role="radiogroup" aria-label="Payment method">
        {filteredBrands.map((brand: PaymentBrand) => {
          const selected = selectedBrand?.value === brand.value
          return (
            <button
              key={`${brand.code}-${brand.value}`}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Select ${brand.value} as payment method`}
              onClick={() => handleBrandClick(brand)}
              className={cn(
                'bg-card relative flex h-14 w-full items-center justify-center rounded-xl border p-2 transition-colors sm:h-12 sm:w-24',
                selected
                  ? 'border-primary bg-primary/5 ring-primary/30 ring-2'
                  : 'border-border hover:border-primary/60'
              )}
            >
              <span className="relative block h-full w-full">
                <Image src={brand.image} alt={brand.value} fill sizes="(max-width: 640px) 30vw, 96px" className="object-contain" />
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Header Section - hidden on mobile since page already has header */}
      <div className="hidden sm:block text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Choose Your Payment Method
        </h3>
        <p className="text-sm text-muted-foreground">
          Secure and encrypted payment options
        </p>
      </div>

      {/* Payment Options Grid */}
      <div className="space-y-4">
        <div
          className={cn(
            'grid gap-3',
            className || 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4'
          )}
        >
          {filteredBrands.map((brand: PaymentBrand) => (
            <Card
              key={`${brand.code}-${brand.value}`}
              className={cn(
                'relative cursor-pointer border transition-all duration-200 shadow-none',
                'hover:scale-[1.01] active:scale-[0.98]',
                'aspect-square w-full',
                selectedBrand?.value === brand.value
                  ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                  : 'hover:border-primary/60 border-border hover:bg-muted/50',
                'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none'
              )}
              onClick={() => handleBrandClick(brand)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleBrandClick(brand)
                }
              }}
              role="button"
              aria-label={`Select ${brand.value} as payment method`}
            >
              <CardContent className="flex h-full items-center justify-center p-1 sm:p-2">
                {/* Brand Logo Only — centered, fills card */}
                <div className="relative h-[70%] w-[90%]">
                  <Image
                    src={brand.image}
                    alt={`${brand.value} payment method`}
                    fill
                    className="object-contain"
                    sizes="100px"
                    priority={false}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.opacity = '0'
                    }}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.opacity = '1'
                      const fallback =
                        target.parentElement?.querySelector('.fallback-icon')
                      if (fallback) {
                        ;(fallback as HTMLElement).style.display = 'none'
                      }
                    }}
                    style={{ transition: 'opacity 0.3s ease' }}
                  />
                  {/* Fallback icon */}
                  <div className="fallback-icon absolute inset-0 flex items-center justify-center">
                    {brand.is_card ? (
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <Smartphone className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedBrand?.value === brand.value && (
                  <div className="bg-primary absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Separate components for specific use cases
export function CardPaymentBrands(
  props: Omit<PaymentBrandsProps, 'filterByCardType'>
) {
  return <PaymentBrands {...props} filterByCardType={true} />
}

export function DigitalPaymentBrands(
  props: Omit<PaymentBrandsProps, 'filterByCardType'>
) {
  return <PaymentBrands {...props} filterByCardType={false} />
}
