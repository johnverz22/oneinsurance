'use client'

import { cn } from '@/lib/utils'

/**
 * SectionCard — bordered card with padded header + flush table content.
 *
 * Usage:
 *   <SectionCard>
 *     <SectionCardHeader title="Agent Management" description="..." actions={<SearchBar />} />
 *     <SectionCardContent>
 *       <DataTable ... />
 *     </SectionCardContent>
 *     <SectionCardFooter>
 *       <Pagination ... />
 *     </SectionCardFooter>
 *   </SectionCard>
 */

interface SectionCardProps {
  children: React.ReactNode
  className?: string
}

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <div className={cn('rounded-xl border shadow-sm overflow-hidden bg-white', className)}>
      {children}
    </div>
  )
}

interface SectionCardHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function SectionCardHeader({ title, description, actions, className }: SectionCardHeaderProps) {
  return (
    <div className={cn('p-4 sm:p-6 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}

interface SectionCardContentProps {
  children: React.ReactNode
  className?: string
  padded?: boolean
}

export function SectionCardContent({ children, className, padded = false }: SectionCardContentProps) {
  return (
    <div className={cn(padded && 'p-4 sm:p-6', className)}>
      {children}
    </div>
  )
}

interface SectionCardFooterProps {
  children: React.ReactNode
  className?: string
}

export function SectionCardFooter({ children, className }: SectionCardFooterProps) {
  return (
    <div className={cn('border-t px-4 sm:px-6 py-3', className)}>
      {children}
    </div>
  )
}
