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
import { cn } from '@/lib/utils'

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
            <h2 className="text-xl font-bold">Insurance Products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
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
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-y">
              <TableHead className="py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground w-12">#</TableHead>
              <TableHead className="py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Product Name</TableHead>
              <TableHead className="py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Provider</TableHead>
              <TableHead className="py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Line of Business</TableHead>
              <TableHead className="py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((assignment, index) => (
                <TableRow
                  key={assignment.product.id}
                  className={cn(index % 2 === 1 ? 'bg-muted/30' : '')}
                >
                  <TableCell className="text-muted-foreground text-sm font-mono">{index + 1}</TableCell>
                  <TableCell className="font-semibold">
                    {assignment.product.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {assignment.product.provider.name}
                  </TableCell>
                  <TableCell>
                    {assignment.product.line_of_business ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {assignment.product.line_of_business.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No LOB assigned</span>
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
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
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
