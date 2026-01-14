import { ProductAssignment } from '@/types/products'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ProductDetailsDialogProps {
  product: ProductAssignment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ProductDetailsDialog({
  product,
  open,
  onOpenChange,
}: ProductDetailsDialogProps) {
  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
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

        <div className="space-y-4 py-3 sm:space-y-6 sm:py-4">
          {/* Provider Information */}
          <div>
            <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
              Provider
            </h3>
            <p className="text-sm sm:text-base">
              {product.product.provider.name}
            </p>
          </div>

          {/* Pricing Information */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
                Price
              </h3>
              <p className="text-sm font-medium sm:text-base">
                {product.product.price}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
                Commission Rate
              </h3>
              <p className="text-sm font-medium sm:text-base">
                {product.commission_rate}%
              </p>
            </div>
          </div>

          {/* Assigned Agents */}
          <div>
            <h3 className="mb-2 text-xs font-semibold text-gray-700 sm:mb-3 sm:text-sm">
              Assigned Agents ({product.agents.length})
            </h3>
            {product.agents.length > 0 ? (
              <div className="max-h-[250px] space-y-2 overflow-y-auto sm:max-h-[300px]">
                {product.agents.map((agent, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border p-2 sm:gap-3 sm:p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-300 text-xs font-bold sm:h-10 sm:w-10 sm:text-sm">
                      {agent.first_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium sm:text-base">
                        {agent.first_name} {agent.last_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic sm:text-sm">
                No agents assigned to this product yet
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
