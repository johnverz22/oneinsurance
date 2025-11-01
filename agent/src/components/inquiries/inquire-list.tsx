'use client'

import { useState } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  User,
  Mail,
  FileText,
  Calendar,
  AlertCircle,
  LucideIcon,
} from 'lucide-react'
import type { Inquiry, InquiryStatus } from '@/types/inquiry'
import { INQUIRY_TYPES } from '@/constants/inquiry-types'
import { InquiryDetailsDialog } from './inquiry-details-dialog'

type InquiryListProps = {
  inquiries: Inquiry[]
  onUpdateInquiry: (inquiry: Inquiry) => void
}

export const InquiryList = ({
  inquiries,
  onUpdateInquiry,
}: InquiryListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<Inquiry['type'] | 'all'>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [response, setResponse] = useState('')

  const filteredInquiries = inquiries.filter((inquiry) => {
    const type = INQUIRY_TYPES.find((type) => type.value === inquiry.type)
    const search = searchTerm.toLowerCase()

    const matchesSearch =
      inquiry.customerInfo.firstName.toLowerCase().includes(search) ||
      inquiry.customerInfo.lastName.toLowerCase().includes(search) ||
      inquiry.customerInfo.email.toLowerCase().includes(search) ||
      type?.value.toLowerCase().includes(search) ||
      type?.label.toLowerCase().includes(search) ||
      type?.description.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'all' || inquiry.status === statusFilter
    const matchesType = typeFilter === 'all' || inquiry.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: InquiryStatus) => {
    const variants = {
      new: { variant: 'default' as const, color: 'bg-blue-500' },
      'in-progress': { variant: 'secondary' as const, color: 'bg-yellow-500' },
      resolved: { variant: 'default' as const, color: 'bg-green-500' },
      closed: { variant: 'outline' as const, color: 'bg-gray-500' },
    }

    const { variant } = variants[status]
    return (
      <Badge variant={variant}>{status.replace('-', ' ').toUpperCase()}</Badge>
    )
  }

  const getTypeIcon = (type: Inquiry['type']) => {
    const icons = {
      'agent-enrollment': User,
      general: MessageSquare,
      product: FileText,
      claim: AlertCircle,
      support: User,
      complaint: AlertCircle,
    } satisfies Record<Inquiry['type'], LucideIcon>

    const Icon = icons[type]
    return <Icon className="h-4 w-4 shrink-0" />
  }

  const handleStatusUpdate = (inquiry: Inquiry, newStatus: InquiryStatus) => {
    const updatedInquiry = {
      ...inquiry,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...(newStatus === 'resolved' &&
        response && { response, responseAt: new Date().toISOString() }),
    }
    onUpdateInquiry(updatedInquiry)
    setResponse('')

    if (newStatus === 'resolved') setShowDetails(false)
  }

  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setShowDetails(true)
  }

  return (
    <div className="space-y-4">
      <Card className="px-4">
        <div className="space-y-4">
          <CardTitle>Inquiries</CardTitle>
          <div className="flex w-full flex-wrap items-center gap-4 lg:flex-nowrap">
            <div className="relative w-full lg:max-w-sm">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex w-full gap-4">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as InquiryStatus | 'all')
                }
              >
                <SelectTrigger className="w-full lg:w-max">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(value) =>
                  setTypeFilter(value as Inquiry['type'] | 'all')
                }
              >
                <SelectTrigger className="w-full lg:w-max">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {INQUIRY_TYPES.map((type, index) => (
                    <SelectItem key={index} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredInquiries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No inquiries found matching your criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredInquiries.map((inquiry) => {
              const type = INQUIRY_TYPES.find(
                (type) => type.value === inquiry.type
              )

              return (
                <Card
                  key={inquiry.id}
                  className="relative w-full transition-shadow hover:shadow-md"
                >
                  <CardContent className="px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(inquiry.type)}
                          <h3 className="text-lg font-semibold">
                            {type?.description}
                          </h3>
                          {getStatusBadge(inquiry.status)}
                        </div>

                        <p className="text-muted-foreground line-clamp-2">
                          {inquiry.message}
                        </p>

                        <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {inquiry.customerInfo.firstName}{' '}
                            {inquiry.customerInfo.lastName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {inquiry.customerInfo.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(inquiry.submittedAt).toLocaleDateString()}
                          </div>
                          {inquiry.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Assigned to: {inquiry.assignedTo}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {inquiry.status === 'new' && (
                          <Button
                            className="text-white"
                            onClick={() =>
                              handleStatusUpdate(inquiry, 'in-progress')
                            }
                          >
                            Start Working
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(inquiry)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {selectedInquiry && (
          <InquiryDetailsDialog
            open={showDetails}
            setOpen={setShowDetails}
            inquiry={selectedInquiry}
            handleStatusUpdate={handleStatusUpdate}
          />
        )}
      </Card>
    </div>
  )
}
