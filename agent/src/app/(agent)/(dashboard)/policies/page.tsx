'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useGetTransactions } from '@/app/data/queries/transactions'
import { PolicyDataTable } from '@/components/policies/policy-data-table'
import { useSearchTransactions } from '@/app/data/mutations/agent/transactions'
import { toast } from 'sonner'
import { TransactionsResponse } from '@/types/agent/transactions'

export default function PoliciesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  // Initialize current page from sessionStorage if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('policies.currentPage')
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
  const { mutateAsync: searchTransactions } = useSearchTransactions()
  const [searchedTransactions, setSearchedTransactions] =
    useState<TransactionsResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (keyword: string) => {
    try {
      setIsSearching(true)
      const result = await searchTransactions({ keyword })
      setSearchedTransactions(result)
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Error searching policies'
      )
    } finally {
      setIsSearching(false)
    }
  }

  const handleDateFilter = (fromDate: Date, toDate: Date) => {
    // Filter the existing data by date range
    const filtered = transactionsResponse?.data?.data?.filter(transaction => {
      if (!transaction.transaction_date) return false
      const transactionDate = new Date(transaction.transaction_date)
      return transactionDate >= fromDate && transactionDate <= toDate
    })
    
    if (filtered && transactionsResponse) {
      setSearchedTransactions({
        ...transactionsResponse,
        data: {
          ...transactionsResponse.data,
          data: filtered
        }
      })
      toast.success(`Filtered ${filtered.length} policies by date range`)
    }
  }

  // update current page when pagination control requests a change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    try {
      sessionStorage.setItem('policies.currentPage', String(page))
    } catch (e) {}
  }

  const handleClearSearch = () => {
    setSearchedTransactions(null)
  }

  // Use searched data if available, otherwise use paginated data
  const displayData = searchedTransactions || transactionsResponse || { 
    success: false, 
    message: '', 
    data: { 
      data: [], 
      total: 0, 
      current_page: 1, 
      last_page: 1, 
      per_page: 10, 
      from: 0, 
      to: 0, 
      path: '',
      first_page_url: '',
      last_page_url: '',
      links: [],
      next_page_url: null,
      prev_page_url: null
    } 
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Policy Management</h2>
          <p className="text-muted-foreground">
            View and manage all your policy transactions, certificates, and coverage details.
          </p>
        </CardHeader>
        <CardContent>
          <PolicyDataTable
            data={displayData}
            isLoading={isLoading || isSearching}
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            onPageChange={handlePageChange}
            currentPage={currentPage}
            isSearchMode={!!searchedTransactions}
            onDateFilter={handleDateFilter}
          />
        </CardContent>
      </Card>
    </div>
  )
}