'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentHistory } from '@/types/agent/payments'
import { cn } from '@/lib/utils'
import { formatPHPAmount } from '@/utils/formatter'

type PaymentHistoryCardProps = {
  history: PaymentHistory
}

export const PaymentHistoryCard = ({ history }: PaymentHistoryCardProps) => {
  const gross = history.grossCommission
  const deductions = history.overriderDeduction
  const net = history.netPayment
  const status = history.status

  return (
    <Card className="rounded-2xl border shadow-xs">
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{history.id}</h3>
            <p className="text-muted-foreground text-sm">
              {history.period} • {history.salesCount} sales
            </p>
          </div>

          <Badge
            className={cn(
              'px-6 py-1',
              status === 'Paid'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white'
            )}
          >
            {status}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="border-muted-foreground/10 rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">Gross Commission</p>
            <h3 className="text-xl font-semibold text-blue-500">
              {formatPHPAmount(gross.total)}
            </h3>

            <div className="text-muted-foreground mt-2 space-y-1 text-xs">
              {gross.breakdown.map((b, i) => (
                <p key={i}>
                  {b.label}: {formatPHPAmount(b.amount)}
                </p>
              ))}
            </div>
          </div>

          <div className="border-muted-foreground/10 rounded-xl border bg-red-500/5 p-4">
            <p className="text-muted-foreground text-sm">
              Overrider Deductions
            </p>
            <h3 className="text-xl font-semibold text-red-600">
              - {formatPHPAmount(deductions.total)}
            </h3>

            <div className="text-muted-foreground mt-2 space-y-1 text-xs">
              {deductions.breakdown.map((d, i) => (
                <p key={i}>
                  {d.label}: {formatPHPAmount(d.amount)}
                </p>
              ))}
            </div>
          </div>

          <div className="border-muted-foreground/10 rounded-xl border bg-green-600/5 p-4">
            <div className="text-muted-foreground text-sm">Net Payment</div>
            <div className="text-xl font-semibold text-green-600">
              {formatPHPAmount(net.amount)}
            </div>

            <div className="text-muted-foreground mt-2 text-xs">
              Method: {net.method}
              <br />
              Date: {net.date}
            </div>
          </div>

          <div className="bg-muted border-muted-foreground/10 rounded-xl border p-4">
            <div className="text-muted-foreground text-sm">Payment Status</div>

            <div className="mt-2 space-y-1 text-sm">
              <p>Due Date: {history.paymentStatus.dueDate}</p>

              {history.paymentStatus.paidDate && (
                <p>Paid: {history.paymentStatus.paidDate}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button className="bg-blue-600 text-white">View Details</Button>
          <Button variant="outline">Download Receipt</Button>
        </div>
      </CardContent>
    </Card>
  )
}
