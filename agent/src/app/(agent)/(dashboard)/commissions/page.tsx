'use client'

import {
  addDays,
  addMonths,
  format,
  getDate,
  getDaysInMonth,
  setDate,
} from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { PaymentHistoryCard } from '@/components/agent/payment-history-card'
import { PaymentHistory } from '@/types/agent/payments'
import { formatPHPAmount } from '@/utils/formatter'
import {
  usePaymentsHistory,
  usePaymentSummary,
} from '@/app/data/queries/payments'

const PAYMENT_HISTORY_COLUMNS: ColumnDef<PaymentHistory>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'period' },
  { accessorKey: 'salesCount' },
  { accessorKey: 'status' },
  { accessorKey: 'grossCommission.total' },
  { accessorKey: 'overriderDeduction.total' },
  { accessorKey: 'netPayment.amount' },
  { accessorKey: 'paymentStatus.dueDate' },
  { accessorKey: 'paymentStatus.paidDate' },
]

function getPaymentDates(today: Date = new Date()) {
  const day = getDate(today)
  const daysInMonth = getDaysInMonth(today)

  let lastPayment: Date
  let nextPayment: Date

  if (day >= 15 && day < daysInMonth) {
    lastPayment = setDate(today, 15)
    nextPayment = setDate(today, daysInMonth >= 30 ? 30 : daysInMonth) // handle shorter months
  } else if (day >= 30 || (day >= 28 && daysInMonth < 30)) {
    // after 30th (or last day of short month)
    lastPayment = setDate(today, daysInMonth >= 30 ? 30 : daysInMonth)
    const nextMonth = addMonths(today, 1)
    const daysInNextMonth = getDaysInMonth(nextMonth)
    nextPayment = setDate(nextMonth, 15)
  } else {
    // before 15th
    lastPayment = setDate(today, 1) // optional: or previous month's 30th
    nextPayment = setDate(today, 15)
  }

  return {
    lastPayment: format(lastPayment, 'PP'),
    nextPayment: format(nextPayment, 'PP'),
  }
}

const PaymentsPage = () => {
  const { data: paymentHistory, isSuccess: isPaymentHistoryFetched, isLoading: isPaymentHistoryLoading, error: paymentHistoryError } =
    usePaymentsHistory()
  const { data: paymentSummary, isSuccess: isPaymentSummaryFetched, isLoading: isPaymentSummaryLoading, error: paymentSummaryError } =
    usePaymentSummary()

  console.log('Commission Debug:', {
    paymentHistory,
    isPaymentHistoryFetched,
    isPaymentHistoryLoading,
    paymentHistoryError,
    paymentSummary,
    isPaymentSummaryFetched,
    isPaymentSummaryLoading,
    paymentSummaryError
  })

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      {/* Summary Cards */}
      {isPaymentSummaryLoading ? (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </Card>
          ))}
        </div>
      ) : paymentSummaryError ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading commission summary</p>
          <p className="text-sm text-muted-foreground">{paymentSummaryError.message}</p>
        </div>
      ) : isPaymentSummaryFetched && paymentSummary ? (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Cases</h4>
            <p className="text-sm font-semibold text-blue-500 lg:text-base">
              {paymentSummary.totalCases || 0}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Records</h4>
            <p className="text-sm font-semibold text-purple-500 lg:text-base">
              {paymentSummary.totalRecords || 0}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Net Premium</h4>
            <p className="text-sm font-semibold text-green-500 lg:text-base">
              PHP {paymentSummary.totalNetPremium || '0.00'}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Net Commission</h4>
            <p className="text-sm font-semibold lg:text-base">
              PHP {paymentSummary.totalNetCommission || '0.00'}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Gross Commission</h4>
            <p className="text-sm font-semibold text-red-500 lg:text-base">
              PHP {paymentSummary.totalGrossCommission || '0.00'}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Withholding Tax</h4>
            <p className="text-muted-foreground text-sm font-semibold lg:text-base">
              PHP {paymentSummary.totalWithholdingTax || '0.00'}
            </p>
          </Card>
        </div>
      ) : null}

      {/* Commission History */}
      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        {isPaymentHistoryLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading commission history...</p>
          </div>
        ) : paymentHistoryError ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading commission history</p>
            <p className="text-sm text-muted-foreground">{paymentHistoryError.message}</p>
          </div>
        ) : !paymentHistory || paymentHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg mb-2">No commission data available</p>
            <p className="text-muted-foreground text-sm">
              Commission data will appear here once you have completed transactions.
            </p>
          </div>
        ) : (
          <DataTable<PaymentHistory, unknown>
            header="Commission History"
            description="Track your commission payments and earnings"
            data={paymentHistory}
            columns={PAYMENT_HISTORY_COLUMNS}
            renderMode="list"
            isLoading={isPaymentHistoryLoading}
            numColumns={1}
            contentRenderer={(row) => (
              <PaymentHistoryCard history={row.original} />
            )}
            containerClassName="gap-6"
            actions={[]}
            onRowClick={(client) => {}}
          />
        )}
      </div>
    </div>
  )
}

export default PaymentsPage
