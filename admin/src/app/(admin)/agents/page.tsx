'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Trash,
  Edit2,
  Check,
  X,
  ArrowUpRight,
} from 'lucide-react'
import {
  DataTable,
  DataTableAction,
  createSortableHeader,
  exportToCSV,
} from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useGetAgents } from '@/app/data/queries/agents'
import { useSearchAgents } from '@/app/data/mutations/agents'
import { useRouter } from 'next/navigation'
import { Agent, AgentsResponse } from '@/types/agents'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActivateAgent, useDeleteAgent } from '@/app/data/mutations/agents'
import { useUpdateAgent } from '@/app/data/mutations/agents'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import { removeLocalStorage } from '@/utils/remove-session-storage'

export default function AgentsPage() {
  const [page, setPage] = useState<number>(1)
  const {
    data: agentsData,
    isFetching,
    isLoading,
    error,
    refetch,
  } = useGetAgents(page)
  const deleteMutation = useDeleteAgent()
  const activateMutation = useActivateAgent()
  const [isDeleting, setIsDeleting] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const [authChecking, setAuthChecking] = useState(true)
  const [searchKey, setSearchKey] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AgentsResponse | null>(
    null
  )

  const { mutateAsync: searchAgents, isPending: isSearching } =
    useSearchAgents()

  useEffect(() => {
    // Small delay to let zustand persist/hydrate and avoid redirect flicker
    const t = setTimeout(() => {
      setAuthChecking(false)
      if (!isAuthenticated) {
        window.location.href = '/login'
        window.location.href = '/login'
      }
    }, 250)

    return () => clearTimeout(t)
  }, [isAuthenticated])

  const columns = React.useMemo<ColumnDef<Agent, any>[]>(
    () => [
      {
        accessorKey: 'first_name',
        header: ({ column }) => createSortableHeader('Agent', column),
        cell: ({ row }) => {
          const a = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar>
                {a.avatar ? (
                  <AvatarImage
                    src={a.avatar}
                    alt={`${a.first_name} ${a.last_name}`}
                  />
                ) : (
                  <AvatarFallback>
                    {a.first_name.charAt(0)}
                    {a.last_name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="font-medium">
                  {a.first_name} {a.last_name}
                </div>
                <div className="text-muted-foreground text-xs">
                  @
                  {a.username ??
                    `${a.first_name.toLowerCase()}.${a.last_name.toLowerCase()}`}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'email',
        header: ({ column }) => createSortableHeader('Email', column),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
      },
      {
        accessorKey: 'designation',
        header: 'Designation',
      },
      {
        accessorKey: 'address',
        header: 'Address',
      },
      {
        accessorKey: 'status',
        header: ({ column }) => createSortableHeader('Status', column),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              row.original.status === 'active'
                ? 'bg-green-100 text-green-800'
                : row.original.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
    ],
    []
  )

  // actions are now available inside the details dialog on row click

  const actions: DataTableAction<Agent>[] = [
    {
      label: 'Activate',
      icon: <Check className="h-4 w-4" />,
      onClick: (agent) => handleActivateClick(agent),
      variant: 'default',
    },
    {
      label: 'Update',
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (agent: Agent) => handleUpdateClick(agent),
    },
    {
      label: 'Delete',
      icon: <Trash className="h-4 w-4" />,
      onClick: (agent) => handleDeleteClick(agent),
      variant: 'destructive',
    },
  ]

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedToView, setSelectedToView] = useState<Agent | null>(null)
  const [isActivateOpen, setIsActivateOpen] = useState(false)
  const [selectedToActivate, setSelectedToActivate] = useState<Agent | null>(
    null
  )
  const [isActivating, setIsActivating] = useState(false)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [selectedToUpdate, setSelectedToUpdate] = useState<Agent | null>(null)
  const [updatePayload, setUpdatePayload] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    designation: 'Agent',
  })
  const updateMutation = useUpdateAgent()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)

  function handleRowClick(agent: Agent) {
    setSelectedToView(agent)
    setIsDetailsOpen(true)
  }

  function handleDeleteClick(agent: Agent) {
    setSelectedAgent(agent)
    setIsDeleteOpen(true)
  }

  function handleActivateClick(agent: Agent) {
    if (agent.status === 'active') {
      toast.info('Agent is already active')
      return
    }

    setSelectedToActivate(agent)
    setIsActivateOpen(true)
  }

  function handleUpdateClick(agent: Agent) {
    if (agent.status !== 'active') {
      toast.error('Only active agents can be updated')
      return
    }

    setSelectedToUpdate(agent)
    setUpdatePayload({
      first_name: agent.first_name,
      last_name: agent.last_name,
      phone: agent.phone ?? '',
      designation: 'Agent',
    })
    setIsUpdateOpen(true)
  }

  async function handleConfirmDelete() {
    // Determine the current active page from the agents response links (if present)
    const links = agentsData?.data?.links
    let targetPage = page

    if (links && Array.isArray(links)) {
      const activeLink = links.find((l: any) => l.active)
      if (activeLink) {
        // try parse from url
        if (activeLink.url) {
          try {
            const u = new URL(activeLink.url)
            const p = u.searchParams.get('page')
            if (p) targetPage = Number(p)
          } catch (e) {
            // ignore
          }
        }

        // fallback: try parse label (clean numbers)
        if (!targetPage && activeLink.label) {
          const cleaned = activeLink.label.replace(/[^0-9]/g, '')
          if (cleaned) targetPage = Number(cleaned)
        }
      }
    }

    try {
      setIsDeleting(true)
      const response = await deleteMutation.mutateAsync(selectedAgent!.id)
      toast.success(response?.message ?? 'Agent deleted')
      // Ensure we fetch the same page the server considers current
      setPage(targetPage)
      await refetch()
    } catch (error) {
      toast.error('Failed to delete agent. Please try again.')
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
      setSelectedAgent(null)
    }
  }

  async function handleConfirmActivate() {
    // Determine the current active page from the agents response links (if present)
    const links = agentsData?.data?.links
    let targetPage = page

    if (links && Array.isArray(links)) {
      const activeLink = links.find((l: any) => l.active)
      if (activeLink) {
        if (activeLink.url) {
          try {
            const u = new URL(activeLink.url)
            const p = u.searchParams.get('page')
            if (p) targetPage = Number(p)
          } catch (e) {
            // ignore
          }
        }

        if (!targetPage && activeLink.label) {
          const cleaned = activeLink.label.replace(/[^0-9]/g, '')
          if (cleaned) targetPage = Number(cleaned)
        }
      }
    }

    try {
      setIsActivating(true)
      const response = await activateMutation.mutateAsync(
        selectedToActivate!.id
      )
      toast.success(response?.message ?? 'Agent activated')
      setPage(targetPage)
      await refetch()
    } catch (error) {
      toast.error('Failed to activate agent. Please try again.')
    } finally {
      setIsActivating(false)
      setIsActivateOpen(false)
      setSelectedToActivate(null)
    }
  }

  async function handleConfirmUpdate() {
    // Determine current active page (reuse same logic)
    const links = agentsData?.data?.links
    let targetPage = page

    if (links && Array.isArray(links)) {
      const activeLink = links.find((l: any) => l.active)
      if (activeLink) {
        if (activeLink.url) {
          try {
            const u = new URL(activeLink.url)
            const p = u.searchParams.get('page')
            if (p) targetPage = Number(p)
          } catch (e) {
            // ignore
          }
        }

        if (!targetPage && activeLink.label) {
          const cleaned = activeLink.label.replace(/[^0-9]/g, '')
          if (cleaned) targetPage = Number(cleaned)
        }
      }
    }

    try {
      setIsUpdating(true)
      const response = await updateMutation.mutateAsync({
        agentId: selectedToUpdate!.id,
        payload: updatePayload,
      })
      toast.success(response?.message ?? 'Agent updated')
      setPage(targetPage)
      await refetch()
    } catch (e) {
      toast.error('Failed to update agent. Please try again.')
    } finally {
      setIsUpdating(false)
      setIsUpdateOpen(false)
      setSelectedToUpdate(null)
    }
  }

  async function handleSearchButtonClick(): Promise<void> {
    if (searchKey.trim() === '') {
      toast.info('Please enter the agent name to search.')
      return
    }
    const searchAgentsResult = await searchAgents({
      searchKey: searchKey.trim(),
    })
    setSearchResults(searchAgentsResult)
    setIsSearchMode(true)
  }

  function handleClearSearch(): void {
    setSearchKey('')
    setSearchQuery('')
    setIsSearchMode(false)
  }

  // Determine which data to display
  const displayData = isSearchMode ? searchResults : agentsData
  const isDataLoading = isSearchMode ? isSearching : isFetching || isLoading

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Agents</h1>
        <p className="text-muted-foreground">
          Manage agents registered in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between px-6">
            {/* <CardTitle>Agent List</CardTitle> */}
            {/* <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                New Agent
              </Button>
            </div> */}
          </div>
        </CardHeader>
        <CardContent>
          <div>
            {authChecking || isDataLoading ? (
              <div className="w-full space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-background flex items-center gap-4 rounded-md border p-3"
                  >
                    <div className="h-10 w-10">
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="w-24">
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between">
                  <div className="flex w-[50%] items-center gap-2">
                    <Input
                      value={searchKey}
                      onChange={(e) => setSearchKey(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchButtonClick()
                        }
                      }}
                      placeholder="Search agents by name, email, or phone..."
                      className="max-w-md rounded-full"
                    />
                    <Button
                      className="from-primary to-lilac rounded-full bg-gradient-to-r text-white"
                      onClick={handleSearchButtonClick}
                      disabled={!searchKey.trim()}
                    >
                      Search
                    </Button>
                    {isSearchMode && (
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={handleClearSearch}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => exportToCSV(displayData?.data.data ?? [])}
                    className="gap-2 rounded-full"
                  >
                    <ArrowUpRight />
                    Export
                  </Button>
                </div>

                {isSearchMode && (
                  <div className="text-muted-foreground mb-4 text-sm">
                    Showing search results for "{searchQuery}"
                  </div>
                )}
                <DataTable
                  columns={columns}
                  data={displayData?.data.data ?? []}
                  onRowClick={(row) => handleRowClick(row)}
                  actions={actions}
                  enableColumnVisibility={false}
                  enablePagination={false}
                />

                {/* Delete confirmation dialog */}
                {DeleteDialog(
                  isDeleteOpen,
                  setIsDeleteOpen,
                  selectedAgent,
                  handleConfirmDelete
                )}

                {/* Activate confirmation dialog */}
                {ActivateDialog(
                  isActivateOpen,
                  setIsActivateOpen,
                  selectedToActivate,
                  handleConfirmActivate,
                  isActivating
                )}

                {/* Update dialog */}
                {UpdateDialog(
                  isUpdateOpen,
                  setIsUpdateOpen,
                  selectedToUpdate,
                  updatePayload,
                  setUpdatePayload,
                  setIsSaveConfirmOpen,
                  isUpdating
                )}

                {/* Details dialog (opened when a row is clicked) */}
                {DetailsDialog(
                  isDetailsOpen,
                  setIsDetailsOpen,
                  selectedToView,
                  // reuse handlers for actions inside the dialog
                  handleActivateClick,
                  handleUpdateClick,
                  handleDeleteClick
                )}

                {/* Confirm save dialog for updates */}
                {ConfirmUpdateDialog(
                  isSaveConfirmOpen,
                  setIsSaveConfirmOpen,
                  selectedToUpdate,
                  handleConfirmUpdate,
                  isUpdating
                )}

                {/* Server-driven pagination links */}
                {!isSearchMode && (
                  <div className="mt-4 flex items-center justify-end gap-2">
                    {(() => {
                      const links = displayData?.data.links ?? []

                      // Separate prev/next from numbered pages
                      const prevLink = links.find(
                        (l: any) =>
                          l.label.includes('Previous') ||
                          l.label.includes('&laquo;')
                      )
                      const nextLink = links.find(
                        (l: any) =>
                          l.label.includes('Next') ||
                          l.label.includes('&raquo;')
                      )

                      // Get only numbered page links
                      const pageLinks = links.filter((l: any) => {
                        const cleaned = l.label.replace(/[^0-9]/g, '')
                        return cleaned !== '' && !isNaN(Number(cleaned))
                      })

                      // Find active page index
                      const activePageIndex = pageLinks.findIndex(
                        (l: any) => l.active
                      )
                      const totalPages = pageLinks.length

                      // Calculate which pages to show (5 pages max)
                      const maxPagesToShow = 5
                      let startIndex = Math.max(
                        0,
                        activePageIndex - Math.floor(maxPagesToShow / 2)
                      )
                      let endIndex = Math.min(
                        totalPages,
                        startIndex + maxPagesToShow
                      )

                      // Adjust if we're near the end
                      if (endIndex - startIndex < maxPagesToShow) {
                        startIndex = Math.max(0, endIndex - maxPagesToShow)
                      }

                      const visiblePages = pageLinks.slice(startIndex, endIndex)

                      return (
                        <>
                          {/* Previous button */}
                          {prevLink && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (prevLink.url) {
                                  try {
                                    const u = new URL(prevLink.url)
                                    const p = u.searchParams.get('page')
                                    p && setPage(Number(p))
                                  } catch (e) {}
                                }
                              }}
                              disabled={!prevLink.url}
                            >
                              «
                            </Button>
                          )}

                          {/* Page numbers */}
                          {visiblePages.map((linkObj: any, idx: number) => {
                            const { url, label: rawLabel, active } = linkObj
                            const cleanedLabel = rawLabel.replace(/[^0-9]/g, '')

                            let pageNum: number | null = null
                            try {
                              if (url) {
                                const u = new URL(url)
                                const p = u.searchParams.get('page')
                                pageNum = p ? Number(p) : null
                              }
                            } catch (e) {
                              pageNum = null
                            }

                            return (
                              <Button
                                key={`page-${cleanedLabel}-${idx}`}
                                variant={active ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => pageNum && setPage(pageNum)}
                                disabled={!url}
                              >
                                {cleanedLabel}
                              </Button>
                            )
                          })}

                          {/* Next button */}
                          {nextLink && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (nextLink.url) {
                                  try {
                                    const u = new URL(nextLink.url)
                                    const p = u.searchParams.get('page')
                                    p && setPage(Number(p))
                                  } catch (e) {}
                                }
                              }}
                              disabled={!nextLink.url}
                            >
                              »
                            </Button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
function DeleteDialog(
  isDeleteOpen: boolean,
  setIsDeleteOpen: React.Dispatch<React.SetStateAction<boolean>>,
  selectedAgent: Agent | null,
  handleConfirmDelete: () => Promise<void>
) {
  return (
    <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
      <AlertDialogContent className="max-h-[80vh] w-[90vw] sm:w-[700px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete agent</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <strong>
              {selectedAgent
                ? `${selectedAgent.first_name} ${selectedAgent.last_name}`
                : 'this agent'}
            </strong>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={async () => await handleConfirmDelete()}
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ActivateDialog(
  isActivateOpen: boolean,
  setIsActivateOpen: React.Dispatch<React.SetStateAction<boolean>>,
  selectedToActivate: Agent | null,
  handleConfirmActivate: () => Promise<void>,
  isActivating: boolean
) {
  return (
    <AlertDialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
      <AlertDialogContent className="max-h-[90vh] w-[95vw] sm:w-[700px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Activate agent</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to activate{' '}
            <strong>
              {selectedToActivate
                ? `${selectedToActivate.first_name} ${selectedToActivate.last_name}`
                : 'this agent'}
            </strong>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsActivateOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="default"
              onClick={async () => await handleConfirmActivate()}
              disabled={isActivating}
            >
              {isActivating ? 'Activating...' : 'Activate'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function UpdateDialog(
  isUpdateOpen: boolean,
  setIsUpdateOpen: React.Dispatch<React.SetStateAction<boolean>>,
  selectedToUpdate: Agent | null,
  updatePayload: { first_name: string; last_name: string; phone: string },
  setUpdatePayload: React.Dispatch<React.SetStateAction<any>>,
  setIsSaveConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>,
  isUpdating: boolean
) {
  return (
    <AlertDialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
      <AlertDialogContent className="max-h-[90vh] w-[95vw] sm:w-[700px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Update agent</AlertDialogTitle>
          <AlertDialogDescription>
            Update details for{' '}
            <strong>
              {selectedToUpdate
                ? `${selectedToUpdate.first_name} ${selectedToUpdate.last_name}`
                : 'this agent'}
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="relative h-full max-h-[64vh] pb-4">
          <div className="grid gap-2 py-2">
            <div>
              <Label>First name</Label>
              <Input
                value={updatePayload.first_name}
                onChange={(e) =>
                  setUpdatePayload({
                    ...updatePayload,
                    first_name: e.target.value,
                  })
                }
                placeholder="First name"
              />
            </div>
            <div>
              <Label>Last name</Label>
              <Input
                value={updatePayload.last_name}
                onChange={(e) =>
                  setUpdatePayload({
                    ...updatePayload,
                    last_name: e.target.value,
                  })
                }
                placeholder="Last name"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={updatePayload.phone}
                onChange={(e) =>
                  setUpdatePayload({ ...updatePayload, phone: e.target.value })
                }
                placeholder="Phone"
              />
            </div>
          </div>
        </ScrollArea>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsUpdateOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={() => setIsSaveConfirmOpen(true)}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ConfirmUpdateDialog(
  isSaveConfirmOpen: boolean,
  setIsSaveConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>,
  selectedToUpdate: Agent | null,
  handleConfirmUpdate: () => Promise<void>,
  isUpdating: boolean
) {
  return (
    <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save changes</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to save changes to{' '}
            <strong>
              {selectedToUpdate
                ? `${selectedToUpdate.first_name} ${selectedToUpdate.last_name}`
                : 'this agent'}
            </strong>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsSaveConfirmOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={async () => await handleConfirmUpdate()}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Yes, save'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DetailsDialog(
  isDetailsOpen: boolean,
  setIsDetailsOpen: React.Dispatch<React.SetStateAction<boolean>>,
  agent: Agent | null,
  handleActivateClick: (agent: Agent) => void,
  handleUpdateClick: (agent: Agent) => void,
  handleDeleteClick: (agent: Agent) => void
) {
  if (!agent) return null

  return (
    <AlertDialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Agent details</AlertDialogTitle>
          <AlertDialogDescription>
            Details for{' '}
            <strong>{`${agent.first_name} ${agent.last_name}`}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="relative h-full max-h-[70vh] pb-4">
          <div className="grid gap-2 py-2">
            <div className="flex items-center gap-4">
              <Avatar>
                {agent.avatar ? (
                  <AvatarImage src={agent.avatar} alt={`${agent.first_name}`} />
                ) : (
                  <AvatarFallback>
                    {agent.first_name?.charAt(0) ?? ''}
                    {agent.last_name?.charAt(0) ?? ''}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="font-medium">
                  {agent.first_name}{' '}
                  {agent.middle_name ? `${agent.middle_name} ` : ''}
                  {agent.last_name}
                </div>
                <div className="text-muted-foreground text-sm">
                  Username: {agent.username ?? '-'}
                </div>
                <div className="text-muted-foreground text-sm">
                  Email: {agent.email}
                </div>
                <div className="text-muted-foreground text-sm">
                  Phone: {agent.phone ?? '-'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company ID</Label>
                <div>{agent.company_id ?? '-'}</div>
              </div>
              <div>
                <Label>Designation</Label>
                <div>{agent.designation ?? '-'}</div>
              </div>
              <div className="col-span-2">
                <Label>Job description</Label>
                <div>{agent.job_description ?? '-'}</div>
              </div>
              <div>
                <Label>Phone description</Label>
                <div>{agent.phone_description ?? '-'}</div>
              </div>
              <div>
                <Label>Telephone</Label>
                <div>{agent.telephone ?? '-'}</div>
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <div>{agent.address ?? '-'}</div>
              </div>
              <div>
                <Label>Is super admin</Label>
                <div>{agent.is_super_admin ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <Label>Birth date</Label>
                <div>{agent.birth_date ?? '-'}</div>
              </div>
              <div>
                <Label>Status</Label>
                <div>{agent.status}</div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <AlertDialogFooter className="z-10">
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                onClick={() => handleActivateClick(agent)}
              >
                {agent.status === 'active' ? 'Activated' : 'Activate'}
              </Button>
              <Button onClick={() => handleUpdateClick(agent)}>Update</Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteClick(agent)}
              >
                Delete
              </Button>
            </div>
            <div>
              <AlertDialogCancel onClick={() => setIsDetailsOpen(false)}>
                Close
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
