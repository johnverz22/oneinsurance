import { useGetProducts } from '@/app/data/queries/products'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')

  const handleProductClick = (product: ProductAssignment) => {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  // Filter products based on search query
  const filteredProducts = productAssignments.filter((assignment) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      assignment.product.name.toLowerCase().includes(query) ||
      assignment.product.description.toLowerCase().includes(query) ||
      assignment.provider.name.toLowerCase().includes(query) ||
      assignment.product.line_of_business?.name.toLowerCase().includes(query)
    )
  })

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64 md:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-full border border-gray-300 bg-white py-2 pr-10 pl-9 text-sm leading-5 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none sm:py-2.5 sm:pl-10"
            />
          </div>
          <CreateProductDialog onSuccess={onProductCreated} />
        </div>
      </div>

      {/* Cards Grid Container */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((assignment) => (
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

              <p className="mb-4 truncate text-xs text-gray-600 sm:mb-5 sm:text-sm">
                {assignment.product.provider.name}
              </p>

              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-muted-foreground text-xs font-semibold whitespace-nowrap sm:text-sm">
                  Line of Business:
                </span>
                {assignment.product.line_of_business ? (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {assignment.product.line_of_business.name}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 italic sm:text-sm">
                    No LOB assigned
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? 'No products found matching your search'
                : 'No products available'}
            </p>
          </div>
        )}
      </div>

      <ProductDetailsDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onProductUpdated={onProductCreated}
      />
    </div>
  )
}
