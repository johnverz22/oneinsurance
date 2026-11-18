'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  LayoutGrid,
  TextSearch,
  ArrowUpRight,
  UserRound,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAgentUser, useAgentAuthStore, useHasHydrated } from '@/store/agent-auth-store'
import { useAuthenticatedImage } from '@/hooks/use-authenticated-image'
import { getInitials } from '@/lib/utils'

export const AGENT_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/sales', label: 'Sales', icon: TextSearch },
  { href: '/referrals', label: 'Referral links', icon: ArrowUpRight },
  { href: '/settings', label: 'User settings', icon: UserRound },
]

/**
 * Desktop (lg+) green sidebar — 1:1 port of the platform-shell mockup.
 * 232px expanded / 76px collapsed rail; Insurance green in both themes.
 * Collapse state is owned by PortalLayout (it drives the shell grid columns).
 */
export function PortalSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const user = useAgentUser()
  const hasHydrated = useHasHydrated()
  const logout = useAgentAuthStore((s) => s.logout)
  const updateUser = useAgentAuthStore((s) => s.updateUser)
  const getAuthHeader = useAgentAuthStore((s) => s.getAuthHeader)
  const router = useRouter()

  // Sync latest user profile (including avatar photo) from server once hydrated
  useEffect(() => {
    if (!hasHydrated) return
    const authHeader = getAuthHeader()
    if (!authHeader) return

    fetch('/api/agent/profile', {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const profile = json?.data
        if (profile) {
          updateUser({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            role: profile.role,
            designation: profile.designation,
            profile_photo: profile.profile_photo ?? null,
          })
        }
      })
      .catch(() => {})
  }, [hasHydrated, getAuthHeader, updateUser])

  const handleLogout = async () => {
    try {
      await fetch('/api/agent/auth/logout', { method: 'POST' })
    } catch {}
    logout()
    router.push('/login')
  }

  const isActive = (href: string) => pathname.startsWith(href)

  const displayName = user?.name || 'Agent User'
  const displayRole = user?.designation || user?.role || 'Agent / advisor'
  const avatarSrc = useAuthenticatedImage(user?.profile_photo?.url)

  return (
    <aside className="agent-dashboard__sidebar hidden py-5 lg:flex lg:flex-col">
      {/* Brand — dark (white) wordmark on the green rail; shield when collapsed */}
      <div className="agent-dashboard__sidebar-top flex min-h-12 items-center justify-between">
        <Link
          href="/dashboard"
          aria-label="One Insurance dashboard"
          title="One Insurance dashboard"
          className="agent-dashboard__brand-link inline-flex min-h-12 items-center rounded-md focus-visible:outline-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-oi-dark.png"
            alt=""
            className="agent-dashboard__logo--full h-auto w-36"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-oi-shield-dark.svg"
            alt=""
            className="agent-dashboard__logo--shield size-9"
          />
        </Link>
      </div>

      <p
        className="agent-dashboard__menu-label mt-8 text-xs text-[#d0e3c8] lg:mt-6"
        aria-label="Agent portal"
      >
        <span className="agent-dashboard__menu-label-full" aria-hidden="true">
          AGENT PORTAL
        </span>
        <span className="agent-dashboard__menu-label-collapsed" aria-hidden="true">
          AG
        </span>
      </p>

      <nav id="agent-portal-navigation" aria-label="Agent portal" className="mt-3 space-y-1">
        {AGENT_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'agent-dashboard__nav-item text-base',
                active && 'agent-dashboard__nav-item--active'
              )}
            >
              <Icon className="size-[18px] sm:size-5" strokeWidth={2} aria-hidden="true" />
              <span className="agent-dashboard__nav-label">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Agent profile + sign-out, anchored to the bottom (mockup: static
          profile block + nav-item-style logout with a visible label) */}
      <div className="agent-dashboard__sidebar-account mt-auto flex flex-col gap-1 pt-4">
        <div
          aria-label={`${displayName} · ${displayRole}`}
          className="agent-dashboard__sidebar-profile flex min-h-14 min-w-0 items-center gap-3 rounded-md px-2 py-2 text-white"
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xs font-bold text-white">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt=""
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </span>
          <span className="agent-dashboard__profile-copy min-w-0">
            <strong className="block truncate text-xs font-semibold">{displayName}</strong>
            <small className="block text-[11px] text-[#d0e3c8]">{displayRole}</small>
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
          className="agent-dashboard__nav-item agent-dashboard__sidebar-logout w-full cursor-pointer text-left"
        >
          <LogOut className="size-[18px] sm:size-5" strokeWidth={2} aria-hidden="true" />
          <span className="agent-dashboard__nav-label">Log out</span>
        </button>
      </div>
    </aside>
  )
}
