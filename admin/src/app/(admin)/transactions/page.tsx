'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowUpRight, X, Eye } from 'lucide-react'
import {
  DataTable,
  DataTableAction,
  createSortableHeader,
  exportToCSV,
} from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useGetTransactions } from '@/app/data/queries/transactions'
import { useSearchTransaction } from '@/app/data/mutations/transactions'
import { Transaction } from '@/types/transactions'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { format } from '@/lib/utils'

export default function TransactionsPage() {
  const [page, setPage] = useState<number>(1)
  const {
    data: transactionsData,
    isFetching,
    isLoading,
  } = useGetTransactions(page)
  const { isAuthenticated } = useAuthStore()
  const [authChecking, setAuthChecking] = useState(true)
  const [searchKey, setSearchKey] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const searchMutation = useSearchTransaction()

  useEffect(() => {
    // Small delay to let zustand persist/hydrate and avoid redirect flicker
    const t = setTimeout(() => {
      setAuthChecking(false)
      if (!isAuthenticated) {
        window.location.href = '/login'
      }
    }, 250)

    return () => clearTimeout(t)
  }, [isAuthenticated])

  const columns = React.useMemo<ColumnDef<Transaction, any>[]>(
    () => [
      {
        accessorKey: 'proposal_number',
        header: ({ column }) => createSortableHeader('Proposal Number', column),
      },
      {
        accessorKey: 'policy_id',
        header: ({ column }) => createSortableHeader('Policy ID', column),
      },
      {
        accessorKey: 'merchant_transaction_id',
        header: 'Merchant Transaction ID',
        cell: ({ row }) => row.original.merchant_transaction_id ?? '-',
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => createSortableHeader('Amount', column),
        cell: ({ row }) => {
          const amount = row.original.amount
          if (amount === null) return '-'
          return typeof amount === 'string'
            ? `₱${parseFloat(amount).toFixed(2)}`
            : `₱${amount.toFixed(2)}`
        },
      },
      {
        accessorKey: 'transaction_status',
        header: 'Transaction Status',
        cell: ({ row }) => row.original.transaction_status ?? '-',
      },
      {
        accessorKey: 'status',
        header: ({ column }) => createSortableHeader('Status', column),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              row.original.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : row.original.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : row.original.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: 'transaction_date',
        header: ({ column }) =>
          createSortableHeader('Transaction Date', column),
        cell: ({ row }) => {
          const date = row.original.transaction_date
          return date ? new Date(date).toLocaleString() : '-'
        },
      },
      // actions column will be injected by DataTable via the actions prop
    ],
    []
  )

  const actions: DataTableAction<Transaction>[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (tx: Transaction) => handleViewDetails(tx),
    },
  ]

  function handleSearchButtonClick(): void {
    if (searchKey.trim() === '') {
      toast.info('Please enter a search term.')
      return
    }
    searchMutation.mutate(searchKey.trim())
    setIsSearchMode(true)
  }

  function handleClearSearch(): void {
    setSearchKey('')
    setIsSearchMode(false)
    searchMutation.reset()
  }

  // Details dialog state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)

  function handleViewDetails(transaction: Transaction) {
    setSelectedTransaction(transaction)
    setIsDetailsOpen(true)
  }

  // Determine which data to display
  const displayData = isSearchMode ? searchMutation.data : transactionsData
  const isDataLoading = isSearchMode
    ? searchMutation.isPending
    : isFetching || isLoading

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          View all transactions processed in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between px-6">
            {/* Placeholder for header content */}
          </div>
        </CardHeader>
        <CardContent>
          <div>
            {authChecking || isDataLoading ? (
              <div className="w-full space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-background flex items-center gap-4 rounded-md border p-3"
                  >
                    <div className="h-10 w-10">
                      <Skeleton className="h-10 w-10" />
                    </div>
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="w-24">
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between">
                  <div className="flex w-[50%] items-center gap-2">
                    <Input
                      value={searchKey}
                      onChange={(e) => setSearchKey(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchButtonClick()
                        }
                      }}
                      placeholder="Search by proposal number, policy ID, transaction ID..."
                      className="max-w-md rounded-full"
                    />
                    <Button
                      className="from-primary to-lilac rounded-full bg-gradient-to-r text-white"
                      onClick={handleSearchButtonClick}
                      disabled={!searchKey.trim()}
                    >
                      Search
                    </Button>
                    {isSearchMode && (
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={handleClearSearch}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => exportToCSV(displayData?.data?.data ?? [])}
                    className="gap-2 rounded-full"
                  >
                    <ArrowUpRight />
                    Export
                  </Button>
                </div>

                {isSearchMode && (
                  <div className="text-muted-foreground mb-4 text-sm">
                    Showing search results for "{searchKey}"
                  </div>
                )}
                <DataTable
                  columns={columns}
                  data={displayData?.data?.data ?? []}
                  actions={actions}
                  enableColumnVisibility={false}
                  enablePagination={false}
                  pageSize={1000}
                />

                {/* Details dialog (shadcn Dialog) */}
                {ViewTransactionDetails(
                  isDetailsOpen,
                  setIsDetailsOpen,
                  selectedTransaction
                )}

                {/* Server-driven pagination links */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  {(() => {
                    const links = transactionsData?.data.links ?? []

                    // Separate prev/next from numbered pages
                    const prevLink = links.find(
                      (l: any) =>
                        l.label.includes('Previous') ||
                        l.label.includes('&laquo;')
                    )
                    const nextLink = links.find(
                      (l: any) =>
                        l.label.includes('Next') || l.label.includes('&raquo;')
                    )

                    // Get only numbered page links
                    const pageLinks = links.filter((l: any) => {
                      const cleaned = l.label.replace(/[^0-9]/g, '')
                      return cleaned !== '' && !isNaN(Number(cleaned))
                    })

                    // Find active page index
                    const activePageIndex = pageLinks.findIndex(
                      (l: any) => l.active
                    )
                    const totalPages = pageLinks.length

                    // Calculate which pages to show (5 pages max)
                    const maxPagesToShow = 5
                    let startIndex = Math.max(
                      0,
                      activePageIndex - Math.floor(maxPagesToShow / 2)
                    )
                    let endIndex = Math.min(
                      totalPages,
                      startIndex + maxPagesToShow
                    )

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
                                  p && setPage(Number(p))
                                } catch (e) {}
                              }
                            }}
                            disabled={!prevLink.url}
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
                              onClick={() => pageNum && setPage(pageNum)}
                              disabled={!url}
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
                                  p && setPage(Number(p))
                                } catch (e) {}
                              }
                            }}
                            disabled={!nextLink.url}
                          >
                            »
                          </Button>
                        )}
                      </>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
