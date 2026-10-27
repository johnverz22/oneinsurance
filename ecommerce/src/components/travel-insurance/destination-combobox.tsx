'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { CountryFlag } from '@/components/ui/country-flag'
import { cn } from '@/lib/utils'

export type DestinationOption = {
  value: string
  label: string
  area: string
  flag?: string
}

interface DestinationComboboxProps {
  /** id for the focusable control (trigger button in single mode, inline input in multi mode). */
  id?: string
  options: DestinationOption[]
  value?: string
  onValueChange?: (value: string) => void
  multiple?: boolean
  values?: string[]
  onValuesChange?: (values: string[]) => void
  placeholder?: string
  mode: 'international' | 'domestic'
  label?: string
  disabled?: boolean
  error?: boolean
  /** Marks the control as required for assistive tech. */
  required?: boolean
  /** id of an element describing the control (e.g. an error message). */
  describedBy?: string
  allowClear?: boolean
  showChips?: boolean
}

const AREA_LABELS: Record<string, string> = {
  APAC: 'Asia Pacific',
  SCHENGEN: 'Schengen',
  WORLD: 'Worldwide',
  DOMESTIC: 'Philippines',
}

/** Breakpoint: < 640px is "mobile" for the bottom-sheet dropdown */
function useIsMobile() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback)
      return () => window.removeEventListener('resize', callback)
    },
    () => window.innerWidth < 640,
    () => false
  )
}

