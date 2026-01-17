'use client'

import { useGetAgentProducts, useGetAgents } from '@/app/data/queries/agents'
import { useSearchAgents } from '@/app/data/mutations/agents'
import {
  useGetAllAgentLineOfBusiness,
  useGetLineOfBusinessList,
} from '@/app/data/queries/line-of-business'
import {
  useAssignLobToAgent,
  useDeleteAgentLob,
} from '@/app/data/mutations/line-of-business'
import {
  AgentProduct,
  AgentProductAssignment,
  ProductCommissionInfo,
  AgentLineOfBusiness,
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
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface AgentWithLobs {
  agent: AgentProductAssignment['agent']
  lobs: AgentLineOfBusiness[]
}

interface AgentsMainContentProps {
  page?: number
  onPageReset?: () => void
  onSearchModeChange?: (isSearchMode: boolean, displayData: any) => void
}

export default function AgentsMainContent({ page = 1, onPageReset, onSearchModeChange }: AgentsMainContentProps) {
  const queryClient = useQueryClient()
  const [agentProductAssignments, setAgentProductAssignments] = useState<
    AgentProductAssignment[]
  >([])
  const [selectedAgent, setSelectedAgent] =
    useState<AgentProductAssignment | null>(null)
  const [selectedAgentLobs, setSelectedAgentLobs] = useState<
    AgentLineOfBusiness[]
  >([])
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchQueryDebounced, setSearchQueryDebounced] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)

  const { mutateAsync: searchAgents, isPending: isSearching } = useSearchAgents()

  // Debounce search query and auto-trigger search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQueryDebounced(searchQuery)
      if (searchQuery.trim()) {
        searchAgents({ searchKey: searchQuery.trim() })
          .then((result) => {
            setSearchResults(result)
            setIsSearchMode(true)
            // Notify parent about search mode change
            onSearchModeChange?.(true, result)
          })
          .catch((error) => {
            console.error('Search error:', error)
            setSearchResults(null)
            setIsSearchMode(false)
            onSearchModeChange?.(false, null)
          })
      } else {
        setSearchResults(null)
        setIsSearchMode(false)
        onSearchModeChange?.(false, null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchAgents, onSearchModeChange])

  const { data: agentProducts } = useGetAgentProducts()
  const { data: agentsData, isLoading: agentsLoading, isFetching } = useGetAgents({
    page: page,
    per_page: 12,
    status: 'active',
  })
  
  // Determine which data to display
  const displayData = isSearchMode ? searchResults : agentsData
  const isDataLoading = isSearchMode ? isSearching : isFetching || agentsLoading
  

  const { data: agentLobs, refetch: refetchAgentLobs } = useGetAllAgentLineOfBusiness()
  const { data: allLobs } = useGetLineOfBusinessList({
    page: 1,
    per_page: 100,
    status: 'active',
  })

  const assignLobMutation = useAssignLobToAgent()
  const deleteLobMutation = useDeleteAgentLob()

  useEffect(() => {
    if (agentProducts && displayData) {
      // Use agents from either search results or regular paginated data
      const allAgents = displayData.data?.data || []
      const agentCommissions = agentProducts.data.data
      
      // If no agents data, set empty array
      if (!allAgents || allAgents.length === 0) {
        setAgentProductAssignments([])
        return
      }
      
      // Create a map of agent commissions by agent_id
      const commissionMap = new Map<number, AgentProduct[]>()
      agentCommissions?.forEach((commission) => {
        const existing = commissionMap.get(Number(commission.agent.id)) || []
        existing.push(commission)
        commissionMap.set(Number(commission.agent.id), existing)
      })

      // Map all agents to AgentProductAssignment format
      const groupedData: AgentProductAssignment[] = allAgents.map((agent: any) => {
        const commissions = commissionMap.get(Number(agent.id)) || []
        
        const products: ProductCommissionInfo[] = commissions.map((commission) => ({
          product: commission.product,
          commission_rate: commission.commission_rate,
          commission_status: commission.status,
          commission_id: commission.id,
        }))

        return {
          agent: agent,
          products: products,
        }
      })

      setAgentProductAssignments(groupedData)
    }
  }, [agentProducts, displayData])

  // Update selected agent LOBs when agentLobs data changes
  useEffect(() => {
    if (selectedAgent && agentLobs?.data?.data) {
      const agentLobAssignments = agentLobs.data.data.filter(
        (lob) => lob.agent_id === selectedAgent.agent.id
      )
      setSelectedAgentLobs(agentLobAssignments)
    }
  }, [agentLobs, selectedAgent])

  const handleAgentClick = (agent: AgentProductAssignment) => {
    setSelectedAgent(agent)
    // Filter LOBs for this agent
    const agentLobAssignments =
      agentLobs?.data?.data?.filter(
        (lob) => lob.agent_id === agent.agent.id
      ) || []
    setSelectedAgentLobs(agentLobAssignments)
    setIsDetailsOpen(true)
  }

  const isLobAssigned = (lobId: number) => {
    return selectedAgentLobs.some((aLob) => aLob.lob_id === lobId)
  }

  const getAgentLobId = (lobId: number) => {
    return selectedAgentLobs.find((aLob) => aLob.lob_id === lobId)?.id
  }

  const handleToggleLob = async (lobId: number, isChecked: boolean) => {
    if (!selectedAgent) {
      console.error('No agent selected')
      return
    }

    try {
      if (isChecked) {
        // Assign LOB
        await assignLobMutation.mutateAsync({
          agent_id: selectedAgent.agent.id,
          lob_id: lobId,
          status: 'active',
        })
        toast.success('Line of business assigned successfully')
      } else {
        // Remove LOB
        const agentLobId = getAgentLobId(lobId)
        if (agentLobId) {
          await deleteLobMutation.mutateAsync(agentLobId)
          toast.success('Line of business removed successfully')
        } else {
          console.error('Agent LOB ID not found')
        }
      }

      // Refresh data
      await refetchAgentLobs()
    } catch (error) {
      console.error('Error toggling LOB:', error)
      toast.error(
        isChecked
          ? 'Failed to assign line of business'
          : 'Failed to remove line of business'
      )
    }
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64 md:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
            </div>
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-full border border-gray-300 bg-white py-2 pr-10 pl-9 text-sm leading-5 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none sm:py-2.5 sm:pl-10"
            />
          </div>
        </div>
      </div>

      {isSearchMode && (
        <div className="text-muted-foreground mb-4 text-sm">
          Showing search results for "{searchQuery}" - Found{' '}
          {agentProductAssignments.length} result(s)
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {isDataLoading ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-gray-500">{isSearching ? 'Searching...' : 'Loading agents...'}</p>
          </div>
        ) : agentProductAssignments.length > 0 ? (
          agentProductAssignments.map((agentAssignment) => (
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
                {agentAssignment.agent.status.toUpperCase()}
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
                Lines of Business:
              </span>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const agentLobAssignments =
                    agentLobs?.data?.data?.filter(
                      (lob) => lob.agent_id === agentAssignment.agent.id
                    ) || []
                  return agentLobAssignments.length > 0 ? (
                    <>
                      {agentLobAssignments.slice(0, 2).map((lob) => (
                        <span
                          key={lob.id}
                          className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 sm:px-3"
                        >
                          {lob.line_of_business.name}
                        </span>
                      ))}
                      {agentLobAssignments.length > 2 && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 sm:px-3">
                          +{agentLobAssignments.length - 2} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      No assignments
                    </span>
                  )
                })()}
              </div>
            </div>
          </div>
        ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? 'No agents found matching your search'
                : 'No agents available'}
            </p>
          </div>
        )}
      </div>

      {/* Agent Details Dialog */}
      <AlertDialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <AlertDialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0">
          <AlertDialogHeader className="border-b px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <AlertDialogTitle className="text-lg font-bold sm:text-xl">
                {selectedAgent?.agent.first_name}{' '}
                {selectedAgent?.agent.middle_name ?? ''}{' '}
                {selectedAgent?.agent.last_name}
              </AlertDialogTitle>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold sm:px-3 ${
                  selectedAgent?.agent.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-50 text-red-500'
                }`}
              >
                {selectedAgent?.agent.status.toUpperCase()}
              </span>
            </div>
            <AlertDialogDescription className="text-xs text-gray-600 sm:text-sm">
              View comprehensive information about the agent and their assigned
              products.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedAgent && (
            <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
              <div className="space-y-4 sm:space-y-6">
                {/* Agent Information */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-gray-700 sm:mb-4 sm:text-sm">
                    Agent Information
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Agent ID</Label>
                      <div className="text-sm font-medium sm:text-base">
                        AGT{String(selectedAgent.agent.id).padStart(3, '0')}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Email</Label>
                      <div className="text-sm font-medium break-all sm:text-base">
                        {selectedAgent.agent.email}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">
                        Phone Number
                      </Label>
                      <div className="text-sm font-medium sm:text-base">
                        {selectedAgent.agent.phone ?? '-'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Address</Label>
                      <div className="text-sm font-medium break-words sm:text-base">
                        {selectedAgent.agent.address ?? '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manage LOB Assignments */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-gray-700 sm:mb-4 sm:text-sm">
                    Manage Line of Business Assignments
                  </h3>
                  {allLobs?.data?.data && allLobs.data.data.length > 0 ? (
                    <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border p-3 sm:max-h-[350px] sm:p-4">
                      {allLobs.data.data.map((lob) => {
                        const isAssigned = isLobAssigned(lob.id)
                        const isLoading =
                          assignLobMutation.isPending ||
                          deleteLobMutation.isPending
                        
                        return (
                          <div
                            key={lob.id}
                            className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                          >
                            <Checkbox
                              id={`lob-${lob.id}`}
                              checked={isAssigned}
                              onCheckedChange={(checked) =>
                                handleToggleLob(lob.id, checked as boolean)
                              }
                              disabled={isLoading}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`lob-${lob.id}`}
                                className="flex cursor-pointer flex-col gap-1"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold sm:text-base">
                                    {lob.name}
                                  </span>
                                  {isAssigned && (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                      Assigned
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 sm:text-sm">
                                  {lob.description}
                                </p>
                              </label>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic sm:text-sm">
                      No lines of business available
                    </p>
                  )}
                </div>

                {/* Summary of Assigned LOBs */}
                {selectedAgentLobs.length > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
                    <h4 className="mb-2 text-xs font-semibold text-green-800 sm:text-sm">
                      Currently Assigned ({selectedAgentLobs.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgentLobs.map((agentLob) => (
                        <span
                          key={agentLob.id}
                          className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 sm:px-3"
                        >
                          {agentLob.line_of_business.name}
                          <span className="text-green-500">
                            • {new Date(agentLob.created_at).toLocaleDateString()}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter className="border-t px-4 py-4 sm:px-6">
            <AlertDialogCancel
              onClick={() => setIsDetailsOpen(false)}
              className="w-full rounded-full bg-green-600 text-white hover:bg-green-700 hover:text-white sm:w-auto"
            >
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
