'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { StatusBadge } from '@/components/line-of-business/line-of-business-data-table'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export default function LobMainContent() {
  const queryClient = useQueryClient()

  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [nameSearch, setNameSearch] = useState<string>('')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedLob, setSelectedLob] = useState<LineOfBusiness | null>(null)

  // Form state
  const [formData, setFormData] = useState<LineOfBusinessFormData>({
    name: '',
    slug: '',
    description: '',
    status: 'active',
  })

  // Fetch data
  const { data: lobData, isLoading, error } = useGetLineOfBusinessList({
    page: currentPage,
    per_page: 15,
    name: nameSearch || undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  console.log('LOB Debug:', {
    lobData,
    isLoading,
    error,
    currentPage,
    nameSearch
  })

  const lineOfBusinessList = lobData?.data?.data || []

  // Fetch agents for selected LOB
  const { data: lobAgentsData, isLoading: isLoadingAgents, refetch: refetchLobAgents } = useGetLobAgents(
    selectedLob?.id || 0
  )
  const lobAgents = lobAgentsData?.data?.agents || []
  const totalAgents = lobAgentsData?.data?.total_agents || 0

  // Mutations
  const createMutation = useCreateLineOfBusiness()
  const updateMutation = useUpdateLineOfBusiness()
  const deleteMutation = useDeleteLineOfBusiness()

  // Refetch agents when details dialog opens
  useEffect(() => {
    if (detailsDialogOpen && selectedLob?.id) {
      refetchLobAgents()
    }
  }, [detailsDialogOpen, selectedLob?.id, refetchLobAgents])

  const handleRowClick = (lob: LineOfBusiness) => {
    setSelectedLob(lob)
    setDetailsDialogOpen(true)
  }

  const handleEditClick = (lob: LineOfBusiness) => {
    setSelectedLob(lob)
    setFormData({
      name: lob.name,
      slug: lob.slug || '',
      description: lob.description,
      status: lob.status as 'active' | 'inactive',
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
      slug: '',
      description: '',
      status: 'active',
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
    <div className="relative z-10 min-h-[400px] rounded-tl-none rounded-tr-3xl rounded-b-3xl border border-t-0 p-4 shadow-sm sm:min-h-[500px] sm:p-6 md:p-8 lg:min-h-screen">
      {/* Section Header */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">Line of Business</h2>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Manage and organize all lines of business for easy assignment and
            monitoring.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64 md:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
            </div>
            <input
              type="text"
              placeholder="Search line of business..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="block w-full rounded-full border border-gray-300 bg-white py-2 pr-10 pl-9 text-sm leading-5 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none sm:py-2.5 sm:pl-10"
            />
          </div>
          <button
            onClick={handleCreateClick}
            className="flex w-full items-center justify-center rounded-full border border-transparent bg-green-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New LOB
          </button>
        </div>
      </div>

      {/* Cards Grid Container */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-red-500 text-lg mb-2">Error loading line of business</p>
            <p className="text-gray-500 text-sm">{error.message || 'Please try refreshing the page'}</p>
          </div>
        ) : lineOfBusinessList.length > 0 ? (
          lineOfBusinessList.map((lob) => (
            <div
              key={lob.id}
              onClick={() => handleRowClick(lob)}
              className="flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-shadow duration-200 hover:shadow-md sm:rounded-2xl sm:p-5"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-base font-bold sm:text-lg">
                  {lob.name}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold sm:px-3 ${
                    lob.status.toLowerCase() === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {lob.status.toUpperCase()}
                </span>
              </div>

              <p className="mb-3 line-clamp-2 text-xs text-gray-600 sm:mb-4 sm:text-sm">
                {lob.description}
              </p>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">
                  Created: {new Date(lob.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-gray-500">
              {nameSearch
                ? 'No line of business found matching your search'
                : 'No line of business available'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {lobData?.data && lobData.data.last_page > 1 && (
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600">
            Showing {lobData.data.from || 0} to {lobData.data.to || 0} of{' '}
            {lobData.data.total || 0} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-full"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: lobData.data.last_page }, (_, i) => i + 1)
                .filter((page) => {
                  const current = currentPage
                  return (
                    page === 1 ||
                    page === lobData.data.last_page ||
                    (page >= current - 1 && page <= current + 1)
                  )
                })
                .map((page, index, array) => (
                  <>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span key={`ellipsis-${page}`} className="px-2">
                        ...
                      </span>
                    )}
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-full p-0 ${
                        currentPage === page
                          ? 'bg-green-600 hover:bg-green-700'
                          : ''
                      }`}
                    >
                      {page}
                    </Button>
                  </>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(lobData.data.last_page, prev + 1)
                )
              }
              disabled={currentPage === lobData.data.last_page}
              className="rounded-full"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent
          className="flex max-h-[90vh] max-w-2xl flex-col p-0"
          showCloseButton={false}
        >
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Create Line of Business</DialogTitle>
            <DialogDescription>
              Add a new line of business to the system
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="Enter slug (e.g., travel-insurance)"
                  required
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
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="rounded-full bg-green-600 hover:bg-green-700"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent
          className="flex max-h-[90vh] max-w-2xl flex-col p-0"
          showCloseButton={false}
        >
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Update Line of Business</DialogTitle>
            <DialogDescription>
              Update the line of business information
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="update-name">Name</Label>
                <Input
                  id="update-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-slug">Slug</Label>
                <Input
                  id="update-slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="Enter slug (e.g., travel-insurance)"
                  required
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
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="rounded-full bg-green-600 hover:bg-green-700"
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
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent
          className="flex max-h-[90vh] max-w-2xl flex-col p-0"
          showCloseButton={false}
        >
          <DialogHeader className="border-b px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-lg font-bold sm:text-xl">
                {selectedLob?.name}
              </DialogTitle>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold sm:px-3 ${
                  selectedLob?.status.toLowerCase() === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                {selectedLob?.status.toUpperCase()}
              </span>
            </div>
            <DialogDescription className="text-xs text-gray-600 sm:text-sm">
              Line of business details and assigned agents
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
            <div className="space-y-4 sm:space-y-6">
              {/* Slug */}
              <div>
                <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
                  Slug
                </h3>
                <p className="text-sm text-gray-700 sm:text-base">
                  {selectedLob?.slug || '-'}
                </p>
              </div>

              {/* Description */}
              <div>
                <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
                  Description
                </h3>
                <p className="text-sm text-gray-700 sm:text-base">
                  {selectedLob?.description || '-'}
                </p>
              </div>

              {/* Created Date */}
              <div>
                <h3 className="mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">
                  Created At
                </h3>
                <p className="text-sm sm:text-base">
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
                </p>
              </div>

              {/* Assigned Agents */}
              <div>
                <h3 className="mb-2 text-xs font-semibold text-gray-700 sm:mb-3 sm:text-sm">
                  Assigned Agents ({totalAgents})
                </h3>
                {isLoadingAgents ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Loading agents...
                  </div>
                ) : lobAgents && lobAgents.length > 0 ? (
                  <div className="max-h-[250px] space-y-2 overflow-y-auto sm:max-h-[300px]">
                    {lobAgents.map((agentLob: any) => (
                      <div
                        key={agentLob.id}
                        className="flex items-center gap-2 rounded-lg border p-2 sm:gap-3 sm:p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-300 text-xs font-bold sm:h-10 sm:w-10 sm:text-sm">
                          {agentLob.agent.first_name?.charAt(0).toUpperCase()}
                          {agentLob.agent.last_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium sm:text-base">
                            {agentLob.agent.first_name}{' '}
                            {agentLob.agent.last_name}
                          </p>
                          <p className="text-xs text-gray-500 sm:text-sm">
                            {agentLob.agent.email}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                            agentLob.status?.toLowerCase() === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-600'
                          }`}
                        >
                          {(agentLob.status || 'active').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic sm:text-sm">
                    No agents assigned to this line of business yet.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 border-t px-4 py-4 sm:flex-row sm:px-6">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setDetailsDialogOpen(false)
                handleEditClick(selectedLob!)
              }}
              className="w-full rounded-full sm:w-auto"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit LOB
            </Button>
            <Button
              onClick={() => setDetailsDialogOpen(false)}
              className="w-full rounded-full bg-green-600 hover:bg-green-700 sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
