import { Card, CardContent } from '@/components/ui/card'

interface PaymentSummaryCardProps {
  title: string
  value: string
}

interface PaymentSummaryProps {
  totalPayouts: number
  totalAmount: number
  pendingCount: number
  completedCount: number
  pendingAmount: number
  completedAmount: number
}

function PaymentSummaryCard({ title, value }: PaymentSummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 text-center">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
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
    <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
      <PaymentSummaryCard title="Total Payouts" value={`${totalPayouts}`} />
      <PaymentSummaryCard
        title="Total Amount"
        value={`₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      />
      <PaymentSummaryCard title="Pending Count" value={`${pendingCount}`} />
      <PaymentSummaryCard title="Completed Count" value={`${completedCount}`} />
      <PaymentSummaryCard
        title="Pending Amount"
        value={`₱${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      />
      <PaymentSummaryCard
        title="Completed Amount"
        value={`₱${completedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      />
    </div>
  )
}
