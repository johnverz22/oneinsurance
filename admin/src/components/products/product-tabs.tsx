'use client'

import React, { useEffect, useState } from 'react'
import { Search, Filter, Plus } from 'lucide-react'
import ProductsMainContent from './products-main-content'
import AgentsMainContent from './agents-main-content'
import AssignProductDialog from './assign-product-dialog'
import {
  Product,
  ProductAssignment,
  ProductsPaginatedResponse,
} from '@/types/products'
import { AgentProduct } from '@/types/agents'
import { useGetProducts } from '@/app/data/queries/products'
import { useGetAgentProducts } from '@/app/data/queries/agents'

function combineProductArrays(
  agentCommissions: AgentProduct[],
  productsWithProviders: Product[]
): ProductAssignment[] {
  // Create a map of products with their providers for quick lookup
  const productProviderMap = new Map<number, Product>()
  productsWithProviders.forEach((product) => {
    productProviderMap.set(Number(product.id), product)
  })

  // Group agent commissions by product_id
  const productAgentMap = new Map<number, AgentProduct[]>()
  agentCommissions.forEach((commission) => {
    const existing = productAgentMap.get(Number(commission.product_id)) || []
    existing.push(commission)
    productAgentMap.set(Number(commission.product_id), existing)
  })

  // Combine and map the data
  const result: ProductAssignment[] = []

  productAgentMap.forEach((commissions, productId) => {
    const productWithProvider = productProviderMap.get(productId)

    if (productWithProvider) {
      // Extract unique agents for this product
      const agents = commissions.map((c) => c.agent)

      // Calculate average commission rate (or use first, depending on business logic)
      const avgCommissionRate = (
        commissions.reduce((sum, c) => sum + parseFloat(c.commission_rate), 0) /
        commissions.length
      ).toFixed(2)

      // Determine overall status (you can customize this logic)
      const allActive = commissions.every((c) => c.status === 'active')
      const status = allActive ? 'active' : 'inactive'

      result.push({
        product: {
          id: productWithProvider.id,
          provider_id: productWithProvider.provider_id,
          name: productWithProvider.name,
          description: productWithProvider.description,
          price: 0,
          status: productWithProvider.status,
          created_at: productWithProvider.created_at,
          updated_at: productWithProvider.updated_at,
          deleted_at: productWithProvider.deleted_at,
          provider: productWithProvider.provider,
        },
        provider: productWithProvider.provider,
        agents: agents,
        commission_rate: avgCommissionRate,
        status: status,
        price: '0.00', // Set default or calculate based on your business logic
      })
    }
  })

  return result
}

export default function ProductTabs() {
  const [activeTab, setActiveTab] = useState('products')
  const [page, setPage] = useState(1)
  const [productsAssignments, setProductsAssignments] = useState<
    ProductAssignment[]
  >([])

  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
  } = useGetProducts(page)
  const {
    data: agentProducts,
    isLoading: agentProductsLoading,
    isError: agentProductsError,
  } = useGetAgentProducts()

  useEffect(() => {
    if (products && agentProducts) {
      const combinedData = combineProductArrays(
        agentProducts.data.data,
        products.data.data
      )
      setProductsAssignments(combinedData)
    }
  }, [products, agentProducts])

  return (
    <div className="mt-4 min-h-screen">
      <div>
        {/* Top Navigation & Actions Bar */}
        <div className="mb-0 flex flex-col-reverse justify-between gap-4 md:flex-row md:items-end md:gap-0">
          {/* Tabs */}
          <div className="flex items-end space-x-[-8px]">
            <button
              onClick={() => setActiveTab('products')}
              className={`relative z-20 rounded-t-2xl px-8 py-3 text-lg font-bold transition-all ${
                activeTab === 'products'
                  ? 'shadow-sm'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700'
              }`}
            >
              Products
              {activeTab === 'products' && (
                <div className="absolute bottom-[-10px] left-0 z-30 h-[10px] w-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('agents')}
              className={`relative z-10 rounded-t-2xl px-8 py-3 text-lg font-bold transition-all ${
                activeTab === 'agents'
                  ? 'shadow-sm'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700'
              }`}
            >
              Agents
            </button>
          </div>

          {/* Search & Action Button */}
          <div className="mb-2 flex flex-1 flex-col items-center gap-4 sm:flex-row md:mb-3 md:justify-end">
            <div className="relative w-full sm:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="block w-full rounded-full border border-gray-300 bg-white py-2.5 pr-10 pl-10 leading-5 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 hover:text-gray-600">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <AssignProductDialog />
          </div>
        </div>

        {activeTab === 'products' ? (
          <ProductsMainContent productAssignments={productsAssignments} />
        ) : (
          <AgentsMainContent />
        )}
      </div>
    </div>
  )
}
