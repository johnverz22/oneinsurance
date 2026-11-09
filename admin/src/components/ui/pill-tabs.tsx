'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export type PillTab = {
  id: string
  label: string
  icon?: LucideIcon
}

type PillTabsProps = {
  tabs: PillTab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

/** Segmented tabs used across admin pages (Products/LoBs, Agents/Applicants). */
export function PillTabs({ tabs, active, onChange, className }: PillTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border border-[#dfe7df] bg-white p-1 dark:border-[#3d4140] dark:bg-[#262828]',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]',
              isActive
                ? 'bg-[#f1f2f0] font-semibold text-[#183d2c] dark:bg-[#303232] dark:text-[#f4f5f2]'
                : 'font-medium text-[#5b6e61] hover:bg-[#f1f2f0] hover:text-[#006838] dark:text-[#b2b7b4] dark:hover:bg-[#303232] dark:hover:text-[#f4f5f2]'
            )}
          >
            {Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
