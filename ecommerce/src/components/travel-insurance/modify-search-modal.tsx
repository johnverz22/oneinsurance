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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Modify your search"
        tabIndex={-1}
        className="relative w-full max-w-3xl rounded-t-2xl bg-white shadow-2xl outline-none dark:bg-[#262828] max-sm:mt-auto max-sm:max-h-[92dvh] max-sm:overflow-y-auto sm:my-auto sm:rounded-xl sm:border sm:border-[#dfe7df] sm:dark:border-[#3d4140]"
      >
        <div className="flex justify-center pb-1 pt-3 sm:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-[#dfe7df] dark:bg-[#3d4140]" />
        </div>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#dfe7df] bg-white px-4 py-3 dark:border-[#3d4140] dark:bg-[#262828] sm:hidden">
          <h2 className="text-base font-semibold leading-tight tracking-tight text-[var(--text-main)] dark:text-[var(--text-main)]">
            Modify your search
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[#f1f2f0] hover:text-[var(--text-main)] focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:bg-[#303232] dark:hover:text-[var(--text-main)]"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 hidden size-11 items-center justify-center rounded-md text-[var(--text-main)] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[var(--text-main)] dark:hover:bg-[#303232] sm:inline-flex"
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="px-4 pb-[max(2.5rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))] pt-5 sm:p-8 sm:pt-16">
          <TripDetailsForm agentCode={agentCode} variant="modal" onSubmitted={onSubmitted} />
        </div>
      </div>
    </div>
  )
}
