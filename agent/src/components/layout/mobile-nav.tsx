'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  FileText,
  Shield,
  Activity,
  UserRound,
} from 'lucide-react'

type NavItem = {
  id: string
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>
}

/**
 * Fixed bottom navigation bar for mobile/tablet viewports (< lg).
 * Page-aware 4-slot bar per QA spec:
 * - Dashboard route: Home / Sales / Policies / Activity
 * - Settings route: Home / Sales / Policies / Settings (Settings in 4th slot)
 * - Active pill: bg-[#d0e3c8] text-[#006838] light / bg-[#006838] text-white dark; min-height 56px;
 *   aria-current="page" on active item.
 */
export function MobileNav() {
  const pathname = usePathname()
  const isSettings = pathname.startsWith('/settings')

  const navItems: NavItem[] = [
    { id: 'home', href: '/dashboard', label: 'Home', icon: LayoutGrid },
    { id: 'sales', href: '/sales', label: 'Sales', icon: FileText },
    { id: 'policies', href: '/referrals', label: 'Policies', icon: Shield },
    isSettings
      ? { id: 'settings', href: '/settings', label: 'Settings', icon: UserRound }
      : { id: 'activity', href: '/dashboard#activity', label: 'Activity', icon: Activity },
  ]

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#dce6dd] bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-lg dark:border-[#3d4140] dark:bg-[#171919] lg:hidden"
    >
      {navItems.map(({ id, href, label, icon: Icon }) => {
        let active = false
        if (id === 'home') {
          active = pathname === '/dashboard'
        } else if (id === 'sales') {
          active = pathname.startsWith('/sales')
        } else if (id === 'policies') {
          active = pathname.startsWith('/referrals')
        } else if (id === 'settings') {
          active = pathname.startsWith('/settings')
        }

        return (
          <Link
            key={id}
            href={href}
            aria-current={active ? 'page' : undefined}
            className="agent-dashboard__bottom-item"
          >
            <Icon className="size-[18px] sm:size-5" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-xs sm:text-sm font-semibold">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
