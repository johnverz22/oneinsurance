'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  FileCheck2,
  Users,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/products', label: 'Products', icon: FileCheck2 },
  { href: '/agents', label: 'Agents', icon: Users },
  { href: '/reports', label: 'Generate report', icon: ArrowUpRight },
]

/**
 * Fixed four-item bottom navigation for mobile/tablet viewports
 * (platform-shell mockup: icon-only items, active pill). Hidden on lg+.
 *
 * Must be rendered *outside* any overflow-hidden ancestor so `fixed` works correctly.
 */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile admin portal shortcuts"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#dce6dd] bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-lg dark:border-[#3d4140] dark:bg-[#171919] lg:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'agent-dashboard__bottom-item flex-1 rounded-md px-1 transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]',
              !active && 'text-[#526858] dark:text-[#808482]'
            )}
          >
            <Icon className="size-[18px] sm:size-5" aria-hidden="true" strokeWidth={1.5} />
            <span className="text-xs sm:text-sm font-semibold">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
