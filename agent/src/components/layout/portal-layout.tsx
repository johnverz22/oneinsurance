'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PortalSidebar } from '@/components/layout/portal-sidebar'
import { PortalHeader } from '@/components/layout/portal-header'
import { MobileNav } from '@/components/layout/mobile-nav'

const SIDEBAR_STORAGE_KEY = 'oi-agent-sidebar-collapsed'

/**
 * Shared shell for all authenticated agent portal pages.
 * 1:1 port of the platform-shell mockup:
 *
 * Desktop (lg+):   232px green sidebar (76px collapsed) + sticky top bar
 *                  + internally scrolling content canvas.
 * Mobile/Tablet:   sticky top bar (hamburger menu + logo) + fixed bottom nav.
 *
 * The shell is a height-capped CSS grid so only the sidebar and the content
 * canvas scroll — the top bar and bottom nav never move.
 */
export function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Rendered only after auth-store hydration (portal group layout gates it),
  // so reading localStorage lazily is safe and avoids a collapse flash.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-3 top-3 z-50 rounded-md bg-[#006838] px-4 py-3 text-white focus:not-sr-only"
      >
        Skip to content
      </a>

      <div
        className={cn(
          'agent-dashboard__shell',
          collapsed && 'agent-dashboard__shell--collapsed'
        )}
      >
        {/* Desktop sidebar — hidden below lg */}
        <PortalSidebar collapsed={collapsed} />

        {/* Edge collapse tab — sticks out of the sidebar's right edge (lg+) */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="agent-portal-navigation"
          className="agent-dashboard__sidebar-toggle"
        >
          <ChevronDown aria-hidden="true" />
        </button>

        <div className="agent-dashboard__workspace">
          <PortalHeader />

          <main
            id="main-content"
            tabIndex={0}
            aria-label="Page content"
            className="agent-dashboard__content px-4 pb-6 pt-6 focus-visible:outline-2 focus-visible:outline-[#006838] sm:px-6 sm:pt-7 lg:px-[22px] lg:pb-[30px] lg:pt-5"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation — rendered outside the shell so `fixed` works */}
      <MobileNav />
    </>
  )
}
