'use client'

import { FC, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Pencil,
  Trash2,
  LucideIcon,
  ArrowLeft,
  ArrowUpRight,
} from 'lucide-react'
import { DialogFormWrapper } from '@/components/ui/dialog-form-wrapper'
import { ColumnDef } from '@tanstack/react-table'
import { createSortableHeader, DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import {
  PaymentConfig,
  useGetPayoutConfigurations,
} from '@/app/data/queries/payout'
import { PageLoader } from '@/components/page-loader'
import {
  useCreatePayoutConfiguration,
  useDeletePayoutConfiguration,
  useUpdatePayoutConfiguration,
} from '@/app/data/mutations/payout'
import { toast } from 'sonner'
import { PaymentConfigForm } from './form'
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
import { formatPHPAmount } from '@/utils/formatter'

interface SummaryCardProps {
  title: string
  value: number | string
  icon?: LucideIcon
}

const SummaryCard: FC<SummaryCardProps> = ({ icon: Icon, title, value }) => (
  <Card className="bg-card flex-1 gap-2">
    <CardHeader>
      <CardTitle className="flex flex-wrap items-center gap-2 text-base font-bold text-[#B4975A]">
        {Icon && <Icon className="size-6 shrink-0" />} {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="flex items-end justify-end">
      <p className="text-2xl font-bold lg:text-3xl">{value}</p>
    </CardContent>
  </Card>
)

export default function PaymentConfigPage() {
  const { data: configs, isSuccess: isConfigsFetched } =
    useGetPayoutConfigurations()
  const { mutateAsync: createPayoutConfiguration } =
    useCreatePayoutConfiguration()
  const { mutateAsync: updatePayoutConfiguration } =
    useUpdatePayoutConfiguration()
  const { mutateAsync: deletePayoutConfiguration } =
    useDeletePayoutConfiguration()

  const [formDialog, setFormDialog] = useState<{
    isVisible: boolean
    data?: PaymentConfig
  }>({
    isVisible: false,
    data: undefined,
  })

  const handleOpenForm = (config?: PaymentConfig) => {
    setFormDialog({ isVisible: true, data: config })
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePayoutConfiguration(id)
      toast.success('Payment Configuration Deleted Successfully.')
    } catch (e: any) {
      const message = e.response.data.message || 'Something went wrong.'
      toast.error(message)
    }
  }

  const columns: ColumnDef<PaymentConfig>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => createSortableHeader('ID', column),
      cell: ({ row }) => <span className="font-mono">#{row.original.id}</span>,
    },
    {
      accessorKey: 'min_payout_amount',
      header: ({ column }) => createSortableHeader('Min Amount', column),
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatPHPAmount(row.original.min_payout_amount)}
        </span>
      ),
    },
    {
      accessorKey: 'max_payout_amount',
      header: ({ column }) => createSortableHeader('Max Amount', column),
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatPHPAmount(row.original.max_payout_amount)}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-md">
          {row.original.description}
        </span>
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
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/payments/configurations/${row.original.id}`}>
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenForm(row.original)}
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
                <AlertDialogTitle>
                  Delete payment configuration?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  selected payment configuration.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleDelete(row.original.id)}
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

  if (!isConfigsFetched) {
    return <PageLoader />
  }

  const configCounts = {
    total: configs.length,
    active: configs.filter((c) => c.is_active).length,
    inactive: configs.filter((c) => !c.is_active).length,
  }

  return (
    <div className="relative mx-auto my-12 w-full max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/payments">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Payment Configurations</h1>
        </div>
        <Button
          variant="default"
          className="px-8"
          onClick={() => handleOpenForm()}
        >
          <Plus /> Add Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard title="Total Configurations" value={configCounts.total} />
        <SummaryCard title="Active" value={configCounts.active} />
        <SummaryCard title="Inactive" value={configCounts.inactive} />
      </div>

      <Card className="bg-background shadow-sm">
        <CardContent className="p-6">
          <DataTable<PaymentConfig, unknown>
            header="Configuration List"
            columns={columns}
            data={configs}
            renderMode="table"
            searchKey={['description']}
            pageSize={5}
          />
        </CardContent>
      </Card>

      <DialogFormWrapper
        title="Payment Configuration"
        open={formDialog.isVisible}
        showTrigger={false}
        setOpen={(value) =>
          setFormDialog({ isVisible: value, data: undefined })
        }
      >
        <div className="p-4">
          <div className="mb-4 space-y-2 border-b py-4">
            <h3 className="text-xl font-bold lg:text-2xl">
              {formDialog.data
                ? 'Edit Payment Configuration'
                : 'Add Payment Configuration'}
            </h3>
            <p className="text-muted-foreground">
              {formDialog.data
                ? 'Update your payment configuration settings'
                : 'Create a new payment configuration'}
            </p>
          </div>
          <PaymentConfigForm
            initialData={formDialog.data}
            onSubmit={async (values) => {
              if (formDialog.data) {
                await updatePayoutConfiguration({
                  configId: formDialog.data.id,
                  config: values,
                })
                toast.success('Payment Configuration Updated Successfully.')
              } else {
                await createPayoutConfiguration(values)
                toast.success('Payment Configuration Created Successfully.')
              }

              setFormDialog({ isVisible: false, data: undefined })
            }}
          />
        </div>
      </DialogFormWrapper>
    </div>
  )
}
