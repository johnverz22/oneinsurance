'use client'

import { useGetProducts } from '@/app/data/queries/products'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Product } from '@/types/products'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Search } from 'lucide-react'
import { useState } from 'react'
import ProductCommisionConfiguration from './product-configuration'
import { cn } from '@/lib/utils'

export default function CommissionsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { data: products, isLoading, isError } = useGetProducts()

  return (
    <>
      <PageHeader
        title="Commissions"
        subTitle="Configure commission percentages for agents, overriders, and admin splits per product"
      />
      <div className="mt-4 grid grid-cols-3 gap-4">
        {/* Product list */}
        <div className="col-span-1 space-y-4">
          <div className="space-y-2">
            <div>
              <p className="text-xl font-bold">Select Product</p>
              <p className="text-base font-light">
                Choose a product to configure commissions
              </p>
            </div>

            <div className="flex h-8 items-center rounded-full border-1 border-gray-800 px-2">
              <Search />
              <input
                type="text"
                placeholder="Search products"
                className="ml-2 h-full w-full border-0 bg-transparent outline-none placeholder:font-light"
              />
            </div>
          </div>
          <div>
            <ScrollArea>
              <div className="space-y-2">
                {isLoading && <p>Loading products...</p>}
                {isError && <p>Error loading products.</p>}
                {products &&
                  products.data.data.map((product) => (
                    <div
                      key={product.id}
                      className={cn(
                        'flex min-h-36 flex-col justify-between rounded-2xl border-2 border-gray-400 p-4 hover:shadow-lg',
                        {
                          'border-blue-500 shadow-lg':
                            selectedProduct?.id === product.id,
                        }
                      )}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div>
                        <p className="text-lg font-bold tracking-wide">
                          {product.provider.name}
                        </p>
                        <p className="text-sm font-light">{product.name}</p>
                        <p className="text-sm">
                          <span className="font-bold">Price: </span>
                          <span className="font-light">
                            ₱ {product.price ?? 'N/A'}
                          </span>
                        </p>
                      </div>

                      <p className="text-sm">
                        <span className="font-bold">Base Commision: </span>
                        <span className="font-light">30%</span>
                      </p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Product Commission configuration */}
        <div className="col-span-2 min-h-screen rounded-2xl border-2 p-6">
          <ProductCommisionConfiguration selectedProduct={selectedProduct} />
        </div>
      </div>
    </>
  )
}
