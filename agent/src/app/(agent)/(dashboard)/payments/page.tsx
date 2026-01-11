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

export const PAYMENT_HISTORY: PaymentHistory[] = [
  {
    payoutReference: 'PR-2024-001',
    agentId: 'AG-1001',
    agentName: 'Juan Dela Cruz',
    payoutAmount: 32500,
    accountType: 'Bank',
    accountName: 'Juan Dela Cruz',
    accountNumber: '****1234',
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-01-15'),
    generatedBy: 'System',
    dateGenerated: new Date('2024-01-16'),
    status: 'Paid',
  },
  {
    payoutReference: 'PR-2024-002',
    agentId: 'AG-1002',
    agentName: 'Maria Santos',
    payoutAmount: 18400,
    accountType: 'GCash',
    accountName: 'Maria Santos',
    accountNumber: '****5678',
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-01-15'),
    generatedBy: 'System',
    dateGenerated: new Date('2024-01-16'),
    status: 'Pending',
  },
  {
    payoutReference: 'PR-2024-003',
    agentId: 'AG-1003',
    agentName: 'Pedro Reyes',
    payoutAmount: 50250,
    accountType: 'Bank',
    accountName: 'Pedro Reyes',
    accountNumber: '****9012',
    dateFrom: new Date('2024-01-16'),
    dateTo: new Date('2024-01-31'),
    generatedBy: 'Finance Admin',
    dateGenerated: new Date('2024-02-01'),
    status: 'Paid',
  },
  {
    payoutReference: 'PR-2024-004',
    agentId: 'AG-1004',
    agentName: 'Ana Lim',
    payoutAmount: 12900,
    accountType: 'PayMaya',
    accountName: 'Ana Lim',
    accountNumber: '****3344',
    dateFrom: new Date('2024-01-16'),
    dateTo: new Date('2024-01-31'),
    generatedBy: 'Finance Admin',
    dateGenerated: new Date('2024-02-01'),
    status: 'Failed',
  },
  {
    payoutReference: 'PR-2024-005',
    agentId: 'AG-1005',
    agentName: 'Mark Villanueva',
    payoutAmount: 27800,
    accountType: 'Bank',
    accountName: 'Mark Villanueva',
    accountNumber: '****7788',
    dateFrom: new Date('2024-02-01'),
    dateTo: new Date('2024-02-15'),
    generatedBy: 'System',
    dateGenerated: new Date('2024-02-16'),
    status: 'Paid',
  },
  {
    payoutReference: 'PR-2024-006',
    agentId: 'AG-1006',
    agentName: 'Chris Tan',
    payoutAmount: 9400,
    accountType: 'GCash',
    accountName: 'Chris Tan',
    accountNumber: '****1122',
    dateFrom: new Date('2024-02-01'),
    dateTo: new Date('2024-02-15'),
    generatedBy: 'System',
    dateGenerated: new Date('2024-02-16'),
    status: 'Pending',
  },
  {
    payoutReference: 'PR-2024-007',
    agentId: 'AG-1007',
    agentName: 'Liza Gomez',
    payoutAmount: 41500,
    accountType: 'Bank',
    accountName: 'Liza Gomez',
    accountNumber: '****8899',
    dateFrom: new Date('2024-02-16'),
    dateTo: new Date('2024-02-28'),
    generatedBy: 'Finance Admin',
    dateGenerated: new Date('2024-03-01'),
    status: 'Paid',
  },
  {
    payoutReference: 'PR-2024-008',
    agentId: 'AG-1008',
    agentName: 'Kevin Ong',
    payoutAmount: 16200,
    accountType: 'PayMaya',
    accountName: 'Kevin Ong',
    accountNumber: '****5566',
    dateFrom: new Date('2024-02-16'),
    dateTo: new Date('2024-02-28'),
    generatedBy: 'Finance Admin',
    dateGenerated: new Date('2024-03-01'),
    status: 'Pending',
  },
  {
    payoutReference: 'PR-2024-009',
    agentId: 'AG-1009',
    agentName: 'Rhea Flores',
    payoutAmount: 35600,
    accountType: 'Bank',
    accountName: 'Rhea Flores',
    accountNumber: '****6677',
    dateFrom: new Date('2024-03-01'),
    dateTo: new Date('2024-03-15'),
    generatedBy: 'System',
    dateGenerated: new Date('2024-03-16'),
    status: 'Paid',
  },
  {
    payoutReference: 'PR-2024-010',
    agentId: 'AG-1010',
    agentName: 'Noel Bautista',
    payoutAmount: 11800,
    accountType: 'GCash',
    accountName: 'Noel Bautista',
    accountNumber: '****4455',
    dateFrom: new Date('2024-03-01'),
    dateTo: new Date('2024-03-15'),
    generatedBy: 'System',
    dateGenerated: new Date('2024-03-16'),
    status: 'Pending',
  },
]

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
  const { data: paymentHistory, isSuccess: isPaymentHistoryFetched } =
    usePaymentsHistory()
  const { data: paymentSummary, isSuccess: isPaymentSummaryFetched } =
    usePaymentSummary()

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      {isPaymentSummaryFetched && (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Cases</h4>
            <p className="text-sm font-semibold text-blue-500 lg:text-base">
              {paymentSummary.totalCases}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Records</h4>
            <p className="text-sm font-semibold text-purple-500 lg:text-base">
              {paymentSummary.totalRecords}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Net Premium</h4>
            <p className="text-sm font-semibold text-green-500 lg:text-base">
              {formatPHPAmount(Number(paymentSummary.totalNetPremium))}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Net Commission</h4>
            <p className="text-sm font-semibold lg:text-base">
              {formatPHPAmount(Number(paymentSummary.totalNetCommission))}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Gross Commission</h4>
            <p className="text-sm font-semibold text-red-500 lg:text-base">
              {formatPHPAmount(Number(paymentSummary.totalGrossCommission))}
            </p>
          </Card>
          <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
            <h4 className="font-bold">Total Withholding Tax</h4>
            <p className="text-muted-foreground text-sm font-semibold lg:text-base">
              {formatPHPAmount(Number(paymentSummary.totalWithholdingTax))}
            </p>
          </Card>
        </div>
      )}

      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <DataTable<PaymentHistory, unknown>
          header="Payment History"
          description="Track your commission payments and earnings"
          data={paymentHistory ?? []}
          columns={PAYMENT_HISTORY_COLUMNS}
          renderMode="list"
          isLoading={!isPaymentHistoryFetched}
          numColumns={1}
          contentRenderer={(row) => (
            <PaymentHistoryCard history={row.original} />
          )}
          containerClassName="gap-6"
          actions={[]}
          onRowClick={(client) => console.log('Clicked row:', client)}
        />
      </div>
    </div>
  )
}

export default PaymentsPage
