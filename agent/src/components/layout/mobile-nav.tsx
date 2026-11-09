'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  CreditCard,
  ArrowUpRight,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutGrid },
  { href: '/sales', label: 'Sales', icon: CreditCard },
  { href: '/referrals', label: 'Links', icon: ArrowUpRight },
  { href: '/settings', label: 'Settings', icon: UserRound },
]

/**
 * Fixed bottom navigation bar for mobile/tablet viewports (< lg).
 * Ported from the platform-shell mockup: 4-column grid, icon-over-label
 * items, pale-green active pill (solid green in dark mode).
 */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#dce6dd] bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-lg dark:border-[#3d4140] dark:bg-[#171919] lg:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'agent-dashboard__bottom-item',
              active && 'text-[#006838] dark:text-[#d0e3c8]'
            )}
          >
            <Icon className="size-[18px] sm:size-5" strokeWidth={2} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
