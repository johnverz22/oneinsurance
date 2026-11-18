'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const HINT_DELAY_MS = 1000
const VIEWPORT_MARGIN = 8

type ActionIconProps = {
  /** Accessible name describing the action and record. */
  label: string
  /** Short action verb shown in the delayed hint badge (e.g. "View details"). */
  hint?: string
  /** How long to hover/focus before the hint appears. Defaults to 1000ms. */
  hintDelayMs?: number
  /** Destructive variant — Failure red icon and hint text. */
  failure?: boolean
  href?: string
  /** Render href as a plain anchor instead of a Next.js Link (mailto:, tel:). */
  external?: boolean
  onClick?: () => void
  disabled?: boolean
  /** ARIA expanded state for actions that toggle a popover. */
  ariaExpanded?: boolean
  /** ARIA haspopup for actions that open a popover/menu. */
  ariaHasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  className?: string
  children: ReactNode
}

/**
 * Shared portal action icon — the `.ui-action-icon` component: 44px target,
 * transparent background, Insurance green icon, Pale Gold hover, and an
 * optional action hint badge that appears after a short, configurable
 * hover/focus delay (1s by default; pass `hintDelayMs={0}` for instant).
 */
export function ActionIcon({
  label,
  hint,
  hintDelayMs = HINT_DELAY_MS,
  failure = false,
  href,
  external = false,
  onClick,
  disabled = false,
  ariaExpanded,
  ariaHasPopup,
  className,
  children,
}: ActionIconProps) {
  const [hintVisible, setHintVisible] = useState(false)
  const timerRef = useRef<number | null>(null)
  const anchorRef = useRef<HTMLElement | null>(null)
  const hintRef = useRef<HTMLSpanElement | null>(null)
  const hintId = useId()

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const hideHint = useCallback(() => {
    clearTimer()
    setHintVisible(false)
  }, [clearTimer])

  const armHint = useCallback(() => {
    if (!hint) return
    clearTimer()
    timerRef.current = window.setTimeout(
      () => setHintVisible(true),
      hintDelayMs
    )
  }, [hint, hintDelayMs, clearTimer])

  useEffect(() => clearTimer, [clearTimer])

  // Position the hint below the control (or above when space is limited)
  // and dismiss it on scroll, resize, Escape, or any click.
  useEffect(() => {
    if (!hintVisible) return
    const anchor = anchorRef.current
    const el = hintRef.current
    if (anchor && el) {
      const rect = anchor.getBoundingClientRect()
      const size = el.getBoundingClientRect()
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(
          rect.left + rect.width / 2 - size.width / 2,
          window.innerWidth - size.width - VIEWPORT_MARGIN
        )
      )
      const below = rect.bottom + 4
      const top =
        below + size.height <= window.innerHeight - VIEWPORT_MARGIN
          ? below
          : Math.max(VIEWPORT_MARGIN, rect.top - size.height - 4)
      el.style.left = `${left}px`
      el.style.top = `${top}px`
      el.style.visibility = 'visible'
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideHint()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', hideHint, true)
    window.addEventListener('resize', hideHint)
    window.addEventListener('click', hideHint)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', hideHint, true)
      window.removeEventListener('resize', hideHint)
      window.removeEventListener('click', hideHint)
    }
  }, [hintVisible, hideHint])

  const cls = cn(
    'ui-action-icon',
    failure && 'ui-action-icon--failure',
    className
  )

  const handleClick = () => {
    hideHint()
    onClick?.()
  }

  const hintEl =
    hint && hintVisible && typeof document !== 'undefined'
      ? createPortal(
          <span
            ref={hintRef}
            id={hintId}
            role="tooltip"
            style={{ visibility: 'hidden' }}
            className={cn(
              'portal-action-hint',
              failure && 'portal-action-hint--failure'
            )}
          >
            {hint}
          </span>,
          document.body
        )
      : null

  const shared = {
    ref: (el: HTMLElement | null) => {
      anchorRef.current = el
    },
    'aria-label': label,
    'aria-describedby': hintVisible ? hintId : undefined,
    'aria-expanded': ariaExpanded,
    'aria-haspopup': ariaHasPopup,
    'data-action-hint': hint,
    className: cls,
    onMouseEnter: armHint,
    onMouseLeave: hideHint,
    onFocus: armHint,
    onBlur: hideHint,
    onClick: handleClick,
  }

  if (href && external) {
    return (
      <a href={href} {...shared}>
        {children}
        {hintEl}
      </a>
    )
  }

  if (href) {
    return (
      <Link href={href} {...shared}>
        {children}
        {hintEl}
      </Link>
    )
  }

  return (
    <button type="button" disabled={disabled} {...shared}>
      {children}
      {hintEl}
    </button>
  )
}
