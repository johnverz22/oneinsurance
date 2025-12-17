import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

type StatusUpdateDialogProps = {
  isOpen: boolean
  status: string
  submitStatus: (notes: string) => void
  onClose?: (isOpen: boolean) => void
}

export function StatusUpdateDialog({
  isOpen,
  status,
  submitStatus,
  onClose,
}: StatusUpdateDialogProps) {
  const [notes, setNotes] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const handleSubmitClick = () => {
    setIsConfirmOpen(true)
  }

  const handleConfirmSubmit = () => {
    setNotes('')
    setIsConfirmOpen(false)
    onClose?.(false)
    submitStatus(notes)
  }

  const handleCancel = () => {
    setNotes('')
    onClose?.(false)
  }

  return (
    <>
      <Dialog open={isOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {status == "approved" ? "Approve" : "Reject"} Applicant Status
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label htmlFor="notes" className="font-medium">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded border p-2"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmitClick}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {status} this applicant's status?
              {notes && (
                <>
                  <br />
                  <br />
                  <strong>Notes:</strong> {notes}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
