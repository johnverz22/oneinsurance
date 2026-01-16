'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Send, X, XCircle, Search, Download } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetApplicants } from '@/app/data/queries/applicant'
import { useGetAgents } from '@/app/data/queries/agents'
import { useGetInvitationByEmail } from '@/app/data/queries/invitation'
import {
  Applicant,
  UpdateApplicantStatusRequest,
} from '@/types/applicant'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import {
  AgentDataTable,
  AgentDataTableAction,
} from '../agents/agent-data-table'
import { AxiosError } from 'axios'
import { useUpdateApplicantStatus } from '@/app/data/mutations/applicant'
import { exportToCSV } from '@/utils/export-to-csv'
import {
  useSendInvitation,
  useResendInvitation,
  useCancelInvitation,
} from '@/app/data/mutations/invitation'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function ApplicantsPage() {
  const [page, setPage] = useState<number>(1)
  const [searchKey, setSearchKey] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const {
    data: applicantsData,
    isFetching,
    isLoading,
    refetch,
  } = useGetApplicants({
    page: page,
    search: searchKey.trim() || undefined,
  })

  const { data: agentsData } = useGetAgents({ page: 1, per_page: 1000 })
  const agents = agentsData?.data?.data || []

  const { mutateAsync: updateApplicantStatus } = useUpdateApplicantStatus()
  const { mutateAsync: sendInvitation } = useSendInvitation()
  const { mutateAsync: resendInvitation } = useResendInvitation()
  const { mutateAsync: cancelInvitation } = useCancelInvitation()

  const { isAuthenticated } = useAuthStore()
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setAuthChecking(false)
      if (!isAuthenticated) {
        window.location.href = '/login'
      }
    }, 250)

    return () => clearTimeout(t)
  }, [isAuthenticated])

  // Check if applicant is already an agent
  const isApplicantAnAgent = (email: string) => {
    return agents.some((agent) => agent.email === email)
  }

  // Filter out applicants who are already agents
  const filteredApplicants = React.useMemo(() => {
    const allApplicants = applicantsData?.data?.data || []
    return allApplicants.filter((applicant) => !isApplicantAnAgent(applicant.email))
  }, [applicantsData, agents])

  const columns = React.useMemo<ColumnDef<Applicant, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <div className="font-medium">
            APP{String(row.original.id).padStart(3, '0')}
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          return (
            <div className="font-medium">
              {row.original.first_name} {row.original.last_name}
            </div>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'contact_number',
        header: 'Phone Number',
      },
      {
        accessorKey: 'application_type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.application_type}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status.toLowerCase()
          return (
            <Badge
              className={`${
                status === 'approved'
                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                  : status === 'pending'
                    ? 'bg-orange-100 text-orange-600 hover:bg-orange-100'
                    : status === 'rejected'
                      ? 'bg-red-100 text-red-700 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.toUpperCase()}
            </Badge>
          )
        },
      },
    ],
    []
  )

  // Actions based on status
  const getActionsForApplicant = (
    applicant: Applicant
  ): AgentDataTableAction<Applicant>[] => {
    const status = applicant.status.toLowerCase()
    
    if (status === 'pending') {
      return [
        {
          label: 'Approve',
          icon: <Check className="h-4 w-4" />,
          onClick: (applicant: Applicant) => handleApproveClick(applicant),
          variant: 'default',
        },
        {
          label: 'Reject',
          icon: <XCircle className="h-4 w-4" />,
          onClick: (applicant: Applicant) => handleRejectClick(applicant),
          variant: 'destructive',
        },
      ]
    }
    
    return []
  }

  function handleApproveClick(applicant: Applicant) {
    setSelectedApplicant(applicant)
    setIsApproveDialogOpen(true)
  }

  function handleRejectClick(applicant: Applicant) {
    setSelectedApplicant(applicant)
    setIsRejectDialogOpen(true)
  }

  async function handleConfirmApprove() {
    if (!selectedApplicant) return

    try {
      setIsUpdatingStatus(true)

      const updateResponse = await updateApplicantStatus({
        data: {
          status: 'approved',
          notes: 'Approved by admin',
        } as UpdateApplicantStatusRequest,
        applicantId: selectedApplicant.id,
      })

      if (updateResponse.success) {
        const invitationUrl = `${window.location.origin}/signup`
        await sendInvitation({
          email: selectedApplicant.email,
          role: 'agent',
          invitation_url: invitationUrl,
        })

        toast.success(
          `Applicant approved and signup link sent to ${selectedApplicant.email}`
        )
        await refetch()
      } else {
        toast.error('Failed to approve applicant. Please try again.')
      }
    } catch (error: any) {
      const message =
        error instanceof AxiosError
          ? Object.entries(error.response?.data?.errors || {})
              .map(
                ([key, value]) =>
                  `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
              )
              .join('\n')
          : 'An unexpected error occurred.'
      toast.error(message)
    } finally {
      setIsUpdatingStatus(false)
      setIsApproveDialogOpen(false)
      setSelectedApplicant(null)
    }
  }

  async function handleConfirmReject() {
    if (!selectedApplicant) return

    try {
      setIsUpdatingStatus(true)

      const updateResponse = await updateApplicantStatus({
        data: {
          status: 'rejected',
          notes: 'Rejected by admin',
        } as UpdateApplicantStatusRequest,
        applicantId: selectedApplicant.id,
      })

      if (updateResponse.success) {
        toast.success('Applicant rejected')
        await refetch()
      } else {
        toast.error('Failed to reject applicant. Please try again.')
      }
    } catch (error: any) {
      const message =
        error instanceof AxiosError
          ? Object.entries(error.response?.data?.errors || {})
              .map(
                ([key, value]) =>
                  `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
              )
              .join('\n')
          : 'An unexpected error occurred.'
      toast.error(message)
    } finally {
      setIsUpdatingStatus(false)
      setIsRejectDialogOpen(false)
      setSelectedApplicant(null)
    }
  }

  function handleRowClick(applicant: Applicant) {
    setSelectedApplicant(applicant)
    setDetailsDialogOpen(true)
  }

  function handleExportToCSV(): void {
    const dataToExport = filteredApplicants
    if (dataToExport.length === 0) {
      toast.info('No data to export')
      return
    }

    // Prepare data for export with formatted fields
    const exportData = dataToExport.map((applicant) => ({
      ID: `APP${String(applicant.id).padStart(3, '0')}`,
      'First Name': applicant.first_name,
      'Last Name': applicant.last_name,
      Email: applicant.email,
      'Phone Number': applicant.contact_number,
      'Application Type': applicant.application_type,
      Status: applicant.status.toUpperCase(),
      'Applied Date': format(new Date(applicant.created_at), 'MMM dd, yyyy'),
      Notes: applicant.notes || '',
    }))

    const filename = `applicants-${new Date().toISOString().split('T')[0]}.csv`

    exportToCSV(exportData, filename)
    toast.success(`Exported ${dataToExport.length} applicant(s) to CSV`)
  }

  const isDataLoading = isFetching || isLoading

  return (
    <div className="min-h-screen">
      {isUpdatingStatus && (
        <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center bg-blue-500 px-4 py-3 text-white shadow-lg">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="font-medium">Processing...</span>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 min-h-[400px] rounded-tl-none rounded-tr-3xl rounded-b-3xl border border-l border-r border-b p-4 shadow-sm sm:min-h-[500px] sm:p-6 md:p-8 lg:min-h-screen">
        {/* Section Header */}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">Applicant Management</h2>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              Review and manage job applicants (excluding those already in Agents)
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64 md:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
              </div>
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="block w-full rounded-full border border-gray-300 bg-white py-2 pr-10 pl-9 text-sm leading-5 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none sm:py-2.5 sm:pl-10"
              />
            </div>
            {searchKey && (
              <button
                onClick={() => setSearchKey('')}
                className="flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </button>
            )}
            <button
              onClick={handleExportToCSV}
              className="flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
          </div>
        </div>

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
          <div>
            {searchKey && (
              <div className="text-muted-foreground mb-4 text-sm">
                Showing search results for "{searchKey}" - Found {filteredApplicants.length} result(s)
              </div>
            )}

            {/* Applicants Table */}
            {filteredApplicants.length > 0 ? (
              <AgentDataTable
                columns={columns}
                data={filteredApplicants}
                onRowClick={(row) => handleRowClick(row)}
                getRowActions={getActionsForApplicant}
                enableColumnVisibility={false}
                enablePagination={false}
                pageSize={1000}
              />
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-gray-500">
                  {searchKey
                    ? 'No applicants found matching your search'
                    : 'No applicants available'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {applicantsData?.data && applicantsData.data.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-600">
                  Showing {applicantsData.data.from || 0} to{' '}
                  {applicantsData.data.to || 0} of{' '}
                  {applicantsData.data.total || 0} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={applicantsData.data.current_page === 1}
                    className="rounded-full"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: applicantsData.data.last_page },
                      (_, i) => i + 1
                    )
                      .filter((pageNum) => {
                        const current = applicantsData.data.current_page
                        return (
                          pageNum === 1 ||
                          pageNum === applicantsData.data.last_page ||
                          (pageNum >= current - 1 && pageNum <= current + 1)
                        )
                      })
                      .map((pageNum, index, array) => (
                        <React.Fragment key={pageNum}>
                          {index > 0 && array[index - 1] !== pageNum - 1 && (
                            <span className="px-2">...</span>
                          )}
                          <Button
                            variant={
                              applicantsData.data.current_page === pageNum
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className={`h-8 w-8 rounded-full p-0 ${
                              applicantsData.data.current_page === pageNum
                                ? 'bg-green-600 hover:bg-green-700'
                                : ''
                            }`}
                          >
                            {pageNum}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((prev) =>
                        Math.min(applicantsData.data.last_page, prev + 1)
                      )
                    }
                    disabled={
                      applicantsData.data.current_page ===
                      applicantsData.data.last_page
                    }
                    className="rounded-full"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Applicant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve{' '}
              <span className="font-semibold">
                {selectedApplicant?.first_name} {selectedApplicant?.last_name}
              </span>
              ?
              <br />
              <br />
              <span className="text-green-600 dark:text-green-400">
                ✓ A signup link will be automatically sent to{' '}
                {selectedApplicant?.email}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApprove}
              disabled={isUpdatingStatus}
              className="rounded-full bg-green-600 hover:bg-green-700"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve & Send Link'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Applicant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject{' '}
              <span className="font-semibold">
                {selectedApplicant?.first_name} {selectedApplicant?.last_name}
              </span>
              ? This action can be reversed later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={isUpdatingStatus}
              className="rounded-full bg-red-500 hover:bg-red-600"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Applicant Details Dialog */}
      <ApplicantDetailsDialog
        applicant={selectedApplicant}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onResend={async (invitationId) => {
          try {
            await resendInvitation(invitationId)
            toast.success('Invitation resent successfully')
            await refetch()
          } catch (error) {
            toast.error('Failed to resend invitation')
          }
        }}
        onCancel={async (invitationId) => {
          try {
            await cancelInvitation(invitationId)
            toast.success('Invitation cancelled successfully')
            await refetch()
            setDetailsDialogOpen(false)
          } catch (error) {
            toast.error('Failed to cancel invitation')
          }
        }}
      />
    </div>
  )
}

// Applicant Details Dialog Component
interface ApplicantDetailsDialogProps {
  applicant: Applicant | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResend: (invitationId: number) => Promise<void>
  onCancel: (invitationId: number) => Promise<void>
}

function ApplicantDetailsDialog({
  applicant,
  open,
  onOpenChange,
  onResend,
  onCancel,
}: ApplicantDetailsDialogProps) {
  const { data: invitation, isLoading, refetch: refetchInvitation } = useGetInvitationByEmail(
    applicant?.email || ''
  )
  const [isResending, setIsResending] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Refetch invitation data when dialog opens
  useEffect(() => {
    if (open && applicant?.email) {
      refetchInvitation()
    }
  }, [open, applicant?.email, refetchInvitation])

  if (!applicant) return null

  const handleResend = async () => {
    if (!invitation) return
    setIsResending(true)
    try {
      await onResend(invitation.id)
      // Refetch invitation data after resending
      await refetchInvitation()
    } finally {
      setIsResending(false)
    }
  }

  const handleCancel = async () => {
    if (!invitation) return
    setIsCancelling(true)
    try {
      await onCancel(invitation.id)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col p-0"
        showCloseButton={false}
      >
        <DialogHeader className="border-b px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <DialogTitle className="text-lg font-bold sm:text-xl">
              {applicant.first_name} {applicant.last_name}
            </DialogTitle>
            <Badge
              className={`w-fit shrink-0 ${
                applicant.status.toLowerCase() === 'approved'
                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                  : applicant.status.toLowerCase() === 'rejected'
                    ? 'bg-red-100 text-red-700 hover:bg-red-100'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-100'
              }`}
            >
              {applicant.status.toUpperCase()}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-gray-600 sm:text-sm">
            Applicant details and invitation status
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="space-y-4 sm:space-y-6">
            {/* Applicant Information */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Applicant Information
              </h3>
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium">{applicant.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm font-medium">
                    {applicant.contact_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium capitalize">
                    {applicant.application_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Applied:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(applicant.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Invitation Status */}
            {applicant.status.toLowerCase() === 'approved' && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Invitation Status
                </h3>
                {isLoading ? (
                  <div className="rounded-lg border p-4 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Loading invitation details...
                    </p>
                  </div>
                ) : invitation ? (
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Invited By:</span>
                      <span className="text-sm font-medium">
                        {invitation.inviter.first_name}{' '}
                        {invitation.inviter.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Invited On:</span>
                      <span className="text-sm font-medium">
                        {format(new Date(invitation.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expires On:</span>
                      <span
                        className={`text-sm font-medium ${
                          new Date(invitation.expires_at) < new Date()
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        {format(new Date(invitation.expires_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge
                        className={
                          invitation.accepted_at
                            ? 'bg-green-100 text-green-700 hover:bg-green-100'
                            : new Date(invitation.expires_at) < new Date()
                              ? 'bg-red-100 text-red-700 hover:bg-red-100'
                              : 'bg-orange-100 text-orange-600 hover:bg-orange-100'
                        }
                      >
                        {invitation.accepted_at
                          ? 'ACCEPTED'
                          : new Date(invitation.expires_at) < new Date()
                            ? 'EXPIRED'
                            : 'PENDING'}
                      </Badge>
                    </div>
                    {invitation.accepted_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Accepted On:
                        </span>
                        <span className="text-sm font-medium">
                          {format(
                            new Date(invitation.accepted_at),
                            'MMM dd, yyyy'
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-sm text-gray-500">
                      No invitation found for this applicant
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {applicant.notes && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  Notes
                </h3>
                <p className="rounded-lg border bg-gray-50 p-3 text-sm">
                  {applicant.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t px-4 py-4 sm:flex-row sm:px-6">
          {applicant.status.toLowerCase() === 'approved' &&
            invitation &&
            !invitation.accepted_at && (
              <>
                <Button
                  variant="outline"
                  onClick={handleResend}
                  disabled={isResending || isCancelling}
                  className="w-full rounded-full sm:w-auto"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Resend Invitation
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isResending || isCancelling}
                  className="w-full rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Cancel Invitation
                    </>
                  )}
                </Button>
              </>
            )}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full rounded-full bg-green-600 hover:bg-green-700 sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
