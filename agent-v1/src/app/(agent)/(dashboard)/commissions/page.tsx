'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table'
import { PaymentHistory } from '@/types/agent/payments'
import { usePaymentsHistory, usePaymentSummary } from '@/app/data/queries/payments'
import { cn } from '@/lib/utils'
import { ShoppingCart, DollarSign, TrendingUp, Receipt, Percent } from 'lucide-react'
import { StatCard } from '@/components/ui/design-system'

// ─── Payment History Columns ──────────────────────────────────────────────────

const PAYMENT_HISTORY_COLUMNS: ColumnDef<PaymentHistory>[] = [
  {
    accessorKey: 'transaction.merchant_transaction_id',
    header: 'Payment ID',
    cell: ({ row }) => {
      // Use merchant_transaction_id from transaction object
      const paymentId = row.original.transaction?.merchant_transaction_id
      
      return (
        <p className="text-muted-foreground font-medium">
          {paymentId && paymentId.trim() !== '' ? paymentId : 'N/A'}
        </p>
      )
    },
  },
  {
    accessorKey: 'product.name',
    header: 'Product',
    cell: ({ row }) => {
      const productName = row.original.product?.name
      const providerName = row.original.provider?.name
      return (
        <div>
          <p className="font-medium">
            {productName && productName.trim() !== '' ? productName : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            {providerName && providerName.trim() !== '' ? providerName : 'N/A'}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: 'total_net_premium',
    header: 'Net Premium',
    cell: ({ row }) => {
      const netPremium = row.original.total_net_premium
      if (!netPremium || netPremium === '0' || netPremium === '0.00') {
        return <p className="font-semibold">0.00</p>
      }
      const numericAmount = typeof netPremium === 'string' ? parseFloat(netPremium) : netPremium
      if (isNaN(numericAmount)) {
        return <p className="font-semibold">0.00</p>
      }
      return (
        <p className="font-semibold">
          {numericAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      )
    },
  },
  {
    accessorKey: 'gross_commission',
    header: 'Gross Commission',
    cell: ({ row }) => {
      const grossCommission = row.original.gross_commission
      if (!grossCommission || grossCommission === '0' || grossCommission === '0.00') {
        return <p className="font-semibold">0.00</p>
      }
      const numericAmount = typeof grossCommission === 'string' ? parseFloat(grossCommission) : grossCommission
      if (isNaN(numericAmount)) {
        return <p className="font-semibold">0.00</p>
      }
      return (
        <p className="font-semibold">
          {numericAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      )
    },
  },
  {
    accessorKey: 'vat_amount',
    header: 'VAT',
    cell: ({ row }) => {
      const vat = row.original.vat_amount
      const vatPercentage = row.original.vat_percentage
      if (!vat || vat === '0' || vat === '0.00') {
        return (
          <div>
            <p className="font-semibold">0.00</p>
            <p className="text-xs text-muted-foreground">0%</p>
          </div>
        )
      }
      const numericAmount = typeof vat === 'string' ? parseFloat(vat) : vat
      if (isNaN(numericAmount)) {
        return (
          <div>
            <p className="font-semibold">0.00</p>
            <p className="text-xs text-muted-foreground">0%</p>
          </div>
        )
      }
      return (
        <div>
          <p className="font-semibold">
            {numericAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground">{vatPercentage || '0'}%</p>
        </div>
      )
    },
  },
  {
    accessorKey: 'withholding_tax_amount',
    header: 'WHT',
    cell: ({ row }) => {
      const wht = row.original.withholding_tax_amount
      const whtPercentage = row.original.withholding_tax_percentage
      if (!wht || wht === '0' || wht === '0.00') {
        return (
          <div>
            <p className="font-semibold">0.00</p>
            <p className="text-xs text-muted-foreground">0%</p>
          </div>
        )
      }
      const numericAmount = typeof wht === 'string' ? parseFloat(wht) : wht
      if (isNaN(numericAmount)) {
        return (
          <div>
            <p className="font-semibold">0.00</p>
            <p className="text-xs text-muted-foreground">0%</p>
          </div>
        )
      }
      return (
        <div>
          <p className="font-semibold">
            {numericAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground">{whtPercentage || '0'}%</p>
        </div>
      )
    },
  },
  {
    accessorKey: 'agent_commission',
    header: 'Net Commission',
    cell: ({ row }) => {
      const netCommission = row.original.agent_commission
      if (!netCommission || netCommission === '0' || netCommission === '0.00') {
        return <p className="font-semibold text-green-600">0.00</p>
      }
      const numericAmount = typeof netCommission === 'string' ? parseFloat(netCommission) : netCommission
      if (isNaN(numericAmount)) {
        return <p className="font-semibold text-green-600">0.00</p>
      }
      return (
        <p className="font-semibold text-green-600">
          {numericAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created Date',
    cell: ({ row }) => {
      const createdAt = row.original.created_at
      if (!createdAt) {
        return <p className="text-sm">N/A</p>
      }
      try {
        const date = new Date(createdAt)
        if (isNaN(date.getTime())) {
          return <p className="text-sm">N/A</p>
        }
        return (
          <p className="text-sm">
            {date.toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )
      } catch (error) {
        return <p className="text-sm">N/A</p>
      }
    },
  },
]

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      ) : paymentSummaryError ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error loading commission summary</p>
          <p className="text-sm text-muted-foreground">{paymentSummaryError.message}</p>
        </div>
      ) : isPaymentSummaryFetched && paymentSummary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl">
          <StatCard title="Cases" value={String(paymentSummary.total_cases || '0')} subtitle="Total transactions" icon={ShoppingCart} colorIdx={0} />
          <StatCard title="Sales" value={`₱${paymentSummary.total_net_premium || '0.00'}`} subtitle="Net premium total" icon={DollarSign} colorIdx={1} />
          <StatCard title="My Commissions" value={`₱${paymentSummary.total_net_commission || '0.00'}`} subtitle="Net commission earned" icon={TrendingUp} colorIdx={2} />
          <StatCard title="VAT" value={`₱${paymentSummary.total_vat_amount || '0.00'}`} subtitle="Value added tax" icon={Receipt} colorIdx={3} />
          <StatCard title="WHT" value={`₱${paymentSummary.total_withholding_tax || '0.00'}`} subtitle="Withholding tax" icon={Percent} colorIdx={4} />
        </div>
      ) : null}

      {/* Commission History */}
      <div>
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
            renderMode="table"
            searchKey="product"
            searchPlaceholder="product or provider name"
            isLoading={isPaymentHistoryLoading}
            alternateColors
          />
        )}
      </div>
    </div>
  )
}

export default PaymentsPage
