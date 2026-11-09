'use client'

import { useState, useMemo } from 'react'
import {
  useGetLineOfBusinessList,
  useGetAllAgentLineOfBusiness,
} from '@/app/data/queries/line-of-business'
import {
  useAssignLobToAgent,
  useUpdateAgentLob,
  useDeleteAgentLob,
} from '@/app/data/mutations/line-of-business'
import { AgentLineOfBusiness, AssignLobAgentRequest } from '@/types/agents'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/line-of-business/line-of-business-data-table'
import { AgentLobDataTable } from '@/components/line-of-business/agent-lob-data-table'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/use-debounce'
import { useGetAgents } from '@/app/data/queries/agents'

export default function AgentLobsPage() {
  const queryClient = useQueryClient()

  // State
  const [agentLobPage, setAgentLobPage] = useState(1)
  const [agentLobStatusFilter, setAgentLobStatusFilter] =
    useState<string>('all')
  const [agentLobSortBy, setAgentLobSortBy] = useState<
    'created_at' | 'name' | 'status'
  >('created_at')
  const [agentLobSortOrder, setAgentLobSortOrder] = useState<'asc' | 'desc'>(
    'desc'
  )
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>()
  const [selectedLobId, setSelectedLobId] = useState<number | undefined>()
  const [agentSearchTerm, setAgentSearchTerm] = useState('')
  const [lobSearchTerm, setLobSearchTerm] = useState('')
  const debouncedAgentSearch = useDebounce(agentSearchTerm, 300)
  const debouncedLobSearch = useDebounce(lobSearchTerm, 300)

  // Dialog states
  const [assignAgentLobDialogOpen, setAssignAgentLobDialogOpen] =
    useState(false)
  const [updateAgentLobDialogOpen, setUpdateAgentLobDialogOpen] =
    useState(false)
  const [deleteAgentLobDialogOpen, setDeleteAgentLobDialogOpen] =
    useState(false)
  const [selectedAgentLob, setSelectedAgentLob] =
    useState<AgentLineOfBusiness | null>(null)

  // Form state
  const [agentLobFormData, setAgentLobFormData] =
    useState<AssignLobAgentRequest>({
      agent_id: 0,
      lob_id: 0,
      status: 'active',
    })

  // Fetch agent LOB data
  const { data: agentLobData, isLoading: isLoadingAgentLob } =
    useGetAllAgentLineOfBusiness({
      page: agentLobPage,
      per_page: 15,
      status:
        agentLobStatusFilter !== 'all'
          ? (agentLobStatusFilter as 'active' | 'inactive')
          : undefined,
      agent_id: selectedAgentId,
      lob_id: selectedLobId,
      sort_by: agentLobSortBy,
      sort_order: agentLobSortOrder,
    })

  const agentLobList = agentLobData?.data?.data || []

  // Fetch agents for dropdown
  const { data: agentsData } = useGetAgents({
    search: debouncedAgentSearch,
    per_page: 20,
  })
  const agents = agentsData?.data?.data || []

  // Fetch LOBs for dropdown
  const { data: lobsForDropdown } = useGetLineOfBusinessList({
    name: debouncedLobSearch || undefined,
    per_page: 20,
  })
  const lobsForSelection = lobsForDropdown?.data?.data || []

  // Fetch all LOBs for filter
  const { data: allLobsData } = useGetLineOfBusinessList({
    per_page: 100,
  })
  const allLobs = allLobsData?.data?.data || []

  // Mutations
  const assignAgentLobMutation = useAssignLobToAgent()
  const updateAgentLobMutation = useUpdateAgentLob()
  const deleteAgentLobMutation = useDeleteAgentLob()

  // Define columns for Agent LOB table
  const agentLobColumns = useMemo<ColumnDef<AgentLineOfBusiness, any>[]>(
    () => [
      {
        accessorKey: 'agent',
        header: 'Agent',
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.agent?.first_name || ''}{' '}
            {row.original.agent?.last_name || ''}
            <div className="text-sm text-gray-500">
              {row.original.agent?.email || '-'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'line_of_business',
        header: 'Line of Business',
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.line_of_business?.name || '-'}
            <div className="text-sm text-gray-500">
              {row.original.line_of_business?.description || '-'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'created_at',
        header: 'Assigned At',
        cell: ({ row }) => (
          <div className="text-gray-600">
            {new Date(row.original.created_at).toLocaleDateString()}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditAgentLobClick(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteAgentLobClick(row.original)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  // Agent LOB handlers
  const handleAssignAgentLobClick = () => {
    setAgentLobFormData({
      agent_id: 0,
      lob_id: 0,
      status: 'active',
    })
    setAssignAgentLobDialogOpen(true)
  }

  const handleEditAgentLobClick = (agentLob: AgentLineOfBusiness) => {
    setSelectedAgentLob(agentLob)
    setAgentLobFormData({
      agent_id: agentLob.agent_id,
      lob_id: agentLob.lob_id,
      status: agentLob.status as 'active' | 'inactive',
    })
    setUpdateAgentLobDialogOpen(true)
  }

  const handleDeleteAgentLobClick = (agentLob: AgentLineOfBusiness) => {
    setSelectedAgentLob(agentLob)
    setDeleteAgentLobDialogOpen(true)
  }

  const handleAssignAgentLob = async () => {
    if (!agentLobFormData.agent_id || !agentLobFormData.lob_id) {
      toast.error('Please select both agent and line of business')
      return
    }
    try {
      await assignAgentLobMutation.mutateAsync(agentLobFormData)
      toast.success('Agent assigned to line of business successfully')
      setAssignAgentLobDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['all-agent-lobs'] })
    } catch (error) {
      toast.error('Failed to assign agent to line of business')
    }
  }

  const handleUpdateAgentLob = async () => {
    if (!selectedAgentLob) return
    try {
      await updateAgentLobMutation.mutateAsync({
        agentLobId: selectedAgentLob.id,
        data: agentLobFormData,
      })
      toast.success('Agent LOB assignment updated successfully')
      setUpdateAgentLobDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['all-agent-lobs'] })
    } catch (error) {
      toast.error('Failed to update agent LOB assignment')
    }
  }

  const handleDeleteAgentLob = async () => {
    if (!selectedAgentLob) return
    try {
      await deleteAgentLobMutation.mutateAsync(selectedAgentLob.id)
      toast.success('Agent LOB assignment deleted successfully')
      setDeleteAgentLobDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['all-agent-lobs'] })
    } catch (error) {
      toast.error('Failed to delete agent LOB assignment')
    }
  }

  return (
    <div>
      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1">
            {/* Status Filter */}
            <Select
              value={agentLobStatusFilter}
              onValueChange={setAgentLobStatusFilter}
            >
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Agent Filter */}
            <Select
              value={selectedAgentId?.toString() || 'all'}
              onValueChange={(value) =>
                setSelectedAgentId(value === 'all' ? undefined : Number(value))
              }
            >
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.first_name} {agent.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* LOB Filter */}
            <Select
              value={selectedLobId?.toString() || 'all'}
              onValueChange={(value) =>
                setSelectedLobId(value === 'all' ? undefined : Number(value))
              }
            >
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filter by LOB" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LOBs</SelectItem>
                {allLobs.map((lob) => (
                  <SelectItem key={lob.id} value={lob.id.toString()}>
                    {lob.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select
              value={agentLobSortBy}
              onValueChange={(value: any) => setAgentLobSortBy(value)}
            >
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Assigned At</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={agentLobSortOrder}
              onValueChange={(value: any) => setAgentLobSortOrder(value)}
            >
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAssignAgentLobClick}
            className="w-full gap-2 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Assign Agent
          </Button>
        </div>
      </div>

      {/* Agent LOB Data Table */}
      <AgentLobDataTable
        columns={agentLobColumns}
        data={agentLobList}
        currentPage={agentLobData?.data?.current_page}
        totalPages={agentLobData?.data?.last_page}
        totalRecords={agentLobData?.data?.total}
        onPageChange={(page) => setAgentLobPage(page)}
      />

      {/* Assign Agent LOB Dialog */}
      <Dialog
        open={assignAgentLobDialogOpen}
        onOpenChange={setAssignAgentLobDialogOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Agent to Line of Business</DialogTitle>
            <DialogDescription>
              Assign an agent to a line of business
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent">Agent</Label>
              <Select
                value={agentLobFormData.agent_id?.toString() || ''}
                onValueChange={(value) =>
                  setAgentLobFormData({
                    ...agentLobFormData,
                    agent_id: Number(value),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search agents..."
                      value={agentSearchTerm}
                      onChange={(e) => setAgentSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.first_name} {agent.last_name} - {agent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lob">Line of Business</Label>
              <Select
                value={agentLobFormData.lob_id?.toString() || ''}
                onValueChange={(value) =>
                  setAgentLobFormData({
                    ...agentLobFormData,
                    lob_id: Number(value),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select line of business" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search LOB..."
                      value={lobSearchTerm}
                      onChange={(e) => setLobSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {lobsForSelection.map((lob) => (
                    <SelectItem key={lob.id} value={lob.id.toString()}>
                      {lob.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={agentLobFormData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setAgentLobFormData({ ...agentLobFormData, status: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setAssignAgentLobDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAgentLob}
              disabled={assignAgentLobMutation.isPending}
              className="w-full sm:w-auto"
            >
              {assignAgentLobMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Agent LOB Dialog */}
      <Dialog
        open={updateAgentLobDialogOpen}
        onOpenChange={setUpdateAgentLobDialogOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Agent LOB Assignment</DialogTitle>
            <DialogDescription>
              Update the agent LOB assignment details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="update-agent">Agent</Label>
              <Select
                value={agentLobFormData.agent_id?.toString() || ''}
                onValueChange={(value) =>
                  setAgentLobFormData({
                    ...agentLobFormData,
                    agent_id: Number(value),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.first_name} {agent.last_name} - {agent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-lob">Line of Business</Label>
              <Select
                value={agentLobFormData.lob_id?.toString() || ''}
                onValueChange={(value) =>
                  setAgentLobFormData({
                    ...agentLobFormData,
                    lob_id: Number(value),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select line of business" />
                </SelectTrigger>
                <SelectContent>
                  {lobsForSelection.map((lob) => (
                    <SelectItem key={lob.id} value={lob.id.toString()}>
                      {lob.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-status">Status</Label>
              <Select
                value={agentLobFormData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setAgentLobFormData({ ...agentLobFormData, status: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setUpdateAgentLobDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAgentLob}
              disabled={updateAgentLobMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateAgentLobMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Agent LOB Alert Dialog */}
      <AlertDialog
        open={deleteAgentLobDialogOpen}
        onOpenChange={setDeleteAgentLobDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will remove the assignment of{' '}
              {selectedAgentLob?.agent?.first_name}{' '}
              {selectedAgentLob?.agent?.last_name} from{' '}
              {selectedAgentLob?.line_of_business?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgentLob}
              disabled={deleteAgentLobMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteAgentLobMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
