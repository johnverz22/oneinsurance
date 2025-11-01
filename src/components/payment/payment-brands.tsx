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
  filterByCardType?: boolean | null // null = all, true = cards only, false = non-cards only
}

export default function PaymentBrands({
  onBrandSelect,
  selectedBrand,
  className,
  showCardBadge = true,
  filterByCardType = null,
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
      <div className="mx-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
        <h3 className="mb-2 text-lg font-semibold text-red-800">
          Oops! Something went wrong
        </h3>
        <p className="mb-4 text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : 'Failed to load payment options. Please try again.'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Try Again
        </button>
      </div>
    )
  }

  if (filteredBrands.length === 0) {
    return (
      <div className="mx-4 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <CreditCard className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-800">
          No payment options available
        </h3>
        <p className="text-sm text-gray-600">
          Please check back later or contact support if this persists.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Header Section - More compact */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Choose Your Payment Method
        </h3>
        <p className="text-sm text-gray-600">
          Secure and encrypted payment options
        </p>
      </div>

      {/* Payment Options Grid */}
      <div className="space-y-4">
        <div
          className={cn(
            'grid gap-3',
            className || 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          )}
        >
          {filteredBrands.map((brand: PaymentBrand) => (
            <Card
              key={`${brand.code}-${brand.value}`}
              className={cn(
                'relative cursor-pointer border-2 transition-all duration-300 ease-in-out',
                'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
                'min-h-[120px]', // Slightly smaller for side-by-side layout
                selectedBrand?.value === brand.value
                  ? 'border-primary bg-primary/10 ring-primary/20 shadow-lg ring-2'
                  : 'hover:border-primary/60 border-gray-200 hover:bg-gray-50',
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
              <CardContent className="flex h-full flex-col items-center justify-between p-3 text-center">
                {/* Brand Logo Section */}
                <div className="relative mb-3 flex h-12 w-full items-center justify-center">
                  <div className="relative mx-auto h-full w-full max-w-[60px]">
                    <Image
                      src={brand.image}
                      alt={`${brand.value} payment method`}
                      fill
                      className="object-contain drop-shadow-sm"
                      sizes="60px"
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
                    <div className="fallback-icon absolute inset-0 flex items-center justify-center rounded-lg border bg-gray-50">
                      {brand.is_card ? (
                        <CreditCard className="h-6 w-6 text-gray-400" />
                      ) : (
                        <Smartphone className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Brand Name */}
                <div className="flex w-full flex-1 flex-col justify-end">
                  <h3 className="mb-2 line-clamp-2 text-xs leading-tight font-semibold text-gray-900">
                    {brand.value}
                  </h3>

                  {/* Card/Digital Badge */}
                  {showCardBadge && (
                    <Badge
                      variant={brand.is_card ? 'default' : 'secondary'}
                      className="mx-auto px-2 py-0.5 text-xs font-medium"
                    >
                      {brand.is_card ? (
                        <>
                          <CreditCard className="mr-1 h-2.5 w-2.5" />
                          Card
                        </>
                      ) : (
                        <>
                          <Smartphone className="mr-1 h-2.5 w-2.5" />
                          Digital
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedBrand?.value === brand.value && (
                  <div className="bg-primary absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-lg">
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
