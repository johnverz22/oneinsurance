'use client'

import React, { useState, useEffect } from 'react'
import { Transaction, TransactionsData } from '@/types/agent/transactions'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Search, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TransactionDataTableProps {
  data: TransactionsData | undefined
  isLoading: boolean
  onPageChange: (page: number) => void
  onSearch: (keyword: string) => void
  onClearSearch: () => void
}

interface TableColumn {
  key: string
  label: string
  render?: (transaction: Transaction) => React.ReactNode
}

const columns: TableColumn[] = [
  { key: 'proposal_number', label: 'Proposal Number' },
  { key: 'policy_id', label: 'Policy ID' },
  {
    key: 'customer_id',
    label: 'Customer ID',
    render: (transaction) => transaction.customer_id ?? 'N/A',
  },
  {
    key: 'merchant_transaction_id',
    label: 'Transaction ID',
    render: (transaction) => transaction.merchant_transaction_id ?? 'N/A',
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (transaction) =>
      transaction.amount ? `₱${transaction.amount}` : 'N/A',
  },
  {
    key: 'status',
    label: 'Status',
    render: (transaction) => {
      const status = transaction.status
      const color =
        status === 'completed'
          ? { text: 'text-green-600', bg: 'bg-green-600' }
          : status === 'pending'
            ? { text: 'text-yellow-600', bg: 'bg-yellow-600' }
            : status === 'failed'
              ? { text: 'text-red-600', bg: 'bg-red-600' }
              : { text: 'text-gray-600', bg: 'bg-gray-600' }
      return (
        <div className="flex items-center gap-2">
          <div className={cn('size-2.5 rounded-full', color.bg)} />
          <span className={color.text}>{status.toUpperCase()}</span>
        </div>
      )
    },
  },
  {
    key: 'transaction_date',
    label: 'Transaction Date & Time',
    render: (transaction) =>
      transaction.transaction_date
        ? new Date(transaction.transaction_date).toLocaleString()
        : 'N/A',
  },
]

export function TransactionDataTable({
  data,
  isLoading,
  onPageChange,
  onSearch,
  onClearSearch,
}: TransactionDataTableProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const transactions = data?.data || []
  const total = data?.total || 0

  const handleSearch = () => {
    console.log('Search triggered with term:', localSearchTerm)
    if (onSearch) {
      onSearch(localSearchTerm)
    }
  }

  const handleClearSearch = () => {
    setLocalSearchTerm('')
    onClearSearch()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Field */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by proposal number, policy ID, or customer ID..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isLoading || !localSearchTerm.trim()}
        >
          Search
        </Button>
        {localSearchTerm && (
          <Button
            variant="outline"
            onClick={handleClearSearch}
            disabled={isLoading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
      {/* Table */}
      <div className="bg-background rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <TableRow
                  key={transaction.id}
                  className={cn('h-16', {
                    'bg-gray-50 dark:bg-gray-900': index % 2 === 1,
                  })}
                >
                  {columns.map((column) => (
                    <TableCell key={`${transaction.id}-${column.key}`}>
                      {column.render
                        ? column.render(transaction)
                        : transaction[column.key as keyof Transaction]}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => alert(`Viewing ${transaction.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center text-gray-500"
                >
                  {isLoading ? 'Loading...' : 'No transactions found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Server-driven pagination links */}
      <div className="mt-4 flex items-center justify-end gap-2">
        {(() => {
          const links = data?.links ?? []

          // Separate prev/next from numbered pages
          const prevLink = links.find(
            (l: any) =>
              l.label.includes('Previous') || l.label.includes('&laquo;')
          )
          const nextLink = links.find(
            (l: any) => l.label.includes('Next') || l.label.includes('&raquo;')
          )

          // Get only numbered page links
          const pageLinks = links.filter((l: any) => {
            const cleaned = l.label.replace(/[^0-9]/g, '')
            return cleaned !== '' && !isNaN(Number(cleaned))
          })

          // Find active page index
          const activePageIndex = pageLinks.findIndex((l: any) => l.active)
          const totalPages = pageLinks.length

          // Calculate which pages to show (5 pages max)
          const maxPagesToShow = 5
          let startIndex = Math.max(
            0,
            activePageIndex - Math.floor(maxPagesToShow / 2)
          )
          let endIndex = Math.min(totalPages, startIndex + maxPagesToShow)

          // Adjust if we're near the end
          if (endIndex - startIndex < maxPagesToShow) {
            startIndex = Math.max(0, endIndex - maxPagesToShow)
          }

          const visiblePages = pageLinks.slice(startIndex, endIndex)

          return (
            <>
              {/* Previous button */}
              {prevLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (prevLink.url) {
                      try {
                        const u = new URL(prevLink.url)
                        const p = u.searchParams.get('page')
                        p && onPageChange(Number(p))
                      } catch (e) {}
                    }
                  }}
                  disabled={!prevLink.url || isLoading}
                >
                  «
                </Button>
              )}

              {/* Page numbers */}
              {visiblePages.map((linkObj: any, idx: number) => {
                const { url, label: rawLabel, active } = linkObj
                const cleanedLabel = rawLabel.replace(/[^0-9]/g, '')

                let pageNum: number | null = null
                try {
                  if (url) {
                    const u = new URL(url)
                    const p = u.searchParams.get('page')
                    pageNum = p ? Number(p) : null
                  }
                } catch (e) {
                  pageNum = null
                }

                return (
                  <Button
                    key={`page-${cleanedLabel}-${idx}`}
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => pageNum && onPageChange(pageNum)}
                    disabled={!url || isLoading}
                  >
                    {cleanedLabel}
                  </Button>
                )
              })}

              {/* Next button */}
              {nextLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (nextLink.url) {
                      try {
                        const u = new URL(nextLink.url)
                        const p = u.searchParams.get('page')
                        p && onPageChange(Number(p))
                      } catch (e) {}
                    }
                  }}
                  disabled={!nextLink.url || isLoading}
                >
                  »
                </Button>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}
