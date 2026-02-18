'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AllTransactionsDataTable } from '@/components/transactions/all-transactions-data-table'

export default function TransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-2">
          View all transactions from all agents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <AllTransactionsDataTable
            onPageChange={handlePageChange}
            currentPage={currentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
