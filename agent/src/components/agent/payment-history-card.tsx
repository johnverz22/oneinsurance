'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PaymentHistory } from '@/types/agent/payments'
import { cn } from '@/lib/utils'
import { formatPHPAmount } from '@/utils/formatter'
import { format } from 'date-fns'

type PaymentHistoryCardProps = {
  history: PaymentHistory
}

export const PaymentHistoryCard = ({ history }: PaymentHistoryCardProps) => {
  const isIncludedInPayout = history.is_included_in_payout

  return (
    <Card className="rounded-2xl border shadow-none">
      <CardContent className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{history.product.name}</h3>
            <p className="text-muted-foreground text-sm">
              {history.provider.name}
            </p>
          </div>

          {/* Badge temporarily hidden */}
          {/* <Badge
            className={cn(
              'px-3 py-1',
              isIncludedInPayout
                ? 'bg-green-600 text-white'
                : 'bg-yellow-500 text-white'
            )}
          >
            {isIncludedInPayout ? 'Included in Payout' : 'Pending'}
          </Badge> */}
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">Net Commission</p>
            <p className="text-xl font-bold text-green-600">
              PHP {history.net_commission}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">Gross Commission</p>
            <p className="text-sm font-medium">
              PHP {history.gross_commission}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">Commission Rate</p>
            <p className="text-sm font-medium">{history.commission_rate}%</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">Case Count</p>
            <p className="text-sm font-medium">{history.case_count}</p>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">Product Price</p>
            <p className="text-sm font-medium">PHP {history.product_price}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">
              VAT ({history.vat_percentage}%)
            </p>
            <p className="text-sm font-medium">PHP {history.vat_amount}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-sm">
              Withholding Tax ({history.withholding_tax_percentage}%)
            </p>
            <p className="text-sm font-medium">
              PHP {history.withholding_tax_amount}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>
            Created on {format(new Date(history.created_at), 'MMM dd, yyyy')}
          </span>

          {history.payout_id && <span>Payout Ref: {history.payout_id}</span>}

          {history.notes && (
            <span className="italic">Notes: {history.notes}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
