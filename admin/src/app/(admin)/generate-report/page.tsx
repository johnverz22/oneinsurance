'use client'

import { useState, useEffect, useMemo } from 'react'
import { useGetAgents } from '@/app/data/queries/agents'
import { useGetProducts, searchProducts } from '@/app/data/queries/products'
import { useSearchAgents } from '@/app/data/mutations/agents'
import { useGetCommissionLogs } from '@/app/data/queries/commission-logs'
import { CommissionLogs } from '@/types/commission-logs'
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
import { exportToCSV } from '@/utils/export-to-csv'

const reportTypes = [
  { value: 'sales', label: 'Sales Report' },
  { value: 'commission', label: 'Commission Report' },
  { value: 'transaction', label: 'Transaction Report' },
  { value: 'performance', label: 'Performance Report' },
]

export default function GenerateReportPage() {
  const {
    data: agents,
    isLoading,
    isError,
    refetch,
  } = useGetAgents({ page: 1 })
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
  const [reportType, setReportType] = useState<string>('commission')
  const [agentSearch, setAgentSearch] = useState<string>('')
  const [productSearch, setProductSearch] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch commission logs with filters
  const { data: commissionLogsData, isLoading: commissionLogsLoading } =
    useGetCommissionLogs({
      page: currentPage,
      per_page: 15,
      agent_id: selectedAgent !== 'all' ? selectedAgent : undefined,
      product_id: selectedProduct !== 'all' ? selectedProduct : undefined,
      period_start: dateFrom || undefined,
      period_end: dateTo || undefined,
    })

  const reportData = commissionLogsData?.data?.data || []

  // Define columns using ColumnDef
  const columns = useMemo<ColumnDef<any, any>[]>(
    () => [
      {
        accessorKey: 'agent',
        header: 'Agent Name',
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.agent.first_name} {row.original.agent.last_name}
          </div>
        ),
      },
      {
        accessorKey: 'product',
        header: 'Product',
        cell: ({ row }) => row.original.product.name,
      },
      {
        accessorKey: 'provider',
        header: 'Provider',
        cell: ({ row }) => row.original.provider.name,
      },
      {
        accessorKey: 'case_count',
        header: 'Cases',
      },
      {
        accessorKey: 'total_net_premium',
        header: () => <div className="text-right">Total Premium</div>,
        cell: ({ row }) => (
          <div className="text-right">
            ₱ {parseFloat(row.original.total_net_premium).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: 'gross_commission',
        header: () => <div className="text-right">Gross Commission</div>,
        cell: ({ row }) => (
          <div className="text-right">
            ₱ {parseFloat(row.original.gross_commission).toLocaleString()}
          </div>
        ),
      },
      {
        accessorKey: 'net_commission',
        header: () => <div className="text-right">Net Commission</div>,
        cell: ({ row }) => (
          <div className="text-right">
            ₱ {parseFloat(row.original.net_commission).toLocaleString()}
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

  const handleGenerateReport = () => {
    if (reportData.length === 0) {
      console.log('No data to export')
      return
    }

    // Format data for CSV export
    const formattedData = reportData.map((row) => ({
      'Agent Name': `${row.agent.first_name} ${row.agent.last_name}`,
      Product: row.product.name,
      Provider: row.provider.name,
      Cases: row.case_count,
      'Total Premium': parseFloat(row.total_net_premium).toFixed(2),
      'Product Price': parseFloat(row.product_price).toFixed(2),
      'Commission Rate': parseFloat(row.commission_rate).toFixed(2),
      'Gross Commission': parseFloat(row.gross_commission).toFixed(2),
      'VAT Percentage': parseFloat(row.vat_percentage).toFixed(2),
      'VAT Amount': parseFloat(row.vat_amount).toFixed(2),
      'Withholding Tax %': parseFloat(row.withholding_tax_percentage).toFixed(
        2
      ),
      'Withholding Tax Amount': parseFloat(row.withholding_tax_amount).toFixed(
        2
      ),
      'Net Commission': parseFloat(row.net_commission).toFixed(2),
      'Created At': new Date(row.created_at).toLocaleDateString(),
    }))

    // Generate filename with date range
    const fromDate = dateFrom
      ? new Date(dateFrom).toLocaleDateString('en-US').replace(/\//g, '-')
      : 'all'
    const toDate = dateTo
      ? new Date(dateTo).toLocaleDateString('en-US').replace(/\//g, '-')
      : 'all'
    const filename = `commission-report_${fromDate}_to_${toDate}.csv`

    exportToCSV(formattedData, filename)
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
              disabled={commissionLogsLoading || reportData.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={commissionLogsLoading || reportData.length === 0}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
          <Button
            onClick={handleGenerateReport}
            disabled={commissionLogsLoading || reportData.length === 0}
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Data Table */}
      <ReportDataTable
        columns={columns}
        data={reportData}
        enablePagination={true}
        currentPage={commissionLogsData?.data?.current_page}
        totalPages={commissionLogsData?.data?.last_page}
        totalRecords={commissionLogsData?.data?.total}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  )
}
