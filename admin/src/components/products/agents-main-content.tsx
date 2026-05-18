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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Search, Pencil } from 'lucide-react'
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
  

  const { data: agentLobs, refetch: refetchAgentLobs } = useGetAllAgentLineOfBusiness({
    per_page: 1000, // Fetch all agent LOB assignments
  })
  
  // Log the raw agentLobs data
  useEffect(() => {
    if (agentLobs) {
      console.log('Raw agentLobs data:', agentLobs)
      console.log('agentLobs.data?.data:', agentLobs.data?.data)
    }
  }, [agentLobs])
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
      console.log('useEffect triggered - updating selectedAgentLobs')
      console.log('agentLobs.data.data:', agentLobs.data.data)
      console.log('selectedAgent.agent.id:', selectedAgent.agent.id)
      
      const agentLobAssignments = agentLobs.data.data.filter(
        (lob) => lob.agent_id === selectedAgent.agent.id
      )
      
      console.log('Filtered agentLobAssignments:', agentLobAssignments)
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
    console.log('isLobAssigned check:', { 
      lobId, 
      lobIdType: typeof lobId,
      selectedAgentLobs: selectedAgentLobs.map(aLob => ({
        id: aLob.id,
        lob_id: aLob.lob_id,
        lob_id_type: typeof aLob.lob_id,
        matches: aLob.lob_id === lobId,
        strictMatch: aLob.lob_id === lobId,
        looseMatch: aLob.lob_id == lobId,
      }))
    })
    const assigned = selectedAgentLobs.some((aLob) => aLob.lob_id === lobId)
    console.log('Result:', assigned)
    return assigned
  }

  const getAgentLobId = (lobId: number) => {
    return selectedAgentLobs.find((aLob) => aLob.lob_id === lobId)?.id
  }

  const handleToggleLob = async (lobId: number, isChecked: boolean) => {
    if (!selectedAgent) {
      console.error('No agent selected')
      return
    }

    console.log('Toggle LOB:', { lobId, isChecked, agentId: selectedAgent.agent.id })

    try {
      if (isChecked) {
        // Assign LOB
        console.log('Assigning LOB:', { agent_id: selectedAgent.agent.id, lob_id: lobId, status: 'active' })
        const result = await assignLobMutation.mutateAsync({
          agent_id: selectedAgent.agent.id,
          lob_id: lobId,
          status: 'active',
        })
        console.log('Assignment result:', result)
        toast.success('Line of business assigned successfully')
      } else {
        // Remove LOB
        const agentLobId = getAgentLobId(lobId)
        console.log('Removing LOB:', { agentLobId, lobId })
        if (agentLobId) {
          const result = await deleteLobMutation.mutateAsync(agentLobId)
          console.log('Removal result:', result)
          toast.success('Line of business removed successfully')
        } else {
          console.error('Agent LOB ID not found')
        }
      }

      // The query will be automatically invalidated by the mutation's onSuccess
      // Just refetch to get the latest data
      console.log('Refetching agent LOBs...')
      const refetchResult = await refetchAgentLobs()
      console.log('Refetch result:', refetchResult)
    } catch (error: any) {
      console.error('Error toggling LOB:', error)
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        toast.error('This agent is already assigned to this line of business')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error(
          isChecked
            ? 'Failed to assign line of business'
            : 'Failed to remove line of business'
        )
      }
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
          Showing search results for "{searchQuery}" — Found{' '}
          {agentProductAssignments.length} result(s)
        </div>
      )}

      {/* Agents Data Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Agent Code</TableHead>
              <TableHead className="font-semibold text-gray-700">Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Lines of Business</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isDataLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-gray-500">
                  {isSearching ? 'Searching...' : 'Loading agents...'}
                </TableCell>
              </TableRow>
            ) : agentProductAssignments.length > 0 ? (
              agentProductAssignments.map((agentAssignment) => {
                const agentLobAssignments = agentLobs?.data?.data?.filter(
                  (lob) => lob.agent_id === agentAssignment.agent.id
                ) || []
                return (
                  <TableRow
                    key={agentAssignment.agent.id}
                    className="hover:bg-gray-50"
                  >
                    <TableCell className="font-mono text-sm text-gray-600">
                      {agentAssignment.agent.settings?.code
                        ? agentAssignment.agent.settings.code.toUpperCase()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {agentAssignment.agent.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {agentLobAssignments.length > 0 ? (
                          <>
                            {agentLobAssignments.slice(0, 3).map((lob) => (
                              <span
                                key={lob.id}
                                className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                              >
                                {lob.line_of_business.name}
                              </span>
                            ))}
                            {agentLobAssignments.length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                +{agentLobAssignments.length - 3} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No assignments</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        agentAssignment.agent.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-50 text-red-500'
                      }`}>
                        {agentAssignment.agent.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleAgentClick(agentAssignment)}
                        className="inline-flex items-center justify-center rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Manage agent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-gray-500">
                  {searchQuery ? 'No agents found matching your search' : 'No agents available'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
                        {selectedAgent.agent.settings?.code
                          ? selectedAgent.agent.settings.code.toUpperCase()
                          : '-'}
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
                        
                        console.log('LOB:', { id: lob.id, name: lob.name, isAssigned })
                        
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
              className="w-full rounded-full from-primary to-lilac bg-gradient-to-r text-white hover:opacity-90 hover:text-white sm:w-auto"
            >
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
