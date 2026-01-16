'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Product } from '@/types/agent/product'

type ProductCardProps = {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex w-full items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Product Name */}
            <div>
              <h3 className="text-lg font-semibold text-foreground md:text-xl">
                {product.name || product.description}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              {product.providerName && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Provider
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {product.providerName}
                  </span>
                </div>
              )}
              {product.lobName && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Line of Business
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {product.lobName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <Badge
            variant="secondary"
            className={cn(
              'shrink-0 px-3 py-1.5 text-xs font-semibold',
              product.status === 'Active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            {product.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
