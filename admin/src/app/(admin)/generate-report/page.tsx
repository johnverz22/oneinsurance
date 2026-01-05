'use client'

import { useState, useEffect, useMemo } from 'react'
import { useGetAgents } from '@/app/data/queries/agents'
import { useGetProducts, searchProducts } from '@/app/data/queries/products'
import { useSearchAgents } from '@/app/data/mutations/agents'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar, Search, FileSpreadsheet, FileText } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { ReportDataTable } from '@/components/reports/report-data-table'
import { ColumnDef } from '@tanstack/react-table'

interface ReportData {
  id: number
  clientName: string
  product: string
  policiesSold: number
  activePolicies: number
  pending: number
  premiumAmount: number
}

const reportTypes = [
  { value: 'sales', label: 'Sales Report' },
  { value: 'commission', label: 'Commission Report' },
  { value: 'transaction', label: 'Transaction Report' },
  { value: 'performance', label: 'Performance Report' },
]

export default function GenerateReportPage() {
  const { data: agents, isLoading, isError, refetch } = useGetAgents(1)
  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useGetProducts(1)

  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [reportType, setReportType] = useState<string>('')
  const [agentSearch, setAgentSearch] = useState<string>('')
  const [productSearch, setProductSearch] = useState<string>('')
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [isReportGenerated, setIsReportGenerated] = useState(false)

  // Define columns using ColumnDef
  const columns = useMemo<ColumnDef<ReportData, any>[]>(
    () => [
      {
        accessorKey: 'clientName',
        header: 'Client Name',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.clientName}</div>
        ),
      },
      {
        accessorKey: 'product',
        header: 'Product',
      },
      {
        accessorKey: 'policiesSold',
        header: 'Policies Sold',
      },
      {
        accessorKey: 'activePolicies',
        header: 'Active Policies',
      },
      {
        accessorKey: 'pending',
        header: 'Pending',
      },
      {
        accessorKey: 'premiumAmount',
        header: () => <div className="text-right">Premium Amount</div>,
        cell: ({ row }) => (
          <div className="text-right">
            ₱ {row.original.premiumAmount.toLocaleString()}
          </div>
        ),
      },
    ],
    []
  )

  // Debounce search inputs
  const debouncedAgentSearch = useDebounce(agentSearch, 500)
  const debouncedProductSearch = useDebounce(productSearch, 500)

  // Search mutations
  const searchAgentsMutation = useSearchAgents()
  const searchProductsQuery = searchProducts(debouncedProductSearch)

  // Effect to trigger agent search
  useEffect(() => {
    if (debouncedAgentSearch.trim()) {
      searchAgentsMutation.mutate({ searchKey: debouncedAgentSearch })
    }
  }, [debouncedAgentSearch])

  // Get filtered agents
  const filteredAgents = agentSearch.trim()
    ? searchAgentsMutation.data?.data?.data || []
    : agents?.data?.data || []

  // Get filtered products
  const filteredProducts = productSearch.trim()
    ? searchProductsQuery.data?.data?.data || []
    : products?.data?.data || []

  // Load mock data on mount
  useEffect(() => {
    const mockData = [
      {
        id: 1,
        clientName: 'Juan Dela Cruz',
        product: 'Life Insurance',
        policiesSold: 24,
        activePolicies: 15,
        pending: 1,
        premiumAmount: 25000,
      },
      {
        id: 2,
        clientName: 'Juan Dela Cruz',
        product: 'Travel Insurance',
        policiesSold: 21,
        activePolicies: 12,
        pending: 2,
        premiumAmount: 25000,
      },
      {
        id: 3,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 18,
        activePolicies: 3,
        pending: 2,
        premiumAmount: 18000,
      },
      {
        id: 4,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 24,
        activePolicies: 15,
        pending: 4,
        premiumAmount: 20000,
      },
      {
        id: 5,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 21,
        activePolicies: 12,
        pending: 2,
        premiumAmount: 18000,
      },
      {
        id: 6,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 18,
        activePolicies: 3,
        pending: 4,
        premiumAmount: 20000,
      },
      {
        id: 7,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 17,
        activePolicies: 6,
        pending: 1,
        premiumAmount: 20000,
      },
      {
        id: 8,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 18,
        activePolicies: 3,
        pending: 2,
        premiumAmount: 18000,
      },
      {
        id: 9,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 17,
        activePolicies: 6,
        pending: 2,
        premiumAmount: 20000,
      },
    ]

    setReportData(mockData)
    setIsReportGenerated(true)
  }, [])

  const handleGenerateReport = () => {
    // Handle report generation logic here
    console.log({
      agent: selectedAgent,
      product: selectedProduct,
      dateFrom,
      dateTo,
      reportType,
    })

    // Mock data - Replace with actual API call based on filters

    const mockData = [
      {
        id: 1,
        clientName: 'Juan Dela Cruz',
        product: 'Life Insurance',
        policiesSold: 24,
        activePolicies: 15,
        pending: 1,
        premiumAmount: 25000,
      },
      {
        id: 2,
        clientName: 'Juan Dela Cruz',
        product: 'Travel Insurance',
        policiesSold: 21,
        activePolicies: 12,
        pending: 2,
        premiumAmount: 25000,
      },
      {
        id: 3,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 18,
        activePolicies: 3,
        pending: 2,
        premiumAmount: 18000,
      },
      {
        id: 4,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 24,
        activePolicies: 15,
        pending: 4,
        premiumAmount: 20000,
      },
      {
        id: 5,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 21,
        activePolicies: 12,
        pending: 2,
        premiumAmount: 18000,
      },
      {
        id: 6,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 18,
        activePolicies: 3,
        pending: 4,
        premiumAmount: 20000,
      },
      {
        id: 7,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 17,
        activePolicies: 6,
        pending: 1,
        premiumAmount: 20000,
      },
      {
        id: 8,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 18,
        activePolicies: 3,
        pending: 2,
        premiumAmount: 18000,
      },
      {
        id: 9,
        clientName: 'Maria Santos',
        product: 'Health Insurance',
        policiesSold: 17,
        activePolicies: 6,
        pending: 2,
        premiumAmount: 20000,
      },
    ]

    setReportData(mockData)
    setIsReportGenerated(true)
  }

  const handleExportExcel = () => {
    // Implement Excel export logic
    console.log('Exporting to Excel...')
  }

  const handleExportPDF = () => {
    // Implement PDF export logic
    console.log('Exporting to PDF...')
  }

  return (
    <div>
      <PageHeader title="Generate Report" subTitle="" />

      {/* Filters Section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Agent Filter */}
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <div className="sticky top-0 z-10 border-b px-2 py-1.5">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search agents..."
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    className="h-8 pl-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <SelectItem value="all">All Agents</SelectItem>
              {searchAgentsMutation.isPending && agentSearch.trim() ? (
                <div className="px-2 py-6 text-center text-sm text-gray-500">
                  Searching...
                </div>
              ) : filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.first_name} {agent.middle_name || ''}{' '}
                    {agent.last_name}
                  </SelectItem>
                ))
              ) : agentSearch.trim() ? (
                <div className="px-2 py-6 text-center text-sm text-gray-500">
                  No agents found
                </div>
              ) : null}
            </SelectContent>
          </Select>

          {/* Product Filter */}
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <div className="sticky top-0 z-10 border-b px-2 py-1.5">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-8 pl-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <SelectItem value="all">All Products</SelectItem>
              {searchProductsQuery.isLoading && productSearch.trim() ? (
                <div className="px-2 py-6 text-center text-sm text-gray-500">
                  Searching...
                </div>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))
              ) : productSearch.trim() ? (
                <div className="px-2 py-6 text-center text-sm text-gray-500">
                  No products found
                </div>
              ) : null}
            </SelectContent>
          </Select>

          {/* Date From */}
          <div className="relative">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Date From: mm/dd/yyyy"
              className="bg-white pr-10"
            />
            <Calendar className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Date To */}
          <div className="relative">
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Date To: mm/dd/yyyy"
              className="bg-white pr-10"
            />
            <Calendar className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Report Type */}
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={!isReportGenerated}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={!isReportGenerated}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
          <Button
            onClick={handleGenerateReport}
            disabled={!reportType || !dateFrom || !dateTo}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Data Table */}
      <ReportDataTable
        columns={columns}
        data={reportData}
        pageSize={9}
        enablePagination={true}
      />
    </div>
  )
}
