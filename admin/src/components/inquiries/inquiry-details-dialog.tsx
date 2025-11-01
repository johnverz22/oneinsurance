'use client'

import { Phone, Mail, Send } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import type { Inquiry, InquiryStatus } from '@/types/inquiry'
import { Card, CardContent } from '@/components/ui/card'
import {
  DialogFormWrapper,
  DialogFormWrapperProps,
} from '@/components/ui/dialog-form-wrapper'
import { ScrollArea } from '@/components/ui/scroll-area'

type InquiryDetailsDialogProps = Pick<
  DialogFormWrapperProps,
  'open' | 'setOpen'
> & {
  inquiry: Inquiry
  handleStatusUpdate: (inquiry: Inquiry, newStatus: InquiryStatus) => void
}

export const InquiryDetailsDialog = ({
  inquiry,
  open,
  setOpen,
  handleStatusUpdate,
}: InquiryDetailsDialogProps) => {
  return (
    <DialogFormWrapper
      open={open}
      setOpen={setOpen}
      title="Inquiry Details"
      className="flex flex-row px-6 lg:w-max"
      contentContainerClassName="overflow-hidden p-8"
      showTrigger={false}
    >
      <ScrollArea className="relative h-full max-h-[80vh] pb-12">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold capitalize">
                {inquiry.type}
              </h3>
            </div>
            <div className="text-muted-foreground text-right text-sm">
              <p>ID: {inquiry.id}</p>
              <p>Submitted: {new Date(inquiry.submittedAt).toLocaleString()}</p>
            </div>
          </div>

          <Separator />

          <Card>
            <h3 className="px-6 text-base text-gray-700 dark:text-gray-300">
              Customer Information
            </h3>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm font-medium">
                    Name
                  </Label>
                  <p>
                    {inquiry.customerInfo.firstName}{' '}
                    {inquiry.customerInfo.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm font-medium">
                    Preferred Contact
                  </Label>
                  <p className="capitalize">
                    {inquiry.customerInfo.preferredContact}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span>{inquiry.customerInfo.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <span>{inquiry.customerInfo.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <h3 className="px-6 text-base text-gray-700 dark:text-gray-300">
              Message
            </h3>
            <CardContent>
              <p className="whitespace-pre-wrap">{inquiry.message}</p>
            </CardContent>
          </Card>

          {(inquiry.productInterest || inquiry.policyNumber) && (
            <Card>
              <h3 className="px-6 text-base text-gray-700 dark:text-gray-300">
                Additional Information
              </h3>
              <CardContent className="space-y-2">
                {inquiry.productInterest && (
                  <div>
                    <Label className="text-muted-foreground text-sm font-medium">
                      Product Interest
                    </Label>
                    <p className="capitalize">{inquiry.productInterest}</p>
                  </div>
                )}
                {inquiry.policyNumber && (
                  <div>
                    <Label className="text-muted-foreground text-sm font-medium">
                      Policy Number
                    </Label>
                    <p>{inquiry.policyNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TODO: Implement API */}
          {inquiry.status === 'in-progress' &&
            (inquiry.type === 'agent-enrollment' ? (
              <Card className="flex w-full flex-row items-center justify-between">
                <h3 className="px-6 text-base text-gray-700 dark:text-gray-300">
                  Send Email Invitation
                </h3>
                <CardContent className="space-y-4">
                  <Button
                    className="text-white"
                    onClick={() => handleStatusUpdate(inquiry, 'resolved')}
                  >
                    Send Invitation & Mark Resolved
                    <Send />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <h3 className="px-6 text-base text-gray-700 dark:text-gray-300">
                  Add Response
                </h3>
                <CardContent className="space-y-4">
                  <Textarea
                    value=""
                    onChange={(e) => console.log(e.target.value)}
                    placeholder="Type your response here..."
                  />
                  <Button
                    onClick={() => handleStatusUpdate(inquiry, 'resolved')}
                  >
                    Send Response & Mark Resolved
                  </Button>
                </CardContent>
              </Card>
            ))}

          {inquiry.response && (
            <Card>
              <h3 className="px-6 text-base text-gray-700 dark:text-gray-300">
                Response
              </h3>
              <p className="text-muted-foreground text-sm">
                Responded on {new Date(inquiry.responseAt!).toLocaleString()}
              </p>
              <CardContent>
                <p className="whitespace-pre-wrap">{inquiry.response}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </DialogFormWrapper>
  )
}