export function DestinationCombobox({
  id: idProp,
  options,
  value = '',
  onValueChange,
  multiple = false,
  values = [],
  onValuesChange,
  placeholder = 'Select destination',
  mode,
  label = 'Destination',
  disabled = false,
  error = false,
  required = false,
  describedBy,
  allowClear = false,
  showChips = true,
}: DestinationComboboxProps) {
  const uid = useId()
  const listboxId = `${uid}-listbox`
  const inputId = idProp ?? `${uid}-input`
  const liveId = `${uid}-live`

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  /** For SM: whether the user has tapped to expand all chips */
  const [chipsExpanded, setChipsExpanded] = useState(false)
  const [liveMessage, setLiveMessage] = useState('')

  const isMobile = useIsMobile()
  /** Outer box (wraps chips + input) — used for focus ring and outside-click */
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /* ── Derived state ─────────────────────────────────────────────────────── */
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...options].sort((a, b) => a.label.localeCompare(b.label))
    if (!q) return sorted
    return sorted.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [options, query])

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, DestinationOption[]>()
    for (const opt of filteredOptions) {
      if (!groups.has(opt.area)) groups.set(opt.area, [])
      groups.get(opt.area)!.push(opt)
    }
    const ordered: { area: string; items: DestinationOption[] }[] = []
    const seen = new Set<string>()
    for (const opt of filteredOptions) {
      if (seen.has(opt.area)) continue
      seen.add(opt.area)
      ordered.push({ area: opt.area, items: groups.get(opt.area) || [] })
    }
    return ordered
  }, [filteredOptions])

  const flatOptions = useMemo(
    () => groupedOptions.flatMap((g) => g.items),
    [groupedOptions]
  )

  const selectedValues = useMemo(
    () => (multiple ? values : value ? [value] : []),
    [multiple, values, value]
  )
  const selectedOptions = useMemo(
    () =>
      selectedValues
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is DestinationOption => Boolean(o)),
    [options, selectedValues]
  )
  const selectedOption = selectedOptions[0]

  /* ── Actions ───────────────────────────────────────────────────────────── */
  const pick = useCallback(
    (v: string) => {
      if (multiple) {
        const next = selectedValues.includes(v)
          ? selectedValues.filter((x) => x !== v)
          : [...selectedValues, v]
        onValuesChange?.(next)
        const opt = options.find((o) => o.value === v)
        if (opt) {
          setLiveMessage(
            selectedValues.includes(v)
              ? `Removed ${opt.label}`
              : `Added ${opt.label}`
          )
        }
        // Keep dropdown open for multi-select
      } else {
        onValueChange?.(v)
        setOpen(false)
      }
    },
    [multiple, onValuesChange, onValueChange, selectedValues, options]
  )

  const handleClearAll = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    if (multiple) {
      onValuesChange?.([])
      setLiveMessage('All destinations cleared')
    } else {
      onValueChange?.('')
    }
    inputRef.current?.focus()
  }

  const removeChip = (v: string) => {
    pick(v)
    inputRef.current?.focus()
  }

  /* ── Open / close ──────────────────────────────────────────────────────── */
  const openDropdown = () => {
    if (disabled) return
    setQuery('')
    setActiveIndex(0)
    setOpen(true)
  }

  const closeDropdown = () => {
    setOpen(false)
    // Return focus to the inline input rather than a separate trigger button
    inputRef.current?.focus()
  }

  /* ── Effects ───────────────────────────────────────────────────────────── */

  // Focus the search input whenever the dropdown opens
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  // Outside-click closes dropdown
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (dropdownRef.current?.contains(t) || boxRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Keyboard navigation inside dropdown
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDropdown()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) =>
          prev + 1 < flatOptions.length ? prev + 1 : flatOptions.length - 1
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const opt = flatOptions[activeIndex]
        if (opt) pick(opt.value)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, flatOptions, activeIndex, pick]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll active item into view
  useEffect(() => {
    if (!open || !dropdownRef.current) return
    const active = dropdownRef.current.querySelector(`[data-index="${activeIndex}"]`)
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  // Backspace on empty input removes last chip
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && query === '' && multiple && selectedValues.length > 0) {
      const last = selectedValues[selectedValues.length - 1]
      pick(last)
    }
  }

  /* ── Chip rendering ────────────────────────────────────────────────────── */
  // On SM: show max 2 chips + "+N more" unless chipsExpanded
  const CHIP_LIMIT_SM = 2
  const visibleChips =
    isMobile && multiple && !chipsExpanded && selectedOptions.length > CHIP_LIMIT_SM
      ? selectedOptions.slice(0, CHIP_LIMIT_SM)
      : selectedOptions
  const hiddenCount =
    isMobile && multiple && !chipsExpanded
      ? Math.max(0, selectedOptions.length - CHIP_LIMIT_SM)
      : 0

  /* ── Single-select display ─────────────────────────────────────────────── */
  const showPlaceholder = multiple ? selectedOptions.length === 0 : !selectedOption

  /* ── Dropdown panel ────────────────────────────────────────────────────── */
  const DropdownContent = (
    <div
      ref={dropdownRef}
      id={listboxId}
      role="listbox"
      aria-multiselectable={multiple || undefined}
      aria-label={label}
      className={cn(
        'z-50 flex flex-col overflow-hidden rounded-lg border border-[#c7d4c9] bg-white shadow-xl dark:border-[#565c58] dark:bg-[#262828]',
        isMobile
          ? 'fixed inset-x-0 bottom-0 max-h-[80vh] rounded-b-none'
          : 'absolute left-0 top-full mt-1 w-full'
      )}
      style={isMobile ? undefined : { minWidth: 320 }}
    >
      {isMobile && (
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-[#c7d4c9] dark:bg-[#565c58]" />
      )}
      <div className="sticky top-0 z-10 border-b border-[#dfe7df] bg-white p-3 dark:border-[#3d4140] dark:bg-[#262828]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#808080]"
            aria-hidden
          />
          <input
            id={`${uid}-search`}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="Search country or city"
            className="ui-form-field w-full pl-9"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={
              flatOptions[activeIndex] ? `${uid}-option-${activeIndex}` : undefined
            }
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <div className="max-h-[50vh] overflow-y-auto p-1 sm:max-h-72">
        {flatOptions.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-[#808080] dark:text-[#b2b7b4]">
            No destinations found.
          </p>
        ) : (
          groupedOptions.map((group) => (
            <div key={group.area} role="group" aria-label={AREA_LABELS[group.area] || group.area}>
              <div className="sticky top-0 bg-[#f1f2f0] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#808080] dark:bg-[#303232] dark:text-[#b2b7b4]">
                {AREA_LABELS[group.area] || group.area}
              </div>
              <ul className="py-1">
                {group.items.map((opt) => {
                  const flatIndex = flatOptions.findIndex((o) => o.value === opt.value)
                  const isActive = flatIndex === activeIndex
                  const isSelected = selectedValues.includes(opt.value)
                  return (
                    <li
                      key={opt.value}
                      id={`${uid}-option-${flatIndex}`}
                      data-index={flatIndex}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => pick(opt.value)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                        isActive || isSelected
                          ? 'bg-[#e2eddb] text-[#183d2c] dark:bg-[#304538] dark:text-[#f4f5f2]'
                          : 'text-[#183d2c] hover:bg-[#f1f2f0] dark:text-[#f4f5f2] dark:hover:bg-[#303232]'
                      )}
                    >
                      {opt.flag && <CountryFlag flag={opt.flag} className="size-5 shrink-0" />}
                      <span className="flex-1 truncate">{opt.label}</span>
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-4 shrink-0 text-[#006838]"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>
      {multiple && (
        <div className="flex items-center justify-between gap-3 border-t border-[#dfe7df] bg-white p-3 dark:border-[#3d4140] dark:bg-[#262828]">
          <span className="text-xs text-[#808080] dark:text-[#b2b7b4]">
            {selectedValues.length} selected
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#006838] px-5 text-sm font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )

  /* ── Render ────────────────────────────────────────────────────────────── */

  // Single-select mode: keep the original trigger-button layout
  if (!multiple) {
    return (
      <div className="relative">
        <button
          type="button"
          id={idProp ?? uid}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-describedby={describedBy}
          // role=button doesn't support aria-required — fold it into the name
          aria-label={required ? `${label} (required)` : label}
          disabled={disabled}
          onClick={openDropdown}
          className={cn(
            'ui-form-field flex w-full items-center justify-between gap-2 text-left',
            disabled && 'cursor-not-allowed opacity-60',
            error && 'border-red-500 outline-red-500'
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selectedOption?.flag ? (
              <CountryFlag flag={selectedOption.flag} className="size-5 shrink-0" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 shrink-0 text-[#808080]"
                aria-hidden
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M3.6 9l16.8 0" />
                <path d="M3.6 15l16.8 0" />
                <path d="M11.5 3a17 17 0 0 0 0 18" />
                <path d="M12.5 3a17 17 0 0 1 0 18" />
              </svg>
            )}
            <span
              className={cn(
                'truncate',
                showPlaceholder && 'text-[#808080] dark:text-[#b2b7b4]'
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {allowClear && selectedValues.length > 0 && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear destination"
                onClick={(e) => {
                  e.stopPropagation()
                  onValueChange?.('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onValueChange?.('')
                  }
                }}
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-[#f1f2f0] dark:hover:bg-[#303232]"
              >
                <X className="size-4 text-[#808080]" aria-hidden />
              </span>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                'size-5 shrink-0 text-[#808080] transition-transform',
                open && 'rotate-180'
              )}
              aria-hidden
            >
              <path d="M6 9l6 6l6 -6" />
            </svg>
          </span>
        </button>

        {open &&
          (isMobile
            ? createPortal(
                <div
                  className="fixed inset-0 z-50 bg-black/40"
                  onClick={() => setOpen(false)}
                >
                  {DropdownContent}
                </div>,
                document.body
              )
            : DropdownContent)}
      </div>
    )
  }

  /* ── Multi-select: chips-inside-box layout ─────────────────────────────── */
  return (
    <div className="relative">
      {/* aria-live region for additions/removals */}
      <div
        id={liveId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      {/*
        Fixed-height combobox box — same h-12 (48px) as every other form field.
        Chips + inline input scroll horizontally inside; they never push the box taller.
        Right-side controls (Clear + chevron) are pinned with shrink-0.
      */}
      <div
        ref={boxRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-multiselectable
        aria-disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={error || undefined}
        aria-label={label}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus()
            if (!open) openDropdown()
          }
        }}
        className={cn(
          // Fixed height matches every other ui-form-field (h-12 = 48px)
          'relative flex h-12 w-full cursor-text items-center overflow-hidden rounded-md border border-[#c7d4c9] bg-white px-2.5 dark:border-[#565c58] dark:bg-[#1c1e1e]',
          // Focus-within ring wraps the whole box
          'focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-[#006838] dark:focus-within:outline-white',
          error && 'border-red-500',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        {/* Scrollable chips + input row — flex-nowrap so they scroll instead of wrap */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Chips */}
          {showChips &&
            visibleChips.map((opt) => (
              <span
                key={opt.value}
                title={opt.label}
                className="inline-flex max-w-[9rem] shrink-0 items-center gap-1 rounded-full border border-[#c7d4c9] bg-[#f1f2f0] py-0.5 pl-2 pr-0.5 text-xs font-medium text-[#183d2c] dark:border-[#565c58] dark:bg-[#303232] dark:text-[#f4f5f2]"
              >
                {opt.flag && <CountryFlag flag={opt.flag} className="size-3.5 shrink-0" />}
                <span className="truncate">{opt.label}</span>
                {/* 44px touch target on SM via after: pseudo-element */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeChip(opt.value)
                  }}
                  aria-label={`Remove ${opt.label}`}
                  className="relative -mr-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[#808080] hover:bg-[#dfe7df] hover:text-[#183d2c] dark:text-[#b2b7b4] dark:hover:bg-[#3d4140] dark:hover:text-[#f4f5f2] sm:size-4 [&]:after:absolute [&]:after:-inset-2 [&]:sm:after:content-none [&]:after:content-['']"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            ))}

          {/* "+N more" chip on mobile (collapsed) */}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setChipsExpanded(true)
              }}
              className="inline-flex shrink-0 items-center rounded-full border border-[#c7d4c9] bg-[#e2eddb] px-2 py-0.5 text-xs font-semibold text-[#006838] dark:border-[#565c58] dark:bg-[#304538] dark:text-[#d0e3c8]"
              aria-label={`Show ${hiddenCount} more selected destinations`}
            >
              +{hiddenCount}
            </button>
          )}

          {/* Inline search input */}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
              if (!open) openDropdown()
            }}
            onFocus={() => {
              if (!open) openDropdown()
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={showPlaceholder ? placeholder : ''}
            disabled={disabled}
            aria-label={label}
            aria-required={required || undefined}
            aria-invalid={error || undefined}
            aria-describedby={describedBy}
            aria-autocomplete="list"
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={
              open && flatOptions[activeIndex]
                ? `${uid}-option-${activeIndex}`
                : undefined
            }
            className="min-w-[5rem] shrink-0 bg-transparent text-sm text-[#183d2c] placeholder-[#808080] outline-none dark:text-[#f4f5f2] dark:placeholder-[#b2b7b4]"
            style={{ width: showPlaceholder ? '100%' : 'auto' }}
          />
        </div>

        {/* Right-side controls: "Clear all" (2+ chips) + chevron */}
        <span className="ml-auto flex shrink-0 items-center gap-1 pl-1">
          {selectedValues.length >= 2 && (
            <button
              type="button"
              onClick={(e) => handleClearAll(e)}
              aria-label="Clear all selected destinations"
              className="rounded text-xs font-semibold text-[#006838] underline underline-offset-2 hover:text-[#00552e] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:hover:text-white"
            >
              Clear
            </button>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'size-5 shrink-0 text-[#808080] transition-transform',
              open && 'rotate-180'
            )}
            aria-hidden
          >
            <path d="M6 9l6 6l6 -6" />
          </svg>
        </span>
      </div>

      {open &&
        (isMobile
          ? createPortal(
              <div
                className="fixed inset-0 z-50 bg-black/40"
                onClick={() => setOpen(false)}
              >
                {DropdownContent}
              </div>,
              document.body
            )
          : DropdownContent)}
    </div>
  )
}
