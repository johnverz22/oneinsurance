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
    <div className="relative z-10 min-h-screen">
      {/* Section Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Insurance Products</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage and organize all available insurance products for easy
              assignment and monitoring.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-56">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-full border border-gray-300 bg-white py-2 pr-4 pl-9 text-sm placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
              />
            </div>
            <CreateProductDialog onSuccess={onProductCreated} />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead className="px-6 py-4 w-12 font-medium text-slate-500">#</TableHead>
              <TableHead className="px-6 py-4 font-medium text-slate-500">Product Name</TableHead>
              <TableHead className="px-6 py-4 font-medium text-slate-500">Provider</TableHead>
              <TableHead className="px-6 py-4 font-medium text-slate-500">Line of Business</TableHead>
              <TableHead className="px-6 py-4 font-medium text-slate-500">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((assignment, index) => (
                <TableRow
                  key={assignment.product.id}
                  onClick={() => handleProductClick(assignment)}
                  className="cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="px-6 py-4 text-gray-400 text-sm font-mono">{index + 1}</TableCell>
                  <TableCell className="px-6 py-4 font-semibold text-slate-900">
                    {assignment.product.name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-600">
                    {assignment.product.provider.name}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {assignment.product.line_of_business ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {assignment.product.line_of_business.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No LOB assigned</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
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
                <TableCell colSpan={5} className="py-12 text-center text-gray-500">
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
