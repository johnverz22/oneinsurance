import { DollarSign, Clock, CheckCircle, CreditCard, Wallet, TrendingDown } from 'lucide-react'
import { StatCard, StatCardsGrid } from '@/components/ui/design-system'
import type { StatColorIndex } from '@/components/ui/design-system'

interface PaymentSummaryProps {
  totalPayouts: number
  totalAmount: number
  pendingCount: number
  completedCount: number
  pendingAmount: number
  completedAmount: number
}

export default function PaymentSummary({
  totalPayouts,
  totalAmount,
  pendingCount,
  completedCount,
  pendingAmount,
  completedAmount,
}: PaymentSummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        title="Total Payouts"
        value={`${totalPayouts}`}
        icon={CreditCard}
        colorIdx={0}
      />
      <StatCard
        title="Total Amount"
        value={`₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={DollarSign}
        colorIdx={1}
      />
      <StatCard
        title="Pending Count"
        value={`${pendingCount}`}
        icon={Clock}
        colorIdx={3}
      />
      <StatCard
        title="Completed Count"
        value={`${completedCount}`}
        icon={CheckCircle}
        colorIdx={2}
      />
      <StatCard
        title="Pending Amount"
        value={`₱${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={Wallet}
        colorIdx={3}
      />
      <StatCard
        title="Completed Amount"
        value={`₱${completedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={TrendingDown}
        colorIdx={2}
      />
    </div>
  )
}
