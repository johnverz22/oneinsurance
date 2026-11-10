'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionIcon } from '@/components/ui/action-icon'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

/** Lightweight dialog matching the admin portal design tokens. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-lg lg:max-w-2xl flex-col overflow-hidden rounded-lg border border-[#dfe7df] bg-white shadow-2xl dark:border-[#3d4140] dark:bg-[#171919]',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#dfe7df] px-5 py-4 dark:border-[#3d4140]">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-main)]">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-[var(--text-sub)]">
                {description}
              </p>
            )}
          </div>
          <ActionIcon label="Close dialog" hint="Close" onClick={onClose} className="shrink-0">
            <X aria-hidden="true" />
          </ActionIcon>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[#dfe7df] px-5 py-4 dark:border-[#3d4140]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

type ConfirmModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: React.ReactNode
  confirmLabel?: string
  loading?: boolean
  destructive?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  loading,
  destructive,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex min-h-11 items-center rounded-md border border-[#c7d4c9] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition-colors hover:bg-[#f1f2f0] disabled:opacity-50 dark:border-[#565c58] dark:bg-transparent dark:text-[var(--text-main)] dark:hover:bg-[#303232]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex min-h-11 items-center rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50',
              destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#006838] hover:bg-[#00552e]'
            )}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm leading-6 text-[var(--text-sub)]">
        {message}
      </div>
    </Modal>
  )
}

/**
 * Compact confirmation dialog — no close button, no dividers.
 * Use for destructive/confirmation actions (delete, activate, approve, reject).
 * Matches the design: large bold title, body text, Cancel + action buttons.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  loading,
  destructive,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-7 py-8 shadow-2xl dark:bg-[#1e2120]">
        {/* Title */}
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
          {title}
        </h2>

        {/* Body */}
        <p className="mt-3 text-base leading-6 text-[var(--text-sub)]">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 items-center rounded-xl border-2 border-[#183d2c] bg-white px-5 text-sm font-bold text-[var(--text-main)] transition-colors hover:bg-[#f1f2f0] disabled:opacity-50 dark:border-[#d0e3c8] dark:bg-transparent dark:text-[#d0e3c8] dark:hover:bg-[#2b352d]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex h-11 items-center rounded-xl px-5 text-sm font-bold text-white transition-colors disabled:opacity-50',
              destructive
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-[#006838] hover:bg-[#00552e] active:bg-[#00441f]'
            )}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
