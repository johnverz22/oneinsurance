'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPHPAmount } from '@/utils/formatter'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Commission } from '@/types/commission'

interface CommissionBreakdownDialogProps {
  commission: Commission
  onClose: () => void
}

const CommissionBreakdownDialog = ({
  commission,
  onClose,
}: CommissionBreakdownDialogProps) => {
  const commissionRate = {
    personal_sales: 0.08,
    overriders: 0.06,
    referrals: 0.05,
  }

  const source = commission.source ?? 'personal_sales'
  const rate = commissionRate[source] * 100

  const statusColors = {
    Paid: { bg: 'bg-green-100', text: 'text-green-800' },
    Approved: { bg: 'bg-blue-100', text: 'text-blue-800' },
    Pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  }

  const statusColor = statusColors[commission.status]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Commission Breakdown</DialogTitle>
          <DialogDescription>
            {format(commission.paidOn, 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {/* Status Badge */}
        <div className="mb-4 flex justify-center">
          <Badge
            className={`${statusColor.bg} ${statusColor.text} font-semibold`}
          >
            {commission.status.charAt(0).toUpperCase() +
              commission.status.slice(1)}
          </Badge>
        </div>

        {/* Commission Details */}
        <div className="space-y-4">
          {/* Source Details */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground mb-1 text-sm">
              Commission Source
            </p>
            <p className="font-semibold">{commission.sourceDetails}</p>
          </div>

          {/* Policy Amount */}
          <div className="border-muted-foreground/20 flex items-center justify-between border-b pb-3">
            <span className="text-muted-foreground text-sm">Policy Amount</span>
            <span className="font-semibold">
              {formatPHPAmount(commission.amount)}
            </span>
          </div>

          {/* Commission Calculation */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Commission Calculation</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-semibold">{rate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Gross Commission (8% × Policy Amount)
              </span>
              <span className="font-semibold text-green-600">
                {formatPHPAmount(commission.grossCommission)}
              </span>
            </div>
          </div>

          {/* Deductions */}
          <div className="border-muted-foreground/20 space-y-2 border-t pt-2">
            <p className="text-sm font-medium">Deductions</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Administrative Fee</span>
              <span className="font-semibold text-red-600">
                -{formatPHPAmount(commission.deductions)}
              </span>
            </div>
          </div>

          {/* Net Commission */}
          <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <p className="text-muted-foreground mb-1 text-sm">Net Commission</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatPHPAmount(commission.netCommission)}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              This is the amount that will be credited to your account
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-muted-foreground bg-muted/30 mt-4 rounded p-3 text-xs">
          <p className="mb-1 font-semibold">Commission ID: {commission.id}</p>
          <p>
            Commissions are processed within 5-7 business days after approval.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CommissionBreakdownDialog
