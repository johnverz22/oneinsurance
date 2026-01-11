'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProcessPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProcessPaymentDialog({
  open,
  onOpenChange,
}: ProcessPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-full">
        <DialogHeader className="relative border-b pb-4">
          <DialogTitle className="text-2xl font-semibold">Payout</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payout Period & Agent Section */}
          <div>
            <h3 className="mb-4 text-base font-semibold">
              Payout Period & Agent
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                <Input
                  id="agent"
                  placeholder="Search Agent..."
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout-month">Payout Month</Label>
                <div className="relative">
                  <Input
                    id="payout-month"
                    placeholder="MM/DD/YYYY"
                    className="rounded-full pr-10"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout-type">Payout Type</Label>
                <Select>
                  <SelectTrigger
                    id="payout-type"
                    className="rounded-full"
                  >
                    <SelectValue placeholder="Select Payout Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="incentive">Incentive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select>
                  <SelectTrigger
                    id="payment-method"
                    className="rounded-full"
                  >
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="paymaya">PayMaya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Commission Breakdown Section */}
          <div className="rounded-lg border bg-gray-50 p-6">
            <h3 className="mb-4 text-base font-semibold">
              Commission Breakdown
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Premium Amount</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Commission Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>LI-10239</TableCell>
                  <TableCell>Life Insurance</TableCell>
                  <TableCell>₱ 25,000</TableCell>
                  <TableCell>10%</TableCell>
                  <TableCell>₱ 2,500</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>TI-10229</TableCell>
                  <TableCell>Travel Insurance</TableCell>
                  <TableCell>₱ 18,000</TableCell>
                  <TableCell>8%</TableCell>
                  <TableCell>₱ 1,480</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Total Payout */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-lg font-semibold">Total Payout</div>
            <div className="text-2xl font-bold text-blue-600">₱ 3,980.00</div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button className="w-full rounded-full bg-green-600 text-white hover:bg-green-700 sm:w-auto">
              Approve and Release Payout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
