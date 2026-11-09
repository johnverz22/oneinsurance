'use client'

import { cn } from '@/lib/utils'

/**
 * PolicyBadge — green pill for policy numbers across all tables.
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
 * GoldActionLink — icon button for view actions in tables.
 */
interface GoldActionLinkProps {
  onClick?: () => void
  children?: React.ReactNode
  className?: string
}

export function GoldActionLink({ onClick, children, className }: GoldActionLinkProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-md text-muted-foreground hover:text-[#B8960C] hover:bg-[#B8960C]/10 transition-colors',
        className
      )}
      title="View"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
  )
}
