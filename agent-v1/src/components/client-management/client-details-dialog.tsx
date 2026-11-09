'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CalendarDays,
  MapPin,
  Briefcase,
  DollarSign,
  FileText,
} from 'lucide-react'
import type { Client } from '@/types/client'

type ClientDetailsDialogProps = {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ClientDetailsDialog = ({
  client,
  open,
  onOpenChange,
}: ClientDetailsDialogProps) => {
  const getStatusBadge = (status: Client['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, color: 'text-yellow-600' },
      approved: { variant: 'default' as const, color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, color: 'text-red-600' },
    }

    const { variant } = variants[status]

    return (
      <Badge variant={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Client Details</DialogTitle>
            {getStatusBadge(client.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Full Name
                  </p>
                  <p className="text-base">
                    {client.firstName} {client.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Email
                  </p>
                  <p className="text-base">{client.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Phone
                  </p>
                  <p className="text-base">{client.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Date of Birth
                    </p>
                    <p className="text-base">
                      {new Date(client.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-base">{client.address.street}</p>
                <p className="text-base">
                  {client.address.city}, {client.address.state}{' '}
                  {client.address.zipCode}
                </p>
                <p className="text-base">{client.address.country}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Occupation
                    </p>
                    <p className="text-base">{client.occupation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Annual Income
                    </p>
                    <p className="text-base">
                      ${client.annualIncome.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.submittedAt && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium">Application Submitted</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(client.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {client.approvedAt && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium">Application Approved</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(client.approvedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {client.rejectedAt && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <div>
                    <p className="text-sm font-medium">Application Rejected</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(client.rejectedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {!client.submittedAt &&
                !client.approvedAt &&
                !client.rejectedAt && (
                  <p className="text-muted-foreground text-sm">
                    No timeline information available
                  </p>
                )}
            </CardContent>
          </Card>

          {client.documents && client.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded border p-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-muted-foreground text-xs">
                          Uploaded:{' '}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{doc.type.toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
