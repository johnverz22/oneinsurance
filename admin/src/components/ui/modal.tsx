'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionIcon } from '@/components/ui/action-icon'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Rendered to the right of the title block, before the close button. */
  headerRight?: React.ReactNode
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
  headerRight,
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

  if (!open || typeof document === 'undefined') return null

  return createPortal(
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
          'relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-[#dfe7df] bg-white shadow-2xl dark:border-[#3d4140] dark:bg-[var(--card-summary)]',
          className
        )}
      >
        <div className="flex items-center gap-3 border-b border-[#dfe7df] px-5 py-4 dark:border-[#3d4140]">
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-semibold leading-6 text-[#006838] dark:text-[#d0e3c8]">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-[var(--text-sub)]">
                {description}
              </p>
            )}
          </div>
          {headerRight && (
            <div className="shrink-0">{headerRight}</div>
          )}
          <ActionIcon label="Close dialog" hint="Close" onClick={onClose} className="shrink-0">
            <X aria-hidden="true" />
          </ActionIcon>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[#dfe7df] px-5 py-4 dark:border-[#3d4140]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
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
            className="btn-secondary inline-flex min-h-11 items-center rounded-md border border-[#006838] bg-transparent px-4 py-2 text-sm font-semibold text-[#006838] transition-colors hover:bg-[#f1f2f0] disabled:opacity-50 dark:border-[#565c58] dark:text-[#f4f5f2] dark:hover:bg-[#303232]"
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
                ? 'bg-[#991b1b] hover:bg-[#7f1717]'
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
 * Rebuilt on Modal per spec M1 (8px radius, 20px green/sage title, 6px buttons, X close).
 */
export function ConfirmDialog(props: ConfirmModalProps) {
  return <ConfirmModal {...props} />
}
