import { CircleCheck, CircleX, Clock, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'failure' | 'pending' | 'info'

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

export function StatusPill({ status }: { status?: string | null }) {
  const raw = (status ?? '').trim()
  if (!raw || raw.toLowerCase() === 'n/a') {
    return <span className="text-sm text-[var(--text-muted)]">N/A</span>
  }
  const variant = variantFor(raw)
  const Icon = VARIANT_ICONS[variant]
  return (
    <span className={cn('ui-status-badge', `ui-status-badge--${variant}`)}>
      <Icon aria-hidden="true" />
      <span>{titleCase(raw)}</span>
    </span>
  )
}
