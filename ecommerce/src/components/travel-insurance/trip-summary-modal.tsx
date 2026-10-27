'use client'

import { useEffect, useRef } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TripSummaryStop {
  kind: string
  name: string
}

interface TripSummaryModalProps {
  open: boolean
  onClose: () => void
  onContinue: () => void
  isSubmitting?: boolean
  stops: TripSummaryStop[]
  dates: string
  days: string
  rows: { label: string; value: string }[]
}

export function TripSummaryModal({
  open,
  onClose,
  onContinue,
  isSubmitting,
  stops,
  dates,
  days,
  rows,
}: TripSummaryModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4" role="presentation">
      <div className="fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-summary-title"
        tabIndex={-1}
        className="relative my-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#dfe7df] bg-white p-5 text-[#183d2c] shadow-2xl outline-none dark:border-[#3d4140] dark:bg-[#262828] dark:text-[#f4f5f2] sm:p-8"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#006838] uppercase dark:text-[#d0e3c8]">
              Review your trip
            </p>
            <h2 id="trip-summary-title" className="mt-1 text-2xl font-semibold tracking-tight">
              Your trip at a glance
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trip summary"
            className="-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:bg-[#303232]"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <section aria-label="Travel route" className="mt-6 rounded-lg bg-[#f1f2f0] p-4 dark:bg-[#303232]">
          <ol className="m-0 list-none p-0">
            {stops.map((stop, i) => {
              const first = i === 0
              const last = i === stops.length - 1
              return (
                <li key={`${stop.kind}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                  {!last && (
                    <span
                      aria-hidden
                      className="absolute top-5 left-[7px] h-[calc(100%-12px)] w-0.5 bg-[#c7d4c9] dark:bg-[#565c58]"
                    />
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      'relative mt-1 size-4 shrink-0 rounded-full border-2 border-[#006838] dark:border-[#d0e3c8]',
                      first || last
                        ? 'bg-[#006838] dark:bg-[#d0e3c8]'
                        : 'bg-[#f1f2f0] dark:bg-[#303232]',
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#333333] dark:text-[#c4c7c5]">{stop.kind}</p>
                    <p className="text-base font-semibold break-words">{stop.name}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <section
          aria-label="Travel dates"
          className="mt-4 flex items-center gap-3 rounded-lg border border-[#dfe7df] p-4 dark:border-[#3d4140]"
        >
          <CalendarDays className="size-5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#333333] dark:text-[#c4c7c5]">Travel dates</p>
            <p className="text-base font-semibold break-words">{dates}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#e2eddb] px-3 py-1 text-sm font-semibold text-[#006838] dark:bg-[#303232] dark:text-[#d0e3c8]">
            {days}
          </span>
        </section>

        <dl className="mt-4 grid grid-cols-1 gap-4 text-base min-[420px]:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-xs font-medium text-[#333333] dark:text-[#c4c7c5]">{row.label}</dt>
              <dd className="mt-1 font-medium break-words">{row.value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={onContinue}
          disabled={isSubmitting}
          className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-5 py-3 text-base font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:opacity-50"
        >
          Continue to plans →
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#006838] px-4 py-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[#303232]"
        >
          Back to my trip
        </button>
      </div>
    </div>
  )
}
