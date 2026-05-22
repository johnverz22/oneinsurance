'use client'

import { cn } from '@/lib/utils'

/**
 * PolicyBadge — the green pill used for policy numbers across all tables.
 * Usage: <PolicyBadge value={policyNumber} />
 */
interface PolicyBadgeProps {
  value: string | null | undefined
  fallback?: string
  className?: string
}

export function PolicyBadge({ value, fallback = 'N/A', className }: PolicyBadgeProps) {
  if (!value || value.trim() === '') {
    return <span className="text-muted-foreground text-sm">{fallback}</span>
  }
  return (
    <span
      className={cn(
        'font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold border border-primary/20',
        className
      )}
    >
      {value}
    </span>
  )
}

/**
 * GoldActionLink — the gold "View" / "View Transactions" link used in tables.
 */
interface GoldActionLinkProps {
  onClick?: () => void
  href?: string
  children?: React.ReactNode
  className?: string
}

export function GoldActionLink({ onClick, children = 'View', className }: GoldActionLinkProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-[#B8960C] hover:text-[#B8960C]/80 hover:underline font-medium cursor-pointer text-sm',
        className
      )}
    >
      {children}
    </button>
  )
}
