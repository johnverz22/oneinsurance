'use client'

import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import type { BadgeVariant } from '@/components/ui/status-badge'

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
  { label: string; badgeVariant: BadgeVariant; icon: React.ElementType; text: string }
> = {
  success: {
    label: 'Paid',
    badgeVariant: 'success',
    icon: CheckCircle2,
    text: 'text-[#166534] dark:text-[#86efac]',
  },
  pending: {
    label: 'Pending',
    badgeVariant: 'pending',
    icon: Clock,
    text: 'text-[#854d0e] dark:text-[#fde047]',
  },
  cancelled: {
    label: 'Cancelled',
    badgeVariant: 'failure',
    icon: XCircle,
    text: 'text-[#991b1b] dark:text-[#fca5a5]',
  },
  failed: {
    label: 'Failed',
    badgeVariant: 'failure',
    icon: AlertCircle,
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
 * StatusPill — renders the shared status badge or an inline text indicator.
 * Status is always communicated by text AND icon, never color alone.
 */
export function StatusPill({ status, variant = 'pill', className }: StatusPillProps) {
  const { label, badgeVariant, icon: Icon, text } = STATUS_CONFIG[status]

  if (variant === 'text') {
    return (
      <span className={cn('inline-flex items-center gap-1', text, className)}>
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    )
  }

  return <StatusBadge variant={badgeVariant} label={label} className={className} />
}
