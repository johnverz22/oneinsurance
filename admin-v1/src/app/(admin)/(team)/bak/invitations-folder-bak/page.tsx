'use client'

import * as React from 'react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Trash2, Send } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetInviatations } from '@/app/data/queries/invitation'
import {
  useCancelInvitation,
  useResendInvitation,
} from '@/app/data/mutations/invitation'
import { Invitation } from '@/types/invitation'
import { Skeleton } from '@/components/ui/skeleton'
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
import { toast } from 'sonner'
import {
  InvitationDataTable,
  InvitationDataTableAction,
} from './invitation-data-table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function InvitationsPage() {
  const [page, setPage] = useState<number>(1)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null)

  const {
    data: invitationsData,
    isFetching,
    isLoading,
    refetch,
  } = useGetInviatations({
    page,
    per_page: 15,
  })

  const cancelInvitation = useCancelInvitation()
  const resendInvitation = useResendInvitation()

  const handleCancelInvitation = (invitation: Invitation) => {
    setSelectedInvitation(invitation)
    setCancelDialogOpen(true)
  }

  const confirmCancelInvitation = async () => {
    if (!selectedInvitation) return

    try {
      await cancelInvitation.mutateAsync(selectedInvitation.id)
      toast.success('Invitation cancelled successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to cancel invitation')
    } finally {
      setCancelDialogOpen(false)
      setSelectedInvitation(null)
    }
  }

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      await resendInvitation.mutateAsync(invitation.id)
      toast.success('Invitation resent successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to resend invitation')
    }
  }

  const getRowActions = (
    invitation: Invitation
  ): InvitationDataTableAction<Invitation>[] => {
    // Only show actions if invitation is not accepted
    if (invitation.accepted_at) {
      return []
    }

    return [
      {
        label: 'Resend Invitation',
        icon: <Send className="h-4 w-4" />,
        onClick: () => handleResendInvitation(invitation),
        variant: 'default',
      },
      {
        label: 'Cancel Invitation',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => handleCancelInvitation(invitation),
        variant: 'destructive',
      },
    ]
  }

  const columns: ColumnDef<Invitation>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue('role')}
        </Badge>
      ),
    },
    {
      accessorKey: 'inviter',
      header: 'Invited By',
      cell: ({ row }) => {
        const inviter = row.original.inviter
        return (
          <div>
            {inviter.first_name} {inviter.last_name}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Invited On',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return <div>{format(date, 'MMM dd, yyyy')}</div>
      },
    },
    {
      accessorKey: 'expires_at',
      header: 'Expires On',
      cell: ({ row }) => {
        const date = new Date(row.getValue('expires_at'))
        const isExpired = date < new Date()
        return (
          <div className={isExpired ? 'text-red-500' : ''}>
            {format(date, 'MMM dd, yyyy')}
          </div>
        )
      },
    },
    {
      accessorKey: 'accepted_at',
      header: 'Status',
      cell: ({ row }) => {
        const acceptedAt = row.getValue('accepted_at') as string | null
        const expiresAt = new Date(row.original.expires_at)
        const isExpired = expiresAt < new Date()

        if (acceptedAt) {
          return <Badge className="bg-green-500">Accepted</Badge>
        } else if (isExpired) {
          return <Badge variant="destructive">Expired</Badge>
        } else {
          return <Badge variant="secondary">Pending</Badge>
        }
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team Invitations</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcw
              className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <InvitationDataTable
            columns={columns}
            data={invitationsData?.data?.data ?? []}
            getRowActions={getRowActions}
            enablePagination={true}
            pageSize={15}
          />
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for{' '}
              <span className="font-semibold">{selectedInvitation?.email}</span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelInvitation}
              className="bg-red-500 hover:bg-red-600"
            >
              Yes, Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
