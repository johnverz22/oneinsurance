'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Mail, Menu, CheckCircle2, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ADMIN_NAV_ITEMS } from '@/components/layout/portal-sidebar'
import { useTopBarSearchStore } from '@/store/top-bar-search-store'
import { useAdminAuthStore } from '@/store/admin-auth-store'
import { ActionIcon } from '@/components/ui/action-icon'
import { TagPill } from '@/components/ui/status-pill'

/**
 * Shared portal top bar — visible at every breakpoint.
 * Below lg: hamburger menu popover + brand logo.
 * lg+: "Admin portal / {page}" context label.
 * Right side (all sizes): theme toggle + notifications + sign out using the
 * shared .ui-action-icon treatment from the platform shell mockups.
 */
export function PortalTopBar() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchQuery = useTopBarSearchStore((s) => s.query)
  const setSearchQuery = useTopBarSearchStore((s) => s.setQuery)
  const logout = useAdminAuthStore((s) => s.logout)
  const getAuthHeader = useAdminAuthStore((s) => s.getAuthHeader)
  const router = useRouter()
  const isDashboard = pathname === '/dashboard'

  const activeItem =
    ADMIN_NAV_ITEMS.find((item) =>
      item.href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname.startsWith(item.href)
    ) ?? ADMIN_NAV_ITEMS.find((item) => item.href === '/dashboard')

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (notificationsOpen || menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notificationsOpen, menuOpen])

  // Close the menu on navigation
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // The quick search only exists on /dashboard — reset it elsewhere
  useEffect(() => {
    if (!isDashboard) setSearchQuery('')
  }, [isDashboard, setSearchQuery])

  // Scrolled shadow on the top bar once the canvas scrolls
  useEffect(() => {
    const scrollEl = document.getElementById('main-content')
    if (!scrollEl) return
    const onScroll = () => setScrolled(scrollEl.scrollTop > 4)
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    try {
      const authHeader = getAuthHeader()
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: authHeader ? { Authorization: authHeader } : {},
      })
    } catch {}
    logout()
    router.push('/login')
  }

  return (
    <header
      className={cn(
        'agent-dashboard__header sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 px-5 sm:px-6 lg:pl-11',
        scrolled && 'agent-dashboard__header--scrolled'
      )}
    >
      {/* ── Mobile controls: menu + brand (hidden on lg+) ─────────────── */}
      <div className="flex min-w-0 items-center gap-3 lg:hidden">
        <div className="relative" ref={menuRef}>
          <ActionIcon
            label="Open navigation"
            hint="Open navigation"
            ariaExpanded={menuOpen}
            ariaHasPopup
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <Menu aria-hidden="true" />
          </ActionIcon>

          {menuOpen && (
            <nav
              aria-label="Mobile admin portal"
              className="agent-dashboard__popover absolute left-0 top-14 w-60 p-2"
            >
              {ADMIN_NAV_ITEMS.map(({ href, label }) => {
                const active =
                  href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center rounded-md px-3 text-base transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]',
                      active
                        ? 'bg-[#d0e3c8] font-semibold text-[#006838] dark:bg-[#006838] dark:text-white'
                        : 'text-[var(--text-sub)] hover:bg-[#eff6ef] hover:text-[#006838] dark:hover:bg-[#006838] dark:hover:text-white'
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>

        <Link href="/dashboard" aria-label="UnoSure – Home" className="flex items-center">
          <Image
            src="/images/logo-unosure-light.png"
            alt="UnoSure"
            width={124}
            height={41}
            className="h-auto w-[124px] dark:hidden"
            priority
          />
          <Image
            src="/images/logo-unosure-dark.png"
            alt="UnoSure"
            width={124}
            height={41}
            className="hidden h-auto w-[124px] dark:block"
            priority
          />
        </Link>
      </div>

      {/* ── Desktop: quick search on /dashboard, context label elsewhere ── */}
      {isDashboard ? (
        <div className="hidden w-full max-w-sm lg:block">
          <label htmlFor="dashboard-search" className="sr-only">
            Search admin areas
          </label>
          <input
            id="dashboard-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search"
            className="ui-form-field min-h-11 w-full rounded-md bg-white px-3 text-sm placeholder:text-[var(--text-muted)] dark:bg-[#303530] dark:placeholder:text-[var(--text-muted)]"
          />
        </div>
      ) : (
        <p className="hidden text-base font-medium text-[var(--text-sub)] lg:block">
          Admin portal <span className="mx-2 text-[var(--text-muted)]">/</span> {activeItem?.label}
        </p>
      )}

      {/* ── Header actions: theme + notifications ─────────────────────── */}
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
            onClick={() => setNotificationsOpen((prev) => !prev)}
          >
            <Mail aria-hidden="true" />
          </ActionIcon>

          {notificationsOpen && (
            <div className="agent-dashboard__popover absolute right-0 top-14 w-[min(20rem,calc(100vw-2rem))] p-5 dark:text-[var(--text-main)]">
              <div className="flex items-center justify-between">
                <strong className="text-base font-semibold text-[var(--text-main)]">Notifications</strong>
                <TagPill>All caught up</TagPill>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-md bg-[#eff6ef] p-3 dark:bg-[#38483b]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#006838] dark:text-[#d0e3c8]" />
                <p className="text-base leading-6 text-[var(--text-sub)]">
                  No new notifications. All policy and commission updates will appear here.
                </p>
              </div>
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
