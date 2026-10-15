import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function DocumentPanel({ children }: { children: ReactNode }) {
  return <div className="border-border bg-muted/30 divide-border divide-y overflow-hidden rounded-lg border">{children}</div>
}

export function DocSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-3 p-4 sm:p-5', className)}>
      <h3 className="text-primary text-xs font-bold tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  )
}

export function DocField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="text-foreground text-sm font-medium break-words">{children || '—'}</div>
    </div>
  )
}

export function DocFieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</div>
}
