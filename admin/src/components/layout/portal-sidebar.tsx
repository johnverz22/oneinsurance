'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutGrid,
  FileCheck2,
  CreditCard,
  Users,
  Wallet,
  TextSearch,
  ArrowUpRight,
  LogOut,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminUser, useAdminAuthStore, useHasHydrated } from '@/store/admin-auth-store'
import { getInitials } from '@/lib/utils'

export const ADMIN_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/products', label: 'Products', icon: FileCheck2 },
  { href: '/commissions', label: 'Commissions', icon: CreditCard },
  { href: '/agents', label: 'Agents', icon: Users },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/transactions', label: 'Transactions', icon: TextSearch },
  { href: '/reports', label: 'Generate report', icon: ArrowUpRight },
  { href: '/settings', label: 'User settings', icon: UserRound },
]

/**
 * Admin portal sidebar — gold variant of the shared platform shell
 * (/mockups/admin/*). Widths: 232px expanded, 76px collapsed.
 * The collapse toggle is rendered by PortalLayout (it sits outside the
 * scrollable aside, pinned to the sidebar/workspace edge).
 */
export function PortalSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const user = useAdminUser()
  const hasHydrated = useHasHydrated()
  const logout = useAdminAuthStore((s) => s.logout)
  const updateUser = useAdminAuthStore((s) => s.updateUser)
  const getAuthHeader = useAdminAuthStore((s) => s.getAuthHeader)
  const router = useRouter()
  const [imgError, setImgError] = useState(false)

  // Sync latest user profile (including avatar photo) from server once hydrated
  useEffect(() => {
    if (!hasHydrated || !user?.id) return
    const authHeader = getAuthHeader()
    if (!authHeader) return

    fetch(`/api/admin/users/${user.id}`, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const profile = json?.data
        if (profile) {
          updateUser({
            name: profile.name,
            email: profile.email,
            role: profile.role,
            designation: profile.designation,
            profile_photo_url: profile.profile_photo_url || profile.avatar || null,
          })
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, user?.id, getAuthHeader, updateUser])

  // Reset img error if profile photo URL changes
  useEffect(() => {
    setImgError(false)
  }, [user?.profile_photo_url])

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

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const displayName = user?.name || 'Admin User'
  const displayRole = user?.role || 'Admin'
  const avatarUrl = user?.profile_photo_url || (user as { avatar?: string | null })?.avatar

  return (
    <aside
      className={cn(
        'portal-sidebar portal-sidebar--admin relative z-40 hidden h-full flex-col overflow-y-auto border-r border-[#a67f20] bg-[#b88e28] lg:flex',
        collapsed ? 'collapsed px-3 py-5' : 'px-5 py-5'
      )}
    >
      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex min-h-12 items-center',
          collapsed ? 'flex-col justify-start' : 'justify-between'
        )}
      >
        <Link
          href="/dashboard"
          aria-label="One Insurance dashboard"
          className={cn(
            'inline-flex min-h-12 items-center rounded-md focus-visible:outline-2 focus-visible:outline-[#183d2c]',
            collapsed ? 'ms-0' : 'ms-3'
          )}
        >
          {/* Full wordmark — hidden when collapsed */}
          <Image
            src="/images/logo-oi-dark.png"
            alt=""
            width={144}
            height={36}
            className={cn('h-auto w-36', collapsed && 'hidden')}
            priority
          />
          {/* Shield mark — only visible when collapsed */}
          <Image
            src="/images/logo-oi-shield-dark.svg"
            alt=""
            width={36}
            height={36}
            className={cn('size-9', !collapsed && 'hidden')}
            priority
          />
        </Link>
      </div>

      {/* ── Menu label ────────────────────────────────────────────────── */}
      <p
        aria-label="Admin portal"
        className={cn(
          'mt-8 text-xs text-white lg:mt-6',
          collapsed ? 'px-0 text-center' : 'px-3'
        )}
      >
        <span aria-hidden="true" className={collapsed ? 'hidden' : undefined}>
          ADMIN PORTAL
        </span>
        <span aria-hidden="true" className={collapsed ? undefined : 'hidden'}>
          M
        </span>
      </p>

      {/* ── Main navigation ───────────────────────────────────────────── */}
      <nav id="admin-portal-navigation" aria-label="Admin portal" className="mt-3 space-y-1">
        {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex min-h-11 items-center rounded-md text-base transition-[background-color,color,gap,padding] duration-[240ms] ease-[cubic-bezier(.2,0,0,1)] motion-reduce:transition-none',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d2c]',
                collapsed ? 'gap-0 px-3.5' : 'gap-3 px-3',
                active
                  ? 'bg-white font-semibold text-[#183d2c] hover:bg-[#fff8e8]'
                  : 'text-white hover:bg-[#ffffff3d]'
              )}
            >
              {/* Active left-edge accent bar */}
              {active && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-2 bottom-2 w-[3px] rounded-r-[3px] bg-[#d6bd7d]',
                    collapsed ? '-left-3' : '-left-5'
                  )}
                />
              )}
              <Icon
                className={cn(
                  'size-5 shrink-0 max-sm:size-[18px]',
                  active ? 'text-[#006838]' : 'text-white'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform,visibility] duration-[240ms] ease-[cubic-bezier(.2,0,0,1)] motion-reduce:transition-none',
                  collapsed
                    ? 'invisible max-w-0 -translate-x-2 opacity-0'
                    : 'visible max-w-40 translate-x-0 opacity-100'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Profile + sign out ─────────────────────────────────────────── */}
      <div
        className={cn(
          'mt-auto flex items-center',
          collapsed ? 'flex-col gap-2.5 pt-3' : 'justify-between gap-2'
        )}
      >
        <div
          title={collapsed ? displayName : undefined}
          className={cn(
            'flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 text-white',
            collapsed && 'w-full flex-none justify-center px-0'
          )}
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/90 text-xs font-bold text-[#183d2c]">
            {avatarUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </span>
          <span className={cn('min-w-0', collapsed && 'hidden')}>
            <strong className="block truncate text-xs font-semibold">{displayName}</strong>
            <small className="block truncate text-[11px] text-white/85">{displayRole}</small>
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-[#183d2c]"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
