'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Search, Filter, Plus, Download } from 'lucide-react'
import LobMainContent from './lob-main-content'
import ProductsMainContent from './products-main-content'
import AgentsMainContent from './agents-main-content'
import AssignProductDialog from './assign-product-dialog'
import { exportToCSV } from '@/utils/export-to-csv'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PillTabs, PaginationBar } from '@/components/ui/design-system'
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
import { useGetAgentProducts, useGetAgents } from '@/app/data/queries/agents'
import { useQueryClient } from '@tanstack/react-query'

const PRODUCT_TABS = [
  { id: 'lob',      label: 'Line of Business' },
  { id: 'products', label: 'Products' },
  { id: 'agents',   label: 'Agents' },
]

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

  // Combine and map the data - iterate through ALL products
  const result: ProductAssignment[] = []

  productsWithProviders.forEach((productWithProvider) => {
    const productId = Number(productWithProvider.id)
    const commissions = productAgentMap.get(productId) || []

    // Extract agents for this product (empty array if no assignments)
    const agents = commissions.map((c) => c.agent)

    // Calculate average commission rate (or use '0.00' if no commissions)
    const avgCommissionRate =
      commissions.length > 0
        ? (
            commissions.reduce(
              (sum, c) => sum + parseFloat(c.commission_rate),
              0
            ) / commissions.length
          ).toFixed(2)
        : '0.00'

    // Determine overall status
    const allActive =
      commissions.length === 0 ||
      commissions.every((c) => c.status === 'active')
    const status = allActive ? 'active' : 'inactive'

    result.push({
      product: {
        id: productWithProvider.id,
        provider_id: productWithProvider.provider_id,
        name: productWithProvider.name,
        description: productWithProvider.description,
        price: 0,
        status: productWithProvider.status,
        carrier_product_code: productWithProvider.carrier_product_code,
        lob_id: productWithProvider.lob_id,
        created_at: productWithProvider.created_at,
        updated_at: productWithProvider.updated_at,
        deleted_at: productWithProvider.deleted_at,
        provider: productWithProvider.provider,
        line_of_business: productWithProvider.line_of_business,
      },
      provider: productWithProvider.provider,
      agents: agents,
      commission_rate: avgCommissionRate,
      status: status,
      price: '0.00', // Set default or calculate based on your business logic
    })
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
  const [activeTab, setActiveTab] = useState('lob')
  const [productsPage, setProductsPage] = useState(1)
  const [agentsPage, setAgentsPage] = useState(1)
  const [productsAssignments, setProductsAssignments] = useState<
    ProductAssignment[]
  >([])
  const [isAgentsSearchMode, setIsAgentsSearchMode] = useState(false)
  const [agentsSearchData, setAgentsSearchData] = useState<any>(null)

  const queryClient = useQueryClient()
  const currentPage = activeTab === 'products' ? productsPage : agentsPage

  // Memoize the search mode change handler to prevent infinite re-renders
  const handleSearchModeChange = useCallback((isSearchMode: boolean, displayData: any) => {
    setIsAgentsSearchMode(isSearchMode)
    setAgentsSearchData(displayData)
  }, [])

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
  const {
    data: agentsData,
    isLoading: agentsLoading,
    isError: agentsError,
  } = useGetAgents({
    page: agentsPage,
    per_page: 12,
    status: 'active', // Only fetch active agents
  })

  useEffect(() => {
    if (products && agentProducts) {
      const combinedData = combineProductArrays(
        agentProducts.data.data,
        products.data.data
      )
      setProductsAssignments(combinedData)
    }
  }, [products, agentProducts])

  const handleExportProducts = () => {
    if (!productsAssignments || productsAssignments.length === 0) {
      toast.info('No products data to export')
      return
    }
    const exportData = productsAssignments.map((assignment) => ({
      product_id: assignment.product.id,
      product_name: assignment.product.name,
      provider: assignment.provider.name,
      status: assignment.status,
      assigned_agents: assignment.agents.length,
      avg_commission_rate: assignment.commission_rate,
      description: assignment.product.description,
    }))
    exportToCSV(exportData, 'products-export.csv')
    toast.success('Products data exported successfully')
  }

  const handleExportAgents = () => {
    if (!agentProducts?.data?.data || agentProducts.data.data.length === 0) {
      toast.info('No agents data to export')
      return
    }
    const exportData = agentProducts.data.data.map((agentProduct) => ({
      agent_id: agentProduct.agent.id,
      agent_name: `${agentProduct.agent.first_name} ${agentProduct.agent.last_name}`,
      agent_email: agentProduct.agent.email,
      product_id: agentProduct.product_id,
      commission_rate: agentProduct.commission_rate,
      status: agentProduct.status,
    }))
    exportToCSV(exportData, 'agent-products-export.csv')
    toast.success('Agent products data exported successfully')
  }

  const handleProductUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['get-agent-products'] })
  }

  return (
    <div className="mt-2 min-h-screen sm:mt-4">
      <div>
        {/* Top Navigation & Actions Bar */}
        <div className="mb-6 flex flex-col-reverse justify-between gap-3 sm:gap-4 md:flex-row md:items-center md:gap-0">
          {/* Tabs */}
          <PillTabs
            tabs={PRODUCT_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {activeTab === 'lob' ? (
          <LobMainContent />
        ) : activeTab === 'products' ? (
          <ProductsMainContent
            productAssignments={productsAssignments}
            onProductCreated={handleProductUpdated}
          />
        ) : (
          <AgentsMainContent 
            page={agentsPage} 
            onPageReset={() => setAgentsPage(1)}
            onSearchModeChange={handleSearchModeChange}
          />
        )}

        {/* Pagination for Products */}
        {activeTab === 'products' && products?.data && products.data.last_page > 1 && (
          <PaginationBar
            currentPage={products.data.current_page}
            lastPage={products.data.last_page}
            total={products.data.total}
            from={products.data.from ?? undefined}
            to={products.data.to ?? undefined}
            onPageChange={setProductsPage}
          />
        )}

        {/* Pagination for Agents */}
        {activeTab === 'agents' && !isAgentsSearchMode && agentsData?.data && agentsData.data.last_page > 1 && (
          <PaginationBar
            currentPage={agentsData.data.current_page}
            lastPage={agentsData.data.last_page}
            total={agentsData.data.total}
            from={agentsData.data.from ?? undefined}
            to={agentsData.data.to ?? undefined}
            onPageChange={setAgentsPage}
          />
        )}
      </div>
    </div>
  )
}
