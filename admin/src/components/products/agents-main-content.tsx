'use client'

import { useGetAgentProducts } from '@/app/data/queries/agents'
import {
  AgentProduct,
  AgentProductAssignment,
  ProductCommissionInfo,
} from '@/types/agents'
import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AgentsMainContent() {
  const [agentProductAssignments, setAgentProductAssignments] = useState<
    AgentProductAssignment[]
  >([])
  const [selectedAgent, setSelectedAgent] =
    useState<AgentProductAssignment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const { data: agentProducts } = useGetAgentProducts()

  useEffect(() => {
    if (agentProducts) {
      const groupedData = groupByAgent(agentProducts.data.data)
      setAgentProductAssignments(groupedData)
    }
  }, [agentProducts])

  const handleAgentClick = (agent: AgentProductAssignment) => {
    setSelectedAgent(agent)
    setIsDetailsOpen(true)
  }

  return (
    <div className="relative z-10 -mt-[1px] min-h-[400px] rounded-tl-none rounded-tr-3xl rounded-b-3xl border border-t-0 p-4 shadow-sm sm:min-h-[500px] sm:p-6 md:p-8 lg:min-h-[600px]">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">Agents & Teams</h2>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Manage product assignments across your agents and teams to
            streamline operations.
          </p>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {agentProductAssignments.map((agentAssignment) => (
          <div
            key={agentAssignment.agent.id}
            onClick={() => handleAgentClick(agentAssignment)}
            className="flex h-full cursor-pointer flex-col rounded-xl border p-4 transition-shadow duration-200 hover:shadow-md sm:rounded-2xl sm:p-6"
          >
            {/* Header: Name + Status */}
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-base font-bold sm:text-lg">
                {agentAssignment.agent.first_name}{' '}
                {agentAssignment.agent.middle_name ?? ''}{' '}
                {agentAssignment.agent.last_name}
              </h3>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold sm:px-3 ${
                  agentAssignment.agent.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-50 text-red-500'
                }`}
              >
                {agentAssignment.agent.status}
              </span>
            </div>

            {/* Email */}
            <p className="mb-3 truncate text-xs font-normal text-gray-400 sm:text-sm">
              {agentAssignment.agent.email}
            </p>

            {/* Role / Location / Commission Row */}
            {/* <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold">
                {agentAssignment.agent.role}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>{agentAssignment.agent.address}</span>
              <span className="hidden sm:inline">•</span>
              <span>
                Commission: {agentAssignment.products[0]?.commission_rate}%
              </span>
            </div> */}

            {/* Assigned Products Section */}
            <div className="mt-auto flex flex-col items-start gap-2 sm:flex-row sm:gap-3">
              <span className="text-xs font-medium whitespace-nowrap sm:text-sm">
                Assigned to:
              </span>
              <div className="flex flex-wrap gap-2">
                {agentAssignment.products.length > 0 ? (
                  <>
                    {agentAssignment.products.slice(0, 2).map((prod, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 sm:px-3"
                      >
                        {prod.product.name}
                      </span>
                    ))}
                    {agentAssignment.products.length > 2 && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 sm:px-3">
                        +{agentAssignment.products.length - 2} more
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    No assignments
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Details Dialog */}
      <AlertDialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <AlertDialogContent className="max-h-[90vh] max-w-[95vw] overflow-hidden sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl">
          <AlertDialogHeader className="border-b pb-3 sm:pb-4">
            <div className="flex items-center justify-between gap-2">
              <AlertDialogTitle className="text-lg font-bold sm:text-xl md:text-2xl">
                Agent Details
              </AlertDialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailsOpen(false)}
                className="h-6 w-6 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm">
              View comprehensive information about the agent and their assigned
              products.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedAgent && (
            <ScrollArea className="max-h-[60vh] sm:max-h-[65vh] md:max-h-[70vh]">
              <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
                {/* Agent Information */}
                <div>
                  <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
                    Agent Information
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Agent ID:</Label>
                      <div className="text-sm font-medium sm:text-base">
                        AGT{String(selectedAgent.agent.id).padStart(3, '0')}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Name:</Label>
                      <div className="text-sm font-medium break-words sm:text-base">
                        {selectedAgent.agent.first_name}{' '}
                        {selectedAgent.agent.middle_name ?? ''}{' '}
                        {selectedAgent.agent.last_name}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Email:</Label>
                      <div className="text-sm font-medium break-all sm:text-base">
                        {selectedAgent.agent.email}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">
                        Phone Number:
                      </Label>
                      <div className="text-sm font-medium sm:text-base">
                        {selectedAgent.agent.phone ?? '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Status:</Label>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold sm:px-3 ${
                            selectedAgent.agent.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-50 text-red-500'
                          }`}
                        >
                          {selectedAgent.agent.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Address:</Label>
                      <div className="text-sm font-medium break-words sm:text-base">
                        {selectedAgent.agent.address ?? '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Products */}
                <div>
                  <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
                    Assigned Products ({selectedAgent.products.length})
                  </h3>
                  {selectedAgent.products.length > 0 ? (
                    <div className="space-y-3">
                      {selectedAgent.products.map((prod, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border p-3 transition-shadow hover:shadow-sm sm:p-4"
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                            <div>
                              <Label className="text-xs text-gray-500">
                                Product Name:
                              </Label>
                              <div className="text-sm font-semibold break-words text-blue-600 sm:text-base">
                                {prod.product.name}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                Provider:
                              </Label>
                              <div className="text-sm font-medium break-words sm:text-base">
                                {prod.product.provider.name}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                Commission Rate:
                              </Label>
                              <div className="text-sm font-medium sm:text-base">
                                {prod.commission_rate}%
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                Commission Status:
                              </Label>
                              <div>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                    prod.commission_status === 'active'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {prod.commission_status}
                                </span>
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-xs text-gray-500">
                                Description:
                              </Label>
                              <div className="text-xs text-gray-600 sm:text-sm">
                                {prod.product.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center sm:p-8">
                      <p className="text-xs text-gray-400 sm:text-sm">
                        No products assigned to this agent.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}

          <AlertDialogFooter className="border-t pt-3 sm:pt-4">
            <AlertDialogCancel
              onClick={() => setIsDetailsOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function groupByAgent(
  agentCommissions: AgentProduct[]
): AgentProductAssignment[] {
  // Group commissions by agent_id
  const agentMap = new Map<number, AgentProduct[]>()

  agentCommissions.forEach((commission) => {
    const existing = agentMap.get(Number(commission.agent.id)) || []
    existing.push(commission)
    agentMap.set(Number(commission.agent.id), existing)
  })

  // Transform to output format
  const result: AgentProductAssignment[] = []

  agentMap.forEach((commissions, agentId) => {
    // Get the agent object (same for all commissions)
    const agent = commissions[0].agent

    // Create products array with commission info
    const products: ProductCommissionInfo[] = commissions.map((commission) => ({
      product: {
        id: commission.product.id,
        provider_id: commission.product.provider_id,
        name: commission.product.name,
        description: commission.product.description,
        status: commission.product.status,
        price: commission.product.price,
        created_at: commission.product.created_at,
        updated_at: commission.product.updated_at,
        deleted_at: commission.product.deleted_at,
        provider: commission.product.provider,
      },
      commission_rate: commission.commission_rate,
      commission_status: commission.status,
      commission_id: commission.id,
    }))

    result.push({
      agent: agent,
      products: products,
    })
  })

  return result
}
