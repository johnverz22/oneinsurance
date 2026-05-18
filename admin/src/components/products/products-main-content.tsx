import { useGetProducts } from '@/app/data/queries/products'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { ProductAssignment } from '@/types/products'
import CreateProductDialog from './create-product-dialog'
import ProductDetailsDialog from './product-details-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
    <div className="relative z-10 min-h-[400px] rounded-tl-none rounded-tr-3xl rounded-b-3xl border border-t-0 p-4 sm:min-h-[500px] sm:p-6 md:p-8 lg:min-h-screen">
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

      {/* Data Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Product Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Provider</TableHead>
              <TableHead className="font-semibold text-gray-700">Line of Business</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((assignment) => (
                <TableRow
                  key={assignment.product.id}
                  onClick={() => handleProductClick(assignment)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell className="font-semibold text-gray-900">
                    {assignment.product.name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {assignment.product.provider.name}
                  </TableCell>
                  <TableCell>
                    {assignment.product.line_of_business ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {assignment.product.line_of_business.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No LOB assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      assignment.product.status.toLowerCase() === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {assignment.product.status.toUpperCase()}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-gray-500">
                  {searchQuery ? 'No products found matching your search' : 'No products available'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
