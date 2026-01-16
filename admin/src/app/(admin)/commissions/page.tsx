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
import { useGetCommissionConfiguration } from '@/app/data/queries/commission'
import { CommissionConfig } from '@/types/commission'

export default function CommissionsPage() {
  const [selectedCommissionConfig, setSelectedCommissionConfig] = useState<CommissionConfig | null>(null)
  const [perPage, setPerPage] = useState(15)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const {data: commissions, isLoading, isError, refetch} = useGetCommissionConfiguration(perPage, page);

  // Filter commissions based on search query
  const filteredCommissions = commissions?.data.data.filter((commission) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      commission.product.name.toLowerCase().includes(searchLower) ||
      commission.product.description?.toLowerCase().includes(searchLower) ||
      commission.base_commission.toString().includes(searchLower)
    )
  }) || []

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
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ml-2 h-full w-full border-0 bg-transparent outline-none placeholder:font-light"
              />
            </div>
          </div>
          <div>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-3 pr-2">
                {isLoading && <p className="text-center text-gray-500">Loading products...</p>}
                {isError && <p className="text-center text-red-500">Error loading products.</p>}
                {!isLoading && !isError && filteredCommissions.length === 0 && (
                  <p className="text-center text-gray-500">
                    {searchQuery ? 'No products found matching your search.' : 'No products available.'}
                  </p>
                )}
                {filteredCommissions.map((commission) => (
                  <div
                    key={commission.id}
                    className={cn(
                      'cursor-pointer rounded-xl border-2 border-gray-300 bg-white p-4 transition-all duration-200 hover:border-blue-400 hover:shadow-md',
                      {
                        'border-blue-500 bg-blue-50 shadow-md':
                          selectedCommissionConfig?.id === commission.id,
                      }
                    )}
                    onClick={() => setSelectedCommissionConfig(commission)}
                  >
                    <div className="space-y-2">
                      <div>
                        <p className="text-base font-bold text-gray-900">
                          {commission.product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {commission.product.description || 'No description'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2">
                        <span className="text-xs font-semibold text-gray-700">
                          Base Commission:
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {commission.base_commission}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Product Commission configuration */}
        <div className="col-span-2 min-h-screen rounded-2xl border-2 p-6">
          <ProductCommisionConfiguration 
            selectedCommissionConfig={selectedCommissionConfig} 
            onUpdateSuccess={() => refetch()}
          />
        </div>
      </div>
    </>
  )
}
