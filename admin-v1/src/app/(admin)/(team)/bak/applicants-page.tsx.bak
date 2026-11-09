'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2, RefreshCcwDot, X } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetApplicants } from '@/app/data/queries/applicant'
import { useSendSignupLink } from '@/app/data/mutations/agents'
import {
  Applicant,
  ApplicantPaginatedResponse,
  UpdateApplicantStatusRequest,
} from '@/types/applicant'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import {
  AgentDataTable,
  AgentDataTableAction,
} from '../agents/agent-data-table'
import { AxiosError } from 'axios'
import { StatusUpdateDialog } from './status-dialog'
import { useUpdateApplicantStatus } from '@/app/data/mutations/applicant'
import { exportToCSV } from '@/utils/export-to-csv'
import { Download } from 'lucide-react'

export default function ApplicantsPage() {
  const [page, setPage] = useState<number>(1)
  const [searchKey, setSearchKey] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchResults, setSearchResults] =
    useState<ApplicantPaginatedResponse | null>(null)
  const [isSendingSignupLink, setIsSendingSignupLink] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] =
    useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  )

  const {
    data: applicantsData,
    isFetching,
    isLoading,
    error,
    refetch,
  } = useGetApplicants({
    page: page,
    search: isSearchMode ? searchKey : undefined,
  })
  const { mutateAsync: updateApplicantStatus } = useUpdateApplicantStatus()

  const sendSignupLinkMutation = useSendSignupLink()
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

  const columns = React.useMemo<ColumnDef<Applicant, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Applicant ID',
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
          return <div className="font-medium">{row.original.first_name} {row.original.last_name}</div>
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
        header: 'Application Type',
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
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${
                status === 'approved'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : status === 'pending'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    : status === 'rejected'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {status}
            </span>
          )
        },
      },
    ],
    []
  )

  // Actions for applicants
  const getActionsForApplicant = (
    applicant: Applicant
  ): AgentDataTableAction<Applicant>[] => {
    const status = applicant.status.toLowerCase()

    if (status === 'pending') {
      return [
        {
          label: isSendingSignupLink ? 'Sending...' : 'Send Signup Link',
          icon: <Check className="h-4 w-4" />,
          onClick: (applicant: Applicant) =>
            handleSendSignUpLinkClick(applicant),
        },
        {
          label: 'Update Application Status',
          icon: <RefreshCcwDot className="h-4 w-4" />,
          onClick: (applicant: Applicant) =>
            handleStatusUpdateClick(applicant),
        },
      ]
    }

    return []
  }

  async function handleSendSignUpLinkClick(applicant: Applicant) {
    if (!applicant.email) {
      toast.error('Applicant email is required to send signup link')
      return
    }

    try {
      setIsSendingSignupLink(true)
      const response = await sendSignupLinkMutation.mutateAsync({
        email: applicant.email,
      })
      toast.success(
        response?.message ?? `Signup link sent to ${applicant.email}`
      )
      await refetch()
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data

        if (errorData.errors?.email && Array.isArray(errorData.errors.email)) {
          const emailError = errorData.errors.email[0]
          toast.error(`${emailError} Use Invitations Page to resend.`)
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

  async function handleStatusUpdateClick(applicant: Applicant) {
    setSelectedApplicant(applicant)
    setIsUpdateStatusDialogOpen(true)
  }

  async function handleUpdateStatusSubmit(status: string, notes: string) {
    try {
      setIsUpdatingStatus(true)
      const updateResponse = await updateApplicantStatus({
        data: {
          status: status,
          notes: notes,
        } as UpdateApplicantStatusRequest,
        applicantId: selectedApplicant?.id as number,
      })
      console.log(updateResponse)
      if (updateResponse.success) {
        toast.success(`Applicant ${status} successfully.`)
        setIsUpdateStatusDialogOpen(false)
        await refetch()
      } else {
        toast.error('Failed to update applicant status. Please try again.')
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
    }
  }

  function handleRowClick(applicant: Applicant) {
    // Could open a details modal in the future
    console.log('Clicked applicant:', applicant)
  }

  async function handleSearchButtonClick(): Promise<void> {
    if (searchKey.trim() === '') {
      toast.info('Please enter a search term.')
      return
    }
    setIsSearchMode(true)
    await refetch()
  }

  function handleClearSearch(): void {
    setSearchKey('')
    setIsSearchMode(false)
    refetch()
  }

  function handleExportToCSV(): void {
    const dataToExport = applicantsData?.data?.data ?? []
    if (dataToExport.length === 0) {
      toast.info('No data to export')
      return
    }
    exportToCSV(dataToExport, 'applicants-export.csv')
    toast.success('Data exported successfully')
  }

  const displayData = applicantsData
  const isDataLoading = isFetching || isLoading

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Loading Indicator */}
      {(isSendingSignupLink || isUpdatingStatus) && (
        <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center bg-blue-500 px-4 py-3 text-white shadow-lg">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="font-medium">
            {isSendingSignupLink
              ? 'Sending signup link...'
              : 'Updating applicant status...'}
          </span>
        </div>
      )}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Applicant Management</h1>
              <p className="text-muted-foreground">
                Manage and review job applicants
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              <div className="p-6">
                <div className="mb-6 flex justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={searchKey}
                      onChange={(e) => setSearchKey(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchButtonClick()
                        }
                      }}
                      placeholder="Search applicants by name, email, or phone..."
                      className="max-w-md"
                    />
                    <Button
                      className="from-primary to-lilac bg-gradient-to-r text-white"
                      onClick={handleSearchButtonClick}
                      disabled={!searchKey.trim()}
                    >
                      Search
                    </Button>
                    {isSearchMode && (
                      <Button variant="outline" onClick={handleClearSearch}>
                        <X className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportToCSV}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>

                {isSearchMode && (
                  <div className="text-muted-foreground mb-4 text-sm">
                    Showing search results for "{searchKey}"
                  </div>
                )}

                <AgentDataTable
                  columns={columns}
                  data={displayData?.data.data ?? []}
                  onRowClick={(row) => handleRowClick(row)}
                  getRowActions={getActionsForApplicant}
                  enableColumnVisibility={false}
                  enablePagination={false}
                  pageSize={1000}
                />

                {/* Pagination */}
                {displayData?.data && (
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {displayData.data.data.length} applicants
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={displayData.data.current_page === 1}
                        className="h-8 w-8 p-0"
                      >
                        ‹
                      </Button>
                      {Array.from(
                        { length: displayData.data.last_page },
                        (_, i) => i + 1
                      )
                        .filter((pageNum) => {
                          const current = displayData.data.current_page
                          return (
                            pageNum === 1 ||
                            pageNum === displayData.data.last_page ||
                            (pageNum >= current - 1 && pageNum <= current + 1)
                          )
                        })
                        .map((pageNum, idx, arr) => {
                          if (idx > 0 && pageNum - arr[idx - 1] > 1) {
                            return (
                              <React.Fragment key={`ellipsis-${pageNum}`}>
                                <span className="px-2 text-gray-400">...</span>
                                <Button
                                  variant={
                                    pageNum === displayData.data.current_page
                                      ? 'default'
                                      : 'outline'
                                  }
                                  size="sm"
                                  onClick={() => setPage(pageNum)}
                                  className="h-8 w-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              </React.Fragment>
                            )
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                pageNum === displayData.data.current_page
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) =>
                            Math.min(displayData.data.last_page, p + 1)
                          )
                        }
                        disabled={
                          displayData.data.current_page ===
                          displayData.data.last_page
                        }
                        className="h-8 w-8 p-0"
                      >
                        ›
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <StatusUpdateDialog
        isOpen={isUpdateStatusDialogOpen}
        submitStatus={async (status: string, notes: string) => {
          await handleUpdateStatusSubmit(status, notes)
        }}
        onClose={(isOpen: boolean) => setIsUpdateStatusDialogOpen(isOpen)}
      />
    </div>
  )
}
