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

const PAYMENT_HISTORY: PaymentHistory[] = [
  {
    id: 'PAY-2025-010',
    period: 'October 2025',
    salesCount: 3,
    status: 'Paid',
    grossCommission: {
      total: 105000,
      breakdown: [
        { label: 'Direct Sales', amount: 85000 },
        { label: 'Overrider Bonus', amount: 20000 },
      ],
    },
    overriderDeduction: {
      total: 15000,
      breakdown: [
        { label: 'Maria Santos', amount: 8000 },
        { label: 'Luis Mendoza', amount: 7000 },
      ],
    },
    netPayment: {
      amount: 90000,
      method: 'GCash',
      date: '2025-11-05',
    },
    paymentStatus: {
      dueDate: '2025-11-05',
      paidDate: '2025-11-02',
    },
  },
  {
    id: 'PAY-2025-009',
    period: 'September 2025',
    salesCount: 4,
    status: 'Paid',
    grossCommission: {
      total: 98000,
      breakdown: [
        { label: 'Direct Sales', amount: 76000 },
        { label: 'Overrider Bonus', amount: 22000 },
      ],
    },
    overriderDeduction: {
      total: 12000,
      breakdown: [
        { label: 'Karen Dizon', amount: 5000 },
        { label: 'Rey Morales', amount: 7000 },
      ],
    },
    netPayment: {
      amount: 86000,
      method: 'Bank Transfer',
      date: '2025-10-04',
    },
    paymentStatus: {
      dueDate: '2025-10-05',
      paidDate: '2025-10-03',
    },
  },
  {
    id: 'PAY-2025-008',
    period: 'August 2025',
    salesCount: 5,
    status: 'Paid',
    grossCommission: {
      total: 125000,
      breakdown: [
        { label: 'Direct Sales', amount: 102000 },
        { label: 'Overrider Bonus', amount: 23000 },
      ],
    },
    overriderDeduction: {
      total: 18000,
      breakdown: [
        { label: 'Jose Ramos', amount: 9000 },
        { label: 'Nina Cruz', amount: 9000 },
      ],
    },
    netPayment: {
      amount: 107000,
      method: 'Maya',
      date: '2025-09-05',
    },
    paymentStatus: {
      dueDate: '2025-09-05',
      paidDate: '2025-09-04',
    },
  },
  {
    id: 'PAY-2025-007',
    period: 'July 2025',
    salesCount: 2,
    status: 'Paid',
    grossCommission: {
      total: 72000,
      breakdown: [
        { label: 'Direct Sales', amount: 58000 },
        { label: 'Overrider Bonus', amount: 14000 },
      ],
    },
    overriderDeduction: {
      total: 9000,
      breakdown: [
        { label: 'Anna Lopez', amount: 4000 },
        { label: 'Mark Villanueva', amount: 5000 },
      ],
    },
    netPayment: {
      amount: 63000,
      method: 'Bank Transfer',
      date: '2025-08-05',
    },
    paymentStatus: {
      dueDate: '2025-08-05',
      paidDate: '2025-08-02',
    },
  },
  {
    id: 'PAY-2025-006',
    period: 'June 2025',
    salesCount: 4,
    status: 'Paid',
    grossCommission: {
      total: 87000,
      breakdown: [
        { label: 'Direct Sales', amount: 69000 },
        { label: 'Overrider Bonus', amount: 18000 },
      ],
    },
    overriderDeduction: {
      total: 11000,
      breakdown: [
        { label: 'Leo Javier', amount: 6000 },
        { label: 'Jane Torres', amount: 5000 },
      ],
    },
    netPayment: {
      amount: 76000,
      method: 'GCash',
      date: '2025-07-04',
    },
    paymentStatus: {
      dueDate: '2025-07-05',
      paidDate: '2025-07-03',
    },
  },
  {
    id: 'PAY-2025-005',
    period: 'May 2025',
    salesCount: 3,
    status: 'Pending',
    grossCommission: {
      total: 94000,
      breakdown: [
        { label: 'Direct Sales', amount: 76000 },
        { label: 'Overrider Bonus', amount: 18000 },
      ],
    },
    overriderDeduction: {
      total: 13000,
      breakdown: [
        { label: 'Sarah Go', amount: 7000 },
        { label: 'Tim Reyes', amount: 6000 },
      ],
    },
    netPayment: {
      amount: 81000,
      method: 'GCash',
      date: '2025-06-05',
    },
    paymentStatus: {
      dueDate: '2025-06-05',
      paidDate: undefined,
    },
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
  const totalEarnings = PAYMENT_HISTORY.reduce(
    (current, history) => current + history.grossCommission.total,
    0
  )

  const totalPaid = PAYMENT_HISTORY.reduce(
    (current, history) =>
      current + (history.status === 'Paid' ? history.grossCommission.total : 0),
    0
  )

  const totalPending = PAYMENT_HISTORY.reduce(
    (current, history) =>
      current +
      (history.status === 'Pending' ? history.grossCommission.total : 0),
    0
  )

  const monthlyAverage = totalEarnings / PAYMENT_HISTORY.length
  const { lastPayment, nextPayment } = getPaymentDates(new Date())

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
          <h4 className="font-bold">Total Earnings</h4>
          <p className="text-sm font-semibold lg:text-base">
            {formatPHPAmount(totalEarnings)}
          </p>
        </Card>
        <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
          <h4 className="font-bold">Total Paid</h4>
          <p className="text-sm font-semibold text-green-500 lg:text-base">
            {formatPHPAmount(totalPaid)}
          </p>
        </Card>
        <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
          <h4 className="font-bold">Total Pending</h4>
          <p className="text-sm font-semibold text-red-500 lg:text-base">
            {formatPHPAmount(totalPending)}
          </p>
        </Card>
        <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
          <h4 className="font-bold">Last Payment</h4>
          <p className="text-muted-foreground text-sm font-semibold lg:text-base">
            {lastPayment}
          </p>
        </Card>
        <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
          <h4 className="font-bold">Next Payment</h4>
          <p className="text-sm font-semibold text-blue-500 lg:text-base">
            {nextPayment}
          </p>
        </Card>
        <Card className="flex flex-col items-center gap-1.5 rounded-3xl px-6 py-2.5 text-center shadow-2xs lg:px-12 lg:py-5">
          <h4 className="font-bold">Monthly Average</h4>
          <p className="text-sm font-semibold text-purple-500 lg:text-base">
            {formatPHPAmount(monthlyAverage)}
          </p>
        </Card>
      </div>

      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <DataTable<PaymentHistory, unknown>
          header="Payment History"
          description="Track your commission payments and earnings"
          data={PAYMENT_HISTORY}
          columns={PAYMENT_HISTORY_COLUMNS}
          renderMode="list"
          numColumns={1}
          contentRenderer={(row) => (
            <PaymentHistoryCard history={row.original} />
          )}
          actions={[]}
          onRowClick={(client) => console.log('Clicked row:', client)}
        />
      </div>
    </div>
  )
}

export default PaymentsPage
