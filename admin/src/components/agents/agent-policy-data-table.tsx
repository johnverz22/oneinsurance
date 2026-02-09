'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetAgentTransactions } from '@/app/data/queries/transactions'
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

interface AgentPolicyDataTableProps {
  agentId: number
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

export function AgentPolicyDataTable({
  agentId,
  onPageChange,
  currentPage,
}: AgentPolicyDataTableProps) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isSearchMode, setIsSearchMode] = useState(false)
  const router = useRouter()

  console.log('AgentPolicyDataTable - Rendering with agentId:', agentId, 'currentPage:', currentPage)

  const {
    data: transactionsResponse,
    isLoading,
    error,
  } = useGetAgentTransactions(agentId, currentPage)

  console.log('AgentPolicyDataTable - Query result:', {
    transactionsResponse,
    isLoading,
    error,
    agentId,
    currentPage
  })

  const transactions = transactionsResponse?.data?.data || []
  console.log('AgentPolicyDataTable - Extracted transactions:', transactions)

  // Don't render if agentId is not valid
  if (!agentId || agentId === 0) {
    console.log('AgentPolicyDataTable - Invalid agentId, showing loading message')
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading agent information...</p>
      </div>
    )
  }

  const handleViewPolicy = (transactionId: number, merchantTxId?: string) => {
    console.log('AgentPolicyDataTable - Navigating to policy:', transactionId, 'merchantTxId:', merchantTxId)
    const url = merchantTxId 
      ? `/agents/${agentId}/policies/${transactionId}?merchant_transaction_id=${merchantTxId}`
      : `/agents/${agentId}/policies/${transactionId}`
    router.push(url)
  }

  const handleSearchSubmit = () => {
    if (searchKeyword.trim()) {
      const filtered = transactions.filter((transaction: any) => {
        const searchTerm = searchKeyword.toLowerCase()
        
        // Search only in policy_number, certificate_number, and policy_holder
        return (
          transaction.policy_number?.toLowerCase().includes(searchTerm) ||
          transaction.certificate_number?.toLowerCase().includes(searchTerm) ||
          transaction.policy_holder?.toLowerCase().includes(searchTerm)
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
  
  console.log('AgentPolicyDataTable - Pagination info:', {
    totalPages,
    currentPage,
    isSearchMode,
    responseData: transactionsResponse?.data,
    lastPage: transactionsResponse?.data?.last_page,
    total: transactionsResponse?.data?.total,
    from: transactionsResponse?.data?.from,
    to: transactionsResponse?.data?.to,
    perPage: transactionsResponse?.data?.per_page,
    transactionsLength: transactions.length,
    displayDataLength: displayData.length,
    showPagination: !isSearchMode && totalPages > 1
  })

  if (isLoading) {
    console.log('AgentPolicyDataTable - Showing loading skeleton')
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
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
    console.log('AgentPolicyDataTable - Showing error state:', error)
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading transactions: {error?.message || 'Unknown error'}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Retry
        </Button>
      </div>
    )
  }

  console.log('AgentPolicyDataTable - Rendering table with', displayData.length, 'transactions')

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by Policy No., Certificate No., or Policy Holder"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearchSubmit} disabled={!searchKeyword.trim()}>
            Search
          </Button>
          {isSearchMode && (
            <Button variant="outline" onClick={handleClearSearchClick}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {fromDate ? format(fromDate, 'MMM dd') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
              <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {toDate ? format(toDate, 'MMM dd') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={toDate}
                onSelect={setToDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {fromDate && toDate && (
            <>
              <Button onClick={handleDateFilter}>
                Filter
              </Button>
              <Button variant="outline" onClick={clearDateFilter}>
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Policy No</TableHead>
              <TableHead className="font-bold">Certificate No</TableHead>
              <TableHead className="font-bold">Policy Holder</TableHead>
              <TableHead className="font-bold">Product</TableHead>
              <TableHead className="font-bold">Plan</TableHead>
              <TableHead className="font-bold">Coverage Period</TableHead>
              <TableHead className="font-bold">Premium</TableHead>
              <TableHead className="font-bold">Currency</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.length > 0 ? (
              displayData.map((transaction: any) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.policy_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {transaction.certificate_number || 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.policy_holder || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {transaction.product?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {transaction.plan_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Try to get dates from policy_details JSON
                      let effectiveDate = null
                      let expiryDate = null
                      
                      if (transaction.policy_details) {
                        try {
                          const policyDetails = typeof transaction.policy_details === 'string' 
                            ? JSON.parse(transaction.policy_details) 
                            : transaction.policy_details
                          effectiveDate = policyDetails.EffectiveDate
                          expiryDate = policyDetails.ExpiryDate
                        } catch (e) {
                          console.error('Error parsing policy_details:', e)
                        }
                      }
                      
                      if (effectiveDate && expiryDate) {
                        const startDate = new Date(effectiveDate)
                        const endDate = new Date(expiryDate)
                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                        
                        return (
                          <div>
                            <p className="text-sm font-medium">
                              {startDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {diffDays} Day{diffDays !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )
                      }
                      
                      return 'N/A'
                    })()}
                  </TableCell>
                  <TableCell>
                    {transaction.premium 
                      ? parseFloat(transaction.premium).toFixed(2)
                      : transaction.amount 
                      ? parseFloat(transaction.amount).toFixed(2)
                      : '0.00'}
                  </TableCell>
                  <TableCell>{transaction.currency || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(transaction.status || 'pending')}>
                      {(transaction.status || 'pending').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleViewPolicy(transaction.id, transaction.merchant_transaction_id)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                    >
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  {isSearchMode ? 'No policies found matching your search' : 'No policies found for this agent'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isSearchMode && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {transactionsResponse?.data?.from || 0} to{' '}
            {transactionsResponse?.data?.to || 0} of{' '}
            {transactionsResponse?.data?.total || 0} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((pageNum) => {
                  return (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  )
                })
                .map((pageNum, index, array) => (
                  <React.Fragment key={pageNum}>
                    {index > 0 && array[index - 1] !== pageNum - 1 && (
                      <span className="px-2 py-1 text-sm">...</span>
                    )}
                    <Button
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  </React.Fragment>
                ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}