function ViewTransactionDetails(
  isDetailsOpen: boolean,
  setIsDetailsOpen: React.Dispatch<React.SetStateAction<boolean>>,
  selectedTransaction: {
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    id: number
    agent_id: number
    agent_code_used: string
    proposal_number: string
    policy_id: string
    merchant_transaction_id: string | null
    amount: string | number | null
    customer_id: number | null
    transaction_status: string | null
    transaction_date: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
  } | null
) {
  return (
    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Details for the selected transaction
          </DialogDescription>
        </DialogHeader>

        {selectedTransaction ? (
          <div className="space-y-2 py-2">
            <div>
              <strong>Proposal Number:</strong>{' '}
              {selectedTransaction.proposal_number}
            </div>
            <div>
              <strong>Policy ID:</strong> {selectedTransaction.policy_id}
            </div>
            <div>
              <strong>Merchant Transaction ID:</strong>{' '}
              {selectedTransaction.merchant_transaction_id ?? '-'}
            </div>
            <div>
              <strong>Amount:</strong>{' '}
              {selectedTransaction.amount !== null
                ? `₱${typeof selectedTransaction.amount === 'string' ? parseFloat(selectedTransaction.amount).toFixed(2) : selectedTransaction.amount.toFixed(2)}`
                : '-'}
            </div>
            <div>
              <strong>Status:</strong> {selectedTransaction.status}
            </div>
            <div>
              <strong>Transaction Status:</strong>{' '}
              {selectedTransaction.transaction_status ?? '-'}
            </div>
            <div>
              <strong>Transaction Date:</strong>{' '}
              {selectedTransaction.transaction_date
                ? new Date(
                    selectedTransaction.transaction_date
                  ).toLocaleString()
                : '-'}
            </div>
            <div>
              <strong>Agent Code Used:</strong>{' '}
              {selectedTransaction.agent_code_used}
            </div>
            <div>
              <strong>Customer ID:</strong>{' '}
              {selectedTransaction.customer_id ?? '-'}
            </div>
            <div>
              <strong>Created At:</strong>{' '}
              {selectedTransaction.created_at
                ? new Date(selectedTransaction.created_at).toLocaleString()
                : '-'}
            </div>
            <div>
              <strong>Updated At:</strong>{' '}
              {selectedTransaction.updated_at
                ? new Date(selectedTransaction.updated_at).toLocaleString()
                : '-'}
            </div>
          </div>
        ) : (
          <div>No transaction selected</div>
        )}

        <DialogFooter>
          <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
