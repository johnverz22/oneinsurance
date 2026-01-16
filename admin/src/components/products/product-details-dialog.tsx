import { ProductAssignment } from '@/types/products'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import UpdateProductDialog from './update-product-dialog'
import { useState } from 'react'

interface ProductDetailsDialogProps {
  product: ProductAssignment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductUpdated?: () => void
}

export default function ProductDetailsDialog({
  product,
  open,
  onOpenChange,
  onProductUpdated,
}: ProductDetailsDialogProps) {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0" showCloseButton={false}>
        <DialogHeader className="border-b px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <DialogTitle className="text-lg font-bold sm:text-xl">
              {product.product.name}
            </DialogTitle>
            <Badge
              className={`w-fit shrink-0 ${
                product.product.status.toLowerCase() === 'active'
                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                  : 'bg-orange-100 text-orange-600 hover:bg-orange-100'
              }`}
            >
              {product.product.status.toUpperCase()}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-gray-600 sm:text-sm">
            View detailed information about this insurance product
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="space-y-4 sm:space-y-6">
          {/* Provider Information */}
          <div>
            <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
              Provider
            </h3>
            <p className="text-sm sm:text-base">
              {product.product.provider.name}
            </p>
          </div>

          {/* Line of Business */}
          <div>
            <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
              Line of Business
            </h3>
            {product.product.line_of_business ? (
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {product.product.line_of_business.name}
              </span>
            ) : (
              <p className="text-xs text-gray-400 italic sm:text-sm">
                No line of business assigned
              </p>
            )}
          </div>

          {/* Carrier Product Code */}
          <div>
            <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
              Carrier Product Code
            </h3>
            <p className="text-sm sm:text-base">
              {(product.product as any).carrier_product_code || 'N/A'}
            </p>
          </div>

          {/* Commission Rate */}
          <div>
            <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
              Commission Rate
            </h3>
            <p className="text-sm font-medium sm:text-base">
              {product.commission_rate}%
            </p>
          </div>
        </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t px-4 py-4 sm:flex-row sm:px-6">
          <UpdateProductDialog
            product={{
              id: product.product.id,
              name: product.product.name,
              description: product.product.description || '',
              provider_id: product.product.provider_id,
              lob_id: (product.product as any).line_of_business?.id || 0,
              status: product.product.status as 'active' | 'inactive',
              carrier_product_code:
                (product.product as any).carrier_product_code || '',
              provider: product.product.provider,
              lob: (product.product as any).line_of_business,
            }}
            onSuccess={() => {
              setUpdateDialogOpen(false)
              onProductUpdated?.()
              onOpenChange(false)
            }}
            trigger={
              <Button variant="outline" className="w-full rounded-full sm:w-auto">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            }
          />
          <Button
            className="w-full rounded-full bg-green-600 hover:bg-green-700 sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
