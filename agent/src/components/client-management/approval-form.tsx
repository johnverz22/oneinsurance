'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Check, X } from 'lucide-react'
import type { Client, ClientStatus } from '@/types/client'

type ApprovalFormProps = {
  client: Client
  action: ClientStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (notes?: string) => void
}

export const ApprovalForm = ({
  client,
  action,
  open,
  onOpenChange,
  onConfirm,
}: ApprovalFormProps) => {
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    onConfirm(notes)
    setNotes('')
  }

  const isApproval = action === 'approved'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApproval ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-red-600" />
            )}
            {isApproval ? 'Approve' : 'Reject'} Client Application
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted flex items-start gap-3 rounded-lg p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">
                Are you sure you want to {action} this application?
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Client: {client.firstName} {client.lastName}
              </p>
              <p className="text-muted-foreground text-sm">
                Email: {client.email}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {isApproval ? 'Approval Notes (Optional)' : 'Rejection Reason'}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isApproval
                  ? 'Add any notes about the approval...'
                  : 'Please provide a reason for rejection...'
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isApproval ? 'default' : 'destructive'}
            onClick={handleConfirm}
          >
            {isApproval ? 'Approve' : 'Reject'} Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
