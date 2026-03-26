'use client'

import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface QuoteSuccessDialogProps {
  open: boolean
  quoteId: string
  onSubmitAnother: () => void
}

export function QuoteSuccessDialog({ open, quoteId, onSubmitAnother }: QuoteSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">Quote Request Submitted!</DialogTitle>
          <DialogDescription>Let our experts recommend the best plan for you</DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-green-700">{quoteId}</p>
          <p className="text-xs text-green-600">Expected callback: 24 hours</p>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Next Steps:</p>
          <ol className="space-y-1.5 text-sm text-gray-600">
            {[
              'Our insurance expert will review your information',
              "You'll receive a personalized quote via email",
              'Schedule a consultation to discuss your options',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="bg-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-white">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <Button
          onClick={onSubmitAnother}
          className="from-primary to-accent mt-4 w-full rounded-full bg-gradient-to-r text-white"
        >
          Submit Another Quote
        </Button>
      </DialogContent>
    </Dialog>
  )
}
