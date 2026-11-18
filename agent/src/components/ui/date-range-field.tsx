'use client'

import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid } from 'date-fns'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

export type DateRange = { from: string; to: string }

type DateRangeFieldProps = {
  id: string
  /** Currently applied range (ISO `yyyy-MM-dd` bounds), or null when unset */
  value: DateRange | null
  /** Called with the new range as soon as both bounds are valid; null clears */
  onApply: (range: DateRange | null) => void
  disabled?: boolean
}

/** Parse an ISO string to a Date object safely */
function parseIso(str: string | undefined): Date | undefined {
  if (!str) return undefined
  const d = parse(str, 'yyyy-MM-dd', new Date())
  return isValid(d) ? d : undefined
}

/** Format a Date to ISO yyyy-MM-dd */
function toIso(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** Build a readable label for the trigger button */
function buildLabel(value: DateRange | null): string {
  if (!value) return ''
  const from = parseIso(value.from)
  const to = parseIso(value.to)
  const fmtFrom = from ? format(from, 'MMM d, yyyy') : value.from
  const fmtTo = to ? format(to, 'MMM d, yyyy') : value.to
  return `${fmtFrom} – ${fmtTo}`
}

/**
 * Calendar date range picker — uses react-day-picker in range mode,
 * wrapped in a Radix Popover. Matches the portal mockup's flatpickr-style
 * date range field.
 *
 * Props are identical to the previous DateRangeField implementation so no
 * changes are required in sales-client.tsx or any other consumer.
 */
export function DateRangeField({ id, value, onApply, disabled }: DateRangeFieldProps) {
  const [open, setOpen] = useState(false)

  // Convert string ISO range → react-day-picker DateRange type
  const selected = value
    ? { from: parseIso(value.from), to: parseIso(value.to) }
    : undefined

  const displayValue = buildLabel(value)

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range || (!range.from && !range.to)) {
      onApply(null)
      return
    }
    if (range.from && range.to) {
      // Both bounds set — apply immediately
      onApply({ from: toIso(range.from), to: toIso(range.to) })
    } else if (range.from && !range.to) {
      // Single day selected — treat as a range that starts selection
      // Don't apply yet; wait for second click
    }
  }

  const handleClear = () => {
    onApply(null)
    setOpen(false)
  }

  const handleDone = () => {
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
      <Popover.Trigger asChild>
        <div className="relative">
          <label htmlFor={id} className="sr-only">
            Date range
          </label>
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              'ui-form-field w-full cursor-pointer pl-9 pr-3 text-left',
              !displayValue && 'text-[var(--text-muted)]',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            {displayValue || 'Date range'}
          </button>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className={cn(
            'rdp-popover z-50 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DayPicker
            mode="range"
            selected={selected as { from: Date; to: Date } | undefined}
            onSelect={handleSelect as (range: { from?: Date; to?: Date } | undefined) => void}
            numberOfMonths={1}
            showOutsideDays
            classNames={{
              root: 'rdp-root p-3',
              months: 'rdp-months',
              month: 'rdp-month',
              month_caption: 'rdp-caption relative flex items-center justify-center mb-3 px-1 h-8',
              caption_label: 'rdp-caption_label text-sm font-semibold text-[var(--text-main)]',
              nav: 'rdp-nav absolute inset-x-0 flex items-center justify-between pointer-events-none',
              button_previous: 'rdp-nav_button rdp-nav_button_previous rdp-nav-btn pointer-events-auto',
              button_next: 'rdp-nav_button rdp-nav_button_next rdp-nav-btn pointer-events-auto',
              month_grid: 'rdp-table w-full border-collapse',
              weekdays: 'rdp-head_row',
              weekday: 'rdp-head_cell w-9 text-center text-xs font-medium text-[var(--text-muted)] pb-2',
              weeks: 'rdp-tbody',
              week: 'rdp-row',
              day: 'rdp-cell relative p-0',
              day_button: 'rdp-day rdp-day-btn',
              today: 'rdp-day_today',
              selected: 'rdp-day_selected',
              range_start: 'rdp-day_range_start',
              range_end: 'rdp-day_range_end',
              range_middle: 'rdp-day_range_middle',
              outside: 'rdp-day_outside',
              disabled: 'rdp-day_disabled',
              hidden: 'invisible',
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? (
                  <ChevronLeft className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-4" aria-hidden="true" />
                ),
            }}
          />

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3 pb-3 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="min-h-9 rounded-md px-3 text-sm font-semibold text-[#006838] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:hover:bg-[var(--subtle)]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="min-h-9 rounded-md px-3 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:bg-[var(--subtle)]"
            >
              Done
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
