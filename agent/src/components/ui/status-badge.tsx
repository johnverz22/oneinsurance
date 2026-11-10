import { CircleCheck, CircleX, Clock, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'success' | 'failure' | 'pending' | 'info'

const EXACT_VARIANTS: Record<string, BadgeVariant> = {
  active: 'success',
  approved: 'success',
  completed: 'success',
  successful: 'success',
  paid: 'success',
  verified: 'success',
  pending: 'pending',
  'for interview': 'pending',
  'in review': 'pending',
  'pending review': 'pending',
  processing: 'pending',
  review: 'pending',
  rejected: 'failure',
  declined: 'failure',
  failed: 'failure',
  cancelled: 'failure',
  canceled: 'failure',
  error: 'failure',
  expired: 'failure',
  inactive: 'failure',
  suspended: 'failure',
}

const VARIANT_ICONS: Record<BadgeVariant, LucideIcon> = {
  success: CircleCheck,
  failure: CircleX,
  pending: Clock,
  info: Info,
}

function variantFor(status: string): BadgeVariant {
  const key = status.toLowerCase()
  const exact = EXACT_VARIANTS[key]
  if (exact) return exact
  if (/reject|declin|fail|cancel|error|expir|suspend|inactiv|block/.test(key)) {
    return 'failure'
  }
  if (/approv|activ|complet|success|paid|verif/.test(key)) return 'success'
  if (/pend|review|interview|process|await|wait/.test(key)) return 'pending'
  return 'info'
}

function titleCase(status: string): string {
  return status.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export type StatusBadgeProps = {
  /** Raw status string — mapped to a variant and title-cased label */
  status?: string | null
  /** Explicit label override (takes precedence over title-cased status) */
  label?: string
  /** Explicit variant override (takes precedence over status mapping) */
  variant?: BadgeVariant
  /** Icon override; pass `null` to render no icon */
  icon?: LucideIcon | null
  className?: string
}

/**
 * StatusBadge — official `.ui-status-badge` treatment: transparent bg,
 * 1px border at 20% status color, rounded pill, 16px outline icon.
 */
export function StatusBadge({ status, label, variant, icon, className }: StatusBadgeProps) {
  const resolvedLabel = label ?? (status ? titleCase(status) : '')
  if (!resolvedLabel) return null
  const resolvedVariant = variant ?? (status ? variantFor(status) : 'info')
  const BadgeIcon = icon === null ? null : (icon ?? VARIANT_ICONS[resolvedVariant])
  return (
    <span className={cn('ui-status-badge', `ui-status-badge--${resolvedVariant}`, className)}>
      {BadgeIcon && <BadgeIcon aria-hidden="true" />}
      <span>{resolvedLabel}</span>
    </span>
  )
}
