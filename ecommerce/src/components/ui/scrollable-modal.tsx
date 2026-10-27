'use client'

/**
 * ScrollableModal
 *
 * A generic modal shell built on the native <dialog> element.
 *
 * Layout:
 * - Mobile  (<sm): bottom sheet — full width, pinned to the bottom of the
 *   viewport, top corners rounded only, up to 92dvh tall. A drag-handle
 *   affordance is shown at the top. Bottom padding accounts for iOS home
 *   indicator via env(safe-area-inset-bottom).
 * - Desktop (sm+): centred floating panel — all corners rounded, up to 90dvh.
 *
 * Other features:
 * - Sticky header with optional eyebrow, title, and X close button
 * - Scrollable content area (overscroll-contain)
 * - Backdrop click closes the modal
 * - Escape key closes via native dialog behaviour (synced back via `onClose`)
 * - Focus moves to the X button when the modal opens
 * - Full dark-mode support
 *
 * Usage:
 *   <ScrollableModal
 *     open={open}
 *     onClose={onClose}
 *     title="My Modal"
 *     eyebrow="Optional · label"       // optional small label above the title
 *     titleId="my-modal-title"         // forwarded to aria-labelledby
 *     descriptionId="my-modal-desc"    // forwarded to aria-describedby
 *     maxWidth="max-w-2xl"            // Tailwind max-width class, default "max-w-7xl"
 *     closeLabel="Close My Modal"      // aria-label on the X button
 *   >
 *     {children}
 *   </ScrollableModal>
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ScrollableModalProps {
  open: boolean
  onClose: () => void
  /** Main heading rendered inside the sticky header */
  title: ReactNode
  /** Small label shown above the title (e.g. "One Insurance · Travel") */
  eyebrow?: ReactNode
  /** id applied to the <h2> title — use as aria-labelledby on the caller if needed */
  titleId?: string
  /** id applied to the scrollable body — use as aria-describedby on the caller if needed */
  descriptionId?: string
  /** Tailwind max-width class. Defaults to max-w-7xl */
  maxWidth?: string
  /** aria-label on the close (X) button. Defaults to "Close" */
  closeLabel?: string
  children?: ReactNode
}

// Header height is ~73px; drag handle on mobile adds ~24px
const HEADER_H = 73
const HANDLE_H = 24

export function ScrollableModal({
  open,
  onClose,
  title,
  eyebrow,
  titleId,
  descriptionId,
  maxWidth = 'max-w-7xl',
  closeLabel = 'Close',
  children,
}: ScrollableModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Sync open prop → native dialog state
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    else if (!open && el.open) el.close()
  }, [open])

  // Sync native close event (Escape key) → onClose callback
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [onClose])

  // Move focus to X button when modal opens
  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => closeBtnRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className={cn(
        // ── Shared ────────────────────────────────────────────────────────────
        'w-full overflow-hidden border border-[#dfe7df] bg-white p-0',
        'text-[#183d2c] shadow-2xl',
        'dark:border-[#3d4140] dark:bg-[#1c1e1e] dark:text-[#f4f5f2]',
        'backdrop:bg-black/60 backdrop:backdrop-blur-xs',

        // ── Mobile default: bottom sheet ───────────────────────────────────────
        // Sits at the very bottom; only top corners are rounded.
        'mx-0 mb-0 mt-auto max-h-[92dvh]',
        'rounded-t-2xl rounded-b-none',

        // ── sm+: centred floating panel ────────────────────────────────────────
        'sm:m-auto sm:max-h-[90dvh] sm:rounded-xl',

        maxWidth,
      )}
    >
      {/* ── Drag-handle affordance (mobile only) ───────────────────────────── */}
      <div className="flex justify-center pb-1 pt-3 sm:hidden" aria-hidden="true">
        <div className="h-1 w-10 rounded-full bg-[#dfe7df] dark:bg-[#3d4140]" />
      </div>

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#dfe7df] bg-white px-4 py-3 dark:border-[#3d4140] dark:bg-[#1c1e1e] sm:px-8 sm:py-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="truncate text-xs font-bold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
              {eyebrow}
            </p>
          )}
          <h2
            id={titleId}
            className="mt-0.5 text-base font-semibold leading-tight tracking-tight sm:text-xl"
          >
            {title}
          </h2>
        </div>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-[#808080] hover:bg-[#f1f2f0] hover:text-[#183d2c] focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:bg-[#303232] dark:hover:text-[#f4f5f2]"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div
        id={descriptionId}
        className="overflow-y-auto overscroll-contain px-4 pt-5 sm:px-8 sm:pt-6"
        style={{
          // Mobile: 92dvh − drag handle − header, with safe-area bottom padding
          // Desktop (via JS media, but CSS handles it via min): 90dvh − header
          // We add bottom padding via paddingBottom instead so safe-area is honoured.
          maxHeight: `calc(92dvh - ${HANDLE_H + HEADER_H}px)`,
          paddingBottom: `max(2.5rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))`,
        }}
      >
        {children}
      </div>
    </dialog>
  )
}
