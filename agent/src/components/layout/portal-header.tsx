'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Menu, Moon, Sun, Mail, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AGENT_NAV_ITEMS } from '@/components/layout/portal-sidebar'
import { usePortalSearchStore } from '@/store/portal-search-store'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { ActionIcon } from '@/components/ui/action-icon'

/**
 * Sticky top bar for the agent portal — 1:1 port of the platform-shell mockup.
 *
 * Mobile/tablet (< lg): hamburger popover with the portal destinations + logo.
 * Desktop (lg+):        "Quick search" field on the dashboard (bound to the
 *                       shared portal search store — drives the dashboard
 *                       activity filter); "Agent portal / <page>" crumb on
 *                       every other page.
 * Right side (all):     theme toggle + notifications preview popover + sign out.
 * A subtle shadow appears once the content canvas is scrolled.
 */
export function PortalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { searchQuery, setSearchQuery } = usePortalSearchStore()
  const logout = useAgentAuthStore((s) => s.logout)

  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Shadow once the scrollable content canvas moves under the bar
  useEffect(() => {
    const content = document.querySelector('.agent-dashboard__content')
    if (!content) return
    const onScroll = () => setScrolled(content.scrollTop > 1)
    content.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => content.removeEventListener('scroll', onScroll)
  }, [])

  // Close popovers on outside click / Escape
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // Close the mobile menu after navigating
  useEffect(() => {
    setMenuOpen(false)
    setNotificationsOpen(false)
  }, [pathname])

  const isActive = (href: string) => pathname.startsWith(href)

  const handleLogout = async () => {
    try {
      await fetch('/api/agent/auth/logout', { method: 'POST' })
    } catch {}
    logout()
    router.push('/login')
  }

  // Mockup: dashboard shows the Quick search field; every other page shows an
  // "Agent portal / <page>" crumb instead.
  const isDashboard = isActive('/dashboard')
  const activeItem = AGENT_NAV_ITEMS.find(({ href }) => isActive(href))

  return (
    <header
      className={cn(
        'agent-dashboard__header sticky top-0 z-30 flex min-h-[72px] items-center justify-between',
        scrolled && 'agent-dashboard__header--scrolled'
      )}
    >
      {/* Mobile: hamburger menu + brand logo */}
      <div className="flex min-w-0 items-center gap-3 lg:hidden">
        <div className="relative" ref={menuRef}>
          <ActionIcon
            label="Open navigation"
            hint="Open navigation"
            ariaExpanded={menuOpen}
            ariaHasPopup
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Menu aria-hidden="true" />
          </ActionIcon>
          {menuOpen && (
            <nav
              aria-label="Mobile agent portal"
              className="agent-dashboard__popover absolute left-0 top-14 z-40 w-60 p-2"
            >
              {AGENT_NAV_ITEMS.map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'agent-dashboard__nav-item text-base',
                      active && 'agent-dashboard__nav-item--active'
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-unosure-light.png"
          alt="UnoSure"
          className="h-auto w-[124px] max-[359px]:w-[100px] dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-unosure-dark.png"
          alt="UnoSure"
          className="hidden h-auto w-[124px] max-[359px]:w-[100px] dark:block"
        />
      </div>

      {/* Desktop: quick search on dashboard, page crumb elsewhere */}
      {isDashboard ? (
        <div className="hidden w-full max-w-sm lg:block">
          <label htmlFor="portal-quick-search" className="sr-only">
            Search dashboard activity
          </label>
          <input
            id="portal-quick-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search"
            className="ui-form-field min-h-11 w-full rounded-md bg-white px-3 text-sm placeholder:text-[var(--text-muted)] dark:bg-[#303530] dark:placeholder:text-[var(--text-muted)]"
          />
        </div>
      ) : (
        <p className="hidden text-base font-medium text-[var(--text-sub)] lg:block">
          Agent portal
          {activeItem && (
            <>
              <span className="mx-2 text-[#b5c5b8]">/</span>
              {activeItem.label}
            </>
          )}
        </p>
      )}

      {/* Right controls: theme toggle + notifications */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <ActionIcon
          label="Toggle color theme"
          hint="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Moon className="dark:hidden" aria-hidden="true" />
          <Sun className="hidden dark:block" aria-hidden="true" />
        </ActionIcon>

        <div className="relative" ref={notifRef}>
          <ActionIcon
            label="Notifications"
            hint="Notifications"
            ariaExpanded={notificationsOpen}
            ariaHasPopup
            onClick={() => setNotificationsOpen((v) => !v)}
          >
            <Mail aria-hidden="true" />
          </ActionIcon>
          {notificationsOpen && (
            <div className="agent-dashboard__popover absolute right-0 top-14 w-[min(20rem,calc(100vw-2rem))] p-5">
              <strong className="text-base">Notifications</strong>
              <p className="mt-2 text-base leading-6 text-[var(--text-sub)]">
                No new notifications.
              </p>
            </div>
          )}
        </div>

        <ActionIcon label="Log out" hint="Log out" onClick={handleLogout}>
          <LogOut aria-hidden="true" />
        </ActionIcon>
      </div>
    </header>
  )
}
