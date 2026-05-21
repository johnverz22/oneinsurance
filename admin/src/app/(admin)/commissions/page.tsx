'use client'

import { useState } from 'react'
import ProductCommisionConfiguration from './product-configuration'
import { useGetCommissionConfiguration } from '@/app/data/queries/commission'
import { CommissionConfig } from '@/types/commission'

export default function CommissionsPage() {
  const [selectedCommissionConfig, setSelectedCommissionConfig] = useState<CommissionConfig | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [perPage] = useState(15)
  const [page] = useState(1)
  const { data: commissions, isLoading, isError, refetch } = useGetCommissionConfiguration(perPage, page)

  const filteredCommissions = commissions?.data.data.filter((commission) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      commission.product.name.toLowerCase().includes(searchLower) ||
      commission.product.description?.toLowerCase().includes(searchLower) ||
      commission.base_commission.toString().includes(searchLower)
    )
  }) || []

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-[#F5F6FA]">
      {/* Page title */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Commissions</h1>
        <p className="text-sm text-gray-500">
          Configure commission percentages for agents, overriders, and admin splits per product
        </p>
      </div>

      {/* 3-col body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — product list */}
        <div className="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-bold text-gray-900">Select Product</p>
            <p className="mb-2 text-xs text-gray-500">Choose a product to configure commissions</p>
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 py-1.5 pl-7 pr-3 text-xs outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="p-4 text-center text-xs text-gray-500">Loading products...</p>}
            {isError && <p className="p-4 text-center text-xs text-red-500">Error loading products.</p>}
            {!isLoading && !isError && filteredCommissions.length === 0 && (
              <p className="p-4 text-center text-xs text-gray-500">
                {searchQuery ? 'No products found.' : 'No products available.'}
              </p>
            )}
            {filteredCommissions.map((commission) => {
              const active = selectedCommissionConfig?.id === commission.id
              return (
                <div
                  key={commission.id}
                  onClick={() => setSelectedCommissionConfig(commission)}
                  className={`cursor-pointer border-b border-gray-100 px-4 py-3 transition-all ${
                    active ? 'border-l-[3px] border-l-green-600 bg-green-50' : 'border-l-[3px] border-l-transparent hover:bg-gray-50'
                  }`}
                >
                  <p className={`text-xs font-semibold leading-snug ${active ? 'text-green-800' : 'text-gray-700'}`}>
                    {commission.product.name}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-400">
                    {commission.product.description || 'No description'}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-[#B8960C]">
                    Base Commission: {Number(commission.base_commission).toFixed(2)}%
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CENTER + RIGHT */}
        <div className="flex flex-1 overflow-hidden">
          <ProductCommisionConfiguration
            selectedCommissionConfig={selectedCommissionConfig}
            onUpdateSuccess={() => refetch()}
          />
        </div>
      </div>
    </div>
  )
}
