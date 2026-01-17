'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Shield,
  RefreshCcw,
} from 'lucide-react'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { ColumnDef } from '@tanstack/react-table'
import { createSortableHeader, DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import { PageLoader } from '@/components/page-loader'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  useShowPayoutConfigurationDetails,
  useGetAgentRestictions,
} from '@/app/data/queries/payout'
import { AgentRestrictionForm } from '../agent-restriction-form'
import {
  useDeleteAgentPayoutRestriction,
  useSetAgentPayoutRestriction,
  useUpdateAgentPayoutRestriction,
} from '@/app/data/mutations/payout'
import { formatPHPAmount } from '@/utils/formatter'

interface AgentRestriction {
  id: number
  agent_id: number
  agent_name: string
  restriction_type: 'excluded' | 'limited' | 'manual_approval_required'
  reason: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function PaymentConfigDetailsPage() {
  const params = useParams()
  const configId = params.id as string

  const { data: configDetails, isLoading: isLoadingConfig } =
    useShowPayoutConfigurationDetails(configId)
  const {
    data: restrictionsData,
    isLoading: isLoadingRestrictions,
    refetch: refetchRestrictions,
  } = useGetAgentRestictions(configId)
  const { mutateAsync: createRestriction } = useSetAgentPayoutRestriction()
  const { mutateAsync: updateRestriction } = useUpdateAgentPayoutRestriction()
  const { mutateAsync: deleteRestriction } = useDeleteAgentPayoutRestriction()

  const [restrictionDialog, setRestrictionDialog] = useState<{
    isVisible: boolean
    data?: AgentRestriction
  }>({
    isVisible: false,
    data: undefined,
  })

  const handleOpenRestrictionForm = (restriction?: AgentRestriction) => {
    setRestrictionDialog({ isVisible: true, data: restriction })
  }

  const handleDeleteRestriction = async (restrictionId: number) => {
    try {
      await deleteRestriction({
        configId: parseInt(configId),
        restrictionId,
      })
      toast.success('Agent Restriction Deleted Successfully.')
      refetchRestrictions()
    } catch (e: any) {
      const message = e.response?.data?.message || 'Something went wrong.'
      toast.error(message)
    }
  }

  const getRestrictionTypeLabel = (type: string) => {
    switch (type) {
      case 'excluded':
        return 'Excluded'
      case 'limited':
        return 'Limited'
      case 'manual_approval_required':
        return 'Manual Approval Required'
      default:
        return type
    }
  }

  const getRestrictionTypeColor = (type: string) => {
    switch (type) {
      case 'excluded':
        return { text: 'text-red-600', bg: 'bg-red-600' }
      case 'limited':
        return { text: 'text-yellow-600', bg: 'bg-yellow-600' }
      case 'manual_approval_required':
        return { text: 'text-blue-600', bg: 'bg-blue-600' }
      default:
        return { text: 'text-gray-600', bg: 'bg-gray-600' }
    }
  }

  const columns: ColumnDef<AgentRestriction>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => createSortableHeader('ID', column),
      cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
    },
    {
      accessorKey: 'agent_id',
      header: ({ column }) => createSortableHeader('Agent', column),
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.agent_id}</span>
      ),
    },
    {
      accessorKey: 'restriction_type',
      header: ({ column }) => createSortableHeader('Restriction Type', column),
      cell: ({ row }) => {
        const type = row.original.restriction_type
        const color = getRestrictionTypeColor(type)
        return (
          <div className="flex items-center gap-2">
            <div className={cn('size-2.5 rounded-full', color.bg)} />
            <span className={cn('font-medium', color.text)}>
              {getRestrictionTypeLabel(type)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-md">{row.original.reason}</span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => createSortableHeader('Status', column),
      cell: ({ row }) => {
        const isActive = row.original.is_active
        return (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'size-2.5 rounded-full',
                isActive ? 'bg-green-600' : 'bg-gray-400'
              )}
            />
            <span
              className={cn(
                'font-medium',
                isActive ? 'text-green-600' : 'text-gray-600'
              )}
            >
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => createSortableHeader('Last Updated', column),
      cell: ({ row }) => {
        const date = new Date(row.original.updated_at)
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenRestrictionForm(row.original)}
          >
            <Pencil className="size-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="size-4 text-red-600" />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete agent restriction?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  agent restriction for {row.original.agent_name}.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleDeleteRestriction(row.original.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  if (isLoadingConfig || isLoadingRestrictions) {
    return <PageLoader />
  }

  const restrictions = restrictionsData?.data || []
  const restrictionCounts = {
    total: restrictions.length,
    active: restrictions.filter((r: AgentRestriction) => r.is_active).length,
    inactive: restrictions.filter((r: AgentRestriction) => !r.is_active).length,
  }

  return (
    <div className="relative mx-auto my-12 w-full max-w-7xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/payments/configurations">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Payment Configuration Details</h1>
      </div>

      {/* Configuration Overview Card */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            Configuration #{configDetails?.id}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-sm">Min Payout Amount</p>
              <p className="text-xl font-bold">
                {formatPHPAmount(configDetails?.min_payout_amount ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Max Payout Amount</p>
              <p className="text-xl font-bold">
                {formatPHPAmount(configDetails?.max_payout_amount ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'size-2.5 rounded-full',
                    configDetails?.is_active ? 'bg-green-600' : 'bg-gray-400'
                  )}
                />
                <span
                  className={cn(
                    'font-medium',
                    configDetails?.is_active
                      ? 'text-green-600'
                      : 'text-gray-600'
                  )}
                >
                  {configDetails?.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Last Updated</p>
              <p className="font-medium">
                {new Date(configDetails?.updated_at).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>
          </div>
          {configDetails?.description && (
            <div>
              <p className="text-muted-foreground text-sm">Description</p>
              <p className="mt-1">{configDetails.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Restrictions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-6 text-[#B4975A]" />
            <h2 className="text-2xl font-bold">Agent Restrictions</h2>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              className="px-8"
              onClick={() => refetchRestrictions()}
            >
              <RefreshCcw />
            </Button>
            <Button
              variant="default"
              className="px-8"
              onClick={() => handleOpenRestrictionForm()}
            >
              <Plus /> Add Restriction
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#B4975A]">
                Total Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold lg:text-3xl">
                {restrictionCounts.total}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#B4975A]">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold lg:text-3xl">
                {restrictionCounts.active}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#B4975A]">
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold lg:text-3xl">
                {restrictionCounts.inactive}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-background shadow-sm">
          <CardContent className="p-6">
            <DataTable<AgentRestriction, unknown>
              header="Agent Restrictions List"
              columns={columns}
              data={restrictions}
              renderMode="table"
              searchKey={['agent_name', 'reason']}
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>

      <DialogFormWrapper
        title="Agent Restriction"
        open={restrictionDialog.isVisible}
        showTrigger={false}
        setOpen={(value) =>
          setRestrictionDialog({ isVisible: value, data: undefined })
        }
      >
        <div className="p-4">
          <div className="mb-4 space-y-2 border-b py-4">
            <h3 className="text-xl font-bold lg:text-2xl">
              {restrictionDialog.data
                ? 'Edit Agent Restriction'
                : 'Add Agent Restriction'}
            </h3>
            <p className="text-muted-foreground">
              {restrictionDialog.data
                ? 'Update agent restriction settings'
                : 'Create a new agent restriction for this configuration'}
            </p>
          </div>
          <AgentRestrictionForm
            initialData={restrictionDialog.data}
            agents={[]}
            isEditing={!!restrictionDialog.data}
            onSubmit={async (values) => {
              try {
                if (restrictionDialog.data) {
                  await updateRestriction({
                    configId: parseInt(configId),
                    restrictionId: restrictionDialog.data.id,
                    payload: {
                      restriction_type: values.restriction_type,
                      reason: values.reason,
                      is_active: values.is_active,
                    },
                  })
                  toast.success('Agent Restriction Updated Successfully.')
                } else {
                  await createRestriction({
                    configId: parseInt(configId),
                    payload: values,
                  })
                  toast.success('Agent Restriction Created Successfully.')
                }
                refetchRestrictions()
                setRestrictionDialog({ isVisible: false, data: undefined })
              } catch (e: any) {
                const message =
                  e.response?.data?.message || 'Something went wrong.'
                toast.error(message)
              }
            }}
          />
        </div>
      </DialogFormWrapper>
    </div>
  )
}
