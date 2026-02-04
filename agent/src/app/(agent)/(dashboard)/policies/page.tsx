'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useGetTransactions } from '@/app/data/queries/transactions'
import { PolicyDataTable } from '@/components/policies/policy-data-table'
import { toast } from 'sonner'
import { TransactionsResponse } from '@/types/agent/transactions'

export default function PoliciesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchedTransactions, setSearchedTransactions] = useState<TransactionsResponse | null>(null)
  
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
  
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (keyword: string) => {
    try {
      setIsSearching(true)
      
      // Use client-side search instead of backend search
      if (!transactionsResponse?.data?.data) {
        toast.error('No data available to search')
        return
      }
      
      const filtered = transactionsResponse.data.data.filter(transaction => {
        const searchTerm = keyword.toLowerCase()
        
        // Try to get CarrierPolicyNo from policy_details for search
        let carrierPolicyNo = ''
        if (transaction.policy_details) {
          try {
            const policyDetails = typeof transaction.policy_details === 'string' 
              ? JSON.parse(transaction.policy_details) 
              : transaction.policy_details;
            carrierPolicyNo = policyDetails?.CarrierPolicyNo || ''
          } catch (e) {
            console.log('Failed to parse policy_details for search:', e)
          }
        }
        
        return (
          carrierPolicyNo.toLowerCase().includes(searchTerm) ||
          transaction.customer_name?.toLowerCase().includes(searchTerm) ||
          transaction.agent_code_used?.toLowerCase().includes(searchTerm) ||
          transaction.carrier_product_code?.toLowerCase().includes(searchTerm)
        )
      })
      
      const searchResult = {
        ...transactionsResponse,
        data: {
          ...transactionsResponse.data,
          data: filtered
        }
      }
      
      setSearchedTransactions(searchResult)
      toast.success(`Found ${filtered.length} policies matching "${keyword}"`)
    } catch (error: any) {
      console.error('Search error:', error)
      toast.error('Error searching policies')
    } finally {
      setIsSearching(false)
    }
  }

  const handleDateFilter = (fromDate: Date, toDate: Date) => {
    // Filter the existing data by date range and only show completed transactions
    const filtered = transactionsResponse?.data?.data?.filter(transaction => {
      if (!transaction.transaction_date) return false
      if (transaction.status?.toLowerCase() !== 'completed') return false
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
      toast.success(`Filtered ${filtered.length} completed policies by date range`)
    }
  }

  // update current page when pagination control requests a change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    try {
      sessionStorage.setItem('policies.currentPage', String(page))
    } catch (e) {}
    
    // Clear search results when changing pages
    if (searchedTransactions) {
      setSearchedTransactions(null)
    }
  }

  const handleClearSearch = () => {
    setSearchedTransactions(null)
    refetch() // Refresh the original data
  }

  // Use searched data if available, otherwise use paginated data
  const displayData = searchedTransactions || transactionsResponse

  // Filter to show only completed transactions for policies
  const filteredDisplayData = displayData ? {
    ...displayData,
    data: {
      ...displayData.data,
      data: displayData.data?.data?.filter(transaction => 
        transaction.status?.toLowerCase() === 'completed'
      ) || []
    }
  } : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Policy Management</h2>
          <p className="text-muted-foreground">
            View and manage all your completed insurance policies, certificates, and coverage details.
          </p>
        </CardHeader>
        <CardContent>
          <PolicyDataTable
            data={filteredDisplayData}
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