'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Trash,
  Edit2,
  Check,
  X,
  ArrowUpRight,
  Search,
  Download,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetAgents, useGetAgentById } from '@/app/data/queries/agents'
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
import {
  useActivateAgent,
  useDeleteAgent,
  useSendSignupLink,
} from '@/app/data/mutations/agents'
import { useUpdateAgent } from '@/app/data/mutations/agents'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { AgentDataTable, AgentDataTableAction } from './agent-data-table'
import { exportToCSV } from '@/utils/export-to-csv'
import { Badge } from '@/components/ui/badge'
import { PaginationBar } from '@/components/ui/design-system'

export default function AgentsPage() {
  const router = useRouter()
  const [page, setPage] = useState<number>(1)
  const {
    data: agentsData,
    isFetching,
    isLoading,
    error,
    refetch,
  } = useGetAgents({ 
    page,
    per_page: 15,
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const deleteMutation = useDeleteAgent()
  const activateMutation = useActivateAgent()
  const sendSignupLinkMutation = useSendSignupLink()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSendingSignupLink, setIsSendingSignupLink] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const [authChecking, setAuthChecking] = useState(true)
  const [searchKey, setSearchKey] = useState('')
  const [searchKeyDebounced, setSearchKeyDebounced] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AgentsResponse | null>(
    null
  )

  const { mutateAsync: searchAgents, isPending: isSearching } =
    useSearchAgents()

  // Debounce search and auto-trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyDebounced(searchKey)
      if (searchKey.trim()) {
        searchAgents({ searchKey: searchKey.trim() })
          .then((result) => {
            setSearchResults(result)
            setIsSearchMode(true)
          })
          .catch((error) => {
            console.error('Search error:', error)
          })
      } else {
        setSearchResults(null)
        setIsSearchMode(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchKey, searchAgents])

  // Get agents data
  const agentsOnly = React.useMemo(() => {
    return agentsData?.data?.data || []
  }, [agentsData])

  // Debug pagination data
  React.useEffect(() => {
    if (agentsData) {
      console.log('Frontend received data structure:', JSON.stringify(agentsData, null, 2))
      console.log('Pagination debug:', {
        page: agentsData.data?.current_page,
        perPage: agentsData.data?.per_page,
        total: agentsData.data?.total,
        lastPage: agentsData.data?.last_page,
        paginatedLength: agentsData.data?.data?.length,
        shouldShowPagination: agentsData.data?.last_page > 1
      })
    }
  }, [agentsData])

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
        accessorKey: 'settings.code',
        header: 'Agent Code',
        cell: ({ row }) => {
          const code = row.original.settings?.code
          return (
            <div className="font-medium">
              {code ? code.toUpperCase() : 'N/A'}
            </div>
          )
        },
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const name = row.original.name
          if (!name) return <div className="font-medium">N/A</div>
          
          // Capitalize first letter of each word
          const capitalizedName = name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
          
          return (
            <div className="font-medium">
              {capitalizedName}
            </div>
          )
        },
      },
      {
        accessorKey: 'role',
        header: 'Type',
        cell: ({ row }) => {
          const role = row.original.role
          return (
            <div className="font-medium">
              {role || 'N/A'}
            </div>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div>
            {row.original.email || 'N/A'}
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <div>
            {row.original.phone || 'N/A'}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          if (!status) return <div>N/A</div>
          
          const statusLower = status.toLowerCase()
          return (
            <Badge
              className={`${
                statusLower === 'active'
                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                  : statusLower === 'pending'
                    ? 'bg-orange-100 text-orange-600 hover:bg-orange-100'
                    : statusLower === 'approved'
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : statusLower === 'for interview'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : statusLower === 'inactive'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.toUpperCase()}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const agent = row.original
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/agents/${agent.id}/policies`)
                }}
                className="p-1.5 rounded-md text-gray-400 hover:text-[#B8960C] hover:bg-[#B8960C]/10 transition-colors"
                title="View Transactions"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/agents/${agent.id}/profile`)
                }}
                className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                title="View Profile"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedToView(agent)
                  setIsDetailsOpen(true)
                }}
                className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                title="View Documents"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteClick(agent)
                }}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Deactivate"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          )
        },
      },
    ],
    [router]
  )

  // Dynamic actions based on agent status
  const getActionsForAgent = (agent: Agent): AgentDataTableAction<Agent>[] => {
    const status = agent.status.toLowerCase()
    
    // Common actions for all agents
    const commonActions: AgentDataTableAction<Agent>[] = [
      {
        label: 'View Profile',
        icon: <ArrowUpRight className="h-4 w-4" />,
        onClick: (agent: Agent) => router.push(`/agents/${agent.id}/profile`),
      },
    ]

    if (status === 'for interview') {
      return [
        ...commonActions,
        {
          label: isSendingSignupLink ? 'Sending...' : 'Send Signup link',
          icon: <Check className="h-4 w-4" />,
          onClick: (agent: Agent) => handleSendSignUpLinkClick(agent),
        },
      ]
    } else if (status === 'active') {
      return [
        ...commonActions,
        {
          label: 'View Documents',
          icon: <Edit2 className="h-4 w-4" />,
          onClick: (agent: Agent) => handleViewDocumentsClick(agent),
        },
        {
          label: 'Deactivate',
          icon: <Trash className="h-4 w-4" />,
          onClick: (agent) => handleDeactivateClick(agent),
          variant: 'destructive',
        },
      ]
    } else if (status === 'pending') {
      return [
        ...commonActions,
        {
          label: 'Review Document',
          icon: <Edit2 className="h-4 w-4" />,
          onClick: (agent: Agent) => handleReviewDocumentClick(agent),
        },
        {
          label: isSendingSignupLink ? 'Sending...' : 'Send Sign Up Link',
          icon: <Check className="h-4 w-4" />,
          onClick: (agent) => handleSendSignUpLinkClick(agent),
        },
      ]
    } else if (status === 'inactive') {
      return [
        ...commonActions,
        {
          label: 'Review Document',
          icon: <Edit2 className="h-4 w-4" />,
          onClick: (agent: Agent) => handleReviewDocumentClick(agent),
        },
        {
          label: 'Activate',
          icon: <Check className="h-4 w-4" />,
          onClick: (agent) => handleActivateClick(agent),
          variant: 'default',
        },
      ]
    }

    return commonActions
  }

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedToView, setSelectedToView] = useState<Agent | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
  
  // Fetch detailed agent data when an agent is selected
  const { data: agentDetailData, isFetching: isFetchingDetail } = useGetAgentById(selectedAgentId)
  const [isActivateOpen, setIsActivateOpen] = useState(false)
  const [selectedToActivate, setSelectedToActivate] = useState<Agent | null>(
    null
  )
  const [isActivating, setIsActivating] = useState(false)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [selectedToUpdate, setSelectedToUpdate] = useState<Agent | null>(null)
  const [updatePayload, setUpdatePayload] = useState({
    name: '',
    phone: '',
    designation: 'Agent',
  })
  const updateMutation = useUpdateAgent()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)

  function handleRowClick(agent: Agent) {
    // Row click disabled - use three-dot menu actions instead
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
      name: agent.name || '',
      phone: agent.phone ?? '',
      designation: 'Agent',
    })
    setIsUpdateOpen(true)
  }

  function handleViewDocumentsClick(agent: Agent) {
    setSelectedToView(agent)
    setIsDetailsOpen(true)
  }

  function handleDeactivateClick(agent: Agent) {
    toast.info('Deactivate feature coming soon')
    // TODO: Implement deactivate functionality
  }

  function handleReviewDocumentClick(agent: Agent) {
    setSelectedToView(agent)
    setIsDetailsOpen(true)
  }

  async function handleSendSignUpLinkClick(agent: Agent) {
    if (!agent.email) {
      toast.error('Agent email is required to send signup link')
      return
    }

    try {
      setIsSendingSignupLink(true)
      const response = await sendSignupLinkMutation.mutateAsync({
        email: agent.email,
      })
      toast.success(response?.message ?? `Signup link sent to ${agent.email}`)
    } catch (error) {
      // Handle validation errors from the API
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data

        // Handle validation errors with specific field messages
        if (errorData.errors?.email && Array.isArray(errorData.errors.email)) {
          const emailError = errorData.errors.email[0]
          toast.error(emailError)
        } else if (errorData.message) {
          toast.error(errorData.message)
        } else if (errorData.success === false) {
          toast.error('Validation error occurred. Please check the details.')
        } else {
          toast.error('Failed to send signup link. Please try again.')
        }
      } else {
        console.error('Unexpected error:', error)
        toast.error('Failed to send signup link. Please try again.')
      }
    } finally {
      setIsSendingSignupLink(false)
    }
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
    // Search is now handled by debounced useEffect
    // This function is kept for Enter key compatibility
    if (searchKey.trim() === '') {
      toast.info('Please enter the agent name to search.')
    }
  }

  function handleClearSearch(): void {
    setSearchKey('')
    setSearchQuery('')
    setIsSearchMode(false)
  }

  // Determine which data to display
  const displayData = isSearchMode ? searchResults : agentsData
  const isDataLoading = isSearchMode ? isSearching : isFetching || isLoading

  function handleExportToCSV(): void {
    const dataToExport = isSearchMode
      ? (searchResults?.data?.data ?? [])
      : agentsOnly

    if (dataToExport.length === 0) {
      toast.info('No agents to export')
      return
    }

    const filename = isSearchMode
      ? `agents-search-${new Date().toISOString().split('T')[0]}.csv`
      : `agents-${new Date().toISOString().split('T')[0]}.csv`

    exportToCSV(dataToExport, filename)
    toast.success(`Exported ${dataToExport.length} agent(s) to CSV`)
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div>
        {/* Section Header */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">Agent Management</h2>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              Manage and monitor all registered agents
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64 md:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
              </div>
              <input
                type="text"
                placeholder="Search agents..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchButtonClick()
                  }
                }}
                className="block w-full rounded-full border border-input bg-card py-2 pr-10 pl-9 text-sm leading-5 placeholder-muted-foreground shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none sm:py-2.5 sm:pl-10"
              />
            </div>
            {isSearchMode && (
              <button
                onClick={handleClearSearch}
                className="flex w-full items-center justify-center rounded-full border border-input bg-card px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </button>
            )}
            <button
              onClick={handleExportToCSV}
              className="flex w-full items-center justify-center rounded-full border border-input bg-card px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">

        {authChecking || isDataLoading ? (
          <div className="w-full space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-card flex items-center gap-4 rounded-md border p-3"
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
          <div>
            {isSearchMode && (
              <div className="text-muted-foreground mb-4 px-4 text-sm">
                Showing search results for "{searchKey}" - Found{' '}
                {displayData?.data?.data?.length || 0} result(s)
              </div>
            )}

            {/* Agents Table */}
            {((isSearchMode ? displayData?.data?.data : agentsOnly) || []).length > 0 ? (
              <AgentDataTable
                columns={columns}
                data={isSearchMode ? (displayData?.data?.data ?? []) : agentsOnly}
                onRowClick={(row) => handleRowClick(row)}
                enableColumnVisibility={false}
                enablePagination={false}
                pageSize={1000}
              />
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-gray-500">
                  {isSearchMode
                    ? 'No agents found matching your search'
                    : 'No agents available'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {!isSearchMode && displayData?.data && displayData.data.total > 0 && displayData.data.last_page > 1 && (
              <PaginationBar
                currentPage={displayData.data.current_page}
                lastPage={displayData.data.last_page}
                total={displayData.data.total}
                from={displayData.data.from ?? undefined}
                to={displayData.data.to ?? undefined}
                onPageChange={setPage}
              />
            )}
          </div>
        )}
        </div>
      </div>

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
              {selectedAgent?.name || 'this agent'}
            </strong>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsDeleteOpen(false)} className="rounded-full">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={async () => await handleConfirmDelete()}
              className="rounded-full"
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
              {selectedToActivate?.name || 'this agent'}
            </strong>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsActivateOpen(false)} className="rounded-full">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="default"
              onClick={async () => await handleConfirmActivate()}
              disabled={isActivating}
              className="rounded-full bg-green-600 hover:bg-green-700"
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
  updatePayload: { name: string; phone: string },
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
              {selectedToUpdate?.name || 'this agent'}
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="relative h-full max-h-[64vh] pb-4">
          <div className="grid gap-2 py-2">
            <div>
              <Label>Name</Label>
              <Input
                value={updatePayload.name}
                onChange={(e) =>
                  setUpdatePayload({
                    ...updatePayload,
                    name: e.target.value,
                  })
                }
                placeholder="Full name"
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
          <AlertDialogCancel onClick={() => setIsUpdateOpen(false)} className="rounded-full">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={() => setIsSaveConfirmOpen(true)}
              disabled={isUpdating}
              className="rounded-full bg-green-600 hover:bg-green-700"
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
              {selectedToUpdate?.name || 'this agent'}
            </strong>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsSaveConfirmOpen(false)} className="rounded-full">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={async () => await handleConfirmUpdate()}
              disabled={isUpdating}
              className="rounded-full bg-green-600 hover:bg-green-700"
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
      <AlertDialogContent className="max-w-4xl">
        <AlertDialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <AlertDialogTitle className="text-2xl font-bold text-green-700">
              View Submitted Documents
            </AlertDialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDetailsOpen(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AlertDialogDescription className="text-sm">
            Verify the documents uploaded by the agent before approving.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-6">
            {/* Agent Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Agent Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Agent ID:</Label>
                  <div className="font-medium">
                    AGT{String(agent.id).padStart(3, '0')}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Name:</Label>
                  <div className="font-medium">
                    {agent.name}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email:</Label>
                  <div className="font-medium">{agent.email}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone Number:</Label>
                  <div className="font-medium">{agent.phone ?? '-'}</div>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Bank Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Bank Name:</Label>
                  <div className="font-medium">-</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Bank Code:</Label>
                  <div className="font-medium">-</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    SWIFT / BIC / Routing Number:
                  </Label>
                  <div className="font-medium">-</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Account Holder Name:
                  </Label>
                  <div className="font-medium">-</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Account Number:
                  </Label>
                  <div className="font-medium">-</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Account Type:</Label>
                  <div className="font-medium">-</div>
                </div>
              </div>
            </div>

            {/* Verification Documents */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">
                Verification Documents
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">ID Type:</Label>
                  <div className="font-medium">-</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">ID Number:</Label>
                  <div>
                    <Button variant="link" className="h-auto p-0 text-blue-600">
                      View ID
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    License Number:
                  </Label>
                  <div>
                    <Button variant="link" className="h-auto p-0 text-blue-600">
                      View License ID
                    </Button>
                  </div>
                </div>
                <div></div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Certificate Number:
                  </Label>
                  <div>
                    <Button variant="link" className="h-auto p-0 text-blue-600">
                      View Certificate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <AlertDialogFooter className="border-t pt-4">
          <div className="flex w-full justify-end">
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (agent.status.toLowerCase() === 'active') {
                  handleDeleteClick(agent)
                } else {
                  handleActivateClick(agent)
                }
              }}
            >
              {agent.status.toLowerCase() === 'active'
                ? 'Deactivate'
                : 'Activate'}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
