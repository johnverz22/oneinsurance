'use client'

import { PanelLeftClose } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PlanSortKey = 'match' | 'lowest' | 'highest' | 'addons' | 'discounts'

export const PLAN_SORT_OPTIONS: { value: PlanSortKey; label: string }[] = [
  { value: 'match', label: 'Best match' },
  { value: 'lowest', label: 'Lowest price' },
  { value: 'highest', label: 'Highest coverage' },
  { value: 'addons', label: 'With add-ons' },
  { value: 'discounts', label: 'With discounts' },
]

interface FilterOptionProps {
  active: boolean
  label: string
  onClick: () => void
  square?: boolean
}

export function FilterOption({ active, label, onClick, square }: FilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-h-8 max-sm:min-h-11 w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-[#006838]',
        active
          ? 'bg-[#006838]/10 font-medium text-[#006838] dark:bg-[#d0e3c8]/10 dark:text-[#d0e3c8]'
          : 'text-[#333333] hover:bg-[#f1f2f0] dark:text-[#c4c7c5] dark:hover:bg-[#303232]'
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2 shrink-0 border transition-colors',
          square ? 'rounded-[2px]' : 'rounded-full',
          active
            ? 'border-[#006838] bg-[#006838] dark:border-[#d0e3c8] dark:bg-[#d0e3c8]'
            : 'border-[#808080]/60'
        )}
      />
      <span className="min-w-0">{label}</span>
    </button>
  )
}

export function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#183d2c] dark:text-[#f4f5f2]">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

interface PlanFilterSidebarProps {
  sortBy: PlanSortKey
  onSortChange: (key: PlanSortKey) => void
  providers: { code: string; name: string }[]
  selectedProviders: string[]
  onToggleProvider: (code: string) => void
  coverages: string[]
  selectedCoverages: string[]
  onToggleCoverage: (name: string) => void
  onClear: () => void
  onCollapse: () => void
}

export const titleCase = (s: string) =>
  s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

export function PlanFilterSidebar(props: PlanFilterSidebarProps) {
  const active = props.selectedProviders.length + props.selectedCoverages.length
  return (
    <aside
      aria-label="Filter plans"
      className="self-start rounded-xl border border-[#dfe7df] bg-white p-4 dark:border-[#3d4140] dark:bg-[#262828] lg:sticky lg:top-24"
    >
      <div className="mb-4 flex items-center justify-between border-b border-[#dfe7df] pb-3 dark:border-[#3d4140]">
        <span className="text-xs font-bold uppercase tracking-wider text-[#808080] dark:text-[#b2b7b4]">
          Filters{active > 0 && ` (${active})`}
        </span>
        <div className="flex items-center gap-1">
          {(active > 0 || props.sortBy !== 'match') && (
            <button
              type="button"
              onClick={props.onClear}
              className="rounded-md px-2 py-1 text-xs font-medium text-[#006838] hover:underline dark:text-[#d0e3c8]"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={props.onCollapse}
            aria-label="Collapse filters"
            title="Collapse filters"
            className="inline-flex size-8 items-center justify-center rounded-md text-[#808080] hover:bg-[#f1f2f0] hover:text-[#183d2c] dark:hover:bg-[#303232] dark:hover:text-[#f4f5f2]"
          >
            <PanelLeftClose className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-14rem)] space-y-5 overflow-y-auto pr-1">
        <Group title="Sort by">
          {PLAN_SORT_OPTIONS.map((o) => (
            <FilterOption
              key={o.value}
              label={o.label}
              active={props.sortBy === o.value}
              onClick={() => props.onSortChange(o.value)}
            />
          ))}
        </Group>
        <Group title="Providers">
          {props.providers.map((p) => (
            <FilterOption
              key={p.code}
              label={p.name}
              active={props.selectedProviders.includes(p.code)}
              onClick={() => props.onToggleProvider(p.code)}
            />
          ))}
        </Group>
        {props.coverages.length > 0 && (
          <Group title="Coverages">
            {props.coverages.map((c) => (
              <FilterOption
                key={c}
                square
                label={titleCase(c)}
                active={props.selectedCoverages.includes(c)}
                onClick={() => props.onToggleCoverage(c)}
              />
            ))}
          </Group>
        )}
      </div>
    </aside>
  )
}
