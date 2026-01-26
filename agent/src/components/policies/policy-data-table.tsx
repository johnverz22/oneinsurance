'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Transaction, TransactionsResponse } from '@/types/agent/transactions'
import { cn } from '@/lib/utils'
import { 
  Shield, 
  Search, 
  X,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
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

interface PolicyDataTableProps {
  data: TransactionsResponse | null
  isLoading: boolean
  onSearch: (keyword: string) => void
  onClearSearch: () => void
  onPageChange: (page: number) => void
  currentPage: number
  isSearchMode: boolean
  onDateFilter?: (fromDate: Date, toDate: Date) => void
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'active':
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

export function PolicyDataTable({
  data,
  isLoading,
  onSearch,
  onClearSearch,
  onPageChange,
  currentPage,
  isSearchMode,
  onDateFilter,
}: PolicyDataTableProps) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const router = useRouter()

  const handleViewPolicy = (transaction: Transaction) => {
    // Use the transaction ID for the policy details page
    router.push(`/policies/${transaction.id}`)
  }

  const handleSearchSubmit = () => {
    if (searchKeyword.trim()) {
      onSearch(searchKeyword.trim())
    }
  }

  const handleClearSearchClick = () => {
    setSearchKeyword('')
    onClearSearch()
  }

  const handleDateFilter = () => {
    if (fromDate && toDate && onDateFilter) {
      onDateFilter(fromDate, toDate)
    }
  }

  const clearDateFilter = () => {
    setFromDate(undefined)
    setToDate(undefined)
    onClearSearch() // This will also clear date filters
  }

  const transactions = data?.data?.data || []

  return (
    <div className="space-y-4">
      {/* Search Field */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by Certificate number or Policyholder"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            className="pl-9"
          />
        </div>
        <Button
          onClick={handleSearchSubmit}
          disabled={isLoading || !searchKeyword.trim()}
        >
          Search
        </Button>
        {isSearchMode && (
          <Button
            variant="outline"
            onClick={handleClearSearchClick}
            disabled={isLoading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Date Filter Section */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
        <Label className="text-sm font-medium">Filter by date:</Label>
        
        {/* From Date */}
        <div className="flex items-center gap-2">
          <Label className="text-sm">From:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[140px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {fromDate ? format(fromDate, "MMM dd, yyyy") : "Select date"}
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
        </div>

        {/* To Date */}
        <div className="flex items-center gap-2">
          <Label className="text-sm">To:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[140px] justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {toDate ? format(toDate, "MMM dd, yyyy") : "Select date"}
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
        </div>

        {/* Filter Buttons */}
        <Button
          onClick={handleDateFilter}
          disabled={!fromDate || !toDate}
          size="sm"
        >
          Apply Filter
        </Button>
        
        {(fromDate || toDate) && (
          <Button
            onClick={clearDateFilter}
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Search Results Info */}
      {isSearchMode && data && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          Found {transactions.length} policies matching your search
        </div>
      )}

      {/* Data Table */}
      <div className="bg-background rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Certificate Number</TableHead>
              <TableHead>Policyholder</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Plan Code</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Coverage Period</TableHead>
              <TableHead>Travel Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction, index) => {
                return (
                  <TableRow
                    key={transaction.id}
                    className={cn('h-16', {
                      'bg-gray-50 dark:bg-gray-900': index % 2 === 1,
                    })}
                  >
                    <TableCell>
                      <button
                        onClick={() => handleViewPolicy(transaction)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {transaction.proposal_number}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {transaction.customer_name || `Customer ID: ${transaction.customer_id}` || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {(() => {
                          // Try to get CarrierProductCode from policy_details
                          const transactionWithDetails = transaction as Transaction & { policy_details?: string };
                          if (transactionWithDetails.policy_details) {
                            try {
                              const policyDetails = typeof transactionWithDetails.policy_details === 'string' 
                                ? JSON.parse(transactionWithDetails.policy_details) 
                                : transactionWithDetails.policy_details;
                              
                              return policyDetails?.CarrierProductCode || policyDetails?.ProductCode || 'TRAVEL';
                            } catch (e) {
                              console.log('Failed to parse policy_details for CarrierProductCode:', e);
                            }
                          }
                          
                          return 'TRAVEL';
                        })()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          // Try to get CarrierCode from policy_details
                          const transactionWithDetails = transaction as Transaction & { policy_details?: string };
                          if (transactionWithDetails.policy_details) {
                            try {
                              const policyDetails = typeof transaction.policy_details === 'string' 
                                ? JSON.parse(transaction.policy_details) 
                                : transaction.policy_details;
                              
                              return policyDetails?.CarrierCode || 'MALAYAN';
                            } catch (e) {
                              console.log('Failed to parse policy_details for CarrierCode:', e);
                            }
                          }
                          
                          return 'MALAYAN';
                        })()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {(() => {
                          // Try to get plan code from policy_details
                          const transactionWithDetails = transaction as Transaction & { policy_details?: string, carrier_product_code?: string };
                          if (transactionWithDetails.policy_details) {
                            try {
                              const policyDetails = typeof transactionWithDetails.policy_details === 'string' 
                                ? JSON.parse(transactionWithDetails.policy_details) 
                                : transactionWithDetails.policy_details;
                              
                              if (policyDetails?.PlanCode) {
                                return policyDetails.PlanCode;
                              }
                            } catch (e) {
                              console.log('Failed to parse policy_details for plan code:', e);
                            }
                          }
                          
                          // Fallback to carrier_product_code or default
                          return transactionWithDetails.carrier_product_code || 'Travel Plan';
                        })()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          // Try to get travel type from policy_details
                          const transactionWithDetails = transaction as Transaction & { policy_details?: string };
                          if (transactionWithDetails.policy_details) {
                            try {
                              const policyDetails = typeof transactionWithDetails.policy_details === 'string' 
                                ? JSON.parse(transactionWithDetails.policy_details) 
                                : transactionWithDetails.policy_details;
                              
                              if (policyDetails?.TravelType) {
                                return policyDetails.TravelType;
                              }
                            } catch (e) {
                              console.log('Failed to parse policy_details for travel type:', e);
                            }
                          }
                          
                          // Fallback
                          return 'Individual';
                        })()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">
                        {transaction.amount
                          ? `₱${Number(transaction.amount).toLocaleString()}`
                          : 'N/A'}
                      </p>
                      {transaction.commission_log?.gross_commission && (
                        <p className="text-sm text-green-600">
                          Commission: ₱{Number(transaction.commission_log.gross_commission).toLocaleString()}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.transaction_date ? (
                        <div>
                          <p className="text-sm">
                            {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Active Policy
                          </p>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">Various Destinations</p>
                        <p className="text-sm text-muted-foreground">Worldwide Coverage</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(getStatusColor(transaction.status))}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                  {isLoading ? 'Loading...' : 'No policies found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}