'use client'

import { cn } from '@/lib/utils'

type StatusVariant =
  | 'completed'
  | 'active'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'approved'
  | 'inactive'
  | 'default'

const STATUS_CONFIG: Record<StatusVariant, { className: string; dotClass: string }> = {
  completed: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotClass: 'bg-emerald-500' },
  active:    { className: 'bg-green-100 text-green-700 border-green-200',     dotClass: 'bg-green-500' },
  approved:  { className: 'bg-green-100 text-green-700 border-green-200',     dotClass: 'bg-green-500' },
  pending:   { className: 'bg-amber-50 text-amber-700 border-amber-200',      dotClass: 'bg-amber-500' },
  failed:    { className: 'bg-red-50 text-red-700 border-red-200',            dotClass: 'bg-red-500' },
  cancelled: { className: 'bg-red-50 text-red-700 border-red-200',            dotClass: 'bg-red-500' },
  refunded:  { className: 'bg-[#FEF9E7] text-[#B8960C] border-[#F0D060]',    dotClass: 'bg-[#B8960C]' },
  inactive:  { className: 'bg-gray-100 text-gray-600 border-gray-200',        dotClass: 'bg-gray-400' },
  default:   { className: 'bg-gray-100 text-gray-600 border-gray-200',        dotClass: 'bg-gray-400' },
}

interface StatusBadgeProps {
  status: string
  className?: string
  showDot?: boolean
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const key = (status?.toLowerCase() as StatusVariant) ?? 'default'
  const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG.default

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        cfg.className,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />}
      {status?.toUpperCase() || 'UNKNOWN'}
    </span>
  )
}
