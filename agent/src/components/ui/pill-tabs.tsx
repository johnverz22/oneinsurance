'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PillTab {
  id: string
  label: string
}

interface PillTabsProps {
  tabs: PillTab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function PillTabs({ tabs, activeTab, onChange, className }: PillTabsProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all',
            activeTab === tab.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

interface PillLinkTab {
  href: string
  label: string
}

interface PillLinkTabsProps {
  tabs: PillLinkTab[]
  activePath: string
  className?: string
}

export function PillLinkTabs({ tabs, activePath, className }: PillLinkTabsProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all',
            activePath === tab.href
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
