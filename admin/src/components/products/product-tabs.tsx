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
import {
  AgentProduct,
  AgentProductAssignment,
  ProductCommissionInfo,
} from '@/types/agents'
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

function mapToAgentProducts(
  agentCommissions: AgentProduct[],
  productsWithProviders: Product[]
): AgentProductAssignment[] {
  // Create a map of products with their providers for quick lookup
  const productProviderMap = new Map<number, Product>()
  productsWithProviders.forEach((product) => {
    productProviderMap.set(Number(product.id), product)
  })

  // Group commissions by agent_id
  const agentCommissionMap = new Map<number, AgentProduct[]>()
  agentCommissions.forEach((commission) => {
    const existing = agentCommissionMap.get(Number(commission.agent.id)) || []
    existing.push(commission)
    agentCommissionMap.set(Number(commission.agent.id), existing)
  })

  // Map to output format
  const result: AgentProductAssignment[] = []

  agentCommissionMap.forEach((commissions, agentId) => {
    // Get the agent object (same for all commissions)
    const agent = commissions[0].agent

    // Get all products for this agent with provider info, including commission metadata
    const products: ProductCommissionInfo[] = []
    commissions.forEach((commission) => {
      const productWithProvider = productProviderMap.get(
        Number(commission.product_id)
      )
      if (productWithProvider) {
        products.push({
          product: productWithProvider,
          commission_rate: commission.commission_rate,
          commission_status: commission.status,
          commission_id: (commission as any).id ?? 0,
        })
      }
    })

    // Calculate average commission rate for this agent
    const avgCommissionRate = (
      commissions.reduce((sum, c) => sum + parseFloat(c.commission_rate), 0) /
      commissions.length
    ).toFixed(2)

    result.push({
      agent: agent,
      products: products,
    })
  })

  return result
}

export default function ProductTabs() {
  const [activeTab, setActiveTab] = useState('products')
  const [productsPage, setProductsPage] = useState(1)
  const [agentsPage, setAgentsPage] = useState(1)
  const [productsAssignments, setProductsAssignments] = useState<
    ProductAssignment[]
  >([])

  const currentPage = activeTab === 'products' ? productsPage : agentsPage

  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
  } = useGetProducts(productsPage)
  const {
    data: agentProducts,
    isLoading: agentProductsLoading,
    isError: agentProductsError,
  } = useGetAgentProducts(agentsPage)

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
          <div className="flex items-end">
            <button
              onClick={() => setActiveTab('products')}
              className={`relative rounded-t-2xl border-x border-t px-8 py-3 text-lg font-bold transition-all ${
                activeTab === 'products'
                  ? 'z-30 border-gray-200 bg-white text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                  : 'z-10 border-transparent bg-gray-100 text-gray-400 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:group-hover:bg-gray-700'
              }`}
            >
              Products
            </button>

            <button
              onClick={() => setActiveTab('agents')}
              className={`relative rounded-t-2xl border-x border-t px-8 py-3 text-lg font-bold transition-all ${
                activeTab === 'agents'
                  ? 'z-30 -ml-[1px] border-gray-200 bg-white text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                  : 'z-20 -ml-[1px] border-transparent bg-gray-100 text-gray-400 group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:group-hover:bg-gray-700'
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

        {/* Pagination for Products */}
        {activeTab === 'products' && products?.data && (
          <div className="mt-6 flex items-center justify-between rounded-b-3xl border border-t-0 bg-white px-6 py-4 dark:bg-gray-900">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {products.data.data.length} of {products.data.total}{' '}
              products
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProductsPage((p) => Math.max(1, p - 1))}
                disabled={products.data.current_page === 1}
                className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ‹
              </button>
              {Array.from({ length: products.data.last_page }, (_, i) => i + 1)
                .filter((pageNum) => {
                  const current = products.data.current_page
                  return (
                    pageNum === 1 ||
                    pageNum === products.data.last_page ||
                    (pageNum >= current - 1 && pageNum <= current + 1)
                  )
                })
                .map((pageNum, idx, arr) => {
                  if (idx > 0 && pageNum - arr[idx - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${pageNum}`}>
                        <span className="px-2 text-gray-400">...</span>
                        <button
                          onClick={() => setProductsPage(pageNum)}
                          className={`flex h-8 w-8 items-center justify-center rounded border text-sm ${
                            pageNum === products.data.current_page
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    )
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setProductsPage(pageNum)}
                      className={`flex h-8 w-8 items-center justify-center rounded border text-sm ${
                        pageNum === products.data.current_page
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              <button
                onClick={() =>
                  setProductsPage((p) =>
                    Math.min(products.data.last_page, p + 1)
                  )
                }
                disabled={
                  products.data.current_page === products.data.last_page
                }
                className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ›
              </button>
            </div>
          </div>
        )}

        {/* Pagination for Agents */}
        {activeTab === 'agents' && agentProducts?.data && (
          <div className="mt-6 flex items-center justify-between rounded-b-3xl border border-t-0 bg-white px-6 py-4 dark:bg-gray-900">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {agentProducts.data.data.length} of{' '}
              {agentProducts.data.total} agents
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAgentsPage((p) => Math.max(1, p - 1))}
                disabled={agentProducts.data.current_page === 1}
                className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ‹
              </button>
              {Array.from(
                { length: agentProducts.data.last_page },
                (_, i) => i + 1
              )
                .filter((pageNum) => {
                  const current = agentProducts.data.current_page
                  return (
                    pageNum === 1 ||
                    pageNum === agentProducts.data.last_page ||
                    (pageNum >= current - 1 && pageNum <= current + 1)
                  )
                })
                .map((pageNum, idx, arr) => {
                  if (idx > 0 && pageNum - arr[idx - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${pageNum}`}>
                        <span className="px-2 text-gray-400">...</span>
                        <button
                          onClick={() => setAgentsPage(pageNum)}
                          className={`flex h-8 w-8 items-center justify-center rounded border text-sm ${
                            pageNum === agentProducts.data.current_page
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    )
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setAgentsPage(pageNum)}
                      className={`flex h-8 w-8 items-center justify-center rounded border text-sm ${
                        pageNum === agentProducts.data.current_page
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              <button
                onClick={() =>
                  setAgentsPage((p) =>
                    Math.min(agentProducts.data.last_page, p + 1)
                  )
                }
                disabled={
                  agentProducts.data.current_page ===
                  agentProducts.data.last_page
                }
                className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
