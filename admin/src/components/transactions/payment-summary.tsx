import { Card, CardContent } from '@/components/ui/card'

interface PaymentSummaryCardProps {
  title: string
  value: string
}

interface PaymentSummaryProps {
  totalPayments: number
  totalAmount: number
  paid: number
  pending: number
  failed: number
  avgProcessing: number
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
  totalPayments,
  totalAmount,
  paid,
  pending,
  failed,
  avgProcessing,
}: PaymentSummaryProps) {
  return (
    <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
      <PaymentSummaryCard title="Total Payments" value={`${totalPayments}`} />
      <PaymentSummaryCard
        title="Total Amount"
        value={`P ${totalAmount.toFixed(2)}`}
      />
      <PaymentSummaryCard title="Paid" value={`P ${paid.toFixed(2)}`} />
      <PaymentSummaryCard title="Pending" value={`P ${pending.toFixed(2)}`} />
      <PaymentSummaryCard title="Failed" value={`P ${failed.toFixed(2)}`} />
      <PaymentSummaryCard
        title="Avg Processing"
        value={avgProcessing.toPrecision(2)}
      />
    </div>
  )
}
