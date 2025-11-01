'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useGetTransactions } from '@/app/data/queries/transactions'
import { TransactionDataTable } from '@/components/transactions/transaction-data-table'
import { useSearchTransactions } from '@/app/data/mutations/agent/transactions'
import { toast } from 'sonner'
import { TransactionsResponse } from '@/types/agent/transactions'

export default function TransactionPage() {
  const [currentPage, setCurrentPage] = useState(1)
  // Initialize current page from sessionStorage if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('transactions.currentPage')
      if (saved) {
        const p = Number(saved)
        if (!isNaN(p) && p > 0) setCurrentPage(p)
      }
    } catch (e) {}
  }, [])

  const {
    data: transactionsResponse,
    isLoading,
    refetch,
  } = useGetTransactions(currentPage)
  const { mutateAsync: searchTractions } = useSearchTransactions()
  const [searchedTransactions, setSearchedTransactions] =
    useState<TransactionsResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (keyword: string) => {
    try {
      setIsSearching(true)
      const result = await searchTractions({ keyword })
      setSearchedTransactions(result)
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Error searching transactions'
      )
    } finally {
      setIsSearching(false)
    }
  }

  // update current page when pagination control requests a change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    try {
      sessionStorage.setItem('transactions.currentPage', String(page))
    } catch (e) {}
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      toast.success('Transactions refreshed')
    } catch (e: any) {
      toast.error('Failed to refresh transactions')
    }
  }

  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Header */}
      <header className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
        <div className="mt-3 sm:mt-0">
          <button
            className="inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
            onClick={handleRefresh}
            disabled={isLoading || isSearching}
          >
            Refresh
          </button>
        </div>
      </header>

      <Card className="bg-background shadow-sm">
        <CardContent className="p-6">
          <TransactionDataTable
            data={searchedTransactions?.data || transactionsResponse?.data}
            isLoading={isLoading || isSearching}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onClearSearch={() => setSearchedTransactions(null)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
