'use client'

import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Canonical status values used throughout the Sales page. */
export type SaleStatus = 'success' | 'pending' | 'cancelled' | 'failed'

export type StatusPillProps = {
  status: SaleStatus
  /** Render a compact pill (default) or an inline text-only variant */
  variant?: 'pill' | 'text'
  className?: string
}

const STATUS_CONFIG: Record<
  SaleStatus,
  { label: string; icon: React.ElementType; pill: string; text: string }
> = {
  success: {
    label: 'Paid',
    icon: CheckCircle2,
    pill: 'badge-success',
    text: 'text-[#166534] dark:text-[#86efac]',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    pill: 'badge-pending',
    text: 'text-[#854d0e] dark:text-[#fde047]',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    pill: 'badge-rejected',
    text: 'text-[#991b1b] dark:text-[#fca5a5]',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    pill: 'badge-rejected',
    text: 'text-[#991b1b] dark:text-[#fca5a5]',
  },
}

/**
 * Resolve a raw API status string to the canonical SaleStatus.
 * Never throws — defaults to 'pending'.
 */
export function resolveStatus(raw: string | null | undefined): SaleStatus {
  const s = (raw ?? '').toLowerCase().trim()
  if (s === 'success' || s === 'completed' || s === 'paid' || s === 'successful') return 'success'
  if (s === 'cancelled' || s === 'canceled') return 'cancelled'
  if (s === 'failed' || s === 'rejected' || s === 'error') return 'failed'
  return 'pending'
}

/**
 * StatusPill — renders a colored badge (pill) or inline text indicator.
 * Status is always communicated by text AND icon, never color alone.
 */
export function StatusPill({ status, variant = 'pill', className }: StatusPillProps) {
  const { label, icon: Icon, pill, text } = STATUS_CONFIG[status]

  if (variant === 'text') {
    return (
      <span className={cn('inline-flex items-center gap-1', text, className)}>
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    )
  }

  return (
    <span className={cn(pill, className)}>
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  )
}
