import { useGetProducts } from '@/app/data/queries/products'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { ProductAssignment } from '@/types/products'
import CreateProductDialog from './create-product-dialog'
import ProductDetailsDialog from './product-details-dialog'

interface ProductsMainContentProps {
  productAssignments: ProductAssignment[]
  onProductCreated?: () => void
}

export default function ProductsMainContent({
  productAssignments,
  onProductCreated,
}: ProductsMainContentProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductAssignment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleProductClick = (product: ProductAssignment) => {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  return (
    <div className="relative z-10 min-h-[400px] rounded-tl-none rounded-tr-3xl rounded-b-3xl border border-t-0 p-4 shadow-sm sm:min-h-[500px] sm:p-6 md:p-8 lg:min-h-screen">
      {/* Section Header */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">Insurance Products</h2>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Manage and organize all available insurance products for easy
            assignment and monitoring.
          </p>
        </div>
        <div className="flex gap-3">
          <CreateProductDialog onSuccess={onProductCreated} />
          <div className="relative w-full sm:w-auto sm:min-w-[200px]">
            <button className="text-muted-foreground w-full rounded-full border border-gray-300 px-4 py-2 pr-10 text-left text-sm focus:ring-1 focus:ring-green-500 focus:outline-none">
              Select Category
            </button>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid Container */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {productAssignments?.map((assignment) => (
          <div
            key={assignment.product.id}
            onClick={() => handleProductClick(assignment)}
            className="flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-shadow duration-200 hover:shadow-md sm:rounded-2xl sm:p-5"
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-base font-bold sm:text-lg">
                {assignment.product.name}
              </h3>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold sm:px-3 ${
                  assignment.product.status.toLowerCase() === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                {assignment.product.status.toUpperCase()}
              </span>
            </div>

            <p className="mb-3 truncate text-xs text-gray-600 sm:mb-4 sm:text-sm">
              {assignment.product.provider.name}
            </p>
            <div className="mb-4 flex flex-col gap-2 text-xs sm:mb-5 sm:flex-row sm:items-center sm:gap-6 sm:text-sm">
              <div>
                <span className="font-bold">Price: </span>
                <span className="text-muted-foreground">
                  {assignment.product.price}
                </span>
              </div>
              <div>
                <span className="font-bold">Commission: </span>
                <span className="text-muted-foreground">
                  {`${assignment.commission_rate}%`}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="text-muted-foreground text-xs font-semibold whitespace-nowrap sm:text-sm">
                Assigned to:
              </span>
              {assignment.agents.length > 0 ? (
                <div className="flex -space-x-2">
                  {assignment.agents.map((agent, index) => (
                    <div
                      key={index}
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 bg-blue-300 text-xs font-bold sm:h-8 sm:w-8`}
                      title={agent.first_name + ' ' + agent.last_name}
                    >
                      {agent.first_name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic sm:text-sm">
                  No agents assigned
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <ProductDetailsDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
