'use client'

import { useState, useMemo } from 'react'
import {
  useGetLineOfBusinessList,
  useGetLobAgents,
} from '@/app/data/queries/line-of-business'
import {
  useCreateLineOfBusiness,
  useUpdateLineOfBusiness,
  useDeleteLineOfBusiness,
} from '@/app/data/mutations/line-of-business'
import {
  LineOfBusiness,
  LineOfBusinessFormData,
} from '@/types/line-of-business'
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  LineOfBusinessDataTable,
  StatusBadge,
} from '@/components/line-of-business/line-of-business-data-table'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export default function LobsPage() {
  const queryClient = useQueryClient()

  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [nameSearch, setNameSearch] = useState<string>('')
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'status'>(
    'created_at'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedLob, setSelectedLob] = useState<LineOfBusiness | null>(null)

  // Form state
  const [formData, setFormData] = useState<LineOfBusinessFormData>({
    name: '',
    description: '',
    status: 'active',
    slug: '',
  })

  // Fetch data
  const { data: lobData, isLoading } = useGetLineOfBusinessList({
    page: currentPage,
    per_page: 15,
    status:
      statusFilter !== 'all'
        ? (statusFilter as 'active' | 'inactive')
        : undefined,
    name: nameSearch || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  })

  const lineOfBusinessList = lobData?.data?.data || []

  // Fetch agents for selected LOB
  const { data: lobAgentsData, isLoading: isLoadingAgents } = useGetLobAgents(
    selectedLob?.id || 0
  )
  const lobAgents = lobAgentsData?.data?.agents || []
  const totalAgents = lobAgentsData?.data?.total_agents || 0

  // Mutations
  const createMutation = useCreateLineOfBusiness()
  const updateMutation = useUpdateLineOfBusiness()
  const deleteMutation = useDeleteLineOfBusiness()

  // Define columns
  const columns = useMemo<ColumnDef<LineOfBusiness, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div
            className="cursor-pointer font-medium hover:text-blue-600"
            onClick={() => handleRowClick(row.original)}
          >
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div
            className="max-w-md cursor-pointer truncate text-gray-600"
            onClick={() => handleRowClick(row.original)}
          >
            {row.original.description}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div onClick={() => handleRowClick(row.original)}>
            <StatusBadge status={row.original.status} />
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => (
          <div
            className="cursor-pointer text-gray-600"
            onClick={() => handleRowClick(row.original)}
          >
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
              onClick={() => handleEditClick(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteClick(row.original)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const handleRowClick = (lob: LineOfBusiness) => {
    setSelectedLob(lob)
    setDetailsDialogOpen(true)
  }

  const handleEditClick = (lob: LineOfBusiness) => {
    setSelectedLob(lob)
    setFormData({
      name: lob.name,
      description: lob.description,
      status: lob.status as 'active' | 'inactive',
      slug: lob.slug || '',
    })
    setUpdateDialogOpen(true)
  }

  const handleDeleteClick = (lob: LineOfBusiness) => {
    setSelectedLob(lob)
    setDeleteDialogOpen(true)
  }

  const handleCreateClick = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
      slug: '',
    })
    setCreateDialogOpen(true)
  }

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData)
      toast.success('Line of business created successfully')
      setCreateDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['line-of-business'] })
    } catch (error) {
      toast.error('Failed to create line of business')
    }
  }

  const handleUpdate = async () => {
    if (!selectedLob) return
    try {
      await updateMutation.mutateAsync({
        lobId: selectedLob.id,
        data: formData,
      })
      toast.success('Line of business updated successfully')
      setUpdateDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['line-of-business'] })
    } catch (error) {
      toast.error('Failed to update line of business')
    }
  }

  const handleDelete = async () => {
    if (!selectedLob) return
    try {
      await deleteMutation.mutateAsync(selectedLob.id)
      toast.success('Line of business deleted successfully')
      setDeleteDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['line-of-business'] })
    } catch (error) {
      toast.error('Failed to delete line of business')
    }
  }

  return (
    <div>
      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-1">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Name Search */}
            <Input
              placeholder="Search by name..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="w-full lg:max-w-xs"
            />

            {/* Sort By */}
            <Select
              value={sortBy}
              onValueChange={(value: any) => setSortBy(value)}
            >
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created At</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={sortOrder}
              onValueChange={(value: any) => setSortOrder(value)}
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
            onClick={handleCreateClick}
            className="w-full gap-2 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <LineOfBusinessDataTable
        columns={columns}
        data={lineOfBusinessList}
        currentPage={lobData?.data?.current_page}
        totalPages={lobData?.data?.last_page}
        totalRecords={lobData?.data?.total}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Line of Business</DialogTitle>
            <DialogDescription>
              Add a new line of business to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
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
              onClick={() => setCreateDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Line of Business</DialogTitle>
            <DialogDescription>
              Update the line of business information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="update-name">Name</Label>
              <Input
                id="update-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-description">Description</Label>
              <Textarea
                id="update-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
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
              onClick={() => setUpdateDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              line of business "{selectedLob?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedLob?.name}</DialogTitle>
            <DialogDescription>
              Line of business details and assigned agents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* LOB Information */}
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="font-semibold">Information</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedLob?.status || ''} />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Created At</Label>
                  <div className="mt-1">
                    {selectedLob?.created_at
                      ? new Date(selectedLob.created_at).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )
                      : '-'}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Description</Label>
                <p className="mt-1 text-gray-700">
                  {selectedLob?.description || '-'}
                </p>
              </div>
            </div>

            {/* Assigned Agents */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Assigned Agents ({totalAgents})
                </h3>
              </div>
              {isLoadingAgents ? (
                <div className="py-8 text-center text-gray-500">
                  Loading agents...
                </div>
              ) : lobAgents && lobAgents.length > 0 ? (
                <div className="space-y-2">
                  {lobAgents.map((agentLob: any) => (
                    <div
                      key={agentLob.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                          {agentLob.agent.first_name?.charAt(0).toUpperCase()}
                          {agentLob.agent.last_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {agentLob.agent.first_name}{' '}
                            {agentLob.agent.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {agentLob.agent.email}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={agentLob.status || 'active'} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No agents assigned to this line of business yet.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
