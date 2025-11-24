'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Product } from '@/types/agent/product'

type ProductCardProps = {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card>
      <CardContent>
        <div className="flex w-full items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold md:text-lg lg:text-xl">
              {product.description} by {product.provider}
            </h3>
            <p className="text-sm font-medium">
              Commission Rate:{' '}
              <span className="font-light">{product.commissionRate}%</span>
            </p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'px-3 py-1 text-sm',
              product.status === 'Active'
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                : 'text-muted bg-muted-foreground'
            )}
          >
            {product.status}
          </Badge>
        </div>

        <div className="mt-6 flex gap-4">
          <Button variant="outline" className="w-full max-w-xs">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
