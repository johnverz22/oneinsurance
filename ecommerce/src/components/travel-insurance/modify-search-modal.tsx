'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { TripDetailsForm } from '@/components/travel-insurance/trip-details-form'

interface ModifySearchModalProps {
  agentCode: string
  open: boolean
  onClose: () => void
  onSubmitted: () => void
}

export function ModifySearchModal({ agentCode, open, onClose, onSubmitted }: ModifySearchModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto sm:items-start sm:p-8" role="presentation">
      <div className="fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Modify your search"
        tabIndex={-1}
        className="relative w-full max-w-3xl rounded-t-2xl border border-[#dfe7df] bg-white p-5 pt-16 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl outline-none max-sm:max-h-[92dvh] max-sm:overflow-y-auto dark:border-[#3d4140] dark:bg-[#262828] sm:my-auto sm:rounded-xl sm:p-8 sm:pt-16"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-md text-[#183d2c] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:bg-[#303232]"
        >
          <X className="size-5" aria-hidden />
        </button>
        <TripDetailsForm agentCode={agentCode} variant="modal" onSubmitted={onSubmitted} />
      </div>
    </div>
  )
}
