'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetAllTransactions } from '@/app/data/queries/transactions'
import { 
  Search, 
  X,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface AllTransactionsDataTableProps {
  onPageChange: (page: number) => void
  currentPage: number
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 hover:bg-green-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    case 'failed':
      return 'bg-red-100 text-red-800 hover:bg-red-200'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    default:
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  }
}

export function AllTransactionsDataTable({
  onPageChange,
  currentPage,
}: AllTransactionsDataTableProps) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isSearchMode, setIsSearchMode] = useState(false)
  const router = useRouter()

  const {
    data: transactionsResponse,
    isLoading,
    error,
  } = useGetAllTransactions(currentPage)

  const transactions = transactionsResponse?.data?.data || []

  const handleViewPolicy = (agentId: number, transactionId: number, merchantTxId?: string) => {
    const url = merchantTxId 
      ? `/agents/${agentId}/policies/${transactionId}?merchant_transaction_id=${merchantTxId}`
      : `/agents/${agentId}/policies/${transactionId}`
    router.push(url)
  }

  const handleSearchSubmit = () => {
    if (searchKeyword.trim()) {
      const filtered = transactions.filter((transaction: any) => {
        const searchTerm = searchKeyword.toLowerCase()
        
        return (
          transaction.policy_number?.toLowerCase().includes(searchTerm) ||
          transaction.certificate_number?.toLowerCase().includes(searchTerm) ||
          transaction.policy_holder?.toLowerCase().includes(searchTerm) ||
          transaction.agent_code_used?.toLowerCase().includes(searchTerm)
        )
      })
      
      setFilteredData(filtered)
      setIsSearchMode(true)
    }
  }

  const handleClearSearchClick = () => {
    setSearchKeyword('')
    setFilteredData([])
    setIsSearchMode(false)
  }

  const handleDateFilter = () => {
    if (fromDate && toDate) {
      const filtered = transactions.filter((transaction: any) => {
        const dateField = transaction.transaction_date || transaction.created_at
        if (!dateField) return false
        const transactionDate = new Date(dateField)
        return transactionDate >= fromDate && transactionDate <= toDate
      })
      setFilteredData(filtered)
      setIsSearchMode(true)
    }
  }

  const clearDateFilter = () => {
    setFromDate(undefined)
    setToDate(undefined)
    setFilteredData([])
    setIsSearchMode(false)
  }

  const displayData = isSearchMode ? filteredData : transactions
  const totalPages = isSearchMode ? 1 : (transactionsResponse?.data?.last_page || 1)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading transactions</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by policy number, certificate, policy holder, or agent code..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit()
                }
              }}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearchSubmit} size="sm">
            Search
          </Button>
          {isSearchMode && (
            <Button
              onClick={handleClearSearchClick}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                {fromDate ? format(fromDate, 'MMM dd, yyyy') : 'From Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={fromDate}
                onSelect={setFromDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                {toDate ? format(toDate, 'MMM dd, yyyy') : 'To Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={toDate}
                onSelect={setToDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(fromDate || toDate) && (
            <>
              <Button onClick={handleDateFilter} size="sm">
                Filter
              </Button>
              <Button onClick={clearDateFilter} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy No</TableHead>
              <TableHead>Certificate No</TableHead>
              <TableHead>Policy Holder</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Coverage Period</TableHead>
              <TableHead className="text-right">Premium</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((transaction: any) => {
                const policyDetails = typeof transaction.policy_details === 'string' 
                  ? JSON.parse(transaction.policy_details) 
                  : transaction.policy_details

                const effectiveDate = policyDetails?.EffectiveDate 
                  ? new Date(policyDetails.EffectiveDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                  : 'N/A'
                
                const expiryDate = policyDetails?.ExpiryDate 
                  ? new Date(policyDetails.ExpiryDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                  : 'N/A'

                const travelDays = policyDetails?.TravelDays || 'N/A'

                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.policy_number || 'N/A'}
                    </TableCell>
                    <TableCell>{transaction.certificate_number || 'N/A'}</TableCell>
                    <TableCell>{transaction.policy_holder || transaction.customer_name || 'N/A'}</TableCell>
                    <TableCell>{transaction.product_name || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.plan_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {effectiveDate} - {expiryDate}
                        <div className="text-xs text-gray-500">{travelDays} Days</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {transaction.amount ? Number(transaction.amount).toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell>{transaction.currency || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleViewPolicy(
                          transaction.agent_id,
                          transaction.id,
                          transaction.merchant_transaction_id
                        )}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isSearchMode && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
