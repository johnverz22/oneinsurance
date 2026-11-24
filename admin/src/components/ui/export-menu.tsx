'use client'

import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'

export type ExportMenuItem = {
  id: string
  label: string
  onSelect: () => void
}

type ExportMenuProps = {
  /** Accessible name for the trigger (defaults to "Download table"). */
  label?: string
  items: ExportMenuItem[]
  disabled?: boolean
}

/**
 * Table export trigger — the shared `.ui-action-icon` download button that
 * opens a small menu of export formats. Matches the portal table export
 * pattern (action icon dropdown, canvas-hover menu items).
 */
export function ExportMenu({
  label = 'Download table',
  items,
  disabled = false,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        className="ui-action-icon"
      >
        <Download aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 top-full z-40 mt-1 min-w-32 rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-md"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className="block min-h-11 w-full cursor-pointer rounded px-3 text-left text-sm font-medium text-[var(--text-main)] transition-colors hover:bg-[var(--canvas)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#006838]"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
