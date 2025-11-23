'use client'

import { PaymentHistoryCard } from '@/components/agent/payment-history-card'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { PaymentHistory } from '@/types/agent/payments'
import { ColumnDef } from '@tanstack/react-table'
import { Users2 } from 'lucide-react'

const PAYMENT_HISTORY: PaymentHistory[] = [
  {
    id: 'PAY-2024-010',
    period: 'October 2024',
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
      date: '2024-11-05',
    },
    paymentStatus: {
      dueDate: '2024-11-05',
      paidDate: '2024-11-02',
    },
  },
  {
    id: 'PAY-2024-009',
    period: 'September 2024',
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
      date: '2024-10-04',
    },
    paymentStatus: {
      dueDate: '2024-10-05',
      paidDate: '2024-10-03',
    },
  },
  {
    id: 'PAY-2024-008',
    period: 'August 2024',
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
      date: '2024-09-05',
    },
    paymentStatus: {
      dueDate: '2024-09-05',
      paidDate: '2024-09-04',
    },
  },
  {
    id: 'PAY-2024-007',
    period: 'July 2024',
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
      date: '2024-08-05',
    },
    paymentStatus: {
      dueDate: '2024-08-05',
      paidDate: '2024-08-02',
    },
  },
  {
    id: 'PAY-2024-006',
    period: 'June 2024',
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
      date: '2024-07-04',
    },
    paymentStatus: {
      dueDate: '2024-07-05',
      paidDate: '2024-07-03',
    },
  },
  {
    id: 'PAY-2024-005',
    period: 'May 2024',
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
      date: '2024-06-05',
    },
    paymentStatus: {
      dueDate: '2024-06-05',
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

const PaymentsPage = () => {
  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Card className="flex flex-row items-center gap-8 rounded-3xl px-12 py-5 shadow-2xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 p-4">
            <Users2
              className="shrink-0 text-purple-300"
              fill="var(--color-purple-300)"
            />
          </div>
          <div>
            <h4 className="text-muted-foreground">Total Overriders</h4>
            <p className="text-lg text-purple-500 lg:text-xl">0</p>
          </div>
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
