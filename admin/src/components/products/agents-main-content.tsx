'use client'

import { useGetAgentProducts } from '@/app/data/queries/agents'
import {
  AgentProduct,
  AgentProductAssignment,
  ProductCommissionInfo,
} from '@/types/agents'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PendingApplicants from './pending-applicants'
import Interviews from './interviews'

export default function AgentsMainContent() {
  const [agentProductAssignments, setAgentProductAssignments] = useState<
    AgentProductAssignment[]
  >([])

  const { data: agentProducts } = useGetAgentProducts()

  useEffect(() => {
    if (agentProducts) {
      const groupedData = groupByAgent(agentProducts.data.data)
      setAgentProductAssignments(groupedData)
    }
  }, [agentProducts])

  return (
    <div className="relative z-10 -mt-[1px] min-h-[600px] rounded-tl-none rounded-tr-3xl rounded-b-3xl border border-t-0 p-6 shadow-sm md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-bold">Agents & Teams</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage product assignments across your agents and teams to
            streamline operations.
          </p>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {agentProductAssignments.map((agentAssignment) => (
          <div
            key={agentAssignment.agent.id}
            className="flex h-full flex-col rounded-2xl border p-6 transition-shadow duration-200 hover:shadow-md"
          >
            {/* Header: Name + Status */}
            <div className="mb-1 flex items-start justify-between">
              <h3 className="text-lg font-bold">
                {agentAssignment.agent.first_name}{' '}
                {agentAssignment.agent.middle_name ?? ''}{' '}
                {agentAssignment.agent.last_name}
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  agentAssignment.agent.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-50 text-red-500'
                }`}
              >
                {agentAssignment.agent.status}
              </span>
            </div>

            {/* Email */}
            <p className="mb-3 text-sm font-normal text-gray-400">
              {agentAssignment.agent.email}
            </p>

            {/* Role / Location / Commission Row */}
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold">
                {agentAssignment.agent.role}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>{agentAssignment.agent.address}</span>
              <span className="hidden sm:inline">•</span>
              <span>
                Commission: {agentAssignment.products[0]?.commission_rate}%
              </span>
            </div>

            {/* Assigned Products Section */}
            <div className="mt-auto flex items-start gap-3 sm:items-center">
              <span className="pt-1 text-sm font-medium whitespace-nowrap sm:pt-0">
                Assigned to:
              </span>
              <div className="flex gap-2 overflow-hidden">
                {agentAssignment.products.length > 0 ? (
                  agentAssignment.products.map((prod, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                    >
                      {prod.product.name}
                    </span>
                  ))
                ) : (
                  <span className="pt-1 text-xs text-gray-400 italic sm:pt-0">
                    No assignments
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
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
