'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const STAT_COLORS = [
  { bar: 'bg-primary',       icon: 'text-primary bg-primary/10' },
  { bar: 'bg-[#B8960C]',     icon: 'text-[#B8960C] bg-[#B8960C]/10' },
  { bar: 'bg-emerald-500',   icon: 'text-emerald-600 bg-emerald-50' },
  { bar: 'bg-amber-500',     icon: 'text-amber-600 bg-amber-50' },
  { bar: 'bg-violet-500',    icon: 'text-violet-600 bg-violet-50' },
] as const

export type StatColorIndex = 0 | 1 | 2 | 3 | 4

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  colorIdx: StatColorIndex
  className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, colorIdx, className }: StatCardProps) {
  const c = STAT_COLORS[colorIdx]
  return (
    <Card className={cn('overflow-hidden border shadow-sm', className)}>
      <div className={cn('h-1 w-full', c.bar)} />
      <CardContent className="px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5', c.icon)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-base font-bold text-foreground leading-tight">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatCardSkeleton() {
  return <Skeleton className="h-[72px] w-full rounded-xl" />
}

interface StatCardsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
}

export function StatCardsGrid({ children, columns = 4 }: StatCardsGridProps) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  }[columns]

  return (
    <div className={cn('grid gap-3 max-w-4xl', colClass)}>
      {children}
    </div>
  )
}
