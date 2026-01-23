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
import { X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { useGetAgents } from '@/app/data/queries/agents'
import type { Agent } from '@/types/agents'

interface ProcessPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProcessPaymentDialog({
  open,
  onOpenChange,
}: ProcessPaymentDialogProps) {
  const [agentSearch, setAgentSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [selectedAgent, setSelectedAgent] = React.useState<Agent | null>(null)
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = React.useState(false)
  const [payoutMonth, setPayoutMonth] = React.useState<Date | undefined>()

  // Debounce agent search input so we don't spam the API
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(agentSearch.trim())
    }, 300)

    return () => clearTimeout(handler)
  }, [agentSearch])

  const {
    data: agentsResponse,
    isLoading: isAgentsLoading,
  } = useGetAgents(
    debouncedSearch
      ? {
          search: debouncedSearch,
          per_page: 10,
        }
      : {
          per_page: 10,
        }
  )

  const agents = agentsResponse?.data?.data ?? []

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setAgentSearch(`${agent.first_name} ${agent.last_name}`)
    setIsAgentDropdownOpen(false)
  }

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
                <div className="relative">
                  <Input
                    id="agent"
                    placeholder="Search Agent..."
                    className="rounded-full"
                    value={agentSearch}
                    onChange={(e) => {
                      setAgentSearch(e.target.value)
                      setIsAgentDropdownOpen(true)
                    }}
                    onFocus={() => {
                      if (agents.length > 0) {
                        setIsAgentDropdownOpen(true)
                      }
                    }}
                  />
                  {isAgentDropdownOpen && agentSearch && (
                    <div className="bg-popover absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-md">
                      {isAgentsLoading ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Searching agents...
                        </div>
                      ) : agents.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No agents found.
                        </div>
                      ) : (
                        agents.map((agent) => (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => handleSelectAgent(agent)}
                            className="hover:bg-accent flex w-full items-start gap-2 px-3 py-2 text-left text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {agent.first_name} {agent.last_name}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {agent.email}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout-month">Payout Month</Label>
                <DateTimePicker
                  variant="date"
                  mode="single"
                  value={payoutMonth}
                  onChange={(date) => setPayoutMonth(date as Date)}
                />
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
