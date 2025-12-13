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
  const {data: commissions, isLoading, isError} = useGetCommissionConfiguration(perPage, page);

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
                {commissions &&
                  commissions.data.data.map((commission) => (
                    <div
                      key={commission.id}
                      className={cn(
                        'flex min-h-36 flex-col justify-between rounded-2xl border-2 border-gray-400 p-4 hover:shadow-lg',
                        {
                          'border-blue-500 shadow-lg':
                            selectedCommissionConfig?.id === commission.id,
                        }
                      )}
                      onClick={() => setSelectedCommissionConfig(commission)}
                    >
                      <div>
                        <p className="text-lg font-bold tracking-wide">
                        {commission.product.name}
                        </p>
                        <p className="text-sm font-light">{commission.product.name}</p>
                        <p className="text-sm">
                          <span className="font-bold">Price: </span>
                          <span className="font-light">
                            ₱ {commission.product.price ?? 'N/A'}
                          </span>
                        </p>
                      </div>

                      <p className="text-sm">
                        <span className="font-bold">Base Commision: </span>
                        <span className="font-light">{commission.base_commission}</span>
                      </p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Product Commission configuration */}
        <div className="col-span-2 min-h-screen rounded-2xl border-2 p-6">
          <ProductCommisionConfiguration selectedCommissionConfig={selectedCommissionConfig} />
        </div>
      </div>
    </>
  )
}
