'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PortalSidebar } from '@/components/layout/portal-sidebar'
import { PortalTopBar } from '@/components/layout/portal-top-bar'
import { MobileNav } from '@/components/layout/mobile-nav'

const STORAGE_KEY = 'oi-admin-sidebar-collapsed'

/**
 * Shared shell for all authenticated admin portal pages, matching the
 * platform-shell mockups (/mockups/admin/*):
 *
 * Desktop (lg+):   232px gold sidebar (76px collapsed) + edge toggle tab +
 *                  shared top bar + scrollable inset canvas.
 * Mobile/Tablet:   top bar (menu popover + logo + theme + notifications) +
 *                  fixed 4-item bottom nav + scrollable canvas.
 *
 * MobileNav is rendered outside the inner overflow-hidden flex wrapper so
 * `fixed` positioning works correctly without being clipped.
 */
export function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  // Restore persisted preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') setCollapsed(true)
    } catch {}
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }

  return (
    <>
      {/* ── Shell: sidebar rail + workspace ──────────────────────────── */}
      <div className="relative flex h-dvh overflow-hidden bg-[#e9ece9] dark:bg-[#141716]">
        {/* Desktop sidebar — hidden on mobile/tablet */}
        <PortalSidebar collapsed={collapsed} />

        {/* Edge collapse/expand tab — pinned to the sidebar/workspace edge */}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="admin-portal-navigation"
          className={cn(
            'group absolute top-4 z-50 hidden h-11 w-11 items-center lg:inline-flex',
            'transition-[left] duration-[240ms] ease-[cubic-bezier(.2,0,0,1)] motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#805c0c]',
            collapsed ? 'left-[76px]' : 'left-[232px]'
          )}
        >
          <span
            aria-hidden="true"
            className="absolute left-0 h-6 w-[18px] rounded-r bg-[#b88e28] transition-colors duration-200 group-hover:bg-[#d6bd7d]"
          />
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'relative ml-0.5 size-3.5 text-white transition-transform duration-[240ms] motion-reduce:transition-none',
              collapsed ? '-rotate-90' : 'rotate-90'
            )}
          />
        </button>

        {/* Workspace: top bar + only scrollable canvas */}
        <div className="flex min-w-0 flex-1 flex-col pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0">
          {/* Skip link for keyboard accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[#006838] focus:px-4 focus:py-3 focus:text-white"
          >
            Skip to content
          </a>

          <PortalTopBar />

          {/*
            Page canvas — the ONLY vertical scroll region.
            Content is centred at a strict 1280px maximum width.
          */}
          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--portal-canvas)] px-4 pb-6 pt-6 focus:outline-none sm:px-6 sm:pt-7 lg:px-[22px] lg:pb-[30px] lg:pt-5"
          >
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      {/* ── Mobile-only: fixed bottom navigation ──────────────────────── */}
      <MobileNav />
    </>
  )
}
