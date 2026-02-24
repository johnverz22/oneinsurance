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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useGetAgents } from '@/app/data/queries/agents'
import { useGetCommissionLogs } from '@/app/data/queries/commission-logs'
import { useCreatePayout } from '@/app/data/mutations/payouts'
import type { Agent } from '@/types/agents'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  const [payoutType, setPayoutType] = React.useState<string>('')
  const [paymentMethod, setPaymentMethod] = React.useState<string>('')

  const createPayoutMutation = useCreatePayout()

  // Debounce agent search input
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
      : undefined
  )

  // Fetch commission logs for selected agent (unpaid commissions only)
  const {
    data: commissionLogsResponse,
    isLoading: isLoadingCommissions,
  } = useGetCommissionLogs(
    selectedAgent
      ? {
          agent_id: selectedAgent.id,
          is_included_in_payout: false,
          per_page: 100,
        }
      : undefined
  )

  const agents = agentsResponse?.data?.data ?? []
  const commissionLogs = commissionLogsResponse?.data?.data ?? []

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    const fullName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim()
    setAgentSearch(fullName || agent.email)
    setIsAgentDropdownOpen(false)
  }

  // Calculate total payout from commission logs
  const totalPayout = commissionLogs.reduce(
    (sum, log) => sum + (parseFloat(log.net_commission) || 0),
    0
  )

  const handleSubmit = async () => {
    // Validation
    if (!selectedAgent) {
      toast.error('Please select an agent')
      return
    }

    if (!payoutMonth) {
      toast.error('Please select a payout month')
      return
    }

    if (!payoutType) {
      toast.error('Please select a payout type')
      return
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    if (commissionLogs.length === 0) {
      toast.error('No unpaid commissions found for this agent')
      return
    }

    try {
      // Create payout with commission logs
      await createPayoutMutation.mutateAsync({
        agent_id: selectedAgent.id,
        payout_amount: totalPayout,
        payout_type: payoutType,
        payment_method: paymentMethod,
        payout_date: format(payoutMonth, 'yyyy-MM-dd'),
        commission_log_ids: commissionLogs.map(log => log.id),
        notes: `Payout for ${commissionLogs.length} commission(s)`,
      })

      toast.success('Payout approved and released successfully!')
      onOpenChange(false)
      
      // Reset form
      setSelectedAgent(null)
      setAgentSearch('')
      setPayoutMonth(undefined)
      setPayoutType('')
      setPaymentMethod('')
    } catch (error) {
      console.error('Error creating payout:', error)
      toast.error('Failed to create payout. Please try again.')
    }
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
                      setSelectedAgent(null)
                      setIsAgentDropdownOpen(true)
                    }}
                    onFocus={() => {
                      setIsAgentDropdownOpen(true)
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsAgentDropdownOpen(false), 200)
                    }}
                  />
                  {isAgentDropdownOpen && (
                    <div className="bg-popover absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-md">
                      {isAgentsLoading ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Searching agents...
                        </div>
                      ) : agents.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {agentSearch ? 'No agents found.' : 'Start typing to search agents...'}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal rounded-full',
                        !payoutMonth && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {payoutMonth ? (
                        format(payoutMonth, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={payoutMonth}
                      onSelect={setPayoutMonth}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout-type">Payout Type</Label>
                <Select value={payoutType} onValueChange={setPayoutType}>
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
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
            {isLoadingCommissions ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading commission logs...
              </div>
            ) : commissionLogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {selectedAgent
                  ? 'No unpaid commissions found for this agent.'
                  : 'Select an agent to view commission logs.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Premium Amount</TableHead>
                    <TableHead>Commission %</TableHead>
                    <TableHead>Commission Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.transaction?.merchant_transaction_id || 'N/A'}
                      </TableCell>
                      <TableCell>{log.product?.name || 'N/A'}</TableCell>
                      <TableCell>
                        ₱ {(parseFloat(log.product_price) || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{parseFloat(log.commission_rate) || 0}%</TableCell>
                      <TableCell>
                        ₱ {(parseFloat(log.net_commission) || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Total Payout */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-lg font-semibold">Total Payout</div>
            <div className="text-2xl font-bold text-blue-600">
              ₱ {totalPayout.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={createPayoutMutation.isPending}
              className="w-full rounded-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
            >
              {createPayoutMutation.isPending ? 'Processing...' : 'Approve and Release Payout'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